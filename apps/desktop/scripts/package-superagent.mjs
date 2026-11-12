/** Build the pinned Super-agent prototype against this distribution's DSH packages. */
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { desktopTargetBuildPaths } from './desktop-build-paths.mjs'

const root = resolve(import.meta.dirname, '../../..')
const release = JSON.parse(readFileSync(join(root, 'linux/release.json'), 'utf8'))
const paths = desktopTargetBuildPaths(`linux-${process.arch}`)
const { values } = parseArgs({ options: { source: { type: 'string' } } })
const pnpm = join(root, 'node_modules/pnpm/bin/pnpm.mjs')
const env = { ...process.env, LC_ALL: 'C', npm_config_manage_package_manager_versions: 'false' }
const command = (file, args, cwd, options = {}) => execFileSync(file, args, { cwd, env, stdio: 'inherit', ...options })
mkdirSync(paths.root, { recursive: true })
mkdirSync(paths.artifacts, { recursive: true })
const temporary = mkdtempSync(join(paths.root, 'superagent-build-'))
try {
  let source = values.source
  if (source === undefined) {
    source = join(temporary, 'upstream')
    command('git', ['init', source], root)
    command('git', ['fetch', '--depth=1', release.superagent.repository, release.superagent.commit], source)
  }
  const archive = command('git', ['archive', release.superagent.commit], source, { stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 })
  const project = join(temporary, 'source')
  mkdirSync(project)
  command('tar', ['-x', '-C', project], root, { input: archive, stdio: ['pipe', 'inherit', 'inherit'] })
  command('git', ['init'], project)
  command('git', ['apply', '--unidiff-zero', join(root, 'linux/superagent.patch')], project)
  const workspace = JSON.parse(command(process.execPath, [pnpm, '-r', 'list', '--depth', '-1', '--json'], root, { stdio: 'pipe' }))
  const packages = new Map(workspace.map(item => [item.name, item]))
  const manifestPath = join(project, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.version = release.superagent.version
  manifest.packageManager = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).packageManager
  manifest.engines.dsh = release.upstreamVersion
  manifest.peerDependencies['@deepseek-ai/dsh-session-query'] = release.upstreamVersion
  manifest.devDependencies['@deepseek-ai/dsh-session-query'] = release.upstreamVersion
  manifest.devDependencies['@deepseek-ai/dsh-session-projection'] = release.upstreamVersion
  for (const section of ['peerDependencies', 'devDependencies']) {
    for (const name of Object.keys(manifest[section])) {
      if (name.startsWith('@deepseek-ai/')) {
        const item = packages.get(name)
        if (!item) throw new Error(`Super-agent dependency is absent from this DSH checkout: ${name}`)
        manifest[section][name] = item.version
      }
    }
  }
  // Non-DSH runtime dependencies use the same versions tested by this checkout.
  const require = createRequire(join(root, 'node_modules/.pnpm/node_modules/package.json'))
  for (const name of Object.keys(manifest.dependencies)) manifest.dependencies[name] = require(`${name}/package.json`).version
  manifest.dshLinux = { upstream: release.superagent, dshVersion: release.upstreamVersion }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  const modules = join(project, 'node_modules')
  const link = (name, target) => {
    const destination = join(modules, name)
    mkdirSync(resolve(destination, '..'), { recursive: true })
    symlinkSync(target, destination, 'dir')
  }
  for (const item of packages.values()) if (item.name?.startsWith('@deepseek-ai/')) link(item.name, item.path)
  for (const name of ['proper-lockfile', 'zod', 'react', 'react-dom', 'jsdom', 'tsdown', 'typescript', 'vitest', '@types/node', '@types/react', '@types/react-dom', '@types/jsdom', '@types/proper-lockfile']) {
    link(name, resolve(require.resolve(`${name}/package.json`), '..'))
  }
  command(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit'], project)
  command(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--maxWorkers', '4'], project)
  command(process.execPath, [require.resolve('tsdown/run')], project)
  command(process.execPath, [pnpm, 'pack', '--pack-destination', paths.artifacts], project)
} finally {
  rmSync(temporary, { recursive: true, force: true })
}

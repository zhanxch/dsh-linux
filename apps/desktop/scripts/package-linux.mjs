/** Build the official Desktop and its complete runtime into Linux packages. */
import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { desktopTargetBuildPaths } from './desktop-build-paths.mjs'

const root = resolve(import.meta.dirname, '../../..')
const { values } = parseArgs({ options: {
  'skip-build': { type: 'boolean', default: false },
  'skip-prepare': { type: 'boolean', default: false },
  dir: { type: 'boolean', default: false },
} })
if (process.platform !== 'linux' || !['x64', 'arm64'].includes(process.arch)) {
  throw new Error('Linux packaging requires a native Linux x64 or arm64 build host')
}
const paths = desktopTargetBuildPaths(`linux-${process.arch}`)
const release = JSON.parse(await readFile(join(root, 'linux/release.json'), 'utf8'))
const desktop = JSON.parse(await readFile(join(root, 'apps/desktop/package.json'), 'utf8'))
if (desktop.version !== release.upstreamVersion) throw new Error('Update linux/release.json to match the DSH source version')
const env = { ...process.env, DSH_DESKTOP_TARGET_PLATFORM: 'linux', DSH_DESKTOP_TARGET_ARCH: process.arch,
  DSH_DESKTOP_UNSIGNED: '1', DSH_TELEMETRY_DISABLED: '1', CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  ELECTRON_BUILDER_COMPRESSION_LEVEL: process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL ?? '5' }
const pnpm = join(root, 'node_modules/pnpm/bin/pnpm.mjs')
async function run(args, cwd = root) {
  console.log(`Linux build: ${args.join(' ')}`)
  const child = spawn(process.execPath, [pnpm, ...args], { cwd, env, stdio: 'inherit' })
  await new Promise((yes, no) => {
    child.once('error', no)
    child.once('exit', (code, signal) => code === 0 ? yes() : no(new Error(`Linux build failed: ${code ?? signal}`)))
  })
}
if (!values['skip-build']) await run(['run', 'build', '--profile', 'local'])
if (!values['skip-prepare']) {
  await run(['exec', 'tsx', 'apps/desktop/scripts/pack-local-packages.ts', '--out', paths.packedDsh])
  await run(['--dir', 'apps/desktop-host', 'pack', '--pack-destination', paths.packedDsh])
  await run(['run', 'release:pack', '--family', 'vendor', '--out', paths.packedVendor])
  await mkdir(paths.packedLandlock, { recursive: true })
  await run(['--dir', 'native/system', 'run', 'build:ts'])
  await run(['--dir', 'native/system/packages/entry', 'pack', '--pack-destination', paths.packedLandlock])
  await run(['run', 'prepare:runtime'], join(root, 'apps/desktop'))
  await run(['run', 'prepare:packages'], join(root, 'apps/desktop'))
  await run(['run', 'prepare:dsh'], join(root, 'apps/desktop'))
}
// Check that a skipped preparation still selects the correct target runtime.
const descriptor = JSON.parse(await readFile(join(paths.dsh, 'desktop-runtime.json'), 'utf8'))
if (descriptor.platform !== 'linux' || descriptor.arch !== process.arch) throw new Error('Prepared runtime target mismatch')
if (descriptor.release.version !== release.upstreamVersion) throw new Error('Rebuild the prepared runtime for the selected DSH version')
await run(['exec', 'electron-builder', '--config', 'electron-builder.linux.mjs', '--linux', `--${process.arch}`,
  ...(values.dir ? ['--dir'] : []), '--publish', 'never'], join(root, 'apps/desktop'))

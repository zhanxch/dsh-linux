/** Linux distribution of the official DSH Desktop; published by zhanxch/dsh-linux. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'
import { desktopTargetBuildPaths } from './scripts/desktop-build-paths.mjs'
import { officePackageDirectories } from '../../scripts/libreoffice-packages.mjs'

const paths = desktopTargetBuildPaths(`linux-${process.arch}`)
const release = JSON.parse(readFileSync(new URL('../../linux/release.json', import.meta.url), 'utf8'))
export default {
  appId: 'io.github.zhanxch.dshlinux',
  productName: 'DeepSeek Harness',
  executableName: 'deepseek-harness',
  extraMetadata: { version: `${release.upstreamVersion}-linux.${release.revision}`,
    homepage: 'https://github.com/zhanxch/dsh-linux',
    desktopName: 'io.github.zhanxch.dshlinux',
    dshDesktopAppId: 'io.github.zhanxch.dshlinux', dshDesktopUpdateChannel: 'nightly' },
  artifactName: 'dsh-linux-${version}-${arch}.${ext}',
  directories: { output: paths.artifacts },
  asar: true,
  electronDist: paths.electron,
  electronFuses: { runAsNode: true },
  npmRebuild: false,
  publish: null,
  files: ['lib/main.js', 'lib/operation-report-worker.js', 'lib/welcome/**/*', 'lib/preload-*.cjs',
    'renderer/**/*', 'package.json',
    { from: '../../LICENSE', to: 'LICENSE' },
    { from: '../../THIRD_PARTY_NOTICES.md', to: 'THIRD_PARTY_NOTICES.md' },
    { from: '../../linux/release.json', to: 'linux-release.json' },
    { from: paths.dsh, to: 'dsh', filter: ['**/*'] },
    { from: join(paths.dsh, 'node_modules'), to: 'dsh/node_modules', filter: ['**/*'] },
    '!node_modules/**/*.{js,cjs,mjs,ts,cts,mts,css}.map', '!node_modules/**/*.tsbuildinfo'],
  asarUnpack: ['**/*.{node,dylib,dll,so,exe}', '**/*.so.*', '**/spawn-helper', '**/@vscode/ripgrep-*/bin/rg',
    '**/node_modules/@deepseek-ai/libreoffice-kit-*/**/*'],
  beforePack: async context => {
    const office = await officePackageDirectories(paths.dsh, { platform: 'linux', arch: process.arch })
    context.packager.config.asarUnpack.push(...office.map(directory => `**/${relative(paths.dsh, directory).split(sep).join('/')}/**/*`))
  },
  extraResources: [{ from: paths.runtime, to: 'runtime' }, { from: 'resources/icon.png', to: 'icon.png' }],
  linux: { target: ['deb', 'tar.gz'], category: 'Development', executableName: 'deepseek-harness', syncDesktopName: true,
    icon: fileURLToPath(new URL('./resources/icon.png', import.meta.url)),
    synopsis: 'DeepSeek Harness desktop for Linux',
    maintainer: 'zhanxch <zhanxch@users.noreply.github.com>',
    desktop: { entry: { Name: 'DeepSeek Harness', 'Name[zh_CN]': 'DeepSeek Harness',
      Comment: 'DeepSeek Harness — Linux community build', StartupWMClass: 'io.github.zhanxch.dshlinux',
      Categories: 'Development;', MimeType: 'x-scheme-handler/dsh;' } } },
  deb: { packageName: 'dsh-linux', priority: 'optional', compression: 'gz' },
}

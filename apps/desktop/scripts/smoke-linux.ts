/** Validate the packaged Linux ASAR and its native runtime without accessing a user's DSH home. */
import { join } from 'node:path'
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { readAsar } from 'app-builder-lib/out/asar/asar.js'
import { desktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { smokePreparedRuntime } from './smoke-prepared-runtime.ts'
import type { DesktopRuntimeDescriptor } from '../src/runtime-tree.ts'

const paths = desktopTargetBuildPaths(`linux-${process.arch}` as 'linux-x64' | 'linux-arm64')
const unpacked = join(paths.artifacts, process.arch === 'arm64' ? 'linux-arm64-unpacked' : 'linux-unpacked')
// Electron 44.7's ASAR path splitter fails on non-ASCII installation paths.
// The Debian installation is ASCII; reproduce that layout even from a localized checkout.
const temporary = await mkdtemp(join(tmpdir(), 'dsh-linux-smoke-'))
try {
  const application = join(temporary, 'application')
  await cp(unpacked, application, { recursive: true })
  const archive = join(application, 'resources/app.asar')
  const asar = await readAsar(archive)
  const descriptor = JSON.parse((await asar.readFile('dsh/desktop-runtime.json')).toString()) as DesktopRuntimeDescriptor
  await smokePreparedRuntime(join(archive, 'dsh'), join(application, 'deepseek-harness'), join(application, 'resources/runtime'), descriptor)
} finally {
  await rm(temporary, { recursive: true, force: true })
}

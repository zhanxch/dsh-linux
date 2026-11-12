/** Linux packages reuse the official application while keeping community updates separate. */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('Linux distribution', () => {
  it('ships an application, runtime and desktop launcher without an official update feed', () => {
    const config = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
      `import config from ${JSON.stringify(new URL('../electron-builder.linux.mjs', import.meta.url).href)}; console.log(JSON.stringify(config))`], { encoding: 'utf8' })) as {
      appId: string
      publish: unknown
      linux: { target: string[] }
      electronFuses: { runAsNode: boolean }
      files: (string | { to: string })[]
      extraResources: { to: string }[]
    }
    expect(config.appId).toBe('io.github.zhanxch.dshlinux')
    expect(config.linux.target).toEqual(['deb', 'tar.gz'])
    expect(config.publish).toBeNull()
    expect(config.electronFuses.runAsNode).toBe(true)
    expect(config.files).toContain('lib/main.js')
    expect(config.files.some(value => typeof value === 'object' && value.to === 'dsh')).toBe(true)
    expect(config.extraResources.some(value => value.to === 'runtime')).toBe(true)
    expect(config.extraResources.some(value => value.to === 'app-update.yml')).toBe(false)
  })
  it('pins both supported Electron archives to upstream checksums', () => {
    const pin = JSON.parse(readFileSync(new URL('../../../linux/electron-checksums.json', import.meta.url), 'utf8')) as {
      version: string
      checksums: Record<string, string>
    }
    for (const arch of ['x64', 'arm64']) expect(pin.checksums[`electron-v${pin.version}-linux-${arch}.zip`]).toMatch(/^[a-f0-9]{64}$/u)
  })
})

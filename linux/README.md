---
description: "Install, launch, build, and maintain the DSH Linux community desktop distribution."
---

# DSH Linux desktop

English | [中文](README.zh.md)

This project packages the official DSH Electron desktop application, conversation interface, and plugin system for Linux. It is maintained by zhanxch independently of DeepSeek's official binary distribution.

## Install and launch

Download the Linux x86_64 `.deb` from [Releases](https://github.com/zhanxch/dsh-linux/releases). Open it with the Ubuntu / Debian software installer, or run this command in the download directory:

```sh
sudo apt install ./dsh-linux-*-amd64.deb
```

Find **DeepSeek Harness** in the system application menu and launch it. The application has its own window; starting a terminal or browser first is unnecessary. Node.js, Python and pnpm are bundled. Configure your account or model through the original DSH interface on first use; this distribution contains no account credentials or API keys.

The `.tar.gz` is an alternative portable package. Extract it and run `deepseek-harness`. If restrictions on unprivileged user namespaces prevent Chromium's sandbox from starting, install the `.deb`; do not add `--no-sandbox`. The package still requires system GTK, NSS, audio and graphics libraries.

The current Electron ASAR path implementation fails for installation directories containing non-ASCII characters. The `.deb` location `/opt/DeepSeek Harness` is unaffected; choose an ASCII-only directory for the portable package.

The application menu's terminal-command manager can install `dsh` at `~/.local/bin/dsh`. That directory must be on the terminal PATH. If another command already occupies it, DSH reports the conflict and preserves a recoverable installation record.

## Features and data

Conversations, execution progress, modes, model configuration, tools, plugins and settings use the current official DSH implementation. Super-agent is a separate research prototype plugin; see [Super-agent integration](superagent.md).

DSH retains the original `DSH_HOME` rules and desktop profile. The default data root is `~/.dsh`; existing DSH users should back up that directory first. New versions may upgrade session formats, so consult upstream upgrade guidance before downgrading.

This community build does not use the official desktop update feed. Download and install a new package from this repository's Releases to upgrade. Package updates replace application files; uninstalling the application does not actively delete DSH user data.

## Build from source

Use a native Linux x64 build host with Node.js 24.22, pnpm 11.28.5, Git, Python 3, and C/C++ build tools. The first build downloads pinned runtime dependencies. Allow at least 12 GB of disk space.

```sh
git clone https://github.com/zhanxch/dsh-linux.git
cd dsh-linux
pnpm install --frozen-lockfile
pnpm run package:desktop:linux
node apps/desktop/scripts/package-superagent.mjs
pnpm exec tsx apps/desktop/scripts/smoke-linux.ts
```

Outputs are under `apps/desktop/.desktop-build/targets/linux-x64/artifacts/`: `.deb`, `.tar.gz`, and the optional Super-agent `.tgz`. The build includes compilation, type checks, production dependencies and runtime checks. `smoke-linux.ts` additionally checks the final ASAR's native modules, plugin installation, Host startup and Office operations using temporary data directories without reading personal sessions.

The code includes Linux arm64 target selection and runtime paths, but this release and CI validate only x86_64. There is no verified arm64 package in this release.

## Maintain and release

The complete upstream Git history is preserved. [release.json](release.json) pins the DSH and Super-agent sources; [electron-checksums.json](electron-checksums.json) records upstream checksums for Electron's Linux archives. Linux changes are concentrated in desktop paths, packaging, command installation and this directory, preserving the DSH product interface.

To update upstream, create a branch, fetch and merge the official version, resolve conflicts, then update the version record, Electron checksums and Super-agent patch. Run the build, focused tests and package checks before reviewing a PR. Changing a version number while reusing an old runtime is insufficient.

The [Linux desktop workflow](../.github/workflows/linux-desktop.yml) builds main commits and PRs and stores artifacts. Pushing a `linux-v<version>` tag publishes a prerelease. Upstream workflows depend on official signing, infrastructure and permissions; this repository enables only its own Linux workflow.

## Validation scope

Automated checks cover compilation, types, Linux target selection, command installation, Super-agent compatibility and the packaged runtime. Real model calls, DeepSeek sign-in and GitHub / Feishu bot workflows require user-owned accounts and are outside keyless checks. Each release describes the checks actually run and the remaining unverified areas.

## License and attribution

DSH and Super-agent retain their authors' copyrights, MIT licenses and third-party notices. Community packaging changes use the repository license. The product name and icon identify the packaged DSH application and do not imply endorsement by DeepSeek.

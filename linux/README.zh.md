---
description: "DSH Linux 社区桌面版的安装、启动、构建和维护指南。"
---

# DSH Linux 桌面版

[English](README.md) | 中文

本项目直接使用官方 DSH 的 Electron 桌面应用、会话界面和插件系统，提供 Linux 安装包。它由 zhanxch 维护，与 DeepSeek 官方二进制发行渠道独立。

<a id="install-and-launch"></a>

## 安装与启动

从 [Releases](https://github.com/zhanxch/dsh-linux/releases) 下载适合 Linux x86_64 的 `.deb`。在 Ubuntu / Debian 的软件安装器中打开，或在下载目录执行：

```sh
sudo apt install ./dsh-linux-*-amd64.deb
```

安装后在系统应用菜单搜索 **DeepSeek Harness**，点击启动。应用有自己的窗口，不需要先打开终端或浏览器，也不需要单独安装 Node.js、Python 或 pnpm。首次使用在原有 DSH 界面中完成账号或模型配置；本发行版不包含账号或 API 密钥。

`.tar.gz` 是可解压运行的备用包。解压后执行其中的 `deepseek-harness`。如果系统限制非特权用户命名空间而使 Chromium 沙箱拒绝启动，使用 `.deb` 安装，不要添加 `--no-sandbox`。安装包仍依赖系统的 GTK、NSS、音频和图形库。

当前 Electron 的 ASAR 路径处理在含中文等非 ASCII 字符的安装目录下会失败。`.deb` 的 `/opt/DeepSeek Harness` 安装位置不受影响；使用解压包时选择仅含 ASCII 字符的目录。

桌面菜单中的终端命令管理可以把 `dsh` 安装到 `~/.local/bin/dsh`。该目录需要在终端的 `PATH` 中；如果已有同名命令，DSH 会显示冲突并保留可恢复的安装记录。

<a id="features-and-data"></a>

## 功能与数据

会话、执行过程、模式切换、模型配置、工具、插件和设置沿用当前官方 DSH。Super-agent 是单独的研究原型插件，见 [Super-agent 集成](superagent.md)。

DSH 使用原有的 `DSH_HOME` 规则及 desktop profile。未设置时，数据根目录是 `~/.dsh`；已安装 DSH 的用户应先备份此目录。新版本可能升级会话格式，降级前应查阅上游升级说明。

该社区版不连接官方桌面自动更新源。升级时从本仓库 Releases 下载新安装包并安装；包管理器更新程序文件，卸载程序不会主动删除 DSH 用户数据。

<a id="build-from-source"></a>

## 从源码构建

需要原生 Linux x64 构建机、Node.js 24.22、pnpm 11.28.5、Git、Python 3 和 C/C++ 编译工具。首次构建需要联网下载固定版本的运行环境。预留至少 12 GB 空间。

```sh
git clone https://github.com/zhanxch/dsh-linux.git
cd dsh-linux
pnpm install --frozen-lockfile
pnpm run package:desktop:linux
node apps/desktop/scripts/package-superagent.mjs
pnpm exec tsx apps/desktop/scripts/smoke-linux.ts
```

产物位于 `apps/desktop/.desktop-build/targets/linux-x64/artifacts/`，包括 `.deb`、`.tar.gz` 和可选的 Super-agent `.tgz`。构建脚本包含源码编译、类型检查、生产依赖打包和运行环境检查。`smoke-linux.ts` 进一步检查最终 ASAR 包中的原生模块、插件安装、服务启动和 Office 功能；它使用临时数据目录，不读取个人会话。

代码包含 Linux arm64 的目标选择和运行环境路径，但本次发布与 CI 只验证 x86_64。尚未发布经过验证的 arm64 安装包。

<a id="maintain-and-release"></a>

## 维护与发布

完整上游 Git 历史保留在本仓库中。[release.json](release.json) 记录 DSH 和 Super-agent 的固定来源，[electron-checksums.json](electron-checksums.json) 保存上游 Electron Linux 压缩包的校验值。Linux 改动集中于桌面路径、打包、命令安装和本目录，避免重写 DSH 的产品界面。

同步上游时先创建分支，fetch 并 merge 官方版本，解决冲突后更新版本记录、Electron 校验值和 Super-agent 补丁。执行构建、针对性测试与安装包检查，再通过 PR 审查。不要只修改版本号而继续复用旧运行环境。

[Linux desktop 工作流](../.github/workflows/linux-desktop.yml) 在 main 提交和 PR 上构建并保存产物；推送 `linux-v<版本>` 标签会发布预览版。上游工作流依赖官方的签名、基础设施及权限，本仓库只启用自己的 Linux 工作流。

<a id="validation-scope"></a>

## 验证范围

本发行版的自动检查覆盖构建、类型、Linux 目标解析、命令安装、Super-agent 兼容及打包后的运行环境。真实模型调用、DeepSeek 账号登录、GitHub / 飞书机器人工作流需要用户自己的账号配置，不属于无密钥检查。发布说明记录当次实际通过的检查和未验证项目。

<a id="license-and-attribution"></a>

## 许可与归属

DSH 与 Super-agent 的版权归各自作者，保留其 MIT 许可和第三方声明。社区打包改动沿用仓库许可。名称与图标用于标识所包装的 DSH 应用，不表示 DeepSeek 对本发行版的背书。

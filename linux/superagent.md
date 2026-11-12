---
description: "固定版本的 DeepSeek Super-agent 研究插件与本发行版的兼容方式。"
---

# Super-agent 集成

[dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) 是 DeepSeek 团队独立开源的研究原型，用于围绕一个 GitHub 仓库处理触发事件、分派任务并执行工作。它不是普通会话里的一个默认模式，也不等于 DSH 原有的子 agent 或团队功能。

## 发行内容

本发行版提供单独的 `dsh-superagent-<版本>.tgz` 插件包，和 DSH 桌面安装包一起发布。源码提交由 [release.json](release.json) 固定；构建时应用 [superagent.patch](superagent.patch)，然后针对当前 DSH 运行类型检查、插件测试和构建。

补丁将会话读取接入当前 Session Query API，使用 Agent 自身的模型选择接口，适配配置表单的可写状态，并拒绝未就绪端口上的管理请求。配套测试覆盖这些接口迁移；不改变原型的任务策略或自动批准权限。

插件包保留上游的配置要求。安装前，按[上游部署说明](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/SETUP.md)准备独立状态目录、目标仓库和用于工作的 GitHub CLI 身份，并设置允许请求的用户与操作范围。无需配置飞书即可使用 GitHub 来源。

## 使用边界

普通 DSH 会话不要求安装此插件。需要 Super-agent 时，将本发行版的 `.tgz` 交给 DSH 插件管理器，按上游说明使用独立 profile 配置 `stateDir`，然后启用和检查设置。不要把个人 GitHub 登录自动当作机器人账号使用。

类型检查和离线测试验证接口兼容；它们不等于已经验证真实仓库的无人值守执行。首次配置应使用测试仓库，在确认事件来源、权限策略和执行结果后再用于正式仓库。

## 重新构建

先完成主仓库依赖安装和 DSH 构建，然后执行：

```sh
node apps/desktop/scripts/package-superagent.mjs
```

脚本获取固定上游提交，在临时目录应用补丁，使用本仓库的依赖运行检查，并输出插件包。检查失败则不发布该插件；不以跳过失败测试的方式宣称兼容。

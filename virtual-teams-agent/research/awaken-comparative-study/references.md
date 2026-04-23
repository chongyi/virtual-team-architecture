# 外部项目链接与参考资料

> 本文档集中收录本调研报告涉及的所有外部项目仓库地址与相关链接，便于未来查阅与追踪。
> 最后更新：2026-04-23

## 核心对比项目

### Awaken (awakenworks/awaken)

| 项目 | 链接 | 说明 |
|------|------|------|
| GitHub 仓库 | https://github.com/awakenworks/awaken | 核心仓库 |
| crates.io | https://crates.io/crates/awaken-agent | 已发布 crate |
| 官方文档 | https://awakenworks.github.io/awaken/ | GitHub Pages 文档 |
| 中文文档 | https://github.com/awakenworks/awaken/blob/main/README.zh-CN.md | 中文 README |
| 本地镜像 | `/Users/chongyi/Projects/tosimpletech/jisi-project/agent-sdk-origin-references/awaken/awaken-v0.2.1` | v0.2.1 本地克隆 |

**关键子目录（本地镜像）：**
- `crates/awaken/` — 主 facade crate
- `crates/awaken-contract/` — 共享契约层
- `crates/awaken-runtime/` — 运行时引擎（9 阶段 phase pipeline）
- `crates/awaken-server/` — 服务端与多协议适配器
- `crates/awaken-stores/` — 存储实现（Memory/File/PostgreSQL/SQLite/NATS）
- `crates/awaken-ext-mcp/` — MCP 插件
- `crates/awaken-ext-permission/` — 权限插件
- `crates/awaken-ext-observability/` — 可观测性插件
- `crates/awaken-ext-skills/` — Skills 插件
- `crates/awaken-ext-reminder/` — Reminder 插件
- `crates/awaken-ext-generative-ui/` — Generative UI 插件
- `crates/awaken-ext-deferred-tools/` — Deferred Tools 插件
- `crates/awaken-protocol-a2a/` — A2A 协议实现
- `apps/admin-console/` — 管理控制台
- `examples/` — 示例项目（ai-sdk-starter、copilotkit-starter、openui-chat）

## VTA 前期调研参考项目

| 项目 | 语言 | 仓库/来源 | 说明 |
|------|------|-----------|------|
| **ClaudeCode** | TypeScript/Bun | Anthropic 内部项目（源码泄露版 2026.3.31） | 行业标杆，prompt 工程与工具编排最成熟 |
| **Codex** | Rust + TS | https://github.com/openai/codex | OpenAI 官方，SQ/EQ 双队列，平台级沙箱 |
| **OpenCode** | TypeScript/Bun | https://github.com/opencode-ai/opencode | 社区项目，API-first，40+ provider |
| **OpenClaw** | TypeScript/Node | https://github.com/openclaw-ai/openclaw | 社区项目，Gateway 模式，多渠道接入 |

## VTA 本地项目

| 项目 | 路径 | 说明 |
|------|------|------|
| VTA 开发代码 | `/Users/chongyi/Projects/tosimpletech/virtual-teams/virtual-teams-agent/dev/` | 实际运行时实现 |
| VTA 架构设计 | `/Users/chongyi/Projects/tosimpletech/virtual-teams/project-repos/architecture/virtual-teams-agent/` | 规划方案与 frozen-plan |

## 相关技术资源

| 资源 | 链接 | 说明 |
|------|------|------|
| rig (Rust LLM SDK) | https://github.com/0xPlaygrounds/rig | VTA 当前推理后端依赖 |
| rmcp (Rust MCP SDK) | https://crates.io/crates/rmcp | VTA MCP 集成基于 rmcp |
| MCP 协议规范 | https://modelcontextprotocol.io/ | Model Context Protocol 官方 |
| A2A 协议 | https://github.com/google/A2A | Google Agent-to-Agent 协议 |
| AI SDK (Vercel) | https://sdk.vercel.ai/ | Awaken 支持的 v6 协议 |
| AG-UI / CopilotKit | https://docs.copilotkit.ai/ | Awaken 支持的 UI 协议 |
| OpenTelemetry GenAI Semantic Conventions | https://opentelemetry.io/docs/specs/semconv/gen-ai/ | 可观测性标准 |

## 调研报告索引

| 报告 | 本地路径 |
|------|---------|
| 调研总览 | `../00-research-overview.md` |
| 参考项目架构分析 | `../01-reference-project-analysis.md` |
| CS 架构深度对比 | `../02-cs-architecture-comparison.md` |
| 补充调研 | `../03-supplementary-research.md` |
| Prompt 体系分析 | `../04-prompt-system-analysis.md` |
| **Awaken 对比调研（本系列）** | **`./README.md`** |

# Awaken 项目概述

> 基于 awakenworks/awaken v0.2.1 的深度调研总结
> 仓库地址：https://github.com/awakenworks/awaken
> 本地镜像：`/Users/chongyi/Projects/tosimpletech/jisi-project/agent-sdk-origin-references/awaken/awaken-v0.2.1`

---

## 1. 项目定位

Awaken 是一个 **"Production AI agent runtime for Rust"**，核心口号为 **"type-safe state, multi-protocol serving, plugin extensibility"**。它为构建 AI Agent 提供 Rust-first 后端，强调编译时安全保证和生产级控制路径。

### 1.1 核心目标

- 提供类型安全的 Agent 运行时（typed tools, generated JSON Schema, typed state keys）
- 同一后端同时服务多种客户端协议（HTTP/SSE、AI SDK v6、AG-UI/CopilotKit、A2A、MCP JSON-RPC）
- 配置优先的优化路径（通过 `/v1/config/*` 和 `/v1/capabilities` 端点动态调整）
- 生产级控制路径（mailbox-backed background runs、HITL decisions、cancellation/interrupt、SSE replay、retries、fallback models、circuit breakers）
- 零 `unsafe` 代码（整个 workspace `forbid(unsafe_code)`）

### 1.2 版本与发布状态

| 属性 | 值 |
|------|-----|
| 版本 | 0.2.2-dev（调研时） |
| 发布状态 | 已发布到 crates.io（`awaken-agent`） |
| 许可证 | MIT OR Apache-2.0 |
| Rust 版本 | 1.93+（MSRV 1.93，workspace pins 1.93.0） |
| Edition | 2024 |

---

## 2. 关键特性

### 2.1 运行时能力

| 特性 | 说明 |
|------|------|
| 类型化工具 | `Tool` / `TypedTool` trait，`schemars` 自动生成 JSON Schema |
| 多协议服务 | 一个后端同时支持 5 种协议 |
| 配置优先优化 | Schema-backed config，运行时验证和应用 |
| 生产控制路径 | Mailbox 后台运行、人工介入、取消/中断、SSE 回放、重试、降级模型、熔断器 |
| 状态管理 | `StateKey` 绑定 Rust value/update 类型，run/thread/profile 三层作用域，原子提交 |

### 2.2 插件生态

| 插件 | 功能 | Feature Flag |
|------|------|-------------|
| Permission | 防火墙式工具访问控制（Deny/Allow/Ask 规则） | `permission` |
| Reminder | 工具调用匹配模式时注入上下文消息 | `reminder` |
| Observability | OpenTelemetry 遥测，对齐 GenAI Semantic Conventions | `observability` |
| MCP | 连接外部 MCP 服务器 | `mcp` |
| Skills | 发现技能包，注入目录供 LLM 按需激活 | `skills` |
| Generative UI | 声明式 UI 流式传输到前端 | `generative-ui` |
| Deferred Tools | Beta 概率模型隐藏大工具模式 | `awaken-ext-deferred-tools` |

---

## 3. 技术栈

| 层级 | 技术 |
|------|------|
| 语言 | Rust 1.93+ |
| 构建 | Cargo workspace |
| ORM/存储 | SQLite（内置）、PostgreSQL（可选）、NATS（mailbox） |
| LLM 集成 | 自有 provider 客户端（非 rig） |
| MCP | 自有 MCP 适配层 |
| 协议 | JSON-RPC 2.0、HTTP/SSE、WebSocket、A2A |
| 可观测性 | OpenTelemetry |
| 前端 | Admin Console（自有） |

---

## 4. 项目结构

```
awaken/
├── crates/
│   ├── awaken/              # Facade crate，feature flags 聚合
│   ├── awaken-contract/     # 共享契约：specs、tools、events、transport、state model
│   ├── awaken-runtime/      # 解析器、phase engine、loop runner、运行时控制
│   ├── awaken-server/       # 路由、mailbox、SSE 传输、协议适配器
│   ├── awaken-stores/       # Memory/File/PostgreSQL/SQLite/NATS 存储
│   ├── awaken-tool-pattern/ # Glob/regex 工具匹配
│   ├── awaken-protocol-a2a/ # A2A 协议实现
│   ├── awaken-ext-permission/
│   ├── awaken-ext-observability/
│   ├── awaken-ext-mcp/
│   ├── awaken-ext-skills/
│   ├── awaken-ext-reminder/
│   ├── awaken-ext-generative-ui/
│   └── awaken-ext-deferred-tools/
│
├── apps/
│   └── admin-console/       # Config API 管理 UI
│
├── examples/
│   ├── ai-sdk-starter/
│   ├── copilotkit-starter/
│   └── openui-chat/
│
├── e2e/                     # 端到端测试
└── docs/                    # GitHub Pages 文档 + 中文文档
```

---

## 5. 设计理念

### 5.1 四层核心概念

1. **Tools** — 实现 `Tool` 或 `TypedTool`，`schemars` 生成 JSON Schema
2. **Agents** — system prompt + model + allowed tools；LLM 驱动编排，**"no predefined graphs"**
3. **State** — typed run/thread state + persistent profile/shared state
4. **Plugins** — lifecycle hooks（permissions、observability、context、skills、MCP）

### 5.2 关键设计原则

- **"Configuration is the control plane"**：模型/提供者路由、prompts、reminders、permissions、tool-loading policy 全部通过 schema-backed config 管理，而非硬编码
- **"The LLM orchestrates"**：开发者定义 agent identity、model binding、tool access；无需手写 DAG
- **"Data-driven optimization"**：agent optimization stays data-driven
- **"One backend, many frontends"**：一个 Rust 后端服务多种协议
- **"Explicit over implicit"**：`ToolGate` 在工具执行前进行纯净检查，状态变更需显式原子提交

### 5.3 执行模型

运行时通过 **9 个类型化阶段**执行，包含：
- 纯 `ToolGate`（工具执行前的纯净检查）
- `PhaseHook`（阶段钩子）
- 计划动作（scheduled actions）
- 效果处理（effects）
- 请求转换（request transforms）
- 插件提供的工具

**"Every state change is committed atomically after the gather phase."**

---

## 6. 协议支持矩阵

| 协议 | 端点 | 前端 |
|------|------|------|
| AI SDK v6 | `POST /v1/ai-sdk/chat` | React `useChat()` |
| AG-UI | `POST /v1/ag-ui/run` | CopilotKit `<CopilotKit>` |
| A2A | `POST /v1/a2a/message:send` | 其他 agents |
| MCP | `POST /v1/mcp` | JSON-RPC 2.0 |
| HTTP/SSE Run API | `POST /v1/run` | 通用 HTTP 客户端 |

---

## 7. 适用场景评估

### 建议使用

- 需要 Rust 后端
- 需要多种协议从一个后端服务
- 需要安全并发状态共享
- 需要可审计的 thread history / 可恢复的控制路径
- 愿意自己接入 tools / providers

### 建议避免

- 需要内置 file/shell/web tools（考虑 OpenAI Agents SDK、Dify、CrewAI）
- 想要可视化 workflow builder（考虑 Dify、LangGraph Studio）
- 偏好 Python（考虑 LangGraph、AG2、PydanticAI）
- 需要稳定/慢速变动的 API
- 想要 LLM-managed memory（考虑 Letta）

---

## 8. 与 VTA 的初步定位差异

| 维度 | Awaken | VTA |
|------|--------|-----|
| 定位 | 通用 Agent Runtime 框架 | Pure Agent 运行时骨架 |
| 开箱即用程度 | 高（内置插件、预设行为） | 零（所有能力需配置注入） |
| 目标用户 | Rust 开发者构建 Agent 服务 | 平台/生态构建者，通过配置包组合 Agent |
| 场景绑定 | 无特定场景 | 为"虚拟员工"生态提供原子化能力 |
| 前端协议 | 5 种已支持 | 规划中（Phase 3-4） |
| 管理界面 | Admin Console 已存在 | 未规划 |

# Awaken 架构深度分析

> 基于 awakenworks/awaken v0.2.1 源码阅读
> 仓库地址：https://github.com/awakenworks/awaken
> 本地镜像：`/Users/chongyi/Projects/tosimpletech/jisi-project/agent-sdk-origin-references/awaken/awaken-v0.2.1`

---

## 1. 三层架构

Awaken 采用清晰的三层架构：

```
┌─────────────────────────────────────────────┐
│           awaken (Facade crate)              │
│     聚合 feature flags，统一对外暴露          │
└─────────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  awaken-     │ │  awaken-     │ │  awaken-     │
│  contract    │ │  runtime     │ │  server      │
│  契约层       │ │  运行时层     │ │  服务端层     │
└──────────────┘ └──────────────┘ └──────────────┘
         │              │               │
         ▼              ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  awaken-     │ │  awaken-     │ │  awaken-ext-*│
│  stores      │ │  tool-pattern│ │  扩展插件     │
│  存储实现     │ │  工具匹配     │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 1.1 awaken-contract（契约层）

**职责**：共享契约，所有 crate 的基础依赖。

**核心模块**：
- `contract/` — Agent 规范、模型/提供者规范、工具定义、事件、传输 trait、类型化状态模型
  - `active_agent.rs` — 活跃 Agent 定义
  - `bundle.rs` — Prompt bundle
  - `event.rs` / `event_sink.rs` — 事件体系
  - `executor.rs` — 执行器 trait
  - `identity.rs` — Run/Thread identity
  - `inference.rs` — 推理抽象
  - `lifecycle.rs` — 生命周期管理
  - `mailbox.rs` — Mailbox 抽象
  - `message.rs` — 消息模型
  - `tool.rs` / `tool_schema.rs` / `tool_intercept.rs` — 工具定义与拦截
  - `transport.rs` — 传输 trait
- `model/` — 动作、效果、阶段、编解码
  - `action.rs` — 动作定义
  - `effect.rs` — 效果定义
  - `phase.rs` — 阶段定义
- `state/` — 状态命令、变更、快照
  - `command.rs` — 状态命令
  - `mutation.rs` — 状态变更
  - `slot.rs` / `snapshot.rs` — 状态槽与快照

**关键类型**：
- `AgentSpec` — Agent 规范
- `Tool` / `TypedTool` — 工具 trait
- `ToolDescriptor` / `ToolResult` / `ToolOutput` — 工具描述与结果
- `Message` / `Role` — 消息模型
- `StateKey` / `StateCommand` / `Snapshot` — 状态管理
- `AgentEvent` / `EventSink` — 事件体系

### 1.2 awaken-runtime（运行时层）

**职责**：将 `AgentSpec` 解析为 `ResolvedExecution`，执行 9 阶段循环，管理活跃运行和外部控制。

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| `agent` | `agent/state/` | Agent 状态管理（run lifecycle、tool call lifecycle、pending work） |
| `backend` | `backend/mod.rs`, `backend/local.rs` | 执行后端抽象（`ExecutionBackend` trait） |
| `builder` | `builder.rs` | `AgentRuntimeBuilder` |
| `context` | `context/`, `context/transform/` | 上下文管理、压缩、摘要、截断 |
| `engine` | `engine/` | 引擎：circuit breaker、retry、streaming、executor、mock |
| `execution` | `execution/` | 执行器实现 |
| `extensions` | `extensions/a2a/`, `extensions/background/`, `extensions/handoff/` | 扩展：A2A 子 Agent、后台任务、Handoff 切换 |
| `hooks` | `hooks/` | PhaseHook、ToolGateHook、ToolPolicyHook |
| `inbox` | `inbox.rs` | 消息收件箱 |
| `loop_runner` | `loop_runner/` | 主执行循环（orchestrator、step、checkpoint、resume、setup） |
| `phase` | `phase/` | Phase pipeline engine |
| `plugins` | `plugins/` | 插件注册与生命周期 |
| `policies` | `policies/` | 策略插件 |
| `registry` | `registry/`, `registry/resolve/` | Agent 注册表与解析 |
| `runtime` | `runtime/agent_runtime/` | 主运行时 API |
| `state` | `state/` | 状态存储实现 |

### 1.3 awaken-server（服务端层）

**职责**：HTTP 路由、SSE 传输、mailbox 后台执行、协议适配器。

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| `app` | `app.rs` | Axum 应用构建 |
| `config_routes` | `config_routes.rs` | Config API 路由 |
| `event_relay` | `event_relay.rs` | 事件中继 |
| `http_run` | `http_run.rs` | HTTP Run API |
| `http_sse` | `http_sse.rs` | SSE 传输 |
| `mailbox` | `mailbox.rs` | Mailbox 后台执行 |
| `protocols` | `protocols/` | 协议适配器 |
| `services` | `services/` | 业务服务 |
| `transport` | `transport/` | 传输抽象（replay buffer、transcoder） |

**协议适配器目录**：
- `protocols/ai_sdk_v6/` — AI SDK v6 适配
- `protocols/ag_ui/` — AG-UI / CopilotKit 适配
- `protocols/a2a/` — A2A 协议适配
- `protocols/mcp/` — MCP JSON-RPC 适配
- `protocols/acp/` — ACP（Agent Communication Protocol）适配

---

## 2. 9 阶段执行引擎

Awaken 的运行时执行基于 **9 个类型化阶段**，这是其最核心的架构特征。

### 2.1 Phase 体系

```rust
pub enum Phase {
    // ... 9 个阶段
}
```

**阶段列表**（基于源码推断）：

1. **Setup** — 准备运行：解析 AgentSpec、初始化状态、加载工具
2. **Resolve** — 解析执行计划：确定模型、工具集、prompt
3. **Pre-inference** — 推理前钩子：插件可修改请求
4. **Inference** — 调用 LLM：流式/非流式响应
5. **Parse** — 解析响应：提取文本、tool calls、reasoning
6. **ToolGate** — 工具门控：**纯净检查**，决定是否允许执行工具（可挂起等待审批）
7. **ToolExecution** — 执行工具：串行/并行执行
8. **Gather** — 收集结果：合并 tool results、更新状态
9. **Commit** — 原子提交：**所有状态变更在此阶段统一提交**

### 2.2 PhaseHook 机制

```rust
pub trait PhaseHook: Send + Sync {
    fn phase(&self) -> Phase;
    async fn invoke(
        &self,
        ctx: &PhaseContext,
    ) -> Result<PhaseOutcome, HookError>;
}
```

插件通过实现 `PhaseHook` 在特定阶段介入执行流程。

### 2.3 ToolGateHook

**最重要的 hook 之一**，在工具执行前进行纯净检查：

```rust
pub trait ToolGateHook: Send + Sync {
    async fn check(
        &self,
        tool_id: &str,
        args: &Value,
        ctx: &ToolCallContext,
    ) -> Result<ToolGateDecision, ToolGateError>;
}
```

决策类型：
- `Allow` — 允许执行
- `Deny` — 拒绝执行
- `Suspend` — 挂起，等待外部决策（人工审批）

### 2.4 状态原子提交

```
Gather 阶段收集所有变更
    ↓
Commit 阶段统一应用
    ↓
如果失败 → 回滚，保持状态一致性
```

---

## 3. 插件系统深度分析

### 3.1 插件生命周期

```
注册 (PluginRegistrar)
    ↓
初始化 (Plugin::init)
    ↓
激活 — 注册 PhaseHook / ToolGateHook / 提供工具
    ↓
运行时 — 按 phase 触发 hook
    ↓
停用 (Plugin::shutdown)
```

### 3.2 核心插件分析

#### Permission 插件 (`awaken-ext-permission`)

**防火墙式工具访问控制**：
- 规则类型：Deny / Allow / Ask
- 匹配方式：工具 ID、glob 模式、正则表达式
- 状态持久化：per-profile / per-thread / per-run

```rust
pub enum PermissionRule {
    Deny { pattern: ToolPattern },
    Allow { pattern: ToolPattern },
    Ask { pattern: ToolPattern },
}
```

#### Reminder 插件 (`awaken-ext-reminder`)

**上下文消息注入**：
- 基于工具调用模式触发
- 可注入 system 或 conversation 级别的上下文
- 规则驱动：`Rule { match: Pattern, inject: ReminderContent }`

#### Observability 插件 (`awaken-ext-observability`)

**OpenTelemetry 集成**：
- 对齐 GenAI Semantic Conventions
- 指标：token 使用、延迟、工具调用次数
- 追踪：span 覆盖每个 phase
- 日志：结构化日志

#### MCP 插件 (`awaken-ext-mcp`)

**外部 MCP 服务器集成**：
- 连接外部 MCP servers
- 将其 tools 注册为原生 Awaken tools
- 配置路径：`deferred_tools` agent 节
- 通过 `/v1/config/*` 管理 MCP 服务器

#### Skills 插件 (`awaken-ext-skills`)

**技能包发现与激活**：
- 发现 skill packages
- 注入目录供 LLM 按需激活
- 支持嵌入式 skills 和外部 skills

#### Generative UI 插件 (`awaken-ext-generative-ui`)

**声明式 UI 流式传输**：
- A2UI / JSON Render / OpenUI Lang
- 将 UI 定义流式传输到前端

#### Deferred Tools 插件 (`awaken-ext-deferred-tools`)

**智能工具加载**：
- Beta 概率模型
- 隐藏大工具模式，按需加载
- 减少上下文窗口占用

---

## 4. 状态管理系统

### 4.1 StateKey 设计

```rust
pub struct StateKey<T, U> {
    key: String,
    _value_type: PhantomData<T>,
    _update_type: PhantomData<U>,
}
```

- `T` — 值类型
- `U` — 更新类型
- 绑定到 Rust 类型，编译时安全

### 4.2 三层作用域

| 作用域 | 生命周期 | 用途 |
|--------|---------|------|
| `run` | 单次运行 | 运行级临时状态 |
| `thread` | 线程/会话 | 跨 run 的会话状态 |
| `profile` | 配置文件级 | 跨线程的共享状态 |

### 4.3 状态变更流程

```
Tool/Plugin 产生 StateCommand
    ↓
StateCommand 包含 MutationBatch
    ↓
Gather phase 收集所有 MutationBatch
    ↓
Commit phase 原子应用
    ↓
触发 CommitHook
    ↓
发射 CommitEvent
```

---

## 5. 后台运行与 Mailbox 系统

### 5.1 Mailbox 架构

Awaken 的 Mailbox 系统支持**后台运行**：

```
Client 发起 RunRequest
    ↓
Backend 创建 Mailbox
    ↓
Agent 在后台执行 loop
    ↓
Client 可随时：
  - 查询状态
  - 发送决策（审批/中断）
  - 订阅事件流
  - 恢复运行
```

### 5.2 后台任务插件 (`extensions/background/`)

```rust
pub struct BackgroundTaskPlugin;
```

- 在 `Phase::StepEnd` 设置 `PendingWorkKey`
- 阻止 `NaturalEnd`，保持运行活跃
- 支持后台任务完成后通知

### 5.3 恢复机制

```rust
pub async fn detect_and_replay_resume(
    store: &StateStore,
    messages: &mut Vec<Message>,
) -> Result<ResumeOutcome, ResumeError> {
    // 检测挂起的 tool calls
    // 重放 resume 决策
}
```

---

## 6. Agent 编排能力

### 6.1 AgentTool — 子 Agent 委派

```rust
pub struct AgentTool {
    agent_id: String,
    description: String,
    resolver: Arc<dyn ExecutionResolver>,
}
```

支持两种模式：
- **Local**：委派给本地已注册的 Agent（`LocalBackend`）
- **Remote**：通过 A2A 协议委派给远程 Agent（`A2aBackend`）

```rust
impl AgentTool {
    pub fn local(agent_id: &str, resolver: Arc<dyn AgentResolver>) -> Self;
    pub fn remote(agent_id: &str, config: A2aConfig) -> Self;
}
```

### 6.2 Handoff — 动态 Agent 切换

```rust
pub struct HandoffPlugin;
pub struct AgentOverlay {
    pub system_prompt: Option<String>,
    pub model_id: Option<String>,
    pub allowed_tools: Option<Vec<String>>,
    pub excluded_tools: Option<Vec<String>>,
}
```

- 在同一线程内动态切换 Agent 变体
- 不终止运行，即时生效
- 通过 overlay 覆盖基础配置

### 6.3 BackendParentContext

```rust
pub struct BackendParentContext {
    pub parent_run_id: Option<String>,
    pub parent_thread_id: Option<String>,
    pub parent_tool_call_id: Option<String>,
}
```

支持父子运行链路追踪。

---

## 7. 前端工具（FrontEndTool）

```rust
pub struct FrontEndTool {
    descriptor: ToolDescriptor,
}

#[async_trait]
impl Tool for FrontEndTool {
    async fn execute(
        &self,
        args: Value,
        ctx: &ToolCallContext,
    ) -> Result<ToolOutput, ToolError> {
        // 1. 挂起工具调用
        // 2. 通过协议层转发给前端
        // 3. 等待前端 resume 决策
        // 4. 将决策结果作为 tool result
    }
}
```

**关键行为**：
- 执行时返回 `ToolStatus::Pending`
- 生成 `SuspendTicket`，action 为 `UseDecisionAsToolResult`
- 协议层（如 AG-UI）将挂起转发给前端
- 前端执行后发送 resume 决策
- 决策内容 verbatim 作为 tool result

---

## 8. 协议适配层设计

### 8.1 通用架构

```
Transport Layer (WebSocket / HTTP / stdio)
    ↓
Protocol Adapter (ai_sdk_v6 / ag_ui / a2a / mcp / acp)
    ↓
Shared Logic (event conversion, message mapping)
    ↓
Runtime API (AgentRuntime::run)
```

### 8.2 AI SDK v6 适配器

```rust
// protocols/ai_sdk_v6/
pub mod encoder;   // 消息编码
pub mod http;      // HTTP 路由
pub mod request;   // 请求解析
pub mod types;     // 类型定义
```

将 Awaken 的内部事件映射为 AI SDK v6 的 `Message` / `ChatCompletion` 格式。

### 8.3 AG-UI 适配器

```rust
// protocols/ag_ui/
pub mod encoder;   // 流式编码
pub mod http;      // HTTP 路由
pub mod types;     // 类型定义
```

将事件流编码为 AG-UI 的增量更新格式。

### 8.4 MCP 适配器

```rust
// protocols/mcp/
pub mod adapter;   // MCP 适配
pub mod http;      // HTTP 路由
pub mod stdio;     // stdio 传输
```

将 MCP JSON-RPC 请求映射为 Awaken 内部调用。

---

## 9. 存储层设计

### 9.1 存储后端

| 后端 | 用途 | 特性 |
|------|------|------|
| Memory | 测试/原型 | 非持久化 |
| File | 轻量场景 | 文件系统持久化 |
| SQLite | 单节点生产 | WAL 模式、mailbox 支持 |
| PostgreSQL | 多节点生产 | 连接池、LISTEN/NOTIFY |
| NATS | 分布式 | Mailbox、事件流 |

### 9.2 Mailbox 存储

Mailbox 是后台运行的核心：
- `sqlite_mailbox.rs` — SQLite 实现的 mailbox
- `nats_mailbox/` — NATS 分布式 mailbox
- `memory_mailbox.rs` — 内存 mailbox

### 9.3 Thread Store

```rust
pub trait ThreadRunStore: Send + Sync {
    async fn create_run(&self, record: RunRecord) -> Result<(), StorageError>;
    async fn update_run(&self, id: &str, update: RunUpdate) -> Result<(), StorageError>;
    async fn get_run(&self, id: &str) -> Result<Option<RunRecord>, StorageError>;
    // ...
}
```

---

## 10. 与 VTA 架构的关键对照点

| 维度 | Awaken | VTA |
|------|--------|-----|
| **分层模型** | contract → runtime → server | runtime-core → kernel → host |
| **Loop 归属** | runtime 内的 phase engine | kernel 纯生命周期 + runtime-agent 独立 loop |
| **阶段粒度** | 9 阶段 pipeline | Phase 1 简单 loop，尚未阶段化 |
| **状态作用域** | run/thread/profile 三层 | Session/Turn + persistent context |
| **状态提交** | 原子 commit（gather 后） | 逐事件追加，尚未原子化 |
| **工具挂起** | `SuspendTicket` + `FrontEndTool` | 尚未实现审批挂起 |
| **后台运行** | `BackgroundTaskPlugin` + mailbox | 未规划 |
| **Agent 切换** | `HandoffPlugin` + `AgentOverlay` | 未规划 |
| **子 Agent** | `AgentTool`（仅 A2A/Awaken Agent） | 计划支持任意第三方 Agent |
| **协议适配** | 5 种已支持 | Phase 3-4 规划 |
| **管理界面** | Admin Console 已存在 | 未规划 |
| **可观测性** | OpenTelemetry 插件 | 未规划 |

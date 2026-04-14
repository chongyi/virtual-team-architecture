# Agent 架构设计方案

> 版本：v0.1-draft | 日期：2026-04-08 | 状态：待评审
>
> 说明：本文是总体架构总览，负责描述目标架构与阶段划分。`Phase 1-2` 的冻结实施方案、基线校正项与接口边界，统一维护在 [`frozen-plan/`](frozen-plan/README.md)。

## 1. 概述

### 1.1 目标

基于现有 runtime 框架，实现生产可用的 Agent 推理循环，使系统具备：

- 完整的 LLM 对话循环（prompt → inference → tool call → loop）
- Client-Server 一等公民架构，支持多前端接入
- 广泛的多 LLM Provider 支持
- 可配置的 agent 角色、风格与行为（无需改代码）
- Sub-agent 编排能力
- 长上下文自动压缩

### 1.2 设计原则

- **Trait 驱动**：核心能力通过 trait 定义，具体实现由 host 组装注入
- **配置包驱动**：agent 的角色/风格/prompt 通过外部配置包定义，支持热更新
- **事件溯源 + 工作状态双轨**：Events 保证审计完整性，Message 表服务实时查询
- **现有架构最大复用**：在已有 crate 基础上扩展，不重建

### 1.3 当前代码基线与实现边界

当前代码基线已经具备 `runtime-core / runtime-store / runtime-kernel / runtime-host / runtime-inference / runtime-protocol` 的稳定底座，但尚未完成以下能力：

- `runtime-agent` crate
- `MessageStore` 与消息工作轨
- Prompt 配置包管理
- Protocol Handler
- WebSocket / stdio transport

因此本文中的部分内容是目标架构描述，而不是“当前代码已实现能力”说明。针对 `Phase 1-2` 的实现边界，本轮冻结结论如下：

- `runtime-kernel` 只负责 session / turn 生命周期、状态校验、事件追加与审批状态
- `runtime-agent` 负责完整推理循环、PromptManager、tool loop 与消息工作轨
- `runtime-host` 继续作为唯一 composition root，并在 `Phase 1-2` 内承载 Protocol Handler
- WebSocket / stdio transport 后置到 `Phase 3`

### 1.4 参考项目调研总结

| 项目 | 语言 | 核心 Loop 模式 | CS 架构 | Provider |
|------|------|---------------|---------|----------|
| ClaudeCode | TypeScript/Bun | AsyncGenerator yield | 单进程 + 可选 Bridge | Anthropic-only |
| Codex | Rust | SQ/EQ 双队列 | In-process channel + Axum WS | OpenAI-primary |
| OpenCode | TypeScript/Bun | SessionProcessor for 循环 | Hono HTTP + SSE | 40+ via ai-sdk |
| OpenClaw | TypeScript/Node | Pi Agent Core 委托 | Gateway WebSocket | 多供应商 via 扩展 |

## 2. 架构总览

### 2.1 更新后的 Crate 依赖图

```
runtime-core ← 领域模型、强类型 ID、事件体系、核心 trait
  ↑
runtime-store ← 持久化抽象（Session/Turn/Event/Message/Approval Store）
  ↑
runtime-store-memory / runtime-store-sqlite ← 存储后端实现
  ↑
runtime-kernel ← Session/Turn 生命周期、事件广播
  ↑
runtime-inference ← Prompt 管线（Composer→Renderer→Projector→Backend）
  ↑
runtime-inference-rig ← Rig 后端（18+ provider）
  ↑
runtime-tools / runtime-skills / runtime-mcp / runtime-plugins ← 扩展点
  ↑
runtime-agent ← 【新增】推理循环、PromptManager、CompactionStrategy、Sub-agent
  ↑
runtime-host ← 组装层（注入所有实现、Phase 1-2 承载 Protocol Handler，Phase 3 接入传输层）
  ↑
host-cli / host-daemon ← 入口
```

### 2.2 新增与变更清单

| Crate | 变更类型 | 说明 |
|-------|---------|------|
| `runtime-agent` | **新增** | 推理循环核心、PromptManager、CompactionStrategy |
| `runtime-core` | 扩展 | 新增 Message/Part 类型、SceneId、Session parent 字段 |
| `runtime-store` | 扩展 | 新增 MessageStore trait |
| `runtime-store-memory` | 扩展 | MessageStore 内存实现 |
| `runtime-store-sqlite` | 扩展 | MessageStore SQLite 实现 |
| `runtime-host` | 扩展 | 注入 runtime-agent、在 Phase 1-2 承载 Protocol Handler、在 Phase 3 接入 transport |

## 3. 核心决策记录

| # | 决策 | 结论 | 理由 |
|---|------|------|------|
| 1 | Agent Loop 归属 | 新建 `runtime-agent` crate | 保持 kernel 纯净（只管生命周期），loop 独立编排 |
| 2 | CS 传输层 | WebSocket + stdio 双传输 | WS 面向网络客户端，stdio 面向本地 daemon，统一由 JSON-RPC 2.0 承载 |
| 3 | 状态持久化 | Events 审计 + Message 工作状态双轨 | Events 保证审计/回放，Message 表服务 loop 实时查询，职责清晰 |
| 4 | Sub-agent | 独立 Session + parent 链接 | 天然隔离，独立 profile/tools/model，上下文共享通过额外机制实现 |
| 5 | 长上下文 | CompactionStrategy trait | trait 驱动，策略可替换，可用不同模型，由 host 注入 |
| 6 | 动态模型选择 | MainLoop / Scene(动态) / SmallFast 三类别 | SceneId 作为策略索引键，配置驱动，回退链清晰 |
| 7 | Prompt 管理 | PromptManager 在 runtime-agent，配置包驱动 | agent 角色/风格/行为通过配置包定义，无需改代码 |

## 4. runtime-agent 详细设计

`runtime-agent` 是新增的核心 crate，职责是驱动完整的推理循环。

### 4.1 依赖关系

```toml
[dependencies]
runtime-core = { path = "../runtime-core" }
runtime-kernel = { path = "../runtime-kernel" }
runtime-store = { path = "../runtime-store" }
runtime-inference = { path = "../runtime-inference" }
runtime-tools = { path = "../runtime-tools" }
runtime-skills = { path = "../runtime-skills" }
runtime-mcp = { path = "../runtime-mcp" }
```

不依赖任何具体后端实现（runtime-inference-rig、runtime-store-sqlite 等），全部通过 trait 注入。

### 4.2 Agent Loop

#### 核心流程

```
用户输入
  ↓
kernel.start_turn(session_id, input)  ← 创建 Turn，记录生命周期
  ↓
prompt_manager.resolve_templates(profile, scene)  ← 从配置包解析模板
  ↓
prompt_composer.compose(request) → PromptBundle  ← 组装 9 层 prompt
  ↓
prompt_renderer.render(bundle) → RenderedPromptBundle  ← 渲染模板变量
  ↓
prompt_projector.project(rendered) → PromptProjection  ← 投影到 provider 格式
  ↓
┌─── inference_loop ───────────────────────────────────┐
│                                                       │
│  model_selector.select(scene_id) → ModelSelector      │
│  inference_backend.execute(request) → stream/result   │
│    ↓                                                  │
│  解析 LLM 响应：                                       │
│    ├─ 纯文本 → 写入 Message 表，发射事件               │
│    ├─ tool_call → 权限检查 → 执行工具 → 结果写入       │
│    │   ↓                                              │
│    │   追加 tool_result 到消息历史                      │
│    │   ↓                                              │
│    │   继续循环（回到 inference_backend.execute）       │
│    └─ stop_reason=end_turn → 退出循环                  │
│                                                       │
│  每轮检查：                                            │
│    - token 阈值 → 触发 compaction_strategy.compact()  │
│    - doom loop 检测（连续 N 次相同错误 → 中止）         │
│    - abort signal → 取消                              │
│                                                       │
└───────────────────────────────────────────────────────┘
  ↓
kernel.complete_turn(turn_id, result)  ← 完成 Turn
  ↓
发射 TurnCompleted 事件
```

#### 关键 Trait

```rust
/// Agent 推理循环的核心 trait。
#[async_trait]
pub trait AgentLoop: Send + Sync {
    /// 执行一个完整的 turn（从用户输入到 LLM 最终响应）。
    async fn run_turn(
        &self,
        context: TurnExecutionContext,
        sink: &dyn AgentEventSink,
    ) -> Result<TurnResult, RuntimeError>;
}

/// Turn 执行上下文，包含 loop 所需的全部依赖。
pub struct TurnExecutionContext {
    pub session_id: SessionId,
    pub turn_id: TurnId,
    pub input: TurnInput,
    pub profile: AgentProfile,
    pub message_history: Vec<Message>,
    pub abort_signal: CancellationToken,
}

/// Agent 事件接收器，loop 通过它向外部推送实时事件。
#[async_trait]
pub trait AgentEventSink: Send + Sync {
    async fn emit(&self, event: AgentLoopEvent);
}

/// Loop 内部产生的事件。
pub enum AgentLoopEvent {
    /// LLM 流式文本 delta
    TextDelta { content: String },
    /// LLM 推理 delta（thinking）
    ReasoningDelta { content: String },
    /// 工具调用开始
    ToolCallStarted { tool_name: String, arguments: Value },
    /// 工具调用完成
    ToolCallCompleted { tool_name: String, result: ToolCallResult },
    /// 需要用户审批
    ApprovalRequired { approval_request: ApprovalRequest },
    /// Compaction 触发
    CompactionTriggered { strategy: String },
    /// 模型切换
    ModelSwitched { from: ModelSelector, to: ModelSelector, reason: String },
}
```

### 4.3 PromptManager

#### 职责

- 从配置包加载 prompt 模板文件
- 解析 `PromptTemplateRef` → 实际模板内容
- 按 AgentProfile / SceneId / Provider 维度路由
- 支持热更新（文件监听或显式 reload）

#### 配置包结构

```
prompt-packages/
  default/                          ← 默认 agent 配置包
    manifest.toml                   ← 包元数据（名称、版本、描述）
    system/
      identity.hbs                  ← agent 身份定义
      constraints.hbs               ← 行为约束
      capabilities.hbs              ← 能力声明
    scenes/
      chat.hbs                      ← Chat 场景 prompt
      plan.hbs                      ← Plan 场景 prompt
      compaction.hbs                ← Compaction 场景 prompt
      deep-thinking.hbs             ← 深度思考场景 prompt
    providers/                      ← provider 特化覆盖（可选）
      anthropic/
        system.hbs                  ← 覆盖 Anthropic 的系统 prompt
    tools/
      tool-usage-guide.hbs          ← 工具使用指南
    runtime/
      reminder.hbs                  ← 运行时注入的 reminder 模板
  code-reviewer/                    ← 另一个 agent 角色配置包
    manifest.toml
    system/
      identity.hbs
    ...
```

#### 核心接口

```rust
/// Prompt 配置包管理器。
#[async_trait]
pub trait PromptManager: Send + Sync {
    /// 解析模板引用为实际模板内容。
    async fn resolve_template(
        &self,
        template_ref: &PromptTemplateRef,
        resolution_context: &PromptResolutionContext,
    ) -> Result<ResolvedPromptTemplate, RuntimeError>;

    /// 列出当前配置包中所有可用的模板。
    async fn list_templates(&self) -> Result<Vec<PromptTemplateRef>, RuntimeError>;

    /// 重新加载配置包（热更新）。
    async fn reload(&self) -> Result<(), RuntimeError>;
}

/// 模板解析上下文，用于路由到正确的模板。
pub struct PromptResolutionContext {
    pub profile_id: AgentProfileId,
    pub scene_id: Option<SceneId>,
    pub provider_id: Option<ProviderId>,
}
```

### 4.4 CompactionStrategy

#### 职责

- 在 token 阈值触发时压缩对话历史
- 策略可替换（全量压缩、部分压缩、滑动窗口等）
- 可使用独立模型（通过 SceneId::Compaction 路由）

#### 核心接口

```rust
/// 对话历史压缩策略。
#[async_trait]
pub trait CompactionStrategy: Send + Sync {
    /// 返回此策略关联的 SceneId（用于模型路由）。
    fn scene_id(&self) -> SceneId {
        SceneId::new("compaction")
    }

    /// 判断是否需要触发压缩。
    fn should_compact(&self, context: &CompactionContext) -> bool;

    /// 执行压缩，返回压缩后的消息历史。
    async fn compact(
        &self,
        context: CompactionContext,
        inference: &dyn InferenceBackend,
        sink: &dyn AgentEventSink,
    ) -> Result<CompactionResult, RuntimeError>;
}

/// 压缩上下文。
pub struct CompactionContext {
    pub session_id: SessionId,
    pub messages: Vec<Message>,
    pub total_tokens: usize,
    pub token_limit: usize,
    pub model_selector: ModelSelector,
}

/// 压缩结果。
pub struct CompactionResult {
    /// 压缩后的消息列表（替换原有历史）。
    pub compacted_messages: Vec<Message>,
    /// 压缩摘要（用于审计）。
    pub summary: String,
    /// 压缩前后的 token 变化。
    pub tokens_before: usize,
    pub tokens_after: usize,
}
```

#### 内置策略

| 策略 | 说明 |
|------|------|
| `FullCompaction` | 将全部历史压缩为结构化摘要，替换所有旧消息 |
| `PartialCompaction` | 保留最近 N 条消息，仅压缩较早部分 |
| `SlidingWindowCompaction` | 保持固定窗口大小，超出部分逐步压缩 |

### 4.5 Sub-agent

#### 创建流程

```
父 agent loop 遇到需要子 agent 的场景
  ↓
kernel.create_session(child_profile_id, parent_session_id, parent_turn_id)
  ↓
创建子 Session（独立 profile、tools、model）
  ↓
agent_loop.run_turn(child_session, child_input)
  ↓
子 agent 独立执行完整 loop
  ↓
子 turn 完成 → TurnResult 回传父 agent
  ↓
父 agent 将子 agent 结果作为 tool_result 继续 loop
```

#### Session 扩展字段

```rust
pub struct Session {
    // ... 现有字段 ...

    /// 父 Session ID（仅子 agent session 有值）。
    pub parent_session_id: Option<SessionId>,
    /// 触发创建此子 session 的父 Turn ID。
    pub parent_turn_id: Option<TurnId>,
}
```

子 agent 对外部客户端完全可观测——它就是一个普通 session，可以通过 `runtime.session.list` 查询，通过 `runtime.event.subscribe` 订阅事件。父子关系通过 parent 字段追溯。

### 4.6 模型选择

#### 三类别模型

```rust
/// 场景标识符，用于 SceneModel 路由。
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct SceneId(String);

impl SceneId {
    pub fn new(id: impl Into<String>) -> Self { Self(id.into()) }

    // 预定义常量（可通过配置扩展）
    pub const PLAN: &str = "plan";
    pub const CHAT: &str = "chat";
    pub const COMPACTION: &str = "compaction";
    pub const DEEP_THINKING: &str = "deep_thinking";
    pub const TITLE: &str = "title";
    pub const SUMMARY: &str = "summary";
}
```

#### ModelPolicy 扩展

```rust
pub struct ModelPolicy {
    /// 主循环模型（MainLoopModel）。
    pub default_selector: ModelSelector,

    /// 小快模型（SmallFastModel），用于轻量任务。
    pub fast_selector: Option<ModelSelector>,

    /// 场景模型映射（SceneModel），按 SceneId 路由。
    pub scene_selectors: BTreeMap<SceneId, ModelSelector>,

    /// 模型切换策略。
    pub switch_policy: ModelSwitchPolicy,

    /// 模型路由策略（预留）。
    pub routing_policy: ModelRoutingPolicy,
}
```

#### 回退链

```
请求 SceneModel(scene_id)
  → scene_selectors.get(scene_id)
  → 未找到 → default_selector (MainLoopModel)

请求 SmallFastModel
  → fast_selector
  → 未配置 → default_selector (MainLoopModel)
```

## 5. 现有 Crate 变更

### 5.1 runtime-core 扩展

#### 新增类型

```rust
/// 对话消息（agent loop 工作状态）。
pub struct Message {
    pub id: MessageId,
    pub session_id: SessionId,
    pub turn_id: TurnId,
    /// 消息角色。
    pub role: MessageRole,
    /// 消息内容部件列表。
    pub parts: Vec<Part>,
    /// 消息级元数据（token 计数、模型信息等）。
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
}

/// 消息角色。
pub enum MessageRole {
    User,
    Assistant,
    ToolResult,
    System,
}

/// 消息内容部件（一条消息可包含多个部件）。
pub struct Part {
    pub id: PartId,
    pub message_id: MessageId,
    /// 部件类型。
    pub kind: PartKind,
    /// 部件内容。
    pub content: Value,
    pub metadata: Value,
}

/// 部件类型。
pub enum PartKind {
    Text,
    Reasoning,
    ToolCall,
    ToolResult,
    Image,
    CompactionSummary,
}

/// 场景标识符。
pub struct SceneId(String);
```

#### Session 扩展

```rust
// Session 新增字段
pub parent_session_id: Option<SessionId>,
pub parent_turn_id: Option<TurnId>,
```

#### ModelPolicy 扩展

```rust
// ModelPolicy 新增字段
pub fast_selector: Option<ModelSelector>,
pub scene_selectors: BTreeMap<SceneId, ModelSelector>,
```

### 5.2 runtime-store 扩展

```rust
/// 消息持久化 trait。
#[async_trait]
pub trait MessageStore: Send + Sync {
    async fn create_message(&self, message: Message) -> StoreResult<()>;
    async fn get_message(&self, id: &MessageId) -> StoreResult<Option<Message>>;
    async fn list_messages(&self, query: MessageQuery) -> StoreResult<Vec<Message>>;
    /// 批量替换消息（compaction 后使用）。
    async fn replace_messages(
        &self,
        session_id: &SessionId,
        messages: Vec<Message>,
    ) -> StoreResult<()>;
    async fn delete_messages_by_session(&self, session_id: &SessionId) -> StoreResult<u64>;
}

pub struct MessageQuery {
    pub session_id: SessionId,
    pub turn_id: Option<TurnId>,
    pub role: Option<MessageRole>,
    pub limit: Option<u32>,
    pub before: Option<MessageId>,
}
```

`RuntimeStores` 扩展 `messages()` 方法，`StoreProvider` 的 transaction 也需覆盖 MessageStore。

### 5.3 runtime-host 变更

- 新增 `runtime-agent` 依赖
- `RuntimeHost::build()` 中组装 `AgentLoop` 实现并注入依赖
- `Phase 1-2` 内新增 host-owned Protocol Handler 边界
- `Phase 3` 再新增传输层抽象（见第 6 节）
- `RuntimeHostConfig` 扩展 agent 相关配置（配置包路径、compaction 策略等）

## 6. 传输层设计

> 本节描述的是目标态 transport 架构。按冻结后的实施边界，`Protocol Handler` 在 `Phase 1-2` 先落在 `runtime-host` 内，WebSocket / stdio transport 的具体实现统一后置到 `Phase 3`。

### 6.1 统一抽象

```rust
/// 传输层 trait，统一 WebSocket 和 stdio。
#[async_trait]
pub trait Transport: Send + Sync {
    /// 接收客户端请求。
    async fn recv(&self) -> Result<JsonRpcRequest<Value>, TransportError>;
    /// 发送响应给客户端。
    async fn send_response(&self, response: JsonRpcResponse) -> Result<(), TransportError>;
    /// 推送通知给客户端。
    async fn send_notification(&self, notification: JsonRpcNotification<Value>) -> Result<(), TransportError>;
    /// 关闭传输。
    async fn close(&self) -> Result<(), TransportError>;
}
```

### 6.2 WebSocket Transport

- 基于 Axum 的 WebSocket 升级
- 单连接承载 JSON-RPC 请求/响应/通知
- 支持多客户端并发连接
- 心跳保活（ping/pong）
- 慢客户端检测与断开

### 6.3 stdio Transport

- 基于 tokio stdin/stdout 的行分隔 JSON-RPC
- 单客户端模式
- 适用于 host-daemon 被 IDE/CLI 进程管理的场景
- 与现有 MCP stdio 传输模式一致

### 6.4 协议复用

两种传输共享同一套 `runtime-protocol` 定义的方法集和事件投影逻辑。传输层只负责字节搬运，不涉及业务语义。

```
Client ←→ Transport (WS/stdio) ←→ Protocol Handler ←→ RuntimeHost ←→ AgentLoop
```

## 7. 数据模型

### 7.1 Message 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | MessageId (TEXT PK) | 消息唯一标识 |
| `session_id` | SessionId (TEXT, INDEX) | 所属 session |
| `turn_id` | TurnId (TEXT, INDEX) | 所属 turn |
| `role` | TEXT | user / assistant / tool_result / system |
| `sequence` | INTEGER | session 内的消息序号（用于排序和 compaction 定位） |
| `metadata` | JSON | token 计数、模型信息、compaction 标记等 |
| `created_at` | TIMESTAMP | 创建时间 |

### 7.2 Part 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | PartId (TEXT PK) | 部件唯一标识 |
| `message_id` | MessageId (TEXT, INDEX) | 所属消息 |
| `kind` | TEXT | text / reasoning / tool_call / tool_result / image / compaction_summary |
| `content` | JSON | 部件内容（结构因 kind 而异） |
| `sequence` | INTEGER | 消息内的部件序号 |
| `metadata` | JSON | 扩展元数据 |

### 7.3 Session 表扩展

| 新增字段 | 类型 | 说明 |
|---------|------|------|
| `parent_session_id` | TEXT (NULLABLE, INDEX) | 父 session（子 agent 场景） |
| `parent_turn_id` | TEXT (NULLABLE) | 触发创建子 session 的父 turn |

### 7.4 双轨关系

```
Events（审计轨）                    Messages（工作轨）
┌─────────────────────┐            ┌──────────────────────┐
│ EventStore.append() │            │ MessageStore.create() │
│ 每个状态变化都记录    │            │ 仅记录对话消息         │
│ 不可变，只追加       │            │ compaction 时可替换    │
│ 用于审计、回放、调试  │            │ 用于 loop 构建上下文   │
└─────────────────────┘            └──────────────────────┘
         ↑                                   ↑
         │                                   │
    AgentLoop 每个动作发射事件         AgentLoop 每轮写入消息
```

Events 和 Messages 之间不存在外键约束。Events 是完整的状态变化日志（包含非对话事件如 session 创建、turn 生命周期等），Messages 是对话历史的精简工作视图。

## 8. 实施路径

### Phase 1：最小可用 Loop

**目标**：单 session、单 turn、无 tool call 的基础对话循环。

| 任务 | Crate | 说明 |
|------|-------|------|
| 定义 Message/Part/SceneId 类型 | runtime-core | 领域模型扩展 |
| 实现 MessageStore trait + memory 后端 | runtime-store, runtime-store-memory | 工作状态存储 |
| 创建 runtime-agent crate 骨架 | runtime-agent | AgentLoop trait + 基础实现 |
| 实现基础 PromptManager（单配置包） | runtime-agent | 文件加载 + 模板解析 |
| host 组装 agent loop | runtime-host | 注入依赖，启动 loop |
| 端到端验证：用户输入 → LLM 响应 | 集成测试 | echo backend + memory store |

### Phase 2：完整对话能力

**目标**：tool call 循环、流式响应、权限审批、多轮对话，以及 host 内部 Protocol Handler 边界。

| 任务 | Crate | 说明 |
|------|-------|------|
| Tool call 解析与执行循环 | runtime-agent | loop 内 tool call → execute → continue |
| 权限审批流程（ApprovalRequired → 等待 → 继续/中止） | runtime-agent | 与 kernel ApprovalService 集成 |
| 流式响应（TextDelta/ReasoningDelta 事件） | runtime-agent | AgentEventSink 实时推送 |
| MessageStore SQLite 实现 | runtime-store-sqlite | 生产存储后端 |
| 三类别模型选择 | runtime-core, runtime-agent | ModelPolicy 扩展 + 选择逻辑 |
| Session parent 字段 | runtime-core, runtime-store | 数据模型扩展 |
| Protocol Handler 边界 | runtime-host | 承接 `runtime.turn.run/get/cancel`、`runtime.approval.respond`、`runtime.event.subscribe` |

### Phase 3：高级特性

**目标**：compaction、sub-agent、transport、配置包热更新。

| 任务 | Crate | 说明 |
|------|-------|------|
| CompactionStrategy trait + FullCompaction 实现 | runtime-agent | 长上下文压缩 |
| Sub-agent 创建与结果回传 | runtime-agent | 独立 session + parent 链接 |
| WebSocket 传输层 | runtime-host | Axum WS + JSON-RPC |
| stdio 传输层 | runtime-host | tokio stdin/stdout |
| 配置包热更新 | runtime-agent | 文件监听 + reload |
| Doom loop 检测 | runtime-agent | 连续错误中止保护 |
| PartialCompaction / SlidingWindow 策略 | runtime-agent | 更多压缩策略 |

### Phase 4：生产加固

**目标**：可观测性、错误恢复、性能优化。

| 任务 | 说明 |
|------|------|
| 结构化日志与 tracing 集成 | 全链路追踪 |
| Token 计数与成本追踪 | 按 session/turn/model 维度 |
| 断线重连与 session 恢复 | WebSocket 传输层 |
| Prompt cache 优化（static/dynamic 分离） | PromptManager |
| 负载测试与并发 session 压测 | 性能基线 |

---

## 附录 A：完整数据流示意

```
用户 (TUI/IDE/Web)
  │
  ▼
Transport (WebSocket / stdio)
  │ JSON-RPC 2.0
  ▼
Protocol Handler
  │ 解析 runtime.turn.run 请求
  ▼
RuntimeHost
  │ 路由到 AgentLoop
  ▼
AgentLoop.run_turn()
  ├─ PromptManager.resolve_templates()
  ├─ PromptComposer.compose() → PromptBundle
  ├─ PromptRenderer.render() → RenderedPromptBundle
  ├─ PromptProjector.project() → PromptProjection
  ├─ ModelSelector.select(scene_id) → ModelSelector
  ├─ InferenceBackend.execute() → stream
  │   ├─ TextDelta → AgentEventSink → Transport → 用户
  │   ├─ ToolCall → ToolRegistry.invoke() → ToolResult
  │   │   └─ MessageStore.create(tool_result)
  │   └─ EndTurn → 退出循环
  ├─ CompactionStrategy.should_compact()? → compact()
  ├─ MessageStore.create(assistant_message)
  └─ Kernel.complete_turn()
       └─ EventStore.append(TurnCompleted)
            └─ Transport → 用户 (runtime.event 通知)
```
```

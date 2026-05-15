# 虚拟员工系统 API 与协议

## 协议分层

VE 系统涉及三层协议交互：

| 层 | 通信方 | 协议 | 详细文档 |
|----|--------|------|---------|
| 对接层 | 协作应用 ↔ Agent 服务器 | JSON-RPC 2.0 + REST | [对接协议](../../11-protocol-and-integration/integration-protocol.md) |
| 内部层 | Agent 服务器 ↔ VE Runner ↔ WEN | JSON-RPC 2.0 + 专用协议 | [内部协议](../../11-protocol-and-integration/internal-protocol.md) |
| VTA trait | VE Runner ↔ VTA Runtime | Rust trait 接口 | 本文冻结 |

本文冻结 VTA 核心 trait 接口和 VE Runner 协议规格。

## VTA 核心 Trait 接口

以下 trait 是 VTA Runtime 的稳定抽象边界，来自 `runtime-core` crate。所有实现通过 trait 注入，不硬编码具体类型。

### RuntimeKernel

Session/Turn 生命周期管理的核心 trait。AgentLoop 通过此接口回调 kernel 完成状态变更。

```rust
#[async_trait]
trait RuntimeKernel: RuntimeLifecycle {
    async fn create_session(&self, session: Session) -> Result<Session, RuntimeError>;
    async fn get_session(&self, session_id: &SessionId) -> Result<Option<Session>, RuntimeError>;
    async fn close_session(&self, request: CloseSessionRequest) -> Result<Session, RuntimeError>;
    async fn start_turn(&self, request: StartTurnRequest) -> Result<StartTurnResponse, RuntimeError>;
    async fn get_turn(&self, turn_id: &TurnId) -> Result<Option<Turn>, RuntimeError>;
    async fn complete_turn(&self, request: CompleteTurnRequest) -> Result<Turn, RuntimeError>;
    async fn fail_turn(&self, request: FailTurnRequest) -> Result<Turn, RuntimeError>;
    async fn cancel_turn(&self, request: CancelTurnRequest) -> Result<Turn, RuntimeError>;
    async fn summary(&self) -> Result<RuntimeKernelSummary, RuntimeError>;
}
```

### AgentLoop

推理循环核心 trait，定义在 `runtime-agent`。`DefaultAgentLoop` 是 Phase 1 的完整实现。

```rust
#[async_trait]
trait AgentLoop: Send + Sync {
    async fn run(&self, context: TurnExecutionContext) -> Result<(), RuntimeError>;
}

struct TurnExecutionContext {
    session_id: SessionId,
    turn_id: TurnId,
    input: TurnInput,
    turn: Turn,
    inference_backend: Arc<dyn InferenceBackend>,
    tool_bridge: Arc<dyn ToolBridge>,
    kernel: Arc<StoreBackedRuntimeKernel>,
    history: Arc<dyn TurnHistory>,
    message_store: Option<Arc<dyn MessageStore>>,
    prompt_manager: Option<Arc<PromptManager>>,
    stream_inference: bool,
    max_iterations: u32,
}
```

### MessageStore

消息工作轨持久化 trait，定义在 `runtime-store`。

```rust
#[async_trait]
trait MessageStore: Send + Sync {
    async fn create_message(&self, message: Message) -> Result<(), StoreError>;
    async fn get_message(&self, id: &MessageId) -> Result<Option<Message>, StoreError>;
    async fn list_messages(&self, query: MessageQuery) -> Result<Vec<Message>, StoreError>;
    async fn replace_messages(&self, old: Vec<MessageId>, new: Vec<Message>) -> Result<(), StoreError>;
    async fn delete_messages_by_session(&self, session_id: &SessionId) -> Result<(), StoreError>;
}

struct MessageQuery {
    session_id: SessionId,
    turn_id: Option<TurnId>,
    role: Option<MessageRole>,
    limit: Option<u64>,
    before: Option<MessageId>,
}
```

### EventBus

事件发布与回放 trait，定义在 `runtime-core`。

```rust
#[async_trait]
trait EventBus: Send + Sync {
    async fn publish(&self, event: RuntimeEvent) -> Result<(), RuntimeError>;
    async fn list(&self, query: EventQuery) -> Result<Vec<RuntimeEvent>, RuntimeError>;
    async fn subscribe(&self, subscription: EventSubscription) -> Result<EventSubscriptionId, RuntimeError>;
    async fn unsubscribe(&self, subscription_id: &EventSubscriptionId) -> Result<(), RuntimeError>;
}
```

### ApprovalService

审批工作流 trait，定义在 `runtime-core`。

```rust
#[async_trait]
trait ApprovalService: Send + Sync {
    async fn request_approval(&self, request: ApprovalRequest) -> Result<ApprovalRequest, RuntimeError>;
    async fn get_approval(&self, approval_id: &ApprovalId) -> Result<Option<ApprovalRequest>, RuntimeError>;
    async fn resolve_approval(&self, request: ResolveApprovalRequest) -> Result<ApprovalRequest, RuntimeError>;
}
```

## VE Runner 协议

VE Runner 与管理服务之间的内部协议。传输层：WebSocket（长连）+ 消息队列（异步任务）。

### Agent 服务器 → VE Runner

| 方法 | 说明 |
|------|------|
| `ve.runner.create_session` | 创建新的 VTA Session 并绑定 WorkContext |
| `ve.runner.execute_turn` | 触发一个推理 Turn |
| `ve.runner.suspend` | 挂起 VE（持久化状态后释放内存） |
| `ve.runner.resume` | 恢复挂起的 VE |
| `ve.runner.destroy` | 销毁 VE 实例 |

### VE Runner → Agent 服务器

| 事件 | 说明 |
|------|------|
| `ve.runner.turn_completed` | Turn 执行完成，携带输出、token 使用、工具调用 |
| `ve.runner.tool_call_request` | VE 需要执行工具（管理服务转发到 WEN 或协作应用） |
| `ve.runner.approval_required` | 需要用户审批 |
| `ve.runner.health` | Runner 心跳 + 资源使用上报 |
| `ve.runner.error` | VE 内部错误上报 |

### 工具调用路由

```
VE Runner → Agent 服务器（ve.runner.tool_call_request）
    ├── 远程工具 → Agent 服务器 → WEN → 返回结果
    └── 平台工具 → Agent 服务器 → 协作应用 API → 返回结果
```

## Runtime Config API

Agent 服务器暴露的 Runtime Config 和 Runtime Data 管理 API。由协作应用的 VE 管理界面调用。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/ves/{ve_id}/config` | 获取 Runtime Config |
| `PUT` | `/api/v1/ves/{ve_id}/config` | 更新 Runtime Config |
| `GET` | `/api/v1/ves/{ve_id}/data` | 获取 Runtime Data |
| `PUT` | `/api/v1/ves/{ve_id}/data/preferences` | 更新用户偏好 |
| `GET` | `/api/v1/ves/{ve_id}/data/memories` | 列出工作记忆条目 |
| `DELETE` | `/api/v1/ves/{ve_id}/data/memories/{memory_id}` | 删除记忆条目 |

## 错误码

VE 系统错误码在[错误处理规范](../../16-technical-specs/error-handling.md)全局定义基础上，补充 VE 专属码：

| 错误码 | 说明 | 可重试？ |
|--------|------|---------|
| `VE_NOT_FOUND` | 目标 VE 不存在 | 否 |
| `VE_OFFLINE` | VE 实例不在线 | 是（等待恢复） |
| `VE_WORK_CONTEXT_LIMIT` | 并发工作上下文超限 | 否 |
| `VE_CONFIG_INVALID` | Runtime Config 校验失败 | 否 |
| `VE_SESSION_ERROR` | VTA Session 内部错误 | 是 |
| `LLM_API_ERROR` | LLM provider 返回错误 | 是（退避重试） |
| `LLM_RATE_LIMITED` | LLM provider 限流 | 是（遵守 Retry-After） |
| `LLM_CONTEXT_TOO_LONG` | 超出模型上下文窗口 | 否（触发 compaction） |
| `WEN_OFFLINE` | 工作环境节点离线 | 否 |
| `WEN_TOOL_NOT_AVAILABLE` | 目标工具不可用 | 否 |
| `TOOL_NOT_ALLOWED` | 工具不在权限白名单 | 否 |
| `TOOL_APPROVAL_REQUIRED` | 需要用户审批 | 否（等待审批） |

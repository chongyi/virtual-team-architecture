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

以下 trait 定义 VTA Runtime 的稳定抽象边界。所有实现必须通过 trait 注入，不硬编码具体类型。

### AgentLoop

VTA 推理循环的核心 trait，管理 Session 级别的 Turn 执行。

```rust
#[async_trait]
trait AgentLoop: Send + Sync {
    /// 执行一个完整 Turn（从接收输入到产生输出）
    async fn execute_turn(
        &self,
        session: &mut Session,
        config: &TurnConfig,
    ) -> Result<TurnOutput, AgentError>;

    /// 获取当前支持的 capability
    fn capabilities(&self) -> AgentCapabilities;
}

struct TurnConfig {
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    model_category: ModelCategory,
    max_tool_calls_per_turn: u32,
    approval_timeout_ms: u64,
}

struct TurnOutput {
    message: Message,
    tool_calls: Vec<ToolCall>,
    finish_reason: FinishReason,
    usage: TokenUsage,
}

enum FinishReason { Stop, ToolCalls, Length, ApprovalRequired }
```

### PromptManager

管理 System Prompt 的构建和注入。

```rust
#[async_trait]
trait PromptManager: Send + Sync {
    /// 基于 Session 上下文构建当前 Turn 的完整 prompt
    async fn build_prompt(
        &self,
        session: &Session,
        config: &PromptConfig,
    ) -> Result<Vec<Message>, PromptError>;

    /// 获取 System Prompt 模板
    fn system_template(&self) -> &str;
}

struct PromptConfig {
    /// 运行时追加的指令（来自 Runtime Config）
    additional_instructions: Vec<String>,
    /// 压缩后的上下文（Resume 场景）
    compressed_context: Option<CompressedContext>,
    /// 当前工作上下文摘要
    work_context_summary: Option<String>,
}
```

### MessageStore

消息和 Session 的持久化抽象。

```rust
#[async_trait]
trait MessageStore: Send + Sync {
    /// 创建 Session
    async fn create_session(&self, meta: SessionMeta) -> Result<Session, StoreError>;
    /// 追加消息到 Session
    async fn append_message(&self, session_id: &str, message: &Message) -> Result<u64, StoreError>;
    /// 获取 Session 的消息历史
    async fn get_messages(&self, session_id: &str, range: Range) -> Result<Vec<Message>, StoreError>;
    /// 归档 Session
    async fn archive_session(&self, session_id: &str) -> Result<(), StoreError>;
    /// 估算 Session 的 token 使用量
    async fn estimate_tokens(&self, session_id: &str) -> Result<u64, StoreError>;
}

struct SessionMeta {
    session_id: String,
    work_context_id: String,
    ve_id: String,
    tenant_id: String,
    model_category: ModelCategory,
    parent_session_id: Option<String>,
}
```

### ModelSelector

模型选择与分发。

```rust
#[async_trait]
trait ModelSelector: Send + Sync {
    /// 选择当前 Turn 使用的模型
    async fn select(&self, category: ModelCategory, priority: Priority) -> Result<ModelRef, SelectError>;
    /// 模型降级（当前模型不可用时）
    async fn fallback(&self, from: &ModelRef) -> Result<ModelRef, SelectError>;
    /// 获取可用模型列表
    fn available_models(&self) -> Vec<ModelRef>;
}

enum ModelCategory { Cheap, Balanced, Powerful }

struct ModelRef {
    provider: String,
    model_id: String,
    max_context_tokens: u32,
    max_output_tokens: u32,
    category: ModelCategory,
}
```

### ToolExecutor

工具调用的统一执行入口。

```rust
#[async_trait]
trait ToolExecutor: Send + Sync {
    /// 执行工具调用
    async fn execute(&self, call: &ToolCall, context: &ToolContext) -> Result<ToolResult, ToolError>;
    /// 列出所有可用工具
    fn list_tools(&self) -> Vec<ToolDescriptor>;
    /// 检查工具是否需要审批
    fn requires_approval(&self, tool_name: &str) -> bool;
}

struct ToolCall {
    id: String,
    name: String,
    arguments: Value,
}

struct ToolContext {
    ve_id: String,
    tenant_id: String,
    work_context_id: String,
    organization_id: Option<String>,
    channel_id: Option<String>,
}

struct ToolResult {
    content: String,
    is_error: bool,
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

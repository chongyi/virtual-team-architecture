# 错误处理规范

## 错误分类

Virtual Team 中的错误分为四大类，每类有不同的处理策略和用户感知方式。

### 错误分类体系

| 分类 | 定义 | 可恢复？ | 用户感知 | 示例 |
|------|------|---------|---------|------|
| **客户端错误 (4xx)** | 请求本身有问题 | 是（修正后重试） | 明确告知错误原因 | 消息格式错误、权限不足、VE 不存在 |
| **服务端错误 (5xx)** | 服务内部异常 | 是（自动重试） | 透明或简短提示 | 数据库连接超时、VE Runner 崩溃、LLM API 不可用 |
| **依赖错误** | 外部服务不可用 | 部分（降级） | 降级提示 | LLM API 限流、WEN 离线 |
| **逻辑错误** | 业务流程中的预期失败 | 是（人工介入） | 需要用户决策 | 审批被拒绝、任务超出 VE 能力范围 |

### 全局错误码

```rust
// 错误码使用 UPPER_SNAKE_CASE，按子系统前缀分类
enum ErrorCode {
    // 通用
    InternalError,
    RateLimited,
    RequestTooLarge,

    // 认证授权 (AUTH_)
    AuthTokenExpired,
    AuthTokenInvalid,
    AuthInsufficientPermissions,
    AuthApiKeyInvalid,

    // 租户 (TENANT_)
    TenantNotFound,
    TenantQuotaExceeded,
    TenantSuspended,

    // 频道 (CHANNEL_)
    ChannelNotFound,
    ChannelAccessDenied,
    ChannelMemberLimitExceeded,

    // 消息 (MESSAGE_)
    MessageNotFound,
    MessageTooLong,
    MessageAlreadyDeleted,

    // 文件 (FILE_)
    FileTooLarge,
    FileTypeNotSupported,
    FileUploadFailed,

    // 虚拟员工 (VE_)
    VENotFound,
    VEOffline,
    VEConfigInvalid,
    VEConfigVersionIncompatible,
    VEWorkContextLimitExceeded,

    // 工作环境节点 (WEN_)
    WENOffline,
    WENToolNotAvailable,
    WENSandboxError,
    WENHeartbeatTimeout,

    // 工具调用 (TOOL_)
    ToolNotAllowed,
    ToolExecutionFailed,
    ToolTimeout,
    ToolApprovalRequired,
    ToolApprovalDenied,

    // LLM (LLM_)
    LLMApiError,
    LLMRateLimited,
    LLMContextTooLong,
    LLMResponseInvalid,

    // 配置包 (PKG_)
    PackageNotFound,
    PackageValidationFailed,
    PackageVersionNotFound,
}
```

## 错误结构

### 内部错误结构

```rust
struct AppError {
    code: ErrorCode,
    message: String,
    details: Option<HashMap<String, Value>>,
    source: Option<Box<dyn Error>>,
    retryable: bool,
    user_visible_message: Option<String>,
}
```

### 用户可见错误

```json
{
  "error": {
    "code": "WEN_OFFLINE",
    "message": "工作环境已断开连接",
    "suggestion": "请检查你的设备是否在线，或尝试重新打开工作环境客户端",
    "request_id": "req_xxx"
  }
}
```

用户可见错误的设计原则：
- **说人话**：不使用技术术语（如 `WebSocket connection timeout`），使用用户能理解的表述
- **给建议**：不仅告知错误，还提供用户可执行的操作建议
- **不暴露内部**：不泄露堆栈跟踪、内部路径、数据库错误详情

## 重试策略

### 重试决策矩阵

| 错误类型 | 重试？ | 最大重试次数 | 退避策略 | 备注 |
|---------|--------|------------|---------|------|
| 网络超时 | ✅ | 3 | 指数退避（1s, 2s, 4s） | 底层连接超时 |
| LLM API 限流 (429) | ✅ | 5 | 指数退避 + Retry-After | 遵守 Retry-After 响应头 |
| LLM API 5xx | ✅ | 3 | 指数退避 | 外部服务瞬时故障 |
| 数据库连接超时 | ✅ | 3 | 指数退避 + 抖动 | 连接池瞬时耗尽 |
| WEN 工具调用超时 | ✅ | 1 | 线性（5s） | 仅重试网络相关超时 |
| 权限拒绝 (403) | ❌ | 0 | — | 不应重试，权限不会自愈 |
| 资源不存在 (404) | ❌ | 0 | — | 不应重试 |
| 请求格式错误 (400) | ❌ | 0 | — | 客户端错误，重试无意义 |
| 审批被拒绝 | ❌ | 0 | — | 用户明确拒绝 |

### 指数退避实现

```
delay = min(base_delay * 2^attempt + random_jitter, max_delay)

base_delay = 1s
max_delay = 30s
jitter = [0, base_delay * 2^attempt * 0.1]
```

### 断路器

对 LLM API 调用使用断路器模式：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 失败阈值 | 5 次 | 滑动窗口内连续失败次数 |
| 窗口大小 | 60s | 滑动窗口时长 |
| 半开超时 | 30s | 进入开路后等待多久尝试半开 |
| 半开探测数 | 1 | 半开状态下允许的探测请求数 |

断路器打开后：
- 新的 LLM 请求直接被拒绝，不实际调用 API
- VE 回复用户"AI 服务暂时不可用，请稍后重试"
- 30s 后进入半开状态，允许 1 个探测请求

## 降级路径

### 按场景的降级策略

| 场景 | 主路径 | 降级路径 1 | 降级路径 2 | 最终兜底 |
|------|--------|----------|----------|---------|
| **LLM 推理** | 主模型 (Claude Opus) | 降级模型 (Claude Sonnet) | 低成本模型 (Claude Haiku) | "AI 服务不可用" |
| **意图识别** | Claude Haiku | GPT-4o-mini | 规则匹配（关键词） | 默认当作 new_task |
| **消息投递** | Agent 服务器路由 | — | — | 消息在队列中等待，VE 恢复后投递 |
| **工具调用（远程）** | WEN 执行 | 提示用户检查 WEN | — | "操作无法完成" |
| **工具调用（平台）** | 服务端直接执行 | — | — | "操作无法完成" |
| **上下文构建** | RAG 检索 | 仅使用 markers（无 RAG） | 不附带上下文 | VE 自行搜索历史消息 |
| **文件上传** | 对象存储 | 本地临时存储 + 异步上传 | — | "上传失败，请重试" |

### 降级示例：LLM 模型降级链

```mermaid
flowchart TD
    A[VE 需要推理] --> B{主模型可用?}
    B -->|是| C[使用主模型]
    B -->|否| D{降级模型可用?}
    D -->|是| E[使用降级模型<br/>附带能力提示:<br/>"当前使用备用模型，回复质量可能降低"]
    D -->|否| F{低成本模型可用?}
    F -->|是| G[使用低成本模型<br/>回复用户:<br/>"AI 服务部分恢复中，复杂任务建议稍后重试"]
    F -->|否| H[回复用户:<br/>"AI 服务暂时不可用，请稍后重试"]
```

## Agent 内部错误处理

### Turn 级别错误

VTA Turn 执行过程中可能出现的错误：

| 错误 | 处理 |
|------|------|
| LLM API 返回非 JSON | 重试 1 次（重新发送请求），仍失败则结束 Turn 并通知 VE |
| Tool call 格式错误 | 将错误信息注入下一轮 system prompt，让 LLM 修正 |
| Tool call 执行失败（远程） | 将错误结果作为 tool_result 返回 LLM，让 LLM 决定下一步 |
| Token 超出限制 | 触发上下文压缩（Resume 机制） |
| Approval 超时 | 视为拒绝，将拒绝结果注入 LLM 上下文 |

### Session 级别恢复

```
Session 创建 → Turn 1 OK
             → Turn 2 OK
             → Turn 3 失败（LLM API 错误，重试耗尽）
             → 通知 VE："当前会话遇到错误，正在尝试恢复..."
             → 创建 Resume（压缩前 2 轮上下文 → 新 Session）
             → 新 Session Turn 1：从断点继续
```

## 用户消息中的错误表述

当 VE 需要告知用户错误时，使用以下话术模式：

| 场景 | 话术模板 |
|------|---------|
| 工具执行失败 | "我在执行 {操作} 时遇到了问题：{简述}。建议你{用户可执行的操作}。" |
| 服务不可用 | "AI 服务暂时有些繁忙（{简述}），我会在 {预估恢复时间} 后自动重试。你也可以{手动操作}。" |
| 权限不足 | "我没有权限执行 {操作}。如果你需要这个功能，请在工作环境设置中授予 {权限名} 权限。" |
| 需要用户决策 | "我在处理 {任务} 时需要你确认：{决策点}。{选项 A} 还是 {选项 B}？" |
| 任务超出能力 | "这个任务超出了我的能力范围（{原因}）。建议你尝试{替代方案}，或者招募一个更擅长{领域}的虚拟员工。"

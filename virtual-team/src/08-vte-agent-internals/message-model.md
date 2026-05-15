# 消息模型与持久化

## Part 化消息系统

VTA 中的消息不是纯文本字符串，而是由多个 Part 组成的结构化实体。这解决了"一条消息中交替出现文本、推理过程、工具调用和工具结果"的问题。

### 核心类型

```rust
struct Message {
    id: MessageId,
    session_id: SessionId,
    turn_id: TurnId,
    role: MessageRole,       // User | Assistant | ToolResult | System
    parts: Vec<Part>,
    metadata: Value,
    created_at: DateTime<Utc>,
}

struct Part {
    id: PartId,
    message_id: MessageId,
    kind: PartKind,          // 内容类型
    content: Value,          // 结构化内容
    metadata: Value,         // 扩展元数据
}

enum PartKind {
    Text,                    // 纯文本
    Reasoning,               // 推理过程（思维链）
    ToolCall,                // 工具调用
    ToolResult,              // 工具执行结果
    Image,                   // 图像（多模态）
    CompactionSummary,       // 压缩摘要
}
```

### 设计动机

- **多模态兼容**：不同 Part 类型对应不同的 UI 渲染方式，不硬编码为字符串
- **结构化工具调用**：`ToolCall` Part 携带 tool_call_id、tool_name、arguments 元数据，LLM 可精确引用
- **增量更新**：流式场景下通过 TextDelta/ReasoningDelta/ToolCallDelta 增量追加内容
- **可见性**：区分 `user` 可见和 `internal` 仅 LLM 可见的消息

## 双轨持久化

VTA 实现了双轨存储模型，解决"审计"和"查询"两个不同需求：

| 轨道 | 存储 | 特性 | 用途 |
|------|------|------|------|
| **EventStore** | 不可变事件流 | 仅追加、完整审计轨迹、支持重放 | 审计、调试、事件溯源 |
| **MessageStore** | 可变消息表 | 高效查询、支持压缩替换 | AgentLoop 上下文构建 |

### MessageStore trait

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
    session_id: SessionId,     // 必填
    turn_id: Option<TurnId>,
    role: Option<MessageRole>,
    limit: Option<u64>,
    before: Option<MessageId>,
}
```

### 写入路径

AgentLoop 在关键节点同时写入 history（内存）和 message_store（持久化）：

```
append_history_entry()
├── history.append(entry)     // 内存中的 TurnHistory
└── message_store.create_message()  // 持久化的 MessageStore（如存在）
```

Phase 1 使用 `InMemoryHistory` 作为临时方案。Phase 2 起 `MessageStore` 成为规范工作轨，history 退化为只读缓存。

### 一致性保证

- EventStore 和 MessageStore 之间通过 Turn 生命周期事件保持最终一致
- kernel.complete_turn() 和 kernel.fail_turn() 触发事件发布，消费方可据此同步
- MessageStore 的 `replace_messages()` 专为 Compaction 设计——压缩结果原子替换原始消息

## 与上层消息模型的关系

| VTA 消息模型 | 协作应用消息模型 | 关系 |
|-------------|----------------|------|
| `Message.role = User` | 用户发送的 IM 消息 | 协作应用消息通过对接协议转为 TurnInput |
| `Message.role = Assistant` | VE 回复的 IM 消息 | AgentLoop 输出通过对接协议转为协作应用消息 |
| `Part.kind = ToolResult` | 工具执行过程 | 不直接暴露给用户，但影响 VE 决策 |
| `Message.metadata` | markers（work_context_id 等） | 协作应用 markers 通过对接协议注入 TurnInput.metadata |

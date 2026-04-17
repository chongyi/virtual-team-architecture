# 数据模型与 Store 接口冻结说明

> 本文冻结新的 `Phase 2-3` 需要的关键类型与 `MessageStore` 接口，避免后续执行阶段继续从 draft 总览文档推导字段与 trait 形态。
>
> 当本文与 [../agent-architecture-design.md](../agent-architecture-design.md) 第 5 节存在不一致时，以本文为准。

## 0. 文档角色

本文是跨阶段接口文档，只负责冻结：

- `Message / Part / MessageRole / PartKind / SceneId`
- `Session` parent 字段
- `ModelPolicy` 的增量字段
- `MessageStore` 与 `MessageQuery`

如果要看这些类型在阶段中的落地顺序，应回到：

- [../phase-2/message-store-work-track.md](../phase-2/message-store-work-track.md)
- [../phase-3/sqlite-message-store-and-migration.md](../phase-3/sqlite-message-store-and-migration.md)

## 1. 新增类型

### `Message`

```rust
pub struct Message {
    pub id: MessageId,
    pub session_id: SessionId,
    pub turn_id: TurnId,
    pub role: MessageRole,
    pub parts: Vec<Part>,
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
}
```

冻结要求：

- `Message` 是 loop 工作轨中的最小消息单元
- `session_id + turn_id + role + parts` 必须可用来构建上下文
- `metadata` 保留为扩展位，不在本文冻结具体字段表

### `MessageRole`

```rust
pub enum MessageRole {
    User,
    Assistant,
    ToolResult,
    System,
}
```

冻结要求：

- 新的 `Phase 2` 至少要稳定支持 `User / Assistant / ToolResult`
- `System` 需要保留，供 Prompt/Compaction 等后续阶段使用

### `Part`

```rust
pub struct Part {
    pub id: PartId,
    pub message_id: MessageId,
    pub kind: PartKind,
    pub content: Value,
    pub metadata: Value,
}
```

冻结要求：

- `Part` 是消息内容的最小部件单位
- `content` 与 `metadata` 保持开放结构，不在本文冻结 provider-specific shape

### `PartKind`

```rust
pub enum PartKind {
    Text,
    Reasoning,
    ToolCall,
    ToolResult,
    Image,
    CompactionSummary,
}
```

冻结要求：

- 新的 `Phase 2` 至少需要稳定承载 `Text / ToolResult`
- 新的 `Phase 3` 需要为 `ToolCall / Reasoning` 预留兼容位

### `SceneId`

```rust
pub struct SceneId(String);
```

冻结要求：

- `SceneId` 是模型选择与 prompt scene 路由的稳定键
- 具体字符串命名约定不在本文冻结

## 2. Session 与 ModelPolicy 增量字段

### `Session`

```rust
pub parent_session_id: Option<SessionId>,
pub parent_turn_id: Option<TurnId>,
```

冻结要求：

- 这两个字段属于新的 `Phase 3` 预留模型
- 在字段落地前，不允许用临时 metadata 替代正式 parent 关系

### `ModelPolicy`

```rust
pub fast_selector: Option<ModelSelector>,
pub scene_selectors: BTreeMap<SceneId, ModelSelector>,
```

冻结要求：

- `fast_selector` 与 `scene_selectors` 都属于新的 `Phase 3`
- 新的 `Phase 1-2` 不要求完整落地选择逻辑

## 3. `MessageStore` 接口

```rust
#[async_trait]
pub trait MessageStore: Send + Sync {
    async fn create_message(&self, message: Message) -> StoreResult<()>;
    async fn get_message(&self, id: &MessageId) -> StoreResult<Option<Message>>;
    async fn list_messages(&self, query: MessageQuery) -> StoreResult<Vec<Message>>;
    async fn replace_messages(
        &self,
        session_id: &SessionId,
        messages: Vec<Message>,
    ) -> StoreResult<()>;
    async fn delete_messages_by_session(&self, session_id: &SessionId) -> StoreResult<u64>;
}
```

冻结要求：

- `create_message / list_messages` 是新的 `Phase 2` 最低必需接口
- `replace_messages` 为后续 compaction 预留，但不要求在新的 `Phase 2-3` 落地真实策略
- `RuntimeStores` 与事务接口必须能暴露 `MessageStore`

## 4. `MessageQuery`

```rust
pub struct MessageQuery {
    pub session_id: SessionId,
    pub turn_id: Option<TurnId>,
    pub role: Option<MessageRole>,
    pub limit: Option<u32>,
    pub before: Option<MessageId>,
}
```

冻结要求：

- `session_id` 必填
- 其余字段都用于历史裁剪、角色过滤和分页式读取
- 更复杂查询条件不在本文冻结

## 5. 分阶段落地映射

### 5.1 新 Phase 2

- 冻结并落地 `Message / Part / MessageRole / PartKind / SceneId`
- 落地 `MessageStore` trait 与 `MessageQuery`
- 完成 memory backend

### 5.2 新 Phase 3

- 落地 sqlite `MessageStore`
- 落地 `Session` parent 字段
- 落地 `ModelPolicy.fast_selector / scene_selectors`

## 6. 本文不负责的内容

- 不负责定义 provider-specific payload 结构
- 不负责定义 compaction 后消息替换算法
- 不负责定义审批、Protocol Handler 或 transport 接口

# ADR-003: 状态持久化

**状态**：已采纳 | **日期**：2026-04-08

## 背景

Agent 运行时需要持久化两类数据：
1. **审计数据**：完整的事件流，用于回放、调试、合规
2. **工作数据**：对话消息历史，用于每轮 LLM 调用时构建上下文

现有架构中 `runtime-store` 已有 EventStore trait 和完整的事件持久化体系。但 agent loop 每轮都需要高效访问消息历史，直接从 EventStore 重建消息列表效率不高。

## 考虑的选项

### A. 纯 Events（事件溯源）

所有状态从事件流重建。

- 优点：单一数据源，无冗余
- 缺点：每轮 LLM 调用都需要从事件流重建消息列表，性能差；查询不灵活

### B. 纯 Message 表

只存消息，不存事件。

- 优点：查询高效，结构清晰
- 缺点：丢失细粒度事件信息（tool 执行过程、状态转换等），审计能力弱

### C. Events 审计 + Message 工作状态双轨（✅ 采纳）

Events 保证审计完整性，Message 表服务 loop 实时查询。

- 优点：各取所长，Events 不丢信息，Message 查询高效
- 缺点：数据冗余，需要保证一致性

## 决策

**采纳选项 C**：双轨模型。

- `EventStore`（已有）：持久化所有 RuntimeEvent，用于审计、回放、调试
- `MessageStore`（新增）：持久化 Message + Part，用于 agent loop 构建上下文

## 理由

- 现有 EventStore 体系成熟，不应废弃
- Agent loop 每轮需要高效的消息历史访问（构建 prompt context）
- 参考 OpenCode 的三表模型（Session → Message → Part）已验证可行
- 双轨之间通过 Turn 生命周期事件保持逻辑一致性

## 影响

- `runtime-core` 新增 Message、MessagePart、MessageRole 等领域类型
- `runtime-store` 新增 MessageStore、MessagePartStore trait
- `runtime-store-memory` 和 `runtime-store-sqlite` 实现新 trait
- Agent loop 写入时同时更新 Message 表和发射 Event

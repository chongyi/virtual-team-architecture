# Phase 2：SQLite MessageStore 与 Migration

> 用途：冻结 `Phase 2` 内消息工作轨的生产落地边界，确保 sqlite 持久化、`messages/parts` schema 与 loop 上下文读取方式一次定清。

## 1. 目标

把 `Phase 1` 的 memory 消息工作轨扩展到 sqlite 生产路径，并明确 migration 与读取边界。

## 2. 本阶段必须具备的能力

- `runtime-store-sqlite` 增加 `messages`
- `runtime-store-sqlite` 增加 `parts`
- migration crate 增加对应 schema 迁移
- sqlite 实现 `MessageStore`
- loop 上下文历史读取走 sqlite `MessageStore`

## 3. 固定边界

- `messages/parts` 是消息工作轨，不替代 `EventStore`
- 对话上下文在生产路径中必须从 `MessageStore` 读取
- `EventStore` 继续只承担审计轨
- schema 设计需要为 `Phase 2` 的 tool 消息与后续 compaction 预留空间

## 4. 本阶段最小消息覆盖面

在 `Phase 2`，以下消息类型必须能稳定落地到 sqlite：

- `user`
- `assistant`
- `tool_result`

与 tool call 直接相关的部件信息也应能在 `Part` 层表达，以支持后续上下文与调试需要。

## 5. 明确不做的内容

以下内容后置：

- compaction 替换策略的真实实现
- 更复杂的历史裁剪
- sub-agent 跨 session 上下文共享

## 6. 验收标准

- sqlite migration 后可稳定创建 `messages/parts`
- sqlite `MessageStore` 能读写完整多轮上下文
- tool result 能进入 sqlite 消息工作轨
- 生产路径不再依赖 `EventStore` 临时重建对话历史

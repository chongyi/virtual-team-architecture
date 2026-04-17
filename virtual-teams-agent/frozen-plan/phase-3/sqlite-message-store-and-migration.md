# Phase 3：SQLite MessageStore 与 Migration

> 用途：冻结新的 `Phase 3` 中消息工作轨的生产落地边界，确保 sqlite 持久化、`messages/parts` schema 与完整对话读取方式一次定清。

## 1. 目标

把新的 `Phase 2` memory 消息工作轨扩展到 sqlite 生产路径，并明确 migration 与读取边界。

## 2. 本阶段必须具备的能力

- `runtime-store-sqlite` 增加 `messages`
- `runtime-store-sqlite` 增加 `parts`
- migration crate 增加对应 schema 迁移
- sqlite 实现 `MessageStore`
- 完整对话上下文历史读取走 sqlite `MessageStore`

## 3. 固定边界

- `messages/parts` 是工作轨，不替代 `EventStore`
- 对话上下文在生产路径中必须从 `MessageStore` 读取
- schema 设计需要为 tool 消息与后续 compaction 预留空间

## 4. 验收标准

- sqlite migration 后可稳定创建 `messages/parts`
- sqlite `MessageStore` 能读写完整多轮上下文
- 生产路径不再依赖 `EventStore` 临时重建对话历史

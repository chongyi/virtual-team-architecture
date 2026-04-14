# Phase 2 子计划索引

> 用途：把 `Phase 2` 的“完整对话能力”拆成可独立执行的计划输入，供后续阶段按子目标推进。

## 范围

本目录只覆盖 `Phase 2`，对应主计划中的三条主线：

- tool loop 与审批 continuation
- sqlite 消息双轨与 migration
- host 内 Protocol Handler

## 当前文档

| 文档 | 用途 |
|------|------|
| [tool-loop-and-approval-continuation.md](tool-loop-and-approval-continuation.md) | 冻结 tool loop、审批挂起、恢复执行与后置项 |
| [sqlite-message-store-and-migration.md](sqlite-message-store-and-migration.md) | 冻结 sqlite `messages/parts`、MessageStore 生产落地与 migration 边界 |
| [host-protocol-handler.md](host-protocol-handler.md) | 冻结 host 内部 Protocol Handler 的承接范围、立即确认语义与完成定义 |

## 文档关系

- `tool-loop-and-approval-continuation.md` 定义完整对话 loop 本身
- `sqlite-message-store-and-migration.md` 定义生产持久化路径
- `host-protocol-handler.md` 定义对外承接面与事件/查询语义

三者组合后，才构成完整的 `Phase 2` 执行输入。

## 建议阅读顺序

1. 先读 [tool-loop-and-approval-continuation.md](tool-loop-and-approval-continuation.md)
2. 再读 [sqlite-message-store-and-migration.md](sqlite-message-store-and-migration.md)
3. 最后读 [host-protocol-handler.md](host-protocol-handler.md)

## 使用方式

- 这些文档不是替代总计划，而是把 `Phase 2` 拆成可独立执行的计划输入
- 后续执行阶段可按文档拆分子任务，但不应偏离这里冻结的边界与后置项
- 如果某项实现只落在 sqlite 或 protocol handler，也仍然需要回看 tool loop 文档，确保继续遵守完整对话与审批 continuation 的冻结语义

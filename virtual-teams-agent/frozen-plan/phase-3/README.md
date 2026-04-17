# Phase 3 子计划索引

> 用途：把新的 `Phase 3` 完整对话与协议承接阶段拆成可独立执行的计划输入。

## 范围

本目录只覆盖新的 `Phase 3`，对应主计划中的三条主线：

- tool loop 的完整扩展与 approval continuation
- sqlite 消息双轨与 migration
- host 内 Protocol Handler

## 当前文档

| 文档 | 用途 |
|------|------|
| [tool-loop-and-approval-continuation.md](tool-loop-and-approval-continuation.md) | 冻结在已有 tool loop 基础上的审批挂起、恢复执行与多轮扩展 |
| [sqlite-message-store-and-migration.md](sqlite-message-store-and-migration.md) | 冻结 sqlite `messages/parts`、MessageStore 生产落地与 migration 边界 |
| [host-protocol-handler.md](host-protocol-handler.md) | 冻结 host 内部 Protocol Handler 的承接范围、立即确认语义与完成定义 |

## 文档关系

- `tool-loop-and-approval-continuation.md` 定义完整对话控制流扩展
- `sqlite-message-store-and-migration.md` 定义生产持久化路径
- `host-protocol-handler.md` 定义对外承接面与事件/查询语义

三者组合后，才构成完整的 `Phase 3` 执行输入。

## 建议执行顺序

1. 先完成 [sqlite-message-store-and-migration.md](sqlite-message-store-and-migration.md)
2. 再完成 [tool-loop-and-approval-continuation.md](tool-loop-and-approval-continuation.md)
3. 最后完成 [host-protocol-handler.md](host-protocol-handler.md)

原因：

- 完整对话与多轮生产路径依赖 sqlite 工作轨
- Protocol Handler 应建立在已冻结的 loop 与审批语义之上，而不是反向决定这些语义

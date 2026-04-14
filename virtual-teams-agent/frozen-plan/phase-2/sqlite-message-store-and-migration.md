# Phase 2：SQLite MessageStore 与 Migration

> 用途：冻结 `Phase 2` 内消息工作轨的生产落地边界，确保 sqlite 持久化、`messages/parts` schema 与 loop 上下文读取方式一次定清。

## 0. 与其他文档的关系

本文只定义 `Phase 2` 的 sqlite 生产落地范围。

- `MessageStore` 的长期边界与双轨规则见 [../interfaces/agent-loop-and-message-store.md](../interfaces/agent-loop-and-message-store.md)
- `Phase 2` 的 tool loop 与审批 continuation 见 [tool-loop-and-approval-continuation.md](tool-loop-and-approval-continuation.md)

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

## 3.1 执行前提

- `Phase 1` 的 memory `MessageStore` 抽象已经稳定
- tool result 已被纳入 `Phase 2` 的消息工作轨范围
- 生产路径的上下文构建不再允许回退到 `EventStore`

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

## 6.1 最小完成产物

- 一份可供实现的 sqlite `messages/parts` 落地范围说明
- 一条明确的 migration 与生产读取边界
- 一组能验证“生产路径已切到 MessageStore”的验收条件

## 7. 本文不负责的内容

- 不负责定义 tool loop 或审批 continuation 本身
- 不负责定义 Protocol Handler 的对外承接边界
- 不负责定义 compaction 的真实替换策略

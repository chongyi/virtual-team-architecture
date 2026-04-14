# Phase 1：MessageStore 与消息工作轨

> 用途：冻结 `MessageStore` 在 `Phase 1` 的最小落地方式，确保后续阶段从一开始就以消息工作轨作为 loop 上下文来源。

## 0. 与接口冻结文档的关系

本文只定义 `Phase 1` 的最小落地范围。`MessageStore`、双轨规则和长期边界以 [../interfaces/agent-loop-and-message-store.md](../interfaces/agent-loop-and-message-store.md) 为准，本文只说明本阶段必须先实现到哪里。

## 1. 目标

在 `Phase 1` 内完成最小 `MessageStore` 抽象与 memory backend，使 loop 不依赖 `EventStore` 临时重建对话上下文。

## 2. 本阶段必须具备的能力

- `runtime-core` 新增：
  - `Message`
  - `Part`
  - `MessageRole`
  - `PartKind`
  - `SceneId`
- `runtime-store` 新增 `MessageStore`
- `RuntimeStores` 增加 `messages()` 门面
- 事务接口增加 messages 门面
- `runtime-store-memory` 实现 `MessageStore`

## 3. Phase 1 的最小消息范围

本阶段只要求最小消息类型进入工作轨：

- `user`
- `assistant`

以下内容虽需在模型中预留，但不要求在本阶段完整写入：

- `tool_call`
- `tool_result`
- `reasoning`

## 4. 本阶段固定边界

- loop 上下文历史读取从 `Phase 1` 起必须走 `MessageStore`
- 不允许继续以 `EventStore` 作为对话上下文主来源
- `MessageStore` 在 `Phase 1` 只要求 memory backend，sqlite 路径后置到 `Phase 2`

## 4.1 执行前提

- `runtime-core` 中消息相关类型作为本阶段新增模型一并冻结
- `runtime-agent` 最小 loop 采用消息工作轨而不是事件回放构建上下文
- sqlite 生产落地明确后置到 `Phase 2`

## 5. 明确不做的内容

- sqlite `messages/parts` 持久化
- compaction 替换逻辑
- tool result 消息完整落地
- 跨 session / sub-agent 的共享机制

## 6. 验收标准

- memory backend 下可按 session 顺序读到 user / assistant 消息
- loop 能使用 `MessageStore` 构建最小上下文
- 消息写入与 turn 生命周期写入具备一致的事务语义
- 后续 `Phase 2` 可以在不破坏抽象的前提下扩展到 sqlite 与 tool 消息

## 6.1 最小完成产物

- 一份可供实现的 `MessageStore` 最小抽象边界说明
- 一条明确的 memory backend 落地范围
- 一组可验证“上下文已改走消息工作轨”的验收条件

## 7. 本文不负责的内容

- 不负责定义 `AgentLoop` 的完整控制流
- 不负责定义 sqlite 生产落地与 migration 细节
- 不负责定义 compaction 或跨 session 消息共享

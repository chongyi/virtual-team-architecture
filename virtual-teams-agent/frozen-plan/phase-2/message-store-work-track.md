# Phase 2：MessageStore 与消息工作轨

> 用途：冻结新的 `Phase 2` 中 `MessageStore` 的最小落地方式，确保从本阶段开始消息工作轨成为 canonical work track。

## 0. 与接口冻结文档的关系

本文只定义新的 `Phase 2` 最小落地范围。长期边界以 [../interfaces/agent-loop-and-message-store.md](../interfaces/agent-loop-and-message-store.md) 为准。

## 1. 目标

在新的 `Phase 2` 内完成最小 `MessageStore` 抽象与 memory backend，使 agent 不再依赖临时 in-process history 构建上下文。

## 2. 本阶段必须具备的能力

- `runtime-core` 新增 `Message / Part / MessageRole / PartKind / SceneId`
- `runtime-store` 新增 `MessageStore`
- `RuntimeStores` 与事务接口增加 `messages()` 门面
- `runtime-store-memory` 实现 `MessageStore`

## 2.1 接入点冻结

- `RuntimeStores` 需要从当前 7 个 store 门面扩展为包含 `MessageStore` 的 8 个 store 门面
- `RuntimeStores::new(...)` 或等价构造入口必须显式接收 `MessageStore`
- `RuntimeStoreTransaction` 或等价事务聚合也必须同步扩展 `messages()` 门面
- `runtime-host` 的组装逻辑需要按新的 store 构造签名同步调整

## 3. 本阶段固定边界

- 从本阶段起，`MessageStore` 成为 canonical work track
- `EventStore` 不再作为对话上下文主来源
- 本阶段只要求 memory backend，sqlite 生产落地后置到 `Phase 3`

## 4. 最小消息范围

本阶段至少要求以下消息进入工作轨：

- `user`
- `assistant`
- `tool_result`

## 5. 明确不做的内容

- sqlite `messages/parts` 持久化
- compaction 替换逻辑
- approval continuation
- 跨 session / sub-agent 共享

## 6. 验收标准

- memory backend 下可按 session 顺序读取消息工作轨
- `runtime-agent` 上下文构建已切换到 `MessageStore`
- 后续 `Phase 3` 可以在不破坏抽象的前提下扩展到 sqlite

## 6.1 检查清单

- 检查项：同一 session 内至少可读取 `user / assistant / tool_result` 三类消息
- 检查项：上下文读取路径不再依赖 `EventStore` 回放
- 检查项：`RuntimeStores` 与事务接口都能暴露 `MessageStore`

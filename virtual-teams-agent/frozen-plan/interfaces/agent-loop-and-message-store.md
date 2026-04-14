# AgentLoop 与 MessageStore 接口冻结说明

> 本文只冻结 `Phase 1-2` 需要的最小接口边界，不展开 `Phase 3+` 的 compaction、sub-agent 执行与 transport 细节。

## 0. 文档角色

本文是跨阶段接口文档，只负责冻结长期边界，不负责替代阶段子计划。

- 如果要看 `Phase 1` 的最小闭环落地，回到 [../phase-1/runtime-agent-minimal-loop.md](../phase-1/runtime-agent-minimal-loop.md) 与 [../phase-1/message-store-work-track.md](../phase-1/message-store-work-track.md)
- 如果要看 `Phase 2` 的完整对话扩展，回到 [../phase-2/tool-loop-and-approval-continuation.md](../phase-2/tool-loop-and-approval-continuation.md) 与 [../phase-2/sqlite-message-store-and-migration.md](../phase-2/sqlite-message-store-and-migration.md)

阶段文档可以引用本文，但不应改写本文冻结的长期边界。

## 1. 冻结目标

锁定以下实现边界：

- `runtime-agent` 是唯一的 loop 编排归属
- `MessageStore` 是唯一的对话工作轨来源
- `EventStore` 继续承担审计轨，不承担 loop 上下文重建
- `runtime-kernel` 与 `runtime-agent` 通过明确的 turn 生命周期接口协作

## 2. AgentLoop 边界

### 2.1 职责

- 接收已创建的 turn 执行上下文
- 解析 PromptManager 输出
- 驱动 inference backend
- 处理 tool call 循环
- 写入消息工作轨
- 在完成或失败时调用 kernel 收尾

### 2.2 不负责

- session/turn 创建规则
- turn 状态合法性校验
- 审批记录持久化本身
- transport 连接管理

## 3. MessageStore 边界

### 3.1 职责

- 持久化会参与 loop 上下文构建的消息历史
- 支持按 session 顺序读取消息
- 支持写入 user / assistant / tool_result / system 等角色消息
- 支持 `Part` 粒度表达 `text / reasoning / tool_call / tool_result`

### 3.2 不负责

- 完整审计
- 生命周期事件回放
- 非对话类状态记录

## 4. 双轨规则

### 审计轨：`EventStore`

- 不可变
- 只追加
- 服务于审计、回放、调试

### 工作轨：`MessageStore`

- 只保存 loop 所需消息
- 可在后续阶段支持 compaction 替换
- 是 prompt context 构建的唯一来源

## 5. 分阶段落地要求

### 5.1 Phase 1

- `MessageStore` 纳入 `RuntimeStores`
- `MessageStore` 纳入事务接口
- 先完成 memory backend
- loop 在最小闭环中写入 user / assistant 消息

### 5.2 Phase 2

- 扩展到 sqlite backend 与 migration
- tool call / tool result 进入消息工作轨
- 多轮历史读取只走 `MessageStore`
- 不允许从 `EventStore` 临时重建对话上下文替代 `MessageStore`

## 7. 相关新增类型

- `Message`
- `Part`
- `MessageRole`
- `PartKind`
- `SceneId`

## 8. 本文不负责的内容

以下能力不在本文冻结范围内：

- compaction 的具体替换算法
- sub-agent 的消息共享机制
- provider override
- prompt 热更新

# Phase 1：runtime-agent 最小 Loop

> 用途：冻结 `runtime-agent` 在 `Phase 1` 的最小能力，确保后续阶段只实现最小闭环，不提前吸收 `Phase 2+` 复杂度。

## 0. 与接口冻结文档的关系

本文只定义 `Phase 1` 的最小闭环能力。`AgentLoop` 与 `MessageStore` 的长期边界以 [../interfaces/agent-loop-and-message-store.md](../interfaces/agent-loop-and-message-store.md) 为准，本文不重复改写长期接口约束。

## 1. 目标

在不进入 tool loop、审批挂起、transport 的前提下，落地最小 `runtime-agent` crate，使系统具备单 session、单 turn 的基础对话闭环。

## 2. 本阶段必须具备的能力

- 新增 `runtime-agent` crate
- 定义 `AgentLoop`
- 定义 `AgentEventSink`
- 组装 PromptManager、PromptComposer、PromptRenderer、PromptProjector、InferenceBackend
- 读取 turn 执行上下文
- 写入 user / assistant 消息工作轨
- 在成功时调用 `kernel.complete_turn`
- 在失败时调用 `kernel.fail_turn`

## 3. 固定执行路径

`kernel.start_turn -> PromptManager -> PromptComposer -> PromptRenderer -> PromptProjector -> InferenceBackend.execute -> MessageStore 写入 -> kernel.complete_turn/fail_turn`

该路径在 `Phase 1` 视为冻结，不引入其他分支编排。

## 4. 明确不做的内容

以下内容全部后置：

- tool call 解析与执行
- 审批挂起与恢复
- 多轮对话优化
- doom loop 检测
- compaction
- sub-agent
- transport 集成

## 5. 与其他文档的依赖关系

- 依赖 [message-store-work-track.md](message-store-work-track.md) 提供消息工作轨与 memory 存储边界
- 依赖 [prompt-manager-minimal-package.md](prompt-manager-minimal-package.md) 提供最小 PromptManager 约束
- 依赖 [../interfaces/agent-loop-and-message-store.md](../interfaces/agent-loop-and-message-store.md) 提供长期 loop 与消息轨边界

## 6. 验收标准

- 能完成单次用户输入到模型输出的闭环
- assistant 输出能写入消息工作轨
- 失败路径能进入 `fail_turn`
- 事件与 turn 状态保持一致
- 不因为 `Phase 2+` 能力预留而引入额外复杂控制流

## 7. 本文不负责的内容

- 不负责定义 `MessageStore` 的完整抽象边界
- 不负责定义 `PromptManager` 的配置包细节
- 不负责定义 `Phase 2` 的 tool loop、审批 continuation 或多轮扩展

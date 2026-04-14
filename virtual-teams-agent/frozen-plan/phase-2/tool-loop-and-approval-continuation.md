# Phase 2：Tool Loop 与审批 Continuation

> 用途：冻结 `Phase 2` 内 `runtime-agent` 的完整对话核心控制流，明确 tool loop、审批挂起与恢复执行的边界。

## 0. 与接口冻结文档的关系

本文定义 `Phase 2` 在 `runtime-agent` 上新增的控制流能力。`AgentLoop`、`MessageStore` 与双轨规则的长期边界仍以 [../interfaces/agent-loop-and-message-store.md](../interfaces/agent-loop-and-message-store.md) 为准。

## 1. 目标

在 `Phase 1` 最小 loop 基础上，扩展 `runtime-agent` 使其具备：

- tool call 解析
- tool execution
- tool result 回灌消息历史
- 审批挂起
- continuation 恢复执行

## 2. 本阶段必须具备的能力

- 从模型输出中识别 tool call
- 调用工具执行并把结果追加回消息工作轨
- 在需要审批时停止当前执行并进入挂起态
- 在审批通过后恢复同一条执行链路，而不是新开不相关 turn
- 在审批拒绝时进入明确的拒绝分支并完成收尾

## 3. 固定控制流

本阶段固定控制流为：

`模型输出 -> 识别 tool call -> 审批检查 -> 执行工具或挂起 -> 追加 tool_result -> 继续 loop -> 最终收尾`

如果进入审批分支，则控制流固定为：

`识别需要审批 -> 挂起 -> 记录审批状态 -> 等待外部响应 -> continuation 恢复或拒绝结束`

## 4. 本阶段边界

- 审批状态持久化由 `runtime-kernel`/store 承担
- 审批识别、挂起点与恢复控制流由 `runtime-agent` 承担
- continuation 是同一执行链的恢复，不应退化为“重新发起一次普通 turn”

## 4.1 执行前提

- `Phase 1` 最小 loop 已成立
- 消息工作轨已是唯一上下文来源
- Protocol Handler 仍后于本控制流定义，不反向决定审批与 continuation 语义

## 5. 明确不做的内容

以下内容后置：

- 更复杂的并发 tool 调度
- sub-agent 派生执行
- compaction
- transport 层面的审批交互细节

## 6. 验收标准

- tool call 可执行并继续 loop
- 审批可挂起
- 审批通过后可恢复执行
- 审批拒绝后有稳定结束路径
- tool_result 能进入消息工作轨并参与后续上下文构建

## 6.1 最小完成产物

- 一条固定的 tool loop 与审批 continuation 控制流
- 一组明确的挂起、恢复、拒绝验收条件
- 一份不会被 transport 细节反向改写的运行语义约束

## 7. 本文不负责的内容

- 不负责定义 sqlite 存储与 migration 细节
- 不负责定义 Protocol Handler 的对外方法承接边界
- 不负责定义 transport 层面的审批交互

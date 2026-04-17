# Phase 3：Tool Loop 扩展与审批 Continuation

> 用途：冻结新的 `Phase 3` 内完整对话控制流扩展，明确 approval continuation、多轮对话与已有 tool loop 的关系。

## 1. 目标

在已有 tool loop 基础上，补齐：

- approval continuation
- multi-turn
- 更稳定的完整对话控制流

## 2. 本阶段必须具备的能力

- 现有 tool loop 能继续运行
- 需要审批时可以挂起当前执行
- 审批通过后恢复同一条执行链
- 审批拒绝后进入稳定结束路径
- 多轮对话建立在工作轨之上

## 3. 固定控制流

`模型输出 -> 识别 tool call -> 审批检查 -> 执行工具或挂起 -> 追加 tool_result -> 继续 loop -> 多轮上下文累积 -> 最终收尾`

## 4. 本阶段边界

- 本阶段不是 tool loop 首次落地阶段
- 审批状态持久化由 `runtime-kernel`/store 承担
- Protocol Handler 不反向定义审批语义

## 5. 明确不做的内容

- transport 层面的审批交互细节
- compaction
- sub-agent 派生执行

## 6. 验收标准

- approval 可挂起、恢复、拒绝
- 多轮上下文完全建立在工作轨与生产持久化能力之上
- 文档中不再把 tool loop 首次落地写成 `Phase 3`

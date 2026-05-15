# U-A3.3 Approval continuation + 多轮对话

## 目标 (Goal)

实现 Approval 机制（工具执行前/后需要用户确认时暂停 Turn，等待 ApprovalStore 中的决策后继续），以及 Session parent 字段支持多轮对话，使得 Agent 可以在需要时等待用户响应后继续执行。

## 上下文 (Context)

- 前置：U-A3.2（Model Selector）
- 设计文档：`08-vte-agent-internals/execution-loop.md`（Approval 流程）、`08-vte-agent-internals/agent-architecture.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/kernel/src/approval.rs | modify | Approval 流程集成 |
| crates/vta/agent/src/loop.rs | modify | DefaultAgentLoop 支持 Approval 暂停/继续 |
| crates/vta/core/src/types.rs | modify | Session 增加 parent_session_id 字段 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- Approval 触发条件：ToolSpec.require_approval = true 或执行循环检测到高风险操作
- Turn 状态新增 AwaitingApproval 变体
- 多轮对话：Session.parent_session_id 可追溯到父会话

## 完成条件 (Done When)

- [ ] TurnStatus 新增 AwaitingApproval 变体
- [ ] ToolSpec 含 require_approval 字段
- [ ] 高风险工具执行前自动触发 Approval 暂停
- [ ] Approval 通过 ApprovalStore 记录和查询
- [ ] Approval 批准后 Turn 从暂停点继续执行
- [ ] Session 支持 parent_session_id 链
- [ ] `cargo test` 全部通过

### 提交标准

- [ ] `feat(vta): add approval continuation and multi-turn session support`

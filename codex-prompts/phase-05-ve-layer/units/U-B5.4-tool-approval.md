# U-B5.4 审批流

## 目标 (Goal)

实现审批流工具：审批模板（审批节点/条件分支）、审批实例（发起/审批/驳回/转交）、审批历史记录，后端 API，Flutter 审批界面。

## 上下文 (Context)

- 前置：U-B5.1（文档工具）
- 设计文档：`04-collaboration-app/collaboration-tools/approval.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/approval.rs | create | ApprovalTemplate、ApprovalInstance、ApprovalNode |
| crates/collab-server/src/store/approval.rs | create | ApprovalStore |
| crates/collab-server/src/service/approval_engine.rs | create | 审批引擎 |
| crates/collab-server/src/routes/approval.rs | create | REST API |
| apps/flutter/lib/features/tools/approval/ | create | Flutter 审批界面 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 审批节点类型：单人审批、多人会签、条件分支
- 基础版仅支持固定模板审批（不支持流程设计器）

## 完成条件 (Done When)

- [ ] 审批模板 CRUD
- [ ] 审批实例发起 → 审批人审批/驳回
- [ ] 审批流转状态机：pending → approved / rejected / transferred
- [ ] Flutter 审批列表 + 详情 + 处理页面
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add approval flow tool with templates and instance management`

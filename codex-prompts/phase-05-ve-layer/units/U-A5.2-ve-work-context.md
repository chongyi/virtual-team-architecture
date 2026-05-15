# U-A5.2 工作上下文状态机

## 目标 (Goal)

在 VE 系统中实现工作上下文（WorkContext）完整状态机：创建（New）、关联（Attach）、Fork（分支新上下文）、Resume（恢复暂停的上下文）、Archive（归档），使得 VE 可以在不同任务之间切换、保持上下文连续性。

## 上下文 (Context)

- 前置：U-A5.1（意图 Agent 完成）
- 设计文档：`06-message-and-work-context.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/agent-server/src/ve/work_context.rs | create | WorkContext 实体与状态机 |
| crates/agent-server/src/ve/work_context_store.rs | create | WorkContext 持久化（PG） |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- WorkContext 状态：Active / Paused / Archived
- Fork 操作创建新 WorkContext（复制父上下文的基本信息，不复制消息历史）
- Resume 操作从 Paused 状态恢复到 Active

## 完成条件 (Done When)

- [ ] WorkContext 含字段：id、tenant_id、ve_id、session_id、status、title、parent_id、created_at
- [ ] 状态转换：New → Active → Paused → Archived；Active → Fork → New
- [ ] 意图 Agent 自动为 use_tool 类型意图创建新 WorkContext
- [ ] WorkContext 标题由意图 Agent 根据用户消息自动生成
- [ ] `cargo test -p vt-agent-server` 全部通过

### 提交标准

- [ ] `feat(ve): add WorkContext state machine with New/Fork/Resume/Archive`

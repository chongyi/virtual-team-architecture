# U-X5.2 基础审计事件

## 目标 (Goal)

为关键操作实现基础审计事件记录：用户登录/登出、VE 创建/销毁、Tool Action 调用、权限变更，确保内测阶段可追踪所有关键操作。

## 上下文 (Context)

- 前置：U-X5.1
- 设计文档：`12-security-and-isolation.md`、`16-technical-specs/observability.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/audit/ | create | 审计事件模块 |
| crates/agent-server/src/audit/ | create | 审计事件模块 |
| migrations/ | create | audit_events 表 |

## 约束 (Constraints)

审计事件字段：event_id、event_type、tenant_id、actor_id、target_type、target_id、payload(JSONB)、created_at。不可删除、不可修改（append-only）。

## 完成条件 (Done When)

- [ ] audit_events 表创建并 append-only
- [ ] 协作应用：用户登录/登出记录审计事件
- [ ] Agent 服务器：VE 实例创建/销毁记录审计事件
- [ ] 协作应用：Tool Action 调用记录审计事件（调用者、tool_type、action、结果）
- [ ] admin console 可查询审计事件
- [ ] `cargo test` 全部通过

### 提交标准

- [ ] `feat(core): add basic audit event recording for critical operations`

# G-X4.2 安全基线验收

## 目标 (Goal)

对首次三方集成进行安全基线审计：JWT 泄漏/篡改测试、tenant 隔离负向测试、API Key 基本生命周期、markers/context 回写幂等与冲突测试。

## 上下文 (Context)

- 前置：G-X4.1（降级验收完成）
- 属于 G-X4 集成质量 gate
- 设计文档：`12-security-and-isolation.md`

## 约束 (Constraints)

本单元不实现完整安全体系，只执行关键安全测试。发现的高危问题必须修复。

## 完成条件 (Done When)

- [ ] JWT 篡改（修改 tenant_id/user_id）→ 请求被拒绝 401
- [ ] 用户 A 发请求携带用户 B 的 tenant_id → 越权请求被拒绝 403
- [ ] 跨频道发消息（非成员）→ 403
- [ ] markers 回写幂等：同一 markers 重复 PUT，不创建重复记录
- [ ] markers 版本冲突：并发写入时，version 不对的请求被拒绝 409
- [ ] API Key 创建/轮换/撤销基本流程（Agent 服务器 ↔ 协作应用之间）
- [ ] 审计事件记录包含操作者 user_id、操作类型、时间戳

### 提交标准

- [ ] `test: add M4 security baseline tests for auth, tenant isolation and idempotency`

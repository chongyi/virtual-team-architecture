# U-X2.2 VTA API 冻结校验与 Tenant 查询审计

## 目标 (Goal)

校验 VTA API 冻结清单与代码一致性、审计所有 PostgreSQL 查询是否正确过滤 tenant_id、验证错误响应格式符合协议约定，确保 M2 里程碑质量。

## 上下文 (Context)

- 前置：U-X2.1（CI 基线完成）
- 本单元属于：Phase 2 → U-X2 基础质量 gate
- 设计文档：`vta-api-freeze.md`（U-A2.3 产出）、`12-security-and-isolation.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| 全量审计 | 检查 | 所有 sqlx 查询包含 `WHERE tenant_id = $tenant_id` |
| 全量审计 | 检查 | 所有 REST/WS 错误响应格式一致性 |
| 全量审计 | 检查 | VTA trait 签名与冻结清单一致 |

## 约束 (Constraints)

- 审计不修改功能代码，只检查和报告
- 发现的问题作为 bug fix commit 修复

## 完成条件 (Done When)

- [ ] 所有 PostgreSQL 查询经过 tenant_id 过滤审计（报告输出）
- [ ] 错误响应格式符合统一规范：`{error: {code, message, details?}}`
- [ ] VTA trait 方法签名与冻结清单逐项比对一致
- [ ] 发现的问题全部修复并提交

### 提交标准

- [ ] `fix: audit and fix tenant_id filtering gaps and error response consistency`

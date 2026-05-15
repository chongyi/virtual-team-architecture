# U-C3.3 多 VE 共享与隔离策略

## 目标 (Goal)

实现 WEN 上的多 VE 共享策略：一个 WEN 可同时服务多个 VE（不同 VE 的文件/进程隔离）、资源配额（每 VE 最大并发工具数、磁盘配额）、优先级调度，确保多 VE 场景下的安全性和公平性。

## 上下文 (Context)

- 前置：U-C3.2（工具路由完成）
- 设计文档：`09-work-environment-node.md`、`12-security-and-isolation.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/sandbox/ve_isolation.rs | modify | 多 VE 资源配额管理 |
| crates/wen-client/src/sandbox/quota.rs | create | 磁盘配额、并发限制 |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] 每个 VE 独立的工作目录（`{sandbox_root}/{tenant_id}/{ve_id}/`）
- [ ] 每 VE 磁盘配额限制（默认 100MB）
- [ ] 每 VE 最大并发工具执行数（默认 3）
- [ ] VE 无法访问其他 VE 的文件（已在 Phase 2 验证，本单元加固）
- [ ] 资源耗尽时的优雅降级（返回配额超限错误）

### 提交标准

- [ ] `feat(wen): add multi-VE resource quota and priority scheduling`

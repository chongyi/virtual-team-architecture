# U-A4.2 VE 管理服务

## 目标 (Goal)

实现 Agent 服务器的 VE 管理服务：VE Instance 生命周期管理（创建、启动、暂停、销毁）、多租户路由（根据 tenant_id + ve_id 定位 VE Runtime）、与 VTA host 的通信，使得 Agent 服务器可以管理多个 VE 实例。

## 上下文 (Context)

- 前置：U-A4.1（接入层完成）
- 设计文档：`07-agent-server.md`、`05-virtual-employee-system.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/agent-server/src/management/mod.rs | create | VE 管理服务 |
| crates/agent-server/src/management/instance.rs | create | VE Instance 生命周期 |
| crates/agent-server/src/management/router.rs | create | 多租户消息路由 |
| crates/agent-server/src/management/store.rs | create | Instance 元数据存储（PostgreSQL） |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 管理服务通过 HTTP API 控制 vta-host 进程（启动/停止/状态查询）
- 租户隔离：route() 方法必须验证 tenant_id 与 ve_id 的归属关系

## 完成条件 (Done When)

- [ ] VE Instance 创建：传入 config_package_path → 生成 ve_id → 记录到 PG
- [ ] VE Runtime 启动：启动 vta-host 子进程
- [ ] 消息路由：根据 tenant_id + ve_id 将消息投递到正确 Runtime
- [ ] Runtime 状态查询：GET /api/v1/ve/{id}/status
- [ ] `cargo test -p vt-agent-server` 全部通过

### 提交标准

- [ ] `feat(agent-server): add VE management service with lifecycle and tenant routing`

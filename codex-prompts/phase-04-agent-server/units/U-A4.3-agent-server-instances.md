# U-A4.3 冷热实例管理

## 目标 (Goal)

实现 Agent 服务器的冷热实例管理：热实例池（预启动的 VE Runtime，即时响应）、冷实例（按需启动，启动后从 SQLite 恢复 Session 状态）、冷热调度策略（基于上一次交互时间的自动热→冷降级），使得系统在成本和延迟之间取得平衡。

## 上下文 (Context)

- 前置：U-A4.2（管理服务）
- 设计文档：`07-agent-server.md`（冷热分离调度）、`virtual-employee-system/technical-design/reliability-and-observability.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/agent-server/src/management/pool.rs | create | 热实例池管理 |
| crates/agent-server/src/management/scheduler.rs | create | 冷热调度器 |
| crates/agent-server/src/management/cold_start.rs | create | 冷启动逻辑 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 热池大小可配置（默认 3），热实例空闲超过 10 分钟自动降级
- 冷启动从 SQLite 恢复 Session 状态（不超过 30s）
- 冷热降级不丢失消息（降级前等待当前 Turn 完成）

## 完成条件 (Done When)

- [ ] 热实例池：预启动 N 个 vta-host 进程
- [ ] 消息到达时优先路由到热实例
- [ ] 空闲超时后热实例降级为冷（进程退出，状态保留在 SQLite）
- [ ] 冷启动后恢复 Session 状态
- [ ] 冷启动期间新消息排队等待（超时 30s 后返回错误）

### 提交标准

- [ ] `feat(agent-server): add hot/cold instance pool with auto-scaling scheduler`

# U-C3.1 VE 分配与节点选择

## 目标 (Goal)

在 Agent 服务器中实现 VE 到 WEN 的分配机制：节点注册表查询、节点选择策略（负载均衡、地理位置就近）、VE 绑定到特定节点，使得 VE 可以在适当的 WEN 上执行工具。

## 上下文 (Context)

- 前置：U-C2.3（WEN 多 VE 隔离测试）+ U-A4.3（Agent 服务器实例管理）
- 跨轨：需 G-A4 和 G-C2 均完成
- 设计文档：`09-work-environment-node.md`、`07-agent-server.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/agent-server/src/management/node_registry.rs | create | WEN 节点注册表（替代 Phase 1 mock） |
| crates/agent-server/src/management/assignment.rs | create | VE → WEN 分配逻辑 |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] Agent 服务器维护活跃 WEN 节点注册表（来自 Phase 1-2 的注册心跳）
- [ ] VE 绑定：API PUT /api/v1/ve/{id}/bind-node
- [ ] 节点选择默认策略：负载最低优先
- [ ] 节点不可用时 VE 重新分配到其他可用节点
- [ ] `cargo test -p vt-agent-server` 全部通过

### 提交标准

- [ ] `feat(agent-server): add VE-to-WEN assignment with node selection strategy`

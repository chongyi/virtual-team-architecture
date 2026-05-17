# U-X5.1 Tool Action 权限审计与离线链路验收

## 目标 (Goal)

对 M5 内测版进行协作工具权限审计和 WEN 离线/超时链路验收：Tool Action 权限越过测试、WEN 离线时工具调用降级、工具执行超时恢复。

## 上下文 (Context)

- 前置：Phase 5 全部功能单元完成
- 属于 U-X5 内测质量 gate

## 约束 (Constraints)

验收测试不修改功能代码，只编写测试并报告。阻塞性问题先修复再通过。

## 完成条件 (Done When)

- [ ] VE 尝试调用未授权的 Tool Action → 调用被拒绝，返回权限错误
- [ ] 配置包 tools.toml 中未声明的工具不可被 VE 调用
- [ ] WEN 进程停止 → VE 调用该 WEN 上的工具 → 返回"节点不可用"错误 → VE 向用户说明
- [ ] 工具执行超时（超过配置时间）→ 错误回传 → VE 不陷入死循环
- [ ] Tool Action 创建的内容标记 source=ve，与用户创建内容可区分
- [ ] **Phase 4 债务修复**：`destroy_instance()` 正确解绑 WEN 节点（`nodes.unassign_ve()`），避免虚增节点负载分数
- [ ] **Phase 4 债务修复**：`ColdStartCoordinator.locks` 在 VE 销毁时清理对应互斥锁，不再泄漏
- [ ] **Phase 4 债务修复**：`create_session` 实现实际会话创建逻辑，不再零操作

### 提交标准

- [ ] `test: add M5 tool permission audit and offline resilience tests`

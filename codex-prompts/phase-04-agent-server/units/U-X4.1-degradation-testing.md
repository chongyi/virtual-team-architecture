# U-X4.1 降级与独立运行验收

## 目标 (Goal)

验证协作应用在 Agent 服务器不可用时的独立运行能力：IM 核心功能正常、VE 联系人显示离线、降级消息正确提示用户，以及 WEN 离线/工具执行失败时的链路表现。

## 上下文 (Context)

- 前置：Phase 4 全部功能单元完成
- 属于 U-X4 集成质量 gate
- 设计文档：`04-collaboration-app/technical-design/sync-reliability-observability.md`、`12-security-and-isolation.md`

## 约束 (Constraints)

验收测试不修改功能代码，只编写测试并报告。阻塞性问题先修复再通过。

## 完成条件 (Done When)

- [ ] Agent 服务器进程停止 → 协作应用登录/消息/频道/组织功能不受影响
- [ ] Agent 服务器停止时 → 向 VE 发消息 → 立即回显降级提示（"VE 暂不可用"），不超时等待
- [ ] Agent 服务器恢复 → VE 联系人状态变为在线 → 新消息正常路由
- [ ] WEN 进程停止 → Agent 服务器标记节点离线 → VE 工具调用返回"节点不可用"错误
- [ ] 工具执行超时 → 错误信息回传 → VE 可恢复（不陷入死循环）
- [ ] 所有降级路径有对应的 tracing event 记录

### 提交标准

- [ ] `test: add degradation and independent-operation acceptance tests for M4`

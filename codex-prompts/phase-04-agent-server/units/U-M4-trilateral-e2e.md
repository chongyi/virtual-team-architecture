# U-M4.1 M4 里程碑三方集成验收

## 目标 (Goal)

对 M4 里程碑进行完整三方集成端到端验证：用户 → 协作应用 → Agent 服务器 → VE Runtime → WEN 工具 → 协作应用回复，全链路可用。

## 上下文 (Context)

- 前置：Phase 4 全部功能单元 + 全部 gate 单元完成
- M4 = A4（Agent 服务器）+ B4（VE 集成）+ C3（VE 绑定到 WEN）

## 约束 (Constraints)

验收测试全链路必须有 tracing correlation_id。

## 完成条件 (Done When)

- [ ] 用户登录协作应用 → 向 VE 联系人发消息"查一下今天的天气"
- [ ] 消息正确路由到 Agent 服务器 → VE Runtime 接收
- [ ] VE 调用工具（mock weather tool 或 MCP tool）→ WEN 执行 → 结果返回 VE
- [ ] VE 生成回复文本 → 回复出现在协作应用聊天窗口中
- [ ] 全链路 correlation_id 一致，tracing 可追踪完整调用链
- [ ] 消息标记（markers）正确回写到原始消息

### 提交标准

- [ ] `test: add M4 trilateral integration acceptance end-to-end tests`

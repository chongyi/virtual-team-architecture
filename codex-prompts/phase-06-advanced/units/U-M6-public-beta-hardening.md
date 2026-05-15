# U-M6.1 M6 里程碑公测版验收

## 目标 (Goal)

对 M6 公测版进行全系统验收：全链路端到端测试、降级场景验证、移动端基础构建通过、Docker 一键部署可运行、Prometheus metrics 可用。

## 上下文 (Context)

- 前置：Phase 6 全部功能单元 + 全部 gate 单元完成
- M6 = A6（VTA 高级特性）+ B6（全平台与工具增强）+ C4（工作环境高级特性）

## 完成条件 (Done When)

- [ ] 全链路端到端：用户登录 → 发消息 → VE 处理 → WEN 工具执行 → 回复正确
- [ ] Sub-agent 场景：主 Agent 委派子任务 → Sub-agent 执行 → 结果回传 → 主 Agent 回复
- [ ] Compaction 场景：超长对话触发压缩 → 压缩后 Agent 仍能回答上下文相关问题
- [ ] 移动端 iOS/Android 基础构建通过
- [ ] 第三方 IM 渠道（企业微信 Webhook）消息互通
- [ ] `docker-compose up` 一键启动全系统 → 所有服务健康检查通过
- [ ] Prometheus metrics 可查询
- [ ] 全链路 tracing correlation_id 一致

### 提交标准

- [ ] `test: add M6 public beta full-system acceptance tests`

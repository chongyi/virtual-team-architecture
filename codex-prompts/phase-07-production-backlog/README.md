# Phase 7：商业化与生产运营深化（Backlog）

> 本阶段为 backlog 清单，不包含详细 unit prompt。待 M6 公测版通过后按需展开。

## 商业化

- 计费系统（Free / Pro / Team / Enterprise 定价层）
- 资源配额计量（消息量、VE 使用时长、存储空间）
- 账单生成与支付集成
- 试用期与升级/降级流程
- 参考：[13-commercialization.md](../../virtual-team/src/13-commercialization.md)

## 安全深化

- API Key 自动轮换（定期 + 泄露响应）
- mTLS 服务间通信
- 提示注入防护（Agent 端输入过滤 + 输出审计）
- 权限引擎完善（RBAC + ABAC）
- 安全审计日志聚合与告警
- SOC 2 / ISO 27001 合规准备
- 参考：[12-security-and-isolation.md](../../virtual-team/src/12-security-and-isolation.md)

## 可观测性与 SLA

- 分布式 tracing（OpenTelemetry 导出到 Jaeger/Tempo）
- 生产级 Grafana dashboard
- SLA 告警规则（延迟、错误率、可用性）
- 生产级压测（1000+ 并发）
- 容量规划与自动扩缩容
- 参考：[16-technical-specs/observability.md](../../virtual-team/src/16-technical-specs/observability.md)

## 部署与运维

- Kubernetes Helm Chart
- Terraform / Pulumi 基础设施即代码
- CI/CD 生产发布流水线（蓝绿/金丝雀部署）
- 多区域部署
- 灾难恢复演练
- 参考：[16-technical-specs/deployment-architecture.md](../../virtual-team/src/16-technical-specs/deployment-architecture.md)

## 数据治理

- 数据保留策略执行（自动过期删除）
- GDPR / 个保法合规（数据导出、删除、匿名化）
- 数据加密（静态加密 + 传输加密）
- 备份加密与异地容灾
- 参考：[16-technical-specs/non-functional-requirements.md](../../virtual-team/src/16-technical-specs/non-functional-requirements.md)

## 协作应用能力深

- 实时协同编辑（CRDT 或 OT 实现）
- 公式引擎（Bitable）
- 第三方插件市场
- 视频/语音通话
- AI 辅助写作/翻译
- 文件预览（Office、PDF 等）
- 参考：[04-collaboration-app/](../../virtual-team/src/04-collaboration-app/)

## VE 能力深化

- 多 Agent 协作编排
- Agent 学习与记忆（长期记忆、用户偏好）
- 技能市场（可共享的 VE 配置包）
- 行业模板（客服、销售、研发、HR 等场景模板）
- 参考：[05-virtual-employee-system.md](../../virtual-team/src/05-virtual-employee-system.md)

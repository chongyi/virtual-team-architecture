# U-X6.1 Prometheus 指标与 Smoke 压测

## 目标 (Goal)

为公测版建立关键 Prometheus 指标和 smoke 压测基线：VTA turn_duration、Agent Server 消息吞吐、WEN 工具执行延迟、协作应用 WebSocket 连接数，确保公测版有基本可观测性。

## 上下文 (Context)

- 前置：Phase 6 全部功能单元完成
- 属于 U-X6 公测质量 gate
- 设计文档：`16-technical-specs/observability.md`、`16-technical-specs/non-functional-requirements.md`

## 约束 (Constraints)

压测目标：10 并发用户、100 条消息/分钟、工具执行 P95 < 5s。不满足时记录而非阻塞。

## 完成条件 (Done When)

- [ ] Prometheus metrics endpoint（`/metrics`）在所有服务启用
- [ ] 关键指标：turn_duration_seconds（P50/P95）、message_latency_seconds、tool_call_total、active_sessions
- [ ] Smoke 测试：10 并发用户发消息 5 分钟 → 无进程崩溃 → 消息送达率 > 99%
- [ ] 压测期间 CPU/内存使用在合理范围
- [ ] Grafana dashboard（或至少 metrics 文档）

### 提交标准

- [ ] `feat(ops): add Prometheus metrics and smoke test baseline`

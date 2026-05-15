# U-A6.3 Transport + 可观测性加固

## 目标 (Goal)

实现 VTA 多传输层（WebSocket/stdio transport 替代 Phase 1 的进程内直连 + HTTP），完善可观测性（Prometheus metrics + tracing span 完善 + 健康检查），使 VTA 达到生产级标准。

## 上下文 (Context)

- 前置：U-A6.2（Sub-agent）
- 设计文档：`08-vte-agent-internals/observability-and-resilience.md`、`16-technical-specs/observability.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/transport/Cargo.toml | create | 传输层 crate |
| crates/vta/transport/src/ws.rs | create | WebSocket transport |
| crates/vta/transport/src/stdio.rs | create | stdio transport |
| crates/vta/agent/src/metrics.rs | create | Prometheus metrics |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] WebSocket transport：Agent 服务器通过 WS 与 VTA host 通信
- [ ] stdio transport：子进程 stdin/stdout JSON-RPC 2.0 通信
- [ ] Prometheus metrics：turn_duration_seconds、tool_call_total、session_active、error_total
- [ ] 健康检查：/health 返回 VTA 内部状态（active_sessions、memory_usage）
- [ ] `cargo test` Workspace 全部通过

### 提交标准

- [ ] `feat(vta): add WebSocket/stdio transport and production observability`

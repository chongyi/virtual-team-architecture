# U-A4.1 接入层与协议适配

## 目标 (Goal)

搭建 `vt-agent-server` crate 骨架，实现接入层：对接协议适配（JSON-RPC 2.0）、协作应用消息格式 ↔ VE 内部消息格式转换、WebSocket 连接管理，使得协作应用可以向 Agent 服务器发送消息。

## 上下文 (Context)

- 前置：U-A3.3（Approval + 多轮对话）
- 设计文档：`07-agent-server.md`、`11-protocol-and-integration/integration-protocol.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/agent-server/Cargo.toml | create | axum + tokio + serde_json |
| crates/agent-server/src/main.rs | create | 入口 |
| crates/agent-server/src/access/mod.rs | create | 接入层：HTTP handler + WebSocket |
| crates/agent-server/src/access/protocol.rs | create | JSON-RPC 2.0 消息解析/序列化 |
| crates/agent-server/src/access/adapter.rs | create | 协议适配：协作应用消息 → VE 消息格式 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 对接协议使用 JSON-RPC 2.0：method 如 `ve.send_message`、`ve.create_session`
- 接入层内部不持有 VE 状态，仅负责解析/路由/响应

## 完成条件 (Done When)

- [ ] Agent 服务器启动并监听 HTTP 端口
- [ ] JSON-RPC 2.0 请求解析正确（id、method、params、jsonrpc）
- [ ] 协作应用消息成功转换为 VE 内部 Message 格式
- [ ] 错误响应符合 JSON-RPC 2.0 规范（code + message）
- [ ] `cargo test -p vt-agent-server` 全部通过

### 提交标准

- [ ] `feat(agent-server): add access layer with JSON-RPC 2.0 protocol adaptation`

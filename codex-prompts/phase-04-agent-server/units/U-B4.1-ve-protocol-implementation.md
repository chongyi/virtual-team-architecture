# U-B4.1 对接协议实现

## 目标 (Goal)

在协作应用服务端实现对接协议客户端：向 Agent 服务器发送 JSON-RPC 2.0 请求（消息转发、Session 管理），接收 VE 回复，处理协议层错误（重试、降级），使得协作应用可以与 Agent 服务器通信。

## 上下文 (Context)

- 前置：U-B3.3（Admin Console 初步）
- 跨轨依赖：需 G-A4（Agent 服务器接入层可用）
- 设计文档：`11-protocol-and-integration/integration-protocol.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/integration/mod.rs | create | 对接模块 |
| crates/collab-server/src/integration/agent_client.rs | create | Agent 服务器 HTTP/WS 客户端 |
| crates/collab-server/src/integration/protocol.rs | create | JSON-RPC 2.0 封装 |
| crates/collab-server/src/integration/fallback.rs | create | 降级策略（Agent 不可用时的 mock 回复） |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 对接协议有独立的超时配置（默认 60s）
- Agent 服务器不可用时降级：返回"VE 暂时不可用"的友好消息给用户
- 消息转发携带完整的上下文数据段（channel_id、recent_messages、org_context）

## 完成条件 (Done When)

- [ ] Agent 客户端可发送 JSON-RPC 2.0 请求
- [ ] 消息转发流程：用户消息 → collab-server → Agent 服务器 → 回传 reply
- [ ] 降级：Agent 服务器不可用时 → 用户收到底层错误提示
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add integration protocol client for Agent Server communication`

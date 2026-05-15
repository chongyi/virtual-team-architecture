# U-B6.2 第三方 IM 渠道

## 目标 (Goal)

实现第三方 IM 渠道接入（Gateway 模式）：企业微信/飞书/Discord 等外部 IM 平台的 webhook 接收入口、消息格式转换（外部 IM 消息 ↔ 协作应用消息）、OAuth 授权管理，使外部平台用户可以接收和发送消息。

## 上下文 (Context)

- 前置：U-B6.1（移动端适配）
- 设计文档：`04-collaboration-app/im-system.md`（Gateway 模式部分）

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/gateway/mod.rs | create | IM Gateway 模块 |
| crates/collab-server/src/gateway/webhook.rs | create | Webhook 接收 |
| crates/collab-server/src/gateway/adapter.rs | create | 消息格式适配 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：先实现一个渠道（如企业微信 webhook），Gateway 设计为可扩展（trait-based adapter）。

## 完成条件 (Done When)

- [ ] Webhook 接收端点（验证签名）
- [ ] 外部 IM 消息转换为内部消息格式（含来源标识）
- [ ] 内部消息转发到外部 IM（通过 webhook URL）
- [ ] OAuth 授权流程（企业微信应用授权）
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add third-party IM channel gateway with WeCom webhook support`

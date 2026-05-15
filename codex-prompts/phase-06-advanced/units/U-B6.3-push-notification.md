# U-B6.3 推送通知

## 目标 (Goal)

实现完整推送通知系统：服务端推送服务（Firebase Cloud Messaging + APNs）、消息到达离线推送、@提及推送、审批通知推送，使得用户离线时不会错过重要消息。

## 上下文 (Context)

- 前置：U-B6.1（移动端适配）
- 设计文档：`04-collaboration-app/technical-design/sync-reliability-observability.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/notification/mod.rs | create | 推送通知模块 |
| crates/collab-server/src/notification/push.rs | create | FCM/APNs 推送客户端 |
| crates/collab-server/src/notification/policy.rs | create | 推送策略（哪些消息推、哪些不推） |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] 服务端推送客户端（FCM + APNs）
- [ ] 离线消息到达 → 推送通知
- [ ] @提及 → 高优先级推送
- [ ] 审批请求 → 推送通知
- [ ] 用户可配置推送偏好（免打扰时段）

### 提交标准

- [ ] `feat(collab): add push notification system with FCM and APNs support`

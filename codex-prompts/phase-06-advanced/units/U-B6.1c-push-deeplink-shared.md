# U-B6.1c 推送通知处理与深度链接路由

## 目标 (Goal)

实现推送通知处理（通知点击跳转到对应页面）和深度链接路由解析（`virtualteam://im/channel/{id}` 等），跨 iOS/Android 统一处理逻辑。

## 上下文 (Context)

- 前置：U-B6.1a + U-B6.1b（iOS/Android 平台适配均完成）
- 设计文档：`04-collaboration-app/technical-design/client-architecture.md`

## 约束 (Constraints)

详见 CONTEXT.md。深度链接解析失败时跳转首页。

## 完成条件 (Done When)

- [ ] 推送通知点击 → 跳转到对应聊天页面（channel + message）
- [ ] @提及通知点击 → 跳转到对应消息
- [ ] 深度链接 `virtualteam://im/channel/{id}` → 正确路由
- [ ] 深度链接 `virtualteam://tools/document/{id}` → 正确路由
- [ ] 应用在后台时收到通知 → 点击通知打开应用并跳转
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(flutter): add push notification handling and deep link routing`

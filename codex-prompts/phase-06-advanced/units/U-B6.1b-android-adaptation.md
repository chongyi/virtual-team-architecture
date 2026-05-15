# U-B6.1b Android 平台适配

## 目标 (Goal)

完成 Flutter 客户端 Android 平台适配：Material 主题适配、FCM 推送通知注册、Android 深度链接（App Links）、Android 构建验证。

## 上下文 (Context)

- 前置：U-B5.6（Tool Action Gateway）
- 设计文档：`04-collaboration-app/technical-design/client-architecture.md`

## 约束 (Constraints)

详见 CONTEXT.md。通过 PlatformCapabilities 抽象层处理。

## 完成条件 (Done When)

- [ ] `flutter build apk` 构建成功
- [ ] Material 3 主题适配（动态颜色支持）
- [ ] FCM 推送注册（device token 获取并上报服务端）
- [ ] App Links 深度链接配置（AndroidManifest intent-filter）
- [ ] Android 原生权限声明（通知、存储）
- [ ] `flutter analyze` 无 error

### 提交标准

- [ ] `feat(flutter): add Android platform adaptation with FCM and App Links`

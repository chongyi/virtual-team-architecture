# U-B6.1a iOS 平台适配

## 目标 (Goal)

完成 Flutter 客户端 iOS 平台适配：安全区域适配、iOS 推送通知（APNs）注册、iOS 深度链接（Universal Links / URL scheme）、iOS 构建验证。

## 上下文 (Context)

- 前置：U-B5.6（Tool Action Gateway）
- 设计文档：`04-collaboration-app/technical-design/client-architecture.md`

## 约束 (Constraints)

详见 CONTEXT.md。通过 PlatformCapabilities 抽象层处理。

## 完成条件 (Done When)

- [ ] `flutter build ios --no-codesign` 构建成功
- [ ] SafeArea 适配所有页面
- [ ] APNs 推送注册（device token 获取并上报服务端）
- [ ] Universal Links 或 URL scheme 深度链接配置
- [ ] iOS 原生权限声明（通知、相册、文件访问）
- [ ] `flutter analyze` 无 error

### 提交标准

- [ ] `feat(flutter): add iOS platform adaptation with push and deep links`

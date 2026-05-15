# U-B6.1 移动端适配

## 目标 (Goal)

完成 Flutter 客户端的 iOS/Android 移动端适配：平台能力完善（推送通知通道、文件选择器、深度链接）、移动端 UI 适配（底部导航、手势返回、安全区域）、移动端性能优化（图片缓存、列表虚拟化）。

## 上下文 (Context)

- 前置：U-B5.6（Tool Action Gateway）
- 设计文档：`04-collaboration-app/technical-design/client-architecture.md`

## 工作范围

修改 `apps/flutter/` 下的平台相关代码，完善 `core/platform/` 适配层。

## 约束 (Constraints)

详见 CONTEXT.md。通过 PlatformCapabilities 抽象层适配。

## 完成条件 (Done When)

- [ ] iOS 构建成功 (`flutter build ios`)
- [ ] Android 构建成功 (`flutter build apk`)
- [ ] 推送通知通道在双端注册
- [ ] 深度链接（`virtualteam://` scheme）正常跳转
- [ ] 移动端安全区域适配（SafeArea）
- [ ] `flutter analyze` 无 error

### 提交标准

- [ ] `feat(flutter): add iOS/Android mobile adaptation with push notifications and deep links`

# 客户端多端技术调研

## 调研问题

协作应用采用 Flutter 单代码库，但 IM 和协作工具在 Mobile、Desktop、Web 上存在明显运行环境差异。本调研用于支撑用户端技术方案中的网络、存储、推送、本地搜索和发布策略。

## 资料来源

- Flutter 架构与平台能力：
  - [Flutter architectural overview](https://docs.flutter.dev/resources/architectural-overview)
  - [Flutter offline-first support](https://docs.flutter.dev/app-architecture/design-patterns/offline-first)
  - [Flutter deployment docs](https://docs.flutter.dev/deployment)
- 移动端后台与推送：
  - [Android Doze and App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby)
  - [Firebase Cloud Messaging: receive messages in Flutter apps](https://firebase.google.com/docs/cloud-messaging/flutter/receive-messages)
  - [Firebase Cloud Messaging: Android message priority](https://firebase.google.com/docs/cloud-messaging/android-message-priority)
  - [Apple UserNotifications](https://developer.apple.com/documentation/usernotifications)
  - [Apple BackgroundTasks](https://developer.apple.com/documentation/BackgroundTasks)
- Web 能力限制：
  - [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
  - [MDN Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)
  - [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- 本地数据库：
  - [SQLite limits](https://sqlite.org/limits.html)

## 关键结论

### Flutter 单代码库可行，但不能等同于同一运行策略

Flutter 支持通过平台通道调用宿主平台能力，因此 IM 客户端可以共享协议、状态、缓存和 UI 组件，同时把推送、文件、深链、系统通知、窗口、后台限制放到 platform port 中。

决策：

- 保留 Flutter 单代码库。
- 平台差异集中在 `core/platform`、`app/shell` 和少量 platform-specific adapter。
- 不在业务仓储和协议 DTO 中散落平台判断。

### 移动端不能假设 WebSocket 在后台持续可靠

Android Doze / App Standby 会限制后台网络、任务和同步；Android 官方对 IM 类应用也倾向使用 FCM 高优先级消息唤醒，而不是要求电池优化豁免。iOS 也不允许普通应用任意长期后台运行，必须依赖 APNs、BackgroundTasks 和应用重新进入前台后的补拉。

决策：

- Mobile 前台使用 WebSocket 实时通道。
- Mobile 后台以 APNs/FCM 通知 + `event_cursor` 补拉为主。
- 不把“后台常驻 WebSocket”作为移动端基础能力。
- 弱网恢复必须从服务端权威游标补拉，不能依赖推送完整到达。

### Web 端能力受浏览器沙盒、通知权限和存储清除策略约束

Web Push 依赖 Service Worker 和用户授权；浏览器存储有配额和清除策略，且清除可能按 origin 整体发生。Web 本地缓存只能作为性能优化，不能保存不可恢复的权威数据。

决策：

- Web 端不承诺大容量离线缓存。
- Web 端不承诺完整本地全文搜索。
- Web Push 只作为提醒通道，进入页面后仍通过 REST / WebSocket 同步权威数据。

### 本地存储容量需要产品级上限

SQLite 理论上支持很大数据库，但真实限制来自设备空间、平台沙盒、备份策略、启动扫描成本和用户体验。协作应用不应把“能存很多”解释为“无限缓存”。

决策：

- Mobile 设置较小软上限，优先缓存最近频道、消息窗口、草稿、outbox 和对象预览。
- Desktop 可设置更大的本地缓存和本地全文索引。
- Web 使用浏览器存储，受配额和清除策略影响。
- 服务端始终是权威数据源。

### 本地全文搜索只做“最近缓存搜索”

完整搜索应由服务端统一索引和权限过滤。本地搜索只用于离线或低延迟检索最近缓存，不作为跨租户、跨对象的权威搜索。

决策：

- Mobile / Desktop 可使用 SQLite FTS 对本地缓存做最近搜索。
- Web 只做有限本地索引或直接依赖服务端搜索。
- 搜索结果必须标注范围，例如“仅本设备缓存结果”。

### 发布流程必须按平台验收

Flutter 可以共享工程，但发布流程仍然是多平台：iOS/macOS 需要 Apple 签名、entitlement、TestFlight/App Store 或 notarization；Android 需要 keystore、Play Console、权限声明；Windows/Linux/Web 也有各自打包、签名、发布和回滚机制。

决策：

- 技术方案中必须列出 ReleaseTarget 矩阵。
- 每个平台都需要独立验收通知、深链、文件、离线缓存、权限和弱网恢复。

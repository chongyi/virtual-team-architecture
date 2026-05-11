# 调研结论与设计决策

## 定位

本文记录协作应用技术方案需要吸收的调研结论。原始资料、链接和风险分析保存在 `virtual-team/research/collaboration-app/`；本文只保留对 `src` 方案产生约束的设计决策。

## 客户端多端决策

### Flutter 单代码库成立，但运行策略必须分平台

Flutter 支持 Mobile、Desktop、Web 和平台通道，因此客户端可以共享协议模型、状态管理、缓存策略和大部分 UI 组件。但 IM 类应用在后台连接、推送、本地存储、文件权限和发布流程上存在平台差异。

决策：

- 保持一个 Flutter 客户端工程。
- 平台差异集中在 platform port 和 responsive shell。
- 不把 Mobile、Desktop、Web 的网络、推送和存储策略写成同一套假设。

### Mobile 以前台实时、后台通知和恢复补拉为主

移动端不能假设后台 WebSocket 长期稳定。后台消息提醒依赖 APNs/FCM；进入前台后通过 `event_cursor` 和频道 `sequence` 补拉权威数据。

决策：

- Mobile 前台使用 WebSocket。
- Mobile 后台使用推送唤醒和通知提醒。
- 推送只作为提醒和唤醒线索，不作为权威消息投递。
- 不把电池优化豁免作为基础能力。

### Desktop 可承担更强本地能力

桌面端更适合长连接、更大缓存、本地全文搜索和多窗口/多面板工作流。

决策：

- Desktop 可使用更大 SQLite 缓存和 FTS 本地搜索。
- Desktop 仍以服务端为权威，不允许离线产生不可合并的大型工作产物。
- 独立窗口属于增强项，基础版使用应用内多面板。

### Web 是正式入口，但能力受浏览器沙盒约束

Web 端受浏览器存储配额、Service Worker、通知权限和后台执行限制影响。

决策：

- Web 本地缓存只作为性能优化。
- Web Push 只作为提醒通道。
- Web 不承诺完整离线和大容量本地全文搜索。

## 管理端决策

### 管理端是独立 Web 应用

管理端面向内部运营、客服、财务、风控和系统运维，不是普通用户协作应用的一组隐藏页面。

决策：

- 管理端独立发布。
- 前端技术栈采用 Vite + React + React Router 7 + Tailwind CSS + shadcn/ui + Zustand 的预定方向。
- 服务端第一阶段提供独立 Admin API 模块，未来可拆成独立后台服务。

### 管理端覆盖平台全后台

管理端不仅管理用户和租户，还要覆盖套餐计费、资源配额、扩展管理、审批与风控、审计、工单客服、系统状态、任务补偿、运营配置和数据分析。

决策：

- 管理端方案按平台全后台设计。
- 高风险操作必须有独立权限、审计和审批能力。
- 管理端角色与租户管理员角色分离。

## 后端决策

### 模块化单体优先，但必须可拆

第一阶段不引入完整微服务运维复杂度，但服务端必须按未来拆分边界编码。

决策：

- 保持 Rust + tokio + axum 的模块化单体。
- 模块必须声明数据所有权、入口 API、内部事件、后台任务、幂等键和指标。
- 模块间不得直接读写私有表。

### Outbox 是拆分和可靠性的基础

搜索、通知、Agent 转发、导出、清理和日程触发都不应阻塞用户写路径。

决策：

- 权威业务写入和 outbox 事件写入同事务。
- 后台 worker 从 outbox 或队列消费并可重试。
- Redis Streams 可作为 worker fanout 和 consumer group 机制，但不替代数据库 outbox 的权威性。

### 服务拆分顺序按压力决定

决策：

1. WebSocket Gateway。
2. Background Worker。
3. Search Service。
4. Notification Service。
5. File Service。
6. Admin API。
7. Agent Adapter。

拆分后必须保持协议、权限、审计、幂等和数据所有权规则不变。

## 产品形态决策

成熟协作应用普遍把消息、应用 surface、文档、表格、审批、管理后台拆成不同承载面。

决策：

- 用户认知优先：用户看到频道、联系人、文档、表格、看板、审批和日程。
- 工程概念内收：Extension、Tool Action、Object Shell、Agent Adapter 不成为普通用户学习负担。
- 工作产物不刷屏，进入协作工具；聊天用于沟通、确认和交付摘要。

# 前端技术栈调研

## 调研问题

协作应用包含 Flutter 用户端和 React 管理端。两者目标用户、运行环境和状态模型不同，需要分别选择框架与库。

## 资料来源

- Flutter 客户端：
  - [Flutter architecture overview](https://docs.flutter.dev/resources/architectural-overview)
  - [Flutter offline-first](https://docs.flutter.dev/app-architecture/design-patterns/offline-first)
  - [Riverpod documentation](https://riverpod.dev/)
  - [Drift documentation](https://drift.simonbinder.eu/)
  - [Dio package](https://pub.dev/packages/dio)
  - [web_socket_channel package](https://pub.dev/packages/web_socket_channel)
  - [firebase_messaging package](https://pub.dev/packages/firebase_messaging)
  - [flutter_secure_storage package](https://pub.dev/packages/flutter_secure_storage)
  - [go_router package](https://pub.dev/packages/go_router)
- React 管理端：
  - [Vite guide](https://vite.dev/guide/)
  - [React documentation](https://react.dev/)
  - [React Router documentation](https://reactrouter.com/home)
  - [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite)
  - [shadcn/ui Vite installation](https://ui.shadcn.com/docs/installation/vite)
  - [Zustand documentation](https://zustand.docs.pmnd.rs/getting-started/introduction)
  - [TanStack Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
  - [TanStack Table documentation](https://tanstack.com/table/latest)
  - [React Hook Form documentation](https://react-hook-form.com/)
  - [Zod documentation](https://zod.dev/)
  - [Vitest documentation](https://vitest.dev/)
  - [Playwright documentation](https://playwright.dev/)

## Flutter 客户端结论

### Riverpod 适合共享状态与依赖注入

协作应用需要跨端共享 auth、tenant、channel、message store、sync client 和 platform ports。Riverpod 的 provider 模型适合测试和依赖替换。

决策：

- 默认 Riverpod。
- 不把状态管理与持久化混在一起。

### Drift/SQLite 适合消息和对象缓存

客户端需要缓存频道消息、草稿、outbox、对象预览和本地搜索索引。Drift 提供类型安全 SQL 和迁移能力，比裸 sqflite 更适合作为长期缓存层。

决策：

- 默认 Drift + SQLite。
- Web 端能力需要单独评估，不承诺与 Desktop 等同缓存。

### 网络库按协议分工

Dio 适合 HTTP、上传、拦截器和取消；web_socket_channel 适合标准 WebSocket；firebase_messaging 适合移动推送。

决策：

- HTTP、WebSocket、推送分开 adapter。
- 推送 payload 不作为权威数据。

## React 管理端结论

### 管理端是内部 SPA，不需要默认 SSR

Vite + React + React Router 7 能满足内部后台的构建、路由和页面组织。SSR 会增加部署和鉴权复杂度，第一阶段没有必要。

决策：

- 默认 Vite + React + TypeScript + React Router 7。

### Zustand 与 TanStack Query 分工必须明确

管理端的服务端数据包括租户、用户、账单、审计、任务、队列和报表。它们需要分页、缓存、重试、失效和刷新，不适合放进 Zustand。

决策：

- Zustand 只保存 UI 状态。
- TanStack Query 管服务端状态。

### shadcn/ui 适合源码化后台组件

shadcn/ui 的组件进入项目源码后可被修改，适合形成自己的管理端设计系统。相比黑盒组件库，它更利于长期定制。

决策：

- 默认 shadcn/ui + Tailwind。
- 超复杂表格、BI 或图表按需引入专用库。

## 风险

- Flutter Web 的本地数据库和文件能力与移动/桌面不同，不能简单复用策略。
- 管理端若把服务端状态放入 Zustand，会造成缓存失效、分页和权限刷新混乱。
- 管理端如果直接使用重型企业组件库，后续视觉和交互定制成本可能增加。

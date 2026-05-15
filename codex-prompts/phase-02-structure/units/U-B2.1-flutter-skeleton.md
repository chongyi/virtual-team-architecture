# U-B2.1 Flutter 项目骨架与 WebSocket 连接

## 目标 (Goal)

在 monorepo 的 `apps/flutter/` 下搭建 Flutter 项目完整骨架：Riverpod 状态管理、go_router 路由、Drift 本地存储、WebSocket 连接管理、JWT 认证流程，使得 Flutter 客户端可以登录并维持实时连接。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-B1.3（用户认证与 WebSocket 实时推送）
- 本单元属于：Phase 2 → G-B2（协作应用前端基础） → 轨道 B → 数据层/基础设施

### 相关设计文档

- `virtual-team/src/04-collaboration-app/technical-design/client-architecture.md`
- `virtual-team/src/04-collaboration-app/technical-design/api-and-protocol.md`
- `virtual-team/src/development-standards/code-conventions.md`（Flutter 部分）

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/pubspec.yaml | create | 依赖：riverpod、go_router、drift、web_socket_channel、dio、flutter_secure_storage |
| apps/flutter/lib/main.dart | create | 入口：ProviderScope + MaterialApp.router |
| apps/flutter/lib/app/routes.dart | create | go_router 路由定义 |
| apps/flutter/lib/core/network/ws.dart | create | WebSocket 连接管理 |
| apps/flutter/lib/core/network/api.dart | create | REST API 客户端（dio） |
| apps/flutter/lib/core/auth/provider.dart | create | 认证状态管理 |
| apps/flutter/lib/core/auth/repository.dart | create | 认证数据仓库 |
| apps/flutter/lib/core/storage/local_db.dart | create | Drift 数据库定义 |

### 协议边界

- 协作应用层协议：WebSocket + REST，首次从 Flutter 侧触及

## 约束 (Constraints)

详见 `CONTEXT.md`。Flutter 重点关注：Riverpod、Repository 模式、PlatformCapabilities 抽象、go_router。

## 完成条件 (Done When)

### 必须满足

- [ ] `flutter pub get` 成功
- [ ] `flutter analyze` 无 error
- [ ] 用户可输入服务器地址 → 登录 → 获得 JWT → 存储到安全存储
- [ ] WebSocket 连接建立成功（含认证帧）
- [ ] WebSocket 断开后自动重连（指数退避）
- [ ] go_router 路由：/login、/home、/im/channel/:id
- [ ] Drift 数据库初始化成功

### 质量门禁

- [ ] `flutter analyze` 无 error
- [ ] `flutter test` 全部通过
- [ ] 无 `// TODO` 或占位代码残留

### 提交标准

- [ ] `feat(flutter): add Flutter project skeleton with auth, WebSocket, and routing`

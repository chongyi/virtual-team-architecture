# U-B1.3 用户认证、WebSocket 实时推送与多端同步

## 目标 (Goal)

在 `vt-collab-server` 中实现完整的用户认证（JWT 签发与验证）、WebSocket 连接管理（认证、连接池、房间订阅）、消息实时推送（message.created 事件广播）、多端同步（sequence-based replay），使得多个客户端可以实时收发消息并在断线重连后补拉遗漏消息。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-B1.2（消息模型、持久化与频道路由）
- 本单元属于：Phase 1 → G-B1（协作应用服务端） → 轨道 B → 接口/集成层

### 相关设计文档

- `virtual-team/src/04-collaboration-app/im-system.md`：WebSocket 通道体系、多端同步 sequence replay 机制、房间订阅模型
- `virtual-team/src/04-collaboration-app/technical-design/api-and-protocol.md`：WebSocket 消息帧格式（JSON）、REST 认证 API
- `virtual-team/src/04-collaboration-app/technical-design/sync-reliability-observability.md`：重连策略、离线消息补拉、幂等保证
- `virtual-team/src/04-collaboration-app/technical-design/data-and-permission-model.md`：用户认证与权限模型
- `virtual-team/src/12-security-and-isolation.md`：JWT 安全约束、tenant_id 在 token 中的传递

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/auth/mod.rs | create | 认证模块 |
| crates/collab-server/src/auth/jwt.rs | create | JWT 签发（login 成功返回 token）、验证中间件（从 Authorization header 提取） |
| crates/collab-server/src/auth/middleware.rs | create | AuthLayer（提取 user_id、tenant_id 注入到 request extensions） |
| crates/collab-server/src/ws/mod.rs | create | WebSocket 模块 |
| crates/collab-server/src/ws/connection.rs | create | WebSocket 连接管理（连接池、房间/频道订阅、用户 ↔ 连接映射） |
| crates/collab-server/src/ws/handler.rs | create | 消息处理：接收 WS 消息帧 → 调用 MessageService 持久化 → 广播给频道订阅者 |
| crates/collab-server/src/ws/protocol.rs | create | WS 消息帧定义（client→server: send_message、subscribe、sync_request；server→client: message_created、message_updated、sync_response） |
| crates/collab-server/src/sync/mod.rs | create | 同步模块 |
| crates/collab-server/src/sync/replay.rs | create | sequence-based 离线消息补拉（client 提供 last_sequence → server 返回 > last_sequence 的消息） |
| crates/collab-server/src/routes/auth.rs | create | REST 路由：POST /auth/login、POST /auth/register |
| crates/collab-server/src/routes/sync.rs | create | REST 路由：GET /sync/messages?channel_id=&since=&limit= |
| migrations/0004_users.sql | create | users 表（user_id、tenant_id、display_name、password_hash、created_at） |

### 协议边界

- 协议名称：协作应用层协议（`virtual-team/src/11-protocol-and-integration/app-layer-protocol.md`）
- 首次触及：否
- 本次涉及部分：WebSocket 消息帧格式（JSON frame）、认证流程（JWT in Authorization header）、sync replay 协议

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。

### 本单元特殊约束

1. **JWT 安全约束**：
   - JWT payload 含 `sub`（user_id）、`tenant_id`、`org_id`（可选）、`exp`、`iat`
   - JWT secret 从环境变量 `JWT_SECRET` 读取，绝不硬编码
   - Token 过期时间默认 24 小时，可配置
   - 中间件提取后注入 request extensions（`Extensions<AuthUser>`）
2. **WebSocket 连接管理**：
   - 连接建立后立即发送认证帧（client → server），含 JWT token
   - 认证失败 → 关闭连接（code 4001）
   - 认证成功后 client 发送 subscribe 帧（含 channel_ids）订阅频道
   - 连接池维护 `user_id → Vec<connection_id>` 映射（同一用户可多端连接）
3. **消息广播**：
   - 消息持久化成功后 → 广播 `message.created` 事件给该频道所有在线订阅者
   - 广播只发送消息摘要（message_id、channel_id、sender_id、sequence、content 摘要），不包含完整 markers
4. **多端同步**：
   - REST API `GET /api/v1/sync/messages?since={sequence}&channel_id=X` 返回 `since` 之后的消息
   - WebSocket 帧也支持 `sync_request` / `sync_response`
   - 客户端本地维护 `last_sequence` cursor，连接建立后自动请求补拉
5. **不在本单元实现**：消息编辑的广播（message_updated 事件逻辑类似，可简化处理）、群组/频道管理 WebSocket 通知

## 完成条件 (Done When)

### 必须满足

- [ ] `POST /api/v1/auth/register` 注册新用户（含 bcrypt 密码哈希）
- [ ] `POST /api/v1/auth/login` 验证凭据 → 返回 JWT token（含 user_id、tenant_id、exp）
- [ ] 所有消息/频道 API 加上 JWT 认证中间件，未认证请求返回 401
- [ ] WebSocket 路径 `/ws` 可升级连接
- [ ] WebSocket 认证流程：client 发送 `{type: "auth", token: "..."}` → server 验证 → 成功回复 `{type: "auth_ok"}` / 失败关闭连接
- [ ] WebSocket 消息发送流程：client 发送 `{type: "send_message", channel_id, content}` → server 持久化 → 广播 `{type: "message_created", message}` 给频道在线订阅者
- [ ] WebSocket 频道订阅：client 发送 `{type: "subscribe", channel_ids: [...]}` → server 注册订阅关系
- [ ] 同一频道内在线用户实时收到新消息广播
- [ ] `GET /api/v1/sync/messages?since={sequence}&channel_id=X` 返回指定 sequence 之后的消息（按 sequence ASC 排列）
- [ ] 多端登录：同一用户可建立多个 WebSocket 连接，每个连接独立收消息
- [ ] JWT secret 从环境变量读取，不硬编码

### 质量门禁

- [ ] 集成测试：用户注册 → 登录获取 token → 建立 WebSocket → 发送消息 → 另一个 WebSocket 连接收到广播
- [ ] 集成测试：离线期间有新消息 → 新连接上线 → sync API 补拉到遗漏消息
- [ ] 集成测试：未认证 WebSocket 连接发送消息被拒绝
- [ ] 集成测试：错误 JWT token 无法通过认证
- [ ] `cargo test -p vt-collab-server` 全部通过
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(collab): add JWT auth, WebSocket real-time messaging and multi-device sync`

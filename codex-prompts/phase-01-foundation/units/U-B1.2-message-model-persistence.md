# U-B1.2 消息模型、持久化与频道路由

## 目标 (Goal)

在 `vt-collab-server` 中实现 IM 系统的完整数据层：Block-based 消息结构体、Channel 频道模型、MessageStore trait + PostgreSQL 实现、消息 CRUD 与频道管理 API，使得消息可以正确发送、存储、软删除和按 sequence 分页查询。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-B1.1（协作应用服务端骨架）
- 本单元属于：Phase 1 → G-B1（协作应用服务端） → 轨道 B → 服务/逻辑层

### 相关设计文档

- `virtual-team/src/04-collaboration-app/im-system.md`：消息模型（Block-based content + JSONB markers）、频道/群组/群成员模型、消息 sequence 机制、多端同步原理
- `virtual-team/src/04-collaboration-app/technical-design/data-and-permission-model.md`：核心实体定义、权限决策路径、tenant_id 隔离
- `virtual-team/src/04-collaboration-app/technical-design/api-and-protocol.md`：消息 REST API 端点设计、请求/响应格式
- `virtual-team/src/04-collaboration-app/technical-design/server-architecture.md`：服务端分层（handler → service → store）

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/mod.rs | create | 数据模型模块 |
| crates/collab-server/src/models/message.rs | create | Message 结构体（message_id、channel_id、sender_id、tenant_id、content blocks、sequence、markers、status、client_request_id） |
| crates/collab-server/src/models/channel.rs | create | Channel 结构体（channel_id、type、name、org_id、tenant_id、member list） |
| crates/collab-server/src/models/user.rs | create | User 基本结构体（user_id、tenant_id、display_name） |
| crates/collab-server/src/store/mod.rs | create | Store 模块 |
| crates/collab-server/src/store/message.rs | create | MessageStore trait + PgMessageStore（sqlx 实现） |
| crates/collab-server/src/store/channel.rs | create | ChannelStore trait + PgChannelStore |
| crates/collab-server/src/service/message.rs | create | MessageService（消息发送、编辑、软删除、查询的业务逻辑） |
| crates/collab-server/src/service/channel.rs | create | ChannelService（成员验证、频道查询） |
| crates/collab-server/src/routes/message.rs | create | REST 路由：POST/DELETE /messages、GET /messages?channel_id=&before=&limit= |
| crates/collab-server/src/routes/channel.rs | create | REST 路由：GET /channels、POST /channels |
| migrations/0002_channels.sql | create | channels 表 DDL |
| migrations/0003_messages.sql | create | messages 表 DDL（含 sequence 自增、markers JSONB、content JSONB） |

### 协议边界

- 协议名称：协作应用层协议（`virtual-team/src/11-protocol-and-integration/app-layer-protocol.md`）
- 首次触及：否（在 U-B1.1 中已建立基础约定）
- 本次涉及部分：消息 CRUD 端点、请求/响应格式、sequence-based 分页

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。特别关注：
- 所有查询必须带 `tenant_id` 过滤
- sqlx 使用命名参数
- 库层使用 thiserror

### 本单元特殊约束

1. **消息模型**：
   - `content` 字段为 JSONB，存储 Block 数组 `[{type, text?, ...}]`
   - `markers` 字段为 JSONB 可空，存放 Agent 标记（intent、work_context_id、etc）
   - `sequence` 为 BIGINT，在 channel_id 范围内自增（用于多端同步 cursor）
   - `status` 枚举：`sent` / `edited` / `deleted`
   - `client_request_id` 为 UNIQUE 约束，用于幂等去重
2. **软删除**：DELETE 操作设置 `status = 'deleted'` + `deleted_at = now()`，不物理删除行
3. **幂等性**：相同 `client_request_id` 的重复请求返回已存在的消息（HTTP 200 + existing message），而非 409
4. **频道成员验证**：发消息前验证 sender 是 channel 成员，非成员返回 403（错误码 `CHANNEL_ACCESS_DENIED`）
5. **分页规范**：使用 `before` (sequence cursor) + `limit` (max 100, default 50) 参数，返回按 sequence DESC 排列的消息列表
6. **不在本单元实现**：WebSocket 实时推送（U-B1.3）、JWT 认证（U-B1.3）。本单元接口先不做认证校验，或使用简单的 header token placeholder。

## 完成条件 (Done When)

### 必须满足

- [ ] `cargo build -p vt-collab-server` 编译通过
- [ ] 消息发送 API `POST /api/v1/messages` 正确存储消息并返回 Message 对象（含生成的 message_id 和 sequence）
- [ ] 消息查询 API `GET /api/v1/messages?channel_id=X&before=N&limit=50` 正确分页
- [ ] 消息编辑 API `PUT /api/v1/messages/{id}` 更新 content 并将 status 改为 edited
- [ ] 消息删除 API `DELETE /api/v1/messages/{id}` 软删除（status=deleted），再次查询不返回
- [ ] `client_request_id` 幂等：重复提交相同 client_request_id 返回已存在的消息
- [ ] 频道成员验证：非成员发送消息返回 403
- [ ] 频道创建/查询 API 正常：`POST /api/v1/channels`、`GET /api/v1/channels`
- [ ] 迁移文件可执行：`sqlx migrate run` 创建 channels 和 messages 表
- [ ] messages 表含 tenant_id、channel_id、sequence（BIGINT 自增或应用层生成）、markers（JSONB nullable）、content（JSONB）、client_request_id（UNIQUE）

### 质量门禁

- [ ] 集成测试：消息发送 + 查询 + 编辑 + 删除的完整流程（使用 sqlx::test 或 testcontainers）
- [ ] 幂等性测试：两次相同 client_request_id 发送
- [ ] 频道成员验证测试：非成员发消息被拒绝
- [ ] `cargo test -p vt-collab-server` 全部通过
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 所有 Public API 结构体有 `///` 文档注释

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(collab): add message model, channel model, persistence layer and CRUD APIs`

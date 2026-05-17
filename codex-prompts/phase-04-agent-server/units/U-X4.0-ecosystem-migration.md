# U-X4.0 生态库迁移与基础设施升级

## 目标 (Goal)

在进入 Phase 4 新功能开发前，将 Phase 1-3 中使用的基础库升级为成熟生态组件：SeaORM 替代 raw SQL 迁移和手写查询、validator 替代手写校验、reqwest-middleware 为 HTTP 调用加重试能力、cached_network_image 和 flutter_markdown 优化 Flutter 端渲染。

## 上下文 (Context)

- 前置：Phase 3 全部单元完成
- 本单元属于：Phase 4 前置补充
- Phase 1-3 代码已稳定运行，本单元不破坏现有功能，只做增量升级

## 工作范围

### 1. SeaORM 集成（Rust 全 workspace）

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| Cargo.toml（workspace root） | modify | 添加 `sea-orm = "2.0.0-rc"` 到 workspace dependencies |
| migration/Cargo.toml | create | 新建 migration crate，依赖 sea-orm-migration |
| migration/src/lib.rs | create | Migrator 结构体，注册全部迁移 |
| migration/src/m20260517_100000_users.rs | create | users 表 SeaORM 迁移 + Entity |
| migration/src/m20260517_100001_channels.rs | create | channels + channel_members 迁移 + Entity |
| migration/src/m20260517_100002_messages.rs | create | messages + channel_sequences 迁移 + Entity |
| migration/src/m20260517_100003_reactions.rs | create | reactions 迁移 + Entity |
| migration/src/m20260517_100004_attachments.rs | create | attachments 迁移 + Entity |
| migration/src/m20260517_100005_orgs.rs | create | orgs + org_members 迁移 + Entity |
| migration/src/m20260517_100006_search.rs | create | messages search_vector FTS 迁移 |
| migration/src/main.rs | create | CLI 入口：`sea-orm-cli migrate up/down` |

**Entity 定义要求**：
- 使用 `#[derive(DeriveEntityModel)]` 宏，表名与现有 PG 表一致
- 每个 Entity 导出 `Entity`、`Model`、`Column` 类型
- Relation 定义：`Message → Channel`（belongs_to）、`Reaction → Message`、`OrgMember → Org`、`ChannelMember → Channel`
- 保留现有 `sqlx` 连接池，SeaORM 通过 `sea_orm::DatabaseConnection` 复用同一连接池

**迁移策略**：
- 新 migration 文件标记为 `#[sea_orm_migration::sea_orm_migration::async_trait::async_trait]`
- 每个迁移的 `up()` 使用 `SchemaBuilder` 或 `Table::create()` API
- 首次运行时检查表是否存在（IF NOT EXISTS），不破坏已有数据
- 后续 Phase 4-6 的新表全部走 SeaORM 迁移

### 2. Validator 集成（Rust）

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| Cargo.toml（workspace root） | modify | 添加 `validator = "0.20"` |
| crates/collab-server/src/models/*.rs | modify | 给请求体 struct 加 `#[derive(Validate)]`：NewChannel、SendMessageRequest、UpdateOrgRequest、InviteMemberRequest 等 |

### 3. Reqwest-middleware 集成（Rust）

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| Cargo.toml（workspace root） | modify | 添加 `reqwest-middleware`、`reqwest-retry` |
| crates/wen-client/src/*.rs | modify | 注册/心跳/事件 HTTP 调用改用 `reqwest_middleware::ClientBuilder` + `RetryTransientMiddleware`（最多 3 次重试，指数退避） |
| crates/agent-server/（后续创建） | — | Phase 4 新建 Agent Server 时直接用 reqwest-middleware |

### 4. Flutter 库升级

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/pubspec.yaml | modify | 添加 `cached_network_image`、`flutter_markdown` |
| apps/flutter/lib/features/im/presentation/widgets/message_bubble.dart | modify | 图片改用 `CachedNetworkImage`（带 placeholder + error widget）；富文本改用 `MarkdownBody` 替代手写正则解析 |
| apps/flutter/lib/features/im/presentation/widgets/image_preview.dart | modify | 预览页使用 `CachedNetworkImage` 原图缓存 |

## 约束 (Constraints)

- **不破坏现有测试**：所有 Phase 1-3 的 90+ 测试必须继续通过
- **SeaORM 与 sqlx 共存**：SeaORM 复用 sqlx 连接池，不重复创建
- **迁移幂等**：SeaORM 迁移使用 IF NOT EXISTS，可在已有数据库上安全运行
- **Flutter 库按需引入**：`cached_network_image` 和 `flutter_markdown` 仅在用到的地方 import

## 完成条件 (Done When)

- [ ] `cargo build` workspace 全量编译通过
- [ ] `sea-orm-cli migrate up` 在所有 Phase 1-3 表已存在的情况下幂等执行（不报错、不重建）
- [ ] 6 个 Entity 定义与现有表结构一致（列名、类型、约束）
- [ ] 现有 sqlx 查询继续工作（SeaORM 复用同一 PG 连接池）
- [ ] `validator` 对现有请求体 struct 的校验通过现有测试
- [ ] WEN 注册/心跳 HTTP 调用带重试（reqwest-middleware）
- [ ] Flutter 图片消息使用 CachedNetworkImage 渲染
- [ ] Flutter 消息文本使用 MarkdownBody 渲染
- [ ] `cargo test` 全量通过（90+ 测试）
- [ ] `flutter analyze` 无新增 error
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(ecosystem): migrate to SeaORM entities, validator, reqwest-middleware, cached_network_image, flutter_markdown`

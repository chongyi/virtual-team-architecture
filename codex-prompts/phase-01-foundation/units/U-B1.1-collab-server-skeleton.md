# U-B1.1 协作应用服务端骨架

## 目标 (Goal)

搭建 `vt-collab-server` crate 完整骨架，包括 axum HTTP server + WebSocket upgrade、PostgreSQL 连接池（sqlx）、Redis 连接、基础中间件链（tracing、correlation_id、request_id、CORS、timeout、rate-limit）、健康检查端点、migration 目录初始化，使得服务可启动并响应健康检查。

## 上下文 (Context)

### 前置条件

- 已完成单元：无（本单元为轨道 B 的起点）
- 本单元属于：Phase 1 → G-B1（协作应用服务端） → 轨道 B → 数据层/基础设施

### 相关设计文档

- `virtual-team/src/04-collaboration-app/technical-design/server-architecture.md`：服务端分层架构（handler → service → store）与模块组成
- `virtual-team/src/04-collaboration-app/technical-design/technology-selection.md`：Rust crate 选型（axum 0.8、sqlx 0.8、redis-rs、tokio）
- `virtual-team/src/04-collaboration-app/technical-design/api-and-protocol.md`：REST API 约定、WebSocket 协议、错误语义
- `virtual-team/src/development-standards/repository-structure.md`：monorepo workspace 结构、crate 命名
- `virtual-team/src/development-standards/code-conventions.md`：Rust 编码规范（tracing、错误处理、数据库访问）

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/Cargo.toml | create | 依赖：axum、tokio、sqlx、redis-rs、serde、tower、tower-http、utoipa、tracing |
| crates/collab-server/src/main.rs | create | 服务入口：启动 axum、连接 PG + Redis、注册路由 |
| crates/collab-server/src/lib.rs | create | `//!` 模块文档 + pub mod 声明 |
| crates/collab-server/src/config.rs | create | 配置加载（从 TOML 文件 + 环境变量覆盖） |
| crates/collab-server/src/middleware/mod.rs | create | 中间件模块 |
| crates/collab-server/src/middleware/tracing.rs | create | tracing span 注入（request_id、correlation_id） |
| crates/collab-server/src/middleware/request_id.rs | create | request_id 提取/生成中间件 |
| crates/collab-server/src/routes/mod.rs | create | 路由模块 |
| crates/collab-server/src/routes/health.rs | create | `GET /health` — 检查 PG、Redis 连通性 |
| crates/collab-server/src/db.rs | create | PostgreSQL 连接池初始化（sqlx::PgPool） |
| crates/collab-server/src/redis.rs | create | Redis 连接初始化（redis::aio::MultiplexedConnection） |
| crates/collab-server/README.md | create | Crate 文档 |
| configs/collab-server.example.toml | create | 配置模板（数据库 URL、Redis URL、JWT secret、端口等） |
| migrations/0001_init.sql | create | 初始迁移文件（空或仅 create extension） |
| docker-compose.yml | create | 或追加：PostgreSQL + Redis 开发环境 |

### 协议边界

- 协议名称：协作应用层协议（`virtual-team/src/11-protocol-and-integration/app-layer-protocol.md`）
- 首次触及：是
- 本次涉及部分：REST API 基础约定（JSON camelCase、错误响应格式）

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。

### 本单元特殊约束

1. **中间件顺序**：request_id → tracing/correlation_id → CORS → timeout（30s） → rate-limit（先占位，不做具体限流逻辑） → 路由
2. **配置加载**：使用 `config` crate 或 serde 直接解析 TOML，支持环境变量覆盖（`COLLAB_` 前缀）。配置文件不含密钥，所有密钥从环境变量读取。
3. **日志**：所有请求进入/离开打印 info 级别日志，包含 request_id、method、path、status、duration_ms。
4. **健康检查**：`GET /health` 返回 JSON `{"status": "ok", "postgres": "ok", "redis": "ok"}`。如果 PG 或 Redis 不可用，status 为 "degraded" 并返回 503。
5. **数据库迁移**：使用 `sqlx migrate`，迁移目录为 `migrations/`。初始迁移可创建 `_sqlx_migrations` 表或 `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`。
6. **不在本单元实现**：具体的业务路由（消息、频道、认证）——它们在 U-B1.2 和 U-B1.3 中实现。本单元只确保骨架可启动。

## 完成条件 (Done When)

### 必须满足

- [ ] `cargo run -p vt-collab-server` 启动后 `GET /health` 返回 200 + JSON 健康状态
- [ ] PostgreSQL 连接池初始化成功（sqlx::PgPool）
- [ ] Redis 连接初始化成功（redis::aio::MultiplexedConnection）
- [ ] 每个请求自动注入 `request_id`（从 `X-Request-ID` header 提取或生成 UUID v7）
- [ ] tracing span 包含 request_id、method、path
- [ ] response header 中返回 `X-Request-ID`
- [ ] 启动日志打印 端口号、PG 连接状态、Redis 连接状态
- [ ] PG 或 Redis 不可用时服务仍可启动（健康检查返回 degraded）
- [ ] `docker-compose.yml` 包含 PostgreSQL 15+ 和 Redis 7+ 的本地开发容器
- [ ] `migrations/` 目录存在并包含至少一个迁移文件

### 质量门禁

- [ ] `cargo build -p vt-collab-server` 编译通过无 warning
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] `cargo test -p vt-collab-server` 全部通过
- [ ] `lib.rs` 有 `//!` 模块文档
- [ ] README.md 说明启动方式、配置说明、健康检查端点

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(collab): add collab-server skeleton with axum, health check, PG/Redis connection`

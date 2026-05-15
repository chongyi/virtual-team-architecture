# Rust 后端技术栈调研

## 调研问题

协作应用后端使用 Rust，需要明确 Web 框架、异步运行时、数据库访问、缓存、对象存储、错误处理、API 文档、观测和测试等库的默认选择。

## 资料来源

- [Tokio documentation](https://tokio.rs/)
- [axum documentation](https://docs.rs/axum/latest/axum/)
- [Tower documentation](https://tower-rs.github.io/tower/tower/)
- [tower-http documentation](https://docs.rs/tower-http/latest/tower_http/)
- [SQLx documentation](https://docs.rs/sqlx/latest/sqlx/)
- [SQLx PostgreSQL](https://docs.rs/sqlx/latest/sqlx/postgres/)
- [redis-rs documentation](https://docs.rs/redis/latest/redis/)
- [Apache Arrow object_store crate](https://docs.rs/object_store/latest/object_store/)
- [serde documentation](https://serde.rs/)
- [thiserror documentation](https://docs.rs/thiserror/latest/thiserror/)
- [anyhow documentation](https://docs.rs/anyhow/latest/anyhow/)
- [tracing crate](https://docs.rs/tracing/latest/tracing/)
- [OpenTelemetry Rust](https://docs.rs/opentelemetry/latest/opentelemetry/)
- [utoipa documentation](https://docs.rs/utoipa/latest/utoipa/)
- [validator documentation](https://docs.rs/validator/latest/validator/)

## 关键结论

### tokio + axum + tower 是合适的 Web 基底

Tokio 是 Rust 异步生态的核心运行时；axum 基于 tower 生态，extractor、router、middleware 模型清晰；tower/tower-http 能统一 timeout、limit、trace、compression、CORS 等横切能力。

决策：

- 默认使用 tokio + axum。
- 所有入口层能力通过 tower/tower-http 或等价 layer 管理。

### sqlx 更符合当前数据建模方式

协作应用需要复杂查询、租户隔离、权限过滤、消息序列、outbox 和审计。SQL 优先能让查询边界和性能更可控。ORM 可以提升简单 CRUD 效率，但可能隐藏复杂查询和跨模块数据所有权。

决策：

- 默认使用 sqlx。
- 迁移使用 sqlx migrate 起步。
- 领域模块通过 repository trait 暴露访问能力，不让 SQL 泄漏到调用方。

### Rust 库优先不等于外部系统 Rust 优先

服务端应用代码优先 Rust 原生库，减少跨语言复杂度。但数据库、缓存、搜索、队列、对象存储、观测系统按成熟度和运维能力选择，不要求系统本身由 Rust 编写。

决策：

- Rust crate 用于服务端代码内的协议、适配器、客户端和中间件。
- 外部系统选择成熟设施，例如 PostgreSQL、Redis、OpenTelemetry Collector。

### 错误和观测需要从第一阶段进入框架

协作应用涉及用户、VE、Admin、系统任务和扩展动作。错误必须区分认证、权限、版本冲突、审批、依赖、可重试和不可重试；观测必须串联 request id 和 correlation id。

决策：

- 领域错误使用 thiserror。
- 边界层和任务上下文使用 anyhow。
- 日志和 trace 使用 tracing + OpenTelemetry。

## 风险

- 过早引入重 ORM 会弱化 SQL 可控性。
- 入口层缺少统一 middleware 会导致认证、限流、超时、追踪散落。
- 如果错误只用字符串，客户端和 VE 无法可靠判断重试、审批和权限行为。

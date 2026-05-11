# 后端扩容与拆分调研

## 调研问题

协作应用后端第一阶段不希望引入复杂微服务运维，但必须避免未来扩容时重写核心架构。本调研用于支撑“模块化单体优先、服务拆分预留”的后端技术方案。

## 资料来源

- [axum crate docs](https://docs.rs/axum/latest/axum/)
- [Tokio tutorial](https://tokio.rs/tokio)
- [Tower docs](https://tower-rs.github.io/tower/tower/)
- [SQLx PostgreSQL docs](https://docs.rs/sqlx/latest/sqlx/postgres/)
- [PostgreSQL NOTIFY](https://www.postgresql.org/docs/17/sql-notify.html)
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [Redis XREADGROUP](https://redis.io/docs/latest/commands/xreadgroup/)

## 关键结论

### Rust + tokio + axum 适合模块化单体起步

axum 强调路由、extractor、错误处理和 Tower middleware 生态；Tokio 是成熟异步运行时；Tower 的 Service / Layer 抽象适合统一 timeout、limit、trace、auth、load shedding 等横切能力。

决策：

- 保留 Rust + tokio + axum。
- HTTP/WS 入口统一经过 Tower middleware：认证、租户注入、限流、超时、追踪、请求体限制。
- 模块边界通过 Rust crate/module、trait 和领域事件表达，而不是一开始拆进程。

### PostgreSQL 可承载第一阶段权威数据和轻量通知，但不是完整消息队列

PostgreSQL `LISTEN/NOTIFY` 可用于简单进程间通知，但 payload 有限制，通知队列也不是完整持久化消息系统。可靠后台任务、跨服务事件和可重放事件不应只依赖 `NOTIFY`。

决策：

- 权威事件写入数据库 outbox 表。
- `NOTIFY` 只用于唤醒 worker 或轻量提示。
- Worker 从 outbox 拉取、处理、ack，并可重试。

### Redis Streams 可作为第一阶段任务队列/事件 fanout 方案

Redis Streams 支持 consumer group、pending entry、ack 和 message claiming，适合后台任务和多 worker 分摊处理。它不是权威业务数据源，不能替代 outbox。

决策：

- 第一阶段可以使用 PostgreSQL outbox + Redis Streams 的组合：
  - PostgreSQL outbox 保证事件与业务写入同事务。
  - Redis Streams 提供 worker fanout、消费组、重试和积压监控。
- 如果不引入 Redis Streams，也必须保留 outbox worker 模式，避免写路径直接调用所有下游。

### 服务拆分需要先冻结数据所有权和事件契约

未来拆服务时最难的不是把进程拆开，而是数据所有权、事务边界、幂等、事件重放、权限一致性和观测链路。

决策：

- 每个模块必须声明 owned tables、public API、domain events、background jobs、idempotency keys、metrics。
- 模块间不能直接读写私有表。
- 跨模块副作用使用 outbox/domain event。
- 拆分顺序按压力和独立性决定，不按目录结构机械拆分。

### 推荐拆分顺序

1. WebSocket Gateway：连接数和实时广播压力最早独立扩容。
2. Background Worker：搜索、通知、导出、清理、日程触发等异步任务先拆。
3. Search Service：索引和查询压力独立扩容。
4. Notification Service：移动推送、Web Push、桌面通知、聚合补偿独立化。
5. File Service：上传签名、缩略图、扫描、导出独立扩容。
6. Admin API：内部管理端高风险操作与用户流量隔离。
7. Agent Adapter：Agent Server 连接和 VE 事件压力独立隔离。

## 风险

- 如果第一阶段为了快而允许跨模块直接查表，未来拆分成本会指数上升。
- 如果没有 outbox，搜索、通知、Agent 转发失败会污染用户写路径。
- 如果没有幂等键，重试和断线恢复会产生重复消息、重复通知和重复工具对象。
- 如果管理端 API 与用户端 API 混用，权限和审计边界会变得难以证明。

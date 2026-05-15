# 技术选型与配套设施

## 定位

本文冻结协作应用基础版的技术选型口径。它只定义“第一阶段默认方案、候选方案、替换条件和不做什么”，不锁死具体版本号，也不替代后续实现阶段的依赖审计和性能测试。

选型原则：

- **云中立优先**：生产设施使用 PostgreSQL、Redis、S3-compatible、OpenTelemetry Collector 等通用能力描述，不直接绑定特定云厂商。
- **Rust 生态优先**：服务端代码库优先使用成熟 Rust 生态；外部系统按成熟度、运维成本和团队能力选择，不为了语言一致性强选 Rust 实现。
- **服务端权威**：本地缓存、搜索索引、队列和通知都是派生或辅助能力，权威数据仍在服务端业务存储。
- **默认可替换**：每个默认选型都必须有替换条件，避免第一阶段方案成为长期技术债。

## 外部基础设施矩阵

| 能力 | 第一阶段默认 | 候选方案 | 替换条件 | 不做什么 |
|------|--------------|----------|----------|----------|
| 关系型数据库 | PostgreSQL 15+ | 云托管 PostgreSQL、兼容 PostgreSQL 的托管数据库 | 数据规模、HA、备份或运维能力要求提升 | 不把 MySQL 作为默认，不把 NoSQL 作为权威业务库 |
| 缓存与在线状态 | Redis 7+ | Valkey、托管 Redis | 成本、许可证、托管能力或兼容性变化 | 不把 Redis 当权威业务存储 |
| 任务/事件分发 | PostgreSQL outbox + Redis Streams | NATS JetStream、Kafka、RabbitMQ | 事件吞吐、跨服务订阅、保留期和重放需求显著提升 | 不让 Redis Streams 替代 outbox 的权威事件 |
| 对象存储 | S3-compatible object storage | AWS S3、Cloudflare R2、MinIO、阿里云 OSS、GCS S3 兼容层 | 云厂商、成本、区域、合规和 CDN 策略确定 | 不把附件或导出文件存入 PostgreSQL 主库 |
| 搜索 | PostgreSQL FTS + pg_trgm | Meilisearch、Typesense、OpenSearch/Elasticsearch | 查询体验、索引规模、排序、拼写纠错或多语言搜索超出 PostgreSQL 能力 | 不让搜索索引成为权威数据源 |
| 可观测性 | OpenTelemetry Collector + Prometheus/Grafana/Loki/Tempo 或等价组合 | 云厂商 APM、Datadog、New Relic | 团队采购、运维能力或合规要求明确 | 不让日志、指标、追踪各自孤立 |
| 推送 | APNs、FCM、Web Push | 第三方聚合推送服务 | 多云、多地区、到达率或运营能力要求提升 | 不把推送 payload 当权威消息 |
| 密钥与配置 | 云中立 Secret 管理抽象 | Vault、云厂商 Secret Manager、SOPS + KMS | 合规、轮换、审计和部署平台确定 | 不把密钥写入仓库、镜像或普通配置文件 |
| CI/CD | GitHub Actions 或等价 CI + 平台构建流水线 | GitLab CI、Buildkite、云厂商流水线 | 仓库托管和发布平台确定 | 不把移动端签名密钥散落到开发机 |

### 本地开发设施

本地开发推荐使用：

- PostgreSQL。
- Redis。
- MinIO 或其他 S3-compatible 本地对象存储。
- OpenTelemetry Collector + Grafana stack 的最小组合。
- 邮件、短信、推送在本地使用 mock adapter。

本地设施必须遵守与生产一致的接口边界，例如对象存储只通过 File Service 访问，事件副作用只通过 outbox/worker 触发。

## 后端 Rust 库选型

| 能力 | 默认库 | 候选方案 | 选型理由 |
|------|--------|----------|----------|
| 异步运行时 | `tokio` | async-std | Rust 服务端事实标准，生态覆盖 axum、sqlx、redis 等核心库 |
| HTTP/Web 框架 | `axum` | actix-web、poem | 与 tower 生态契合，extractor/middleware 模型清晰 |
| 中间件 | `tower`、`tower-http` | axum 自定义 middleware | timeout、limit、trace、cors、compression 等横切能力统一 |
| 数据库访问 | `sqlx` | SeaORM、Diesel | SQL 优先、编译期检查、迁移支持，适合复杂查询和边界清晰的数据所有权 |
| 迁移 | `sqlx migrate` | refinery | 与 sqlx 工具链一致，第一阶段降低工具复杂度 |
| Redis | `redis-rs` | deadpool-redis、fred | 生态成熟，支持异步连接；连接池可按压测结果补充 |
| 对象存储 | `object_store` + S3-compatible adapter | AWS SDK for Rust、云厂商 SDK | 抽象 S3、本地和其他对象存储，利于云中立 |
| 序列化 | `serde`、`serde_json` | simd-json | Rust 标准序列化生态，协议和配置统一 |
| 错误处理 | `thiserror` + 边界层 `anyhow` | miette | 领域错误可枚举，边界层保留上下文 |
| 日志/追踪 | `tracing`、`tracing-subscriber`、OpenTelemetry exporter | log + env_logger | 结构化日志和 trace span 是基础要求 |
| API 文档 | `utoipa` | paperclip、手写 OpenAPI | 可从 Rust 类型生成 OpenAPI，降低文档漂移 |
| 输入校验 | `validator` 或领域手写校验 | garde | 简单 DTO 用库，复杂业务规则放领域层 |
| 鉴权/JWT | `jsonwebtoken` + 自有 Auth Service | biscuit、paseto | 第一阶段满足 JWT，后续可评估 PASETO 或企业 SSO |
| 时间 | `time` 或 `chrono` | 只用 std time | 协议时间、审计、日程需要稳定时间处理 |
| 测试 | `tokio::test`、`insta`、testcontainers-rs | cargo-nextest | 按模块风险补充快照、集成测试和容器化依赖测试 |

### Rust 选型边界

- 外部系统不强求 Rust 实现。例如 PostgreSQL、Redis、OpenTelemetry Collector、对象存储和搜索服务按成熟度选择。
- 服务端核心业务代码优先 Rust 原生库，减少跨语言运行时和 FFI。
- 数据库访问采用 SQL 优先，避免 ORM 抽象隐藏复杂权限、租户隔离和查询性能。
- 每个外部依赖必须由 adapter 封装，业务模块不得直接依赖云厂商 SDK。

## Flutter 客户端库选型

| 能力 | 默认库 | 候选方案 | 选型理由 |
|------|--------|----------|----------|
| 状态管理 | Riverpod | Bloc、provider | 适合跨端共享状态、依赖注入和可测试 provider |
| 本地数据库 | Drift + SQLite | sqflite、isar | 类型安全 SQL、迁移、测试友好，适合消息和对象缓存 |
| 安全存储 | flutter_secure_storage 或平台封装 | 自研平台通道 | token 和敏感凭据进入平台安全存储 |
| HTTP | Dio | package:http | 拦截器、取消、上传进度、重试封装更适合复杂客户端 |
| WebSocket | web_socket_channel | socket_io_client | 标准 WebSocket，避免引入非必要协议 |
| 推送 | firebase_messaging + APNs/FCM 配置 | 原生平台通道、第三方推送聚合 | 移动端主流通道，后续可用 adapter 替换 |
| 路由 | go_router | auto_route | 与 Flutter 官方生态接近，适合深链和多端路由 |
| 文件选择 | file_picker + 平台 adapter | 原生平台通道 | 覆盖桌面、移动、Web 文件选择差异 |
| 本地通知 | flutter_local_notifications | 平台通道 | 支持前台提示和本地提醒 |
| 测试 | flutter_test、integration_test、mocktail | patrol | 第一阶段覆盖 widget、provider、关键集成流程 |

### 客户端选型边界

- Riverpod 管应用状态和依赖注入，不承担持久化职责。
- Drift/SQLite 管本地缓存，不是权威数据源。
- Web 端受浏览器存储限制，不能假设 Drift/SQLite 能提供与 Desktop 等同的缓存能力。
- 推送只作为提醒和唤醒线索，打开应用后仍通过同步协议补拉权威数据。

## React 管理端库选型

| 能力 | 默认库 | 候选方案 | 选型理由 |
|------|--------|----------|----------|
| 构建工具 | Vite | Rsbuild、Next.js | 管理端第一阶段是内部 SPA，不需要 SSR 复杂度 |
| UI 框架 | React + TypeScript | Vue、Svelte | 团队生态和后台组件生态成熟 |
| 路由 | React Router 7 | TanStack Router | 路由守卫、嵌套路由、数据加载能力成熟 |
| 样式 | Tailwind CSS | CSS Modules、vanilla-extract | 与 shadcn/ui 契合，适合统一后台设计系统 |
| 组件 | shadcn/ui | Ant Design、MUI | 组件源码进入项目，可定制且不被黑盒主题锁定 |
| 客户端 UI 状态 | Zustand | Jotai、Redux Toolkit | 轻量，适合筛选条件、布局偏好、临时选择 |
| 服务端状态 | TanStack Query | SWR、React Router loaders only | 分页、缓存、重试、失效、后台刷新能力完整 |
| 表格 | TanStack Table | AG Grid | 基础后台表格默认轻量，超大数据/企业表格再评估 AG Grid |
| 表单 | React Hook Form | Formik | 与 schema 校验生态配合好，性能和控制粒度适合后台 |
| 校验 | Zod | Valibot、Yup | schema 可复用，适合 API DTO 和表单校验 |
| 图表 | Recharts 或 ECharts | Nivo | 第一阶段运营图表简单；复杂大屏再单独评估 |
| 测试 | Vitest、Testing Library、Playwright | Cypress | 单元、组件和关键后台流程覆盖 |

### 管理端选型边界

- Zustand 只保存客户端 UI 状态，不保存服务端权威数据。
- TanStack Query 管服务端状态，不绕过 Admin API 直接访问用户端 API。
- shadcn/ui 是源码化组件体系，不作为不可修改的黑盒组件库。
- 复杂 BI、报表和超大表格可以后续引入专业组件，不进入基础版默认。

## 搜索与队列迁移条件

### 搜索迁移

第一阶段默认 PostgreSQL FTS + pg_trgm。满足任一条件时评估专用搜索服务：

- 搜索索引数据量或查询 QPS 明显影响主库。
- 需要更强的中文分词、拼写纠错、排序、聚合、同义词或跨对象召回。
- 管理端和用户端搜索体验要求明显分化。
- 搜索索引重建时间影响发布或运维。

候选顺序：

1. Meilisearch / Typesense：更轻量，适合产品搜索体验快速提升。
2. OpenSearch / Elasticsearch：更重，但适合复杂聚合、日志和大规模搜索。

### 队列迁移

第一阶段默认 PostgreSQL outbox + Redis Streams。满足任一条件时评估 NATS JetStream 或 Kafka：

- Redis Streams 积压和消费组管理无法满足跨服务重放和保留需求。
- 事件吞吐超过 Redis 运维舒适区。
- 多个独立服务需要长期订阅、回放和 schema 管理。
- 事件成为跨系统集成主干。

无论迁移到哪种消息系统，业务写入与 outbox 事件写入同事务的原则不变。

## 不做什么

- 不把 PostgreSQL、Redis、S3 这类外部系统和 Rust crate 混为一类。
- 不因服务端使用 Rust 而强行选择 Rust 实现的数据库、搜索或队列系统。
- 不让 Redis Streams 成为权威事件源。
- 不让管理端 Zustand 保存服务端权威数据。
- 不把 Flutter 本地缓存当作离线权威数据库。
- 不在基础版锁死具体云厂商。

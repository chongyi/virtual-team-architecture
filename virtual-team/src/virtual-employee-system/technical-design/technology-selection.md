# 虚拟员工系统技术选型

## 实际 Crate 结构

VE 系统的 VTA Runtime 已实现为 15 个 Rust crate 的 workspace，位于 `crates/` 下：

| 层 | crate | 职责 |
|----|-------|------|
| **核心模型** | `runtime-core` | 领域类型（Session、Turn、Message、Part、AgentProfile）、ID 类型、事件、核心 trait |
| **存储** | `runtime-store` | Store trait（MessageStore、EventStore、ApprovalStore、SkillStore） |
| | `runtime-store-memory` | 内存存储实现（测试/Phase 1） |
| | `runtime-store-sqlite` | SQLite 存储实现（Phase 3 sea-orm 后端） |
| | `runtime-store-sqlite-migration` | SQLite 数据库迁移 |
| **推理** | `runtime-inference` | 推理管线：Composer → Renderer → Projector → Backend |
| | `runtime-inference-rig` | Rig 后端的 LLM 适配（支持 18+ provider） |
| **工具** | `runtime-tools` | 工具注册表、ToolSpec、可见性过滤 |
| | `runtime-skills` | 技能系统、Skill 模型与注册表 |
| | `runtime-mcp` | MCP 客户端、stdio/SSE/HTTP 传输 |
| | `runtime-plugins` | 插件系统、运行时 patch 注入 |
| **协议** | `runtime-protocol` | JSON-RPC 2.0 协议类型（纯模型，不包含 server） |
| **编排** | `runtime-kernel` | Session/Turn 生命周期、审批、事件总线 |
| | `runtime-agent` | AgentLoop、PromptManager、ToolBridge |
| | `runtime-host` | 组合根、配置、生命周期管理 |

## 选型分层

| 层级 | 范围 | 说明 |
|------|------|------|
| **系统设施** | PostgreSQL、Redis、S3 | 与协作应用共享基础设施 |
| **服务端库** | Rust crate（tokio、axum、sqlx 等） | 服务端代码直接依赖 |
| **VTA 专属** | Model provider SDK、MCP 库、存储后端 | VTA Runtime 特有 |

系统设施已在[协作应用技术选型](../../04-collaboration-app/technical-design/technology-selection.md)中统一说明。本文重点覆盖 VTA 和 Agent 服务器专属的库选型。

## VTA Runtime 内部 crate 选型

| 组件 | 默认方案 | 候选方案 | 选择理由 |
|------|---------|---------|---------|
| **异步运行时** | tokio | — | 与 axum 生态一致，协作应用同栈 |
| **HTTP 客户端** | reqwest | ureq | tokio 原生 async，连接池，TLS 原生支持 |
| **JSON-RPC** | `serde_json` + 自研轻量协议 | jsonrpsee | 内部协议栈简单，无需完整的 client/server framework |
| **Prompt 模板** | handlebars | tera | Rust 原生，零依赖，适合简单模板（HBS 配置包不涉及复杂模板逻辑） |
| **LLM API client** | `async-openai` + Anthropic 官方 SDK | 自研统一 HTTP client | 优先使用官方或主流 SDK；远期如多 provider 需求增加，可自研统一适配层 |
| **SQLite** | `rusqlite` | `sqlx-sqlite` | VTA Session 和 Message 本地存储优先 SQLite；rusqlite 更底层、更适合嵌入式场景 |
| **PostgreSQL** | `sqlx` | `diesel` | 与协作应用服务端一致，命名参数查询 |
| **MCP 工具集成** | `mcp-rs` | 自研 MCP client | 优先使用现有 Rust MCP 生态 |
| **沙箱** | `bubblewrap` (Linux) / OS 原生隔离 | Docker SDK | 进程级隔离优先 OS 原生机制；容器级隔离远期引入 |
| **配置包解析** | `toml` + `serde` | — | Rust 生态标准 |

## 模型提供商

### 三类别模型选择

VTA 定义三类模型选择维度，基础版先锁定每个类别的默认模型：

| 类别 | 默认模型 | 候选模型 | 选择理由 |
|------|---------|---------|---------|
| **Cheap（低成本）** | Claude Haiku 4.5 | GPT-4o-mini | 意图识别、简单分类、低延迟 |
| **Balanced（均衡）** | Claude Sonnet 4.6 | GPT-4.1 | 主 Agent 日常推理、文档生成、代码分析 |
| **Powerful（高性能）** | Claude Opus 4.7 | GPT-4.5 Preview | 复杂分析、关键决策、助理型 VE |

### Provider SDK 集成

- **Anthropic**：优先使用 `async-openai` 兼容接口（Anthropic 已兼容 OpenAI API 格式），或 Anthropic 官方 Rust SDK 候选
- **OpenAI**：使用 `async-openai` crate
- 所有 LLM 调用通过统一的 `ModelSelector` trait 分发，不直接硬编码 provider

```rust
#[async_trait]
trait ModelProvider: Send + Sync {
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse, ModelError>;
    fn model_id(&self) -> &str;
    fn category(&self) -> ModelCategory;
}
```

## 存储后端

### 存储分层

| 数据 | 后端 | 位置 | 说明 |
|------|------|------|------|
| VTA Session / Message | SQLite | VE Runner 本地 | 单 VE 的对话历史，随 Runner 生命周期 |
| VE 注册表 / Runtime 状态 | PostgreSQL | Agent 服务器 | 全局注册、租户路由、Quota |
| Runtime Config & Data | PostgreSQL（JSONB） | Agent 服务器 | 结构化 + 灵活字段混合 |
| 消息队列 | Redis Streams | Agent 服务器 | 接入层与管理服务解耦 |
| 审计日志 | PostgreSQL（hypertable） | Agent 服务器 | 不可变，按时间分区 |

### SQLite vs PostgreSQL 边界

VTA Session 和 Message 使用 SQLite（VE Runner 本地），原因是：
- 低延迟——不需要跨网络查询
- 离线容错——LLM API 不可用时 Session 仍然可读
- VE Runner 崩溃后，SQLite 文件可用于恢复

全局数据（注册表、Runtime 状态、路由表、Config/Data）使用 PostgreSQL，原因是：
- 管理服务无状态 → 需要共享数据库做状态中转
- 多租户查询天然需要 `WHERE tenant_id`
- 与协作应用基础设施共享

## MCP 生态选型

| 组件 | 默认方案 | 候选方案 | 说明 |
|------|---------|---------|------|
| MCP client (Rust) | `mcp-rs` | 自研 | 优先使用社区生态 |
| MCP transport | stdio + HTTP | WebSocket | stdio 用于本地子进程，HTTP 用于远程 sidecar |
| MCP tool discovery | 启动时注册 + 心跳 | 动态发现 | WEN 注册时声明可用 MCP server 列表 |

## 沙箱方案

| 级别 | 实现方式 | 依赖 | 说明 |
|------|---------|------|------|
| **None** | 宿主机直接执行 | 无 | 开发/测试，完全信任 |
| **Process** | OS UID/GID 隔离 + 文件系统权限 | `nix` crate (Linux) / 原生 API (macOS) | 生产默认级别 |
| **Container** | Docker/Podman API | `bollard` (Docker SDK for Rust) 或 shell-out | 远期，不可信代码执行 |

基础版只实现 Process 级别的文件系统隔离和 UID/GID 隔离。Container 级别属于完整形态方向。

## 不做事项

- 不引入 gRPC 或 Protobuf。VE 内部协议使用 JSON-RPC 2.0 over WebSocket/stdio。
- 不引入 Kafka / RabbitMQ。基础版使用 Redis Streams 满足消息队列需求。
- 不引入分布式事务框架。跨服务状态一致性通过幂等 + 重试 + 审计保证。
- 不在基础版实现多模型 provider 的自动 failover。降级链在 VTA 层手动选择。
- 不引入 Rust 以外的服务端语言。VE 系统全线 Rust。
- 不锁定具体的 LLM 模型版本号。模型版本锁定进入实现阶段根据 provider 可用性决定。

# Virtual Team —— 项目全局上下文

> 本文件是所有 Codex 计划单元的固定项目背景。
> 每天启动 Codex goal 模式时，将本文件作为前置上下文载入，再加载当日单元 prompt。

---

## 零、环境初始化（每次启动必读）

> **在开始任何工作前，按顺序执行以下三步：**

### 第一步：读取环境配置

读取 `.env-context` 获取所有路径变量、模型配置、基础设施配置。该文件被 `.gitignore` 忽略，不提交。

| 变量 | 含义 |
|------|------|
| `PROJECT_MONO_REPO` | monorepo 代码仓库（当前工作目录） |
| `ARCHITECTURE_REPO` | 架构设计文档仓库 |
| `DEEPSEEK_API_KEY` | 测试模型 API 密钥 |
| `DEEPSEEK_BASE_URL` | API 端点 |
| `CHEAP_MODEL` | 低成本快速模型（意图识别等） |
| `POWERFUL_MODEL` | 强推理模型（主 Agent） |
| `POSTGRES_*` / `REDIS_*` / `MINIO_*` | 本地基础设施连接信息 |

### 第二步：执行前置检查

读取 `PREFLIGHT.md`，按当前 Phase 逐项验证环境。缺什么报什么，不跳过。

### 第三步：确定 LLM 策略

- **API 密钥可用** → 使用真实模型（`.env-context` 中配置的 deepseek 模型）
- **API 密钥不可用** → 使用 Mock LLM Backend，commit 末尾加 `[MOCK-LLM]` 标记
- Mock 通过的单元视为功能流体验证通过，注入真实 key 后需重新跑一次 E2E 确认

### 路径解析规则

1. **设计文档路径**：单元 prompt 中"相关设计文档"引用的路径，按以下规则拼接：
   - 以 `virtual-team/src/` 开头 → 直接拼 `{ARCHITECTURE_REPO}/{路径}`
   - 不以 `virtual-team/src/` 开头（如 `04-collaboration-app/...`、`08-vte-agent-internals/...` 等短路径）→ 拼 `{ARCHITECTURE_REPO}/virtual-team/src/{路径}`

2. **代码路径**：本文件中所有以 `crates/`、`apps/`、`configs/`、`migrations/`、`docker/` 开头的路径，以及所有单元 prompt 中"工作范围"表格列出的文件路径，均为相对于 `PROJECT_MONO_REPO`（即工作目录）的路径。

3. **绝对路径禁止**：所有提示词文件中不硬编码本机绝对路径。任何需要绝对路径的地方使用上述变量。

---

## 一、项目是什么

Virtual Team 是一个 **AI Agent 应用平台**，面向非技术用户。核心理念：将真实世界公司的人员、组织、工具映射为虚拟世界中的 AI Agent、虚拟组织和协作工具。

系统分为两大子系统：

### 子系统一：协作应用（VTC — Virtual Team Collaboration）
- 独立的即时通讯与协作系统（类似 Slack/飞书）
- **用户入口**：用户不直接操作 VE，而是通过协作应用与 VE 交互
- 可独立运行：Agent 服务器不可用时，IM、组织管理、协作工具核心功能不受影响
- 技术栈：Flutter（客户端）+ Rust（服务端）+ React（管理端）

### 子系统二：虚拟员工系统（VE System）
- Agent 运行时核心
- 管理 VE 生命周期、路由消息、调度执行
- 通过冻结协议与协作应用通信，不共享数据库、不共享进程
- 含三个核心组件：
  - **VTA Runtime**：Agent 推理基座（Pure Agent 骨架）
  - **Agent 服务器**：接入层 + VE 管理服务 + 调度
  - **工作环境节点（WEN）**：远程工具承载（沙盒执行环境）

---

## 二、核心原则

1. **独立应用优先**：协作应用不是 Agent Server 的 UI 附属品。Agent Server 不可用时，协作应用核心功能（登录、IM、组织管理）保持可用。
2. **Pure Agent 骨架**：VTA Runtime 零预设 prompt、零内置工具、零默认技能。所有能力通过配置包注入。
3. **核心与扩展分离**：协作工具通过 Extension Manifest + Tool Action Gateway 注册，不绕过核心权限。
4. **服务端权威**：本地缓存、搜索索引、队列和通知都是派生或辅助能力，权威数据在服务端业务存储。
5. **独立运行，协议对接**：VE 系统不共享数据库、不共享进程。通过冻结的协议通信。
6. **配置包驱动**：VE 的全部能力（prompt、工具、权限、模型）通过文件式配置包注入；运行时本身零预设。
7. **Tenant = 用户级**：每个用户是一个独立租户（tenant），组织（org）是租户内的管理单元。

---

## 三、三轨并行架构

三条轨道从 Phase 1 起完全并行启动，无相互依赖：

| 轨道 | 内容 | 技术栈 |
|------|------|--------|
| **轨道 A**：Agent 核心链 | VTA Runtime → Agent 服务器 → VE 封装层 | Rust workspace（`vta-*` 前缀） |
| **轨道 B**：协作应用 | IM 服务端 → Flutter 前端 → 组织管理 → VE 集成 → 协作工具 | Rust + Flutter + React |
| **轨道 C**：工作环境客户端 | 节点注册 → 工具能力 → VE 绑定 → 高级特性 | Rust（`wen-client`） |

### 各轨道阶段

**轨道 A（Agent 核心链）**：A1 VTA 最小 MVP → A2 结构收敛 → A3 完整对话 → A4 Agent 服务器 → A5 VE 封装层 → A6 高级特性

**轨道 B（协作应用）**：B1 服务端 → B2 前端基础 → B3 组织管理 → B4 VE 集成（需 A4） → B5 协作工具集（需 A5） → B6 全平台

**轨道 C（工作环境）**：C1 客户端骨架 → C2 工具能力 → C3 VE 绑定（需 A4） → C4 高级特性

### 关键集成点
- **集成点 1（M4）**：A4 + B4 + C3 → 首次三方集成（用户发消息 → VE 处理 → 工具执行 → 回复）
- **集成点 2（M5）**：A5 + B5 → 内测版（完整 VE 行为 + 基础协作工具）

---

## 四、协议边界

四条已冻结的协议边界，所有跨边界通信必须遵守：

| 协议层 | 通信方 | 协议 | 冻结文档 |
|--------|--------|------|---------|
| 协作应用层协议 | Flutter 客户端 ↔ 协作应用服务端 | WebSocket + REST | `virtual-team/src/11-protocol-and-integration/app-layer-protocol.md` |
| 对接协议 | 协作应用服务端 ↔ Agent 服务器 | JSON-RPC 2.0 + REST | `virtual-team/src/11-protocol-and-integration/integration-protocol.md` |
| 内部协议 | Agent 服务器 ↔ VE Runner ↔ WEN | JSON-RPC 2.0 | `virtual-team/src/11-protocol-and-integration/internal-protocol.md` |
| VTA trait 接口 | VE Runner ↔ VTA Runtime | Rust trait | `virtual-team/src/virtual-employee-system/technical-design/api-and-protocol.md` |

---

## 五、核心数据流：用户 → VE

```
用户（Flutter 客户端）
  → 输入消息
  → 协作应用服务端（持久化消息，构建上下文数据段）
  → 对接协议（JSON-RPC 2.0）
  → Agent 服务器（定位 VE Runtime，投递到意图识别 Agent）
  → 意图识别 Agent（分析意图，创建/关联工作上下文）
  → 主 Agent（推理 → 工具调用（经 WEN）/ 回复生成）
  → Agent 服务器（回复回传）
  → 协作应用服务端（markers 回写，消息广播）
  → 客户端显示
```

---

## 六、三层概念模型

| 层级 | 概念 | 说明 |
|------|------|------|
| **账户层** | User（用户） | 个人账号，认证主体 |
| **隔离层** | Tenant（租户） | 数据空间边界，计费单元。所有 SQL 查询按 `tenant_id` 过滤 |
| **业务层** | Organization（组织） | 租户内的树形结构，人员与资源的管理单元 |
| | VE Instance（虚拟员工实例） | 配置包定义的静态"基因"（prompt、工具、权限、模型） |
| | VE Runtime（虚拟员工运行时） | 一个 Instance 在一个 Tenant 中的一次"上岗" |
| | Work Context（工作上下文） | 任务级独立工作空间，支持 New/Fork/Resume |
| | Work Environment Node | 工具执行沙盒环境 |

---

## 七、技术选型总表

| 组件 | 方案 | 备注 |
|------|------|------|
| 异步运行时 | tokio | Rust 异步标准 |
| HTTP 框架 | axum | 基于 tower 的模块化框架 |
| 数据库 | PostgreSQL 15+ | 业务数据（sqlx 驱动，无 ORM） |
| 会话存储 | SQLite | VTA Session 级别（非业务数据） |
| 缓存 | Redis 7+ | 会话状态、在线状态、速率限制 |
| 对象存储 | S3-compatible（MinIO/AWS S3） | 文件、图片、附件 |
| 序列化 | serde + serde_json | snake_case ↔ camelCase |
| 错误处理 | thiserror（库层）+ anyhow（边界层） | 库 API 不返回 anyhow::Error |
| 日志/追踪 | tracing | 结构化日志，非 log crate |
| 鉴权 | jsonwebtoken | JWT 签发与验证 |
| MCP 集成 | mcp-rs | Model Context Protocol |
| LLM SDK | async-openai + Anthropic SDK | 多模型供应商 |
| 沙箱 | bubblewrap (Linux) / OS 原生 (macOS) | 进程与文件系统隔离 |
| Prompt 模板 | handlebars | 配置包中的 prompt 模板引擎 |
| Flutter 状态管理 | Riverpod | 统一状态管理方案 |
| Flutter 本地存储 | Drift + SQLite | 离线缓存 |
| Flutter 路由 | go_router | 声明式路由 |
| 管理端 | Vite + React + TypeScript + shadcn/ui | 独立 Web 应用 |
| 管理端数据请求 | TanStack Query | 服务端状态管理 |

---

## 八、Rust Workspace 结构

```
crates/
  vta/                      # VTA Agent Runtime workspace
    core/                   #   核心 trait 定义（vta-core）
    store/                  #   Store trait（vta-store）
    store-memory/           #   内存后端实现（vta-store-memory）
    store-sqlite/           #   SQLite 后端实现（vta-store-sqlite）
    inference/              #   推理管线（vta-inference）
    inference-rig/          #   Rig LLM 后端
    tools/                  #   工具注册表（vta-tools）
    skills/                 #   技能系统（vta-skills）
    mcp/                    #   MCP 集成（vta-mcp）
    kernel/                 #   Session/Turn 生命周期（vta-kernel）
    agent/                  #   AgentLoop（vta-agent）
    host/                   #   组合根（vta-host）
  collab-server/            # 协作应用服务端
  agent-server/             # Agent 服务器
  wen-client/               # 工作环境客户端
  shared/                   # 公共类型与工具
    protocol/               #   协议类型定义（共享）
    error/                  #   统一错误类型
    id/                     #   ID 前缀与生成
```

### Crate 命名约定
- `vt-` 前缀：Virtual Team 全平台公共组件
- `vta-` 前缀：VTA Agent Runtime 专属组件

### Cargo.toml 规范
- 每个 crate 独立 `Cargo.toml`，workspace root 声明成员
- 版本号由 workspace root `[workspace.package]` 统一管理
- 依赖版本在 workspace root `[workspace.dependencies]` 统一声明
- 公共 API crate 必须含 `README.md`

---

## 九、全局约束

### Rust 约束
1. 库层使用 `thiserror` 定义结构化错误枚举，应用边界使用 `anyhow::Result`
2. 所有公共 trait 和函数必须有 `///` 文档注释
3. `pub` 模块必须有 `//!` 模块级文档
4. 文档使用中文，技术术语保留英文
5. JSON 字段：Rust 侧 `snake_case`，通过 `#[serde(rename_all = "camelCase")]` 映射
6. 使用 `tracing` crate 进行结构化日志（非 `log`）
7. 跨服务请求必须携带 `correlation_id`
8. 数据库访问使用 `sqlx`，不使用 ORM；查询用命名参数（非 `$1`）
9. 所有查询必须带 `tenant_id` 过滤
10. 迁移文件按 `V{seq}__{description}.sql` 命名

### Flutter 约束
1. 状态管理使用 Riverpod
2. Repository 模式：Provider 通过 Repository 接口获取数据
3. 平台差异通过 `PlatformCapabilities` 抽象层处理（禁止在功能模块中直接用 `dart:io` 判断）
4. 路由使用 `go_router`，定义集中在 `lib/app/routes.dart`
5. 路由路径格式：`/{feature}/{subfeature}`（如 `/im/channel/:id`）

### 架构约束
1. 基础版不承诺：实时多人协同编辑、公式引擎、第三方插件市场
2. VTA 核心 trait 接口必须保持最小化——只定义推理循环必需的抽象
3. 静态配置包与动态 Runtime Config/Data 严格分离
4. 所有错误路径：用户可见错误有可理解的中文消息；内部错误不泄露给用户
5. 所有降级行为必须在可观测性指标中可见
6. 协作工具通过 Tool Action Gateway + Extension Manifest 注册，不绕过核心权限

### Commit 约束

- **每个单元完成后必须立即创建一条 commit**，不允许跨单元合并提交
- 格式：`<type>(<scope>): <description>`
- type：`feat` / `fix` / `refactor` / `docs` / `test` / `chore`
- scope：`collab` / `vta` / `agent-server` / `wen` / `protocol` / `flutter` / `admin`
- 示例：`feat(vta): add RuntimeKernel trait with Session/Turn lifecycle methods`

---

## 十、架构文档索引

| 领域 | 路径（相对于 `virtual-team/src/`） |
|------|------|
| 项目总览 | `00-overview.md`、`01-project-vision.md`、`02-core-concepts.md` |
| 系统架构 | `03-system-architecture.md` |
| 协作应用总览 | `04-collaboration-app/overview.md` |
| 协作应用架构 | `04-collaboration-app/architecture.md` |
| IM 系统 | `04-collaboration-app/im-system.md` |
| 上下文增强 | `04-collaboration-app/context-enhancement.md` |
| 协作工具总览 | `04-collaboration-app/collaboration-tools/overview.md` |
| 协作工具详情 | `04-collaboration-app/collaboration-tools/` 下各文件 |
| 协作应用客户端架构 | `04-collaboration-app/technical-design/client-architecture.md` |
| 协作应用服务端架构 | `04-collaboration-app/technical-design/server-architecture.md` |
| 协作应用技术选型 | `04-collaboration-app/technical-design/technology-selection.md` |
| 协作应用 API 与协议 | `04-collaboration-app/technical-design/api-and-protocol.md` |
| 协作应用数据模型 | `04-collaboration-app/technical-design/data-and-permission-model.md` |
| 协作应用同步与可观测性 | `04-collaboration-app/technical-design/sync-reliability-observability.md` |
| 协作应用管理控制台 | `04-collaboration-app/technical-design/admin-console.md` |
| VE 系统总览 | `05-virtual-employee-system.md` |
| 消息与工作上下文 | `06-message-and-work-context.md` |
| Agent 服务器 | `07-agent-server.md` |
| VTA Agent 架构 | `08-vte-agent-internals/agent-architecture.md` |
| VTA 执行循环 | `08-vte-agent-internals/execution-loop.md` |
| VTA 消息模型 | `08-vte-agent-internals/message-model.md` |
| VTA 工具系统 | `08-vte-agent-internals/tool-system.md` |
| VTA 技能系统 | `08-vte-agent-internals/skills-system.md` |
| VTA 压缩与上下文管理 | `08-vte-agent-internals/compaction-and-context.md` |
| VTA 配置包 | `08-vte-agent-internals/config-package.md` |
| VTA 运行时配置与数据 | `08-vte-agent-internals/runtime-config-and-data.md` |
| VTA 可观测性与韧性 | `08-vte-agent-internals/observability-and-resilience.md` |
| 工作环境节点 | `09-work-environment-node.md` |
| 租户与组织模型 | `10-tenant-and-org-model.md` |
| 应用层协议 | `11-protocol-and-integration/app-layer-protocol.md` |
| 对接协议 | `11-protocol-and-integration/integration-protocol.md` |
| 内部协议 | `11-protocol-and-integration/internal-protocol.md` |
| 安全与隔离 | `12-security-and-isolation.md` |
| 商业化 | `13-commercialization.md` |
| 路标 | `14-roadmap.md` |
| 词汇表 | `15-glossary.md` |
| VE 技术选型 | `virtual-employee-system/technical-design/technology-selection.md` |
| VE API 与协议 | `virtual-employee-system/technical-design/api-and-protocol.md` |
| VE 数据模型 | `virtual-employee-system/technical-design/data-and-permission-model.md` |
| VE 可靠性与可观测性 | `virtual-employee-system/technical-design/reliability-and-observability.md` |
| 开发规范：仓库结构 | `development-standards/repository-structure.md` |
| 开发规范：代码规范 | `development-standards/code-conventions.md` |
| 技术规格：数据模型 | `16-technical-specs/data-model-reference.md` |
| 技术规格：非功能需求 | `16-technical-specs/non-functional-requirements.md` |
| 技术规格：可观测性 | `16-technical-specs/observability.md` |
| 技术规格：错误处理 | `16-technical-specs/error-handling.md` |
| 技术规格：部署架构 | `16-technical-specs/deployment-architecture.md` |

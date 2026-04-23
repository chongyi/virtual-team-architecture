# VTA vs Awaken 全维度对比

> 基于 VTA 实际代码（`/Users/chongyi/Projects/tosimpletech/virtual-teams/virtual-teams-agent/dev/`）与 Awaken v0.2.1 源码（`/Users/chongyi/Projects/tosimpletech/jisi-project/agent-sdk-origin-references/awaken/awaken-v0.2.1/`）的对照分析
> 仓库地址：https://github.com/awakenworks/awaken

---

## 1. 项目基础信息对比

| 维度 | VTA | Awaken |
|------|-----|--------|
| **全称** | Virtual Teams Agent | Awaken |
| **定位** | Pure Agent 运行时骨架 | Production AI agent runtime |
| **语言** | Rust | Rust |
| **Rust Edition** | 2024 | 2024 |
| **版本** | 0.1.0（未发布） | 0.2.2-dev（已发布） |
| **许可证** | MIT | MIT OR Apache-2.0 |
| **发布状态** | `publish = false` | crates.io 可安装（`awaken-agent`） |
| **代码行数** | ~41,613 行 Rust | 估计 5-10 万行（含 examples、admin console、e2e） |
| **Crate 数** | 13 个 runtime-* crate | 14+（含 7 个 ext-* 插件） |
| **unsafe 策略** | 未明确禁止 | 整个 workspace `forbid(unsafe_code)` |

---

## 2. Crate 结构映射

### 2.1 分层对照表

| VTA Crate | 职责 | Awaken 对应 Crate | 职责对照 |
|-----------|------|-------------------|----------|
| `runtime-core` | 领域模型、强类型 ID、事件体系、核心 trait | `awaken-contract` | 共享契约：specs、tools、events、transport、state model |
| `runtime-kernel` | Session/Turn 生命周期、事件广播、审批状态 | `awaken-runtime` (部分) | Agent 生命周期、mailbox、状态管理 |
| `runtime-agent` | 推理循环、PromptManager、tool loop | `awaken-runtime` (核心) | 9 阶段 phase engine、loop runner |
| `runtime-host` | 运行时装配、生命周期协调 | `awaken` facade + `awaken-server` (部分) | Facade 聚合 + server 启动 |
| `runtime-store` | 持久化抽象 | `awaken-stores` (部分) | 存储 trait 定义 |
| `runtime-store-memory` | 内存存储实现 | `awaken-stores` (memory.rs) | 内存存储 |
| `runtime-store-sqlite` | SQLite 存储实现 | `awaken-stores` (sqlite_*.rs) | SQLite 存储 |
| `runtime-inference` | 推理抽象 | `awaken-contract` (inference.rs) | 推理 trait 定义 |
| `runtime-inference-rig` | Rig 后端实现 | 无直接对应 | Awaken 使用自有 provider 客户端 |
| `runtime-tools` | 工具抽象与注册 | `awaken-contract` (tool.rs) | 工具 trait 与描述 |
| `runtime-skills` | 技能声明与注册 | `awaken-ext-skills` | Skills 插件 |
| `runtime-mcp` | MCP 集成（基于 rmcp） | `awaken-ext-mcp` | MCP 插件 |
| `runtime-plugins` | 插件系统集成 | `awaken-runtime` (plugins/) | 插件生命周期 |
| `runtime-protocol` | 对外协议模型 | `awaken-server` (protocols/) | 协议适配器 |
| 无直接对应 | 无 | `awaken-server` | HTTP 路由、mailbox、SSE 传输 |
| 无直接对应 | 无 | `apps/admin-console` | 管理控制台 |
| 无直接对应 | 无 | `awaken-ext-observability` | OpenTelemetry 插件 |
| 无直接对应 | 无 | `awaken-ext-permission` | 权限插件 |
| 无直接对应 | 无 | `awaken-ext-reminder` | Reminder 插件 |
| 无直接对应 | 无 | `awaken-ext-generative-ui` | Generative UI 插件 |
| 无直接对应 | 无 | `awaken-ext-deferred-tools` | Deferred Tools 插件 |
| 无直接对应 | 无 | `awaken-protocol-a2a` | A2A 协议实现 |

### 2.2 架构分层对比

```
VTA 架构：
┌─────────────────────────────────────────────┐
│  host-cli / host-daemon（入口，规划中）        │
├─────────────────────────────────────────────┤
│  runtime-host（唯一装配入口）                  │
├─────────────────────────────────────────────┤
│  runtime-agent（推理循环）                     │
├─────────────────────────────────────────────┤
│  runtime-kernel（会话生命周期）                │
├─────────────────────────────────────────────┤
│  runtime-core（领域模型与契约）                │
├─────────────────────────────────────────────┤
│  runtime-store + backends（持久化）           │
│  runtime-inference + rig（推理）              │
│  runtime-tools / runtime-skills / runtime-mcp │
│  runtime-plugins / runtime-protocol           │
└─────────────────────────────────────────────┘

Awaken 架构：
┌─────────────────────────────────────────────┐
│  examples / apps/admin-console               │
├─────────────────────────────────────────────┤
│  awaken（Facade）                            │
├─────────────────────────────────────────────┤
│  awaken-server（路由、mailbox、协议适配）      │
├─────────────────────────────────────────────┤
│  awaken-runtime（9 阶段引擎、loop runner）     │
├─────────────────────────────────────────────┤
│  awaken-contract（共享契约）                  │
├─────────────────────────────────────────────┤
│  awaken-stores（存储实现）                    │
│  awaken-tool-pattern（工具匹配）              │
│  awaken-ext-*（7 个官方插件）                  │
│  awaken-protocol-a2a（A2A 协议）              │
└─────────────────────────────────────────────┘
```

---

## 3. 核心能力矩阵

### 3.1 运行时能力

| 能力 | VTA | Awaken | 说明 |
|------|-----|--------|------|
| Agent Loop | ✅ `runtime-agent` | ✅ 9 阶段 phase engine | VTA 分离 kernel/agent；Awaken 统一在 runtime |
| Tool Call 循环 | ✅ | ✅ | 两者均支持 |
| MCP 集成 | ✅ `runtime-mcp` (rmcp) | ✅ `awaken-ext-mcp` | VTA 基于 rmcp；Awaken 自有实现 |
| 插件系统 | ✅ `runtime-plugins` | ✅ 7+ 官方插件 | Awaken 插件生态更成熟 |
| 多 Provider 支持 | ✅ 18+ (via rig) | ✅ 多 provider | VTA 通过 rig；Awaken 自有客户端 |
| 流式响应 | ✅ | ✅ | 两者均支持 |
| 后台运行 | ❌ 未规划 | ✅ Mailbox + BackgroundTaskPlugin | Awaken 独有 |
| 审批/挂起 | ✅ 模型有，待实现 | ✅ ToolGateHook + SuspendTicket | Awaken 生产级实现 |
| 取消/中断 | ✅ `CancellationToken` | ✅ CancellationToken + remote abort | 两者均有 |

### 3.2 状态与存储

| 能力 | VTA | Awaken | 说明 |
|------|-----|--------|------|
| 事件溯源 | ✅ `RuntimeEvent` | ✅ `AgentEvent` | 两者均支持 |
| 消息工作轨 | ✅ 设计中 (Message/Part) | ✅ `Message` / `ThreadRunStore` | VTA Phase 2-3 实现 |
| 持久化存储 | ✅ SQLite + Memory | ✅ SQLite/PostgreSQL/File/Memory | Awaken 更多后端 |
| 状态原子提交 | ❌ 逐事件追加 | ✅ Gather → Commit | Awaken 更强 |
| 三层作用域 | ❌ Session/Turn 两级 | ✅ run/thread/profile | Awaken 更细粒度 |
| Mailbox | ❌ 无 | ✅ SQLite/NATS/Memory | Awaken 独有 |

### 3.3 协议与服务

| 能力 | VTA | Awaken | 说明 |
|------|-----|--------|------|
| JSON-RPC | ✅ 规划中 | ✅ MCP JSON-RPC | VTA Phase 3-4 |
| WebSocket | ✅ 规划中 | ✅ | VTA Phase 4 |
| stdio | ✅ 规划中 | ✅ ACP stdio | VTA Phase 4 |
| AI SDK v6 | ❌ 未规划 | ✅ | Awaken 独有 |
| AG-UI/CopilotKit | ❌ 未规划 | ✅ | Awaken 独有 |
| A2A | ❌ 未规划 | ✅ `awaken-protocol-a2a` | Awaken 独有 |
| HTTP/SSE Run API | ❌ 未规划 | ✅ | Awaken 独有 |
| Admin Console | ❌ 未规划 | ✅ `apps/admin-console` | Awaken 独有 |

### 3.4 Prompt 与配置

| 能力 | VTA | Awaken | 说明 |
|------|-----|--------|------|
| Prompt 配置包 | ✅ 文件式 (manifest.toml + hbs) | ❌ 无 | VTA 独有 |
| 配置 API | ❌ 未规划 | ✅ `/v1/config/*` | Awaken 独有 |
| 管理界面 | ❌ 未规划 | ✅ Admin Console | Awaken 独有 |
| 热更新 | ✅ 规划中 | ✅ | 两者均有 |
| Scene 路由 | ✅ `SceneId` | ❌ 无 | VTA 独有 |
| 模型降级 | ✅ 设计中 | ✅ fallback models | 两者均有 |

### 3.5 可观测性与控制

| 能力 | VTA | Awaken | 说明 |
|------|-----|--------|------|
| OpenTelemetry | ❌ 未规划 | ✅ `ext-observability` | Awaken 独有 |
| 熔断器 | ❌ 未规划 | ✅ `engine/circuit_breaker.rs` | Awaken 独有 |
| 重试机制 | ❌ 未规划 | ✅ `engine/retry.rs` | Awaken 独有 |
| SSE 回放 | ❌ 未规划 | ✅ `transport/replay_buffer.rs` | Awaken 独有 |
| 结构化日志 | ✅ tracing | ✅ tracing + OTel | Awaken 更强 |

### 3.6 Agent 编排

| 能力 | VTA | Awaken | 说明 |
|------|-----|--------|------|
| Sub-agent | ✅ 规划中 (独立 Session + parent) | ✅ `AgentTool` | Awaken 仅支持 Awaken Agent |
| 外部 Agent 调度 | ✅ 规划中 (ClaudeCode/Codex等) | ❌ 不支持 | VTA 独有 |
| Agent 切换 | ❌ 未规划 | ✅ `HandoffPlugin` | Awaken 独有 |
| 动态 overlay | ❌ 未规划 | ✅ `AgentOverlay` | Awaken 独有 |

### 3.7 商业与生态

| 能力 | VTA | Awaken | 说明 |
|------|-----|--------|------|
| 租户隔离 | ✅ 规划中 | ❌ 无 | VTA 独有 |
| SLA 监控 | ✅ 规划中 | ❌ 无 | VTA 独有 |
| 开放平台 | ✅ 规划中 | ❌ 无 | VTA 独有 |
| SDK 客户端 | ❌ 未规划 | ✅ AI SDK v6 适配 | Awaken 独有 |

---

## 4. 数据模型对比

### 4.1 会话模型

| 维度 | VTA | Awaken |
|------|-----|--------|
| **核心实体** | `Session` + `Turn` | `Thread` + `Run` |
| **Session 字段** | id, profile_id, status, persistent_context, active_skills, defaults, model_state, metadata, created_at, updated_at, closed_at | id, created_at, title, archived_at, directory, roots, agent_id, provider_id, model_id |
| **父子关系** | `parent_session_id` + `parent_turn_id`（设计中） | `BackendParentContext`（parent_run_id, parent_thread_id, parent_tool_call_id） |
| **生命周期** | Open → Turn 创建 → Running → Complete/Fail → Closed | Active → Running → Waiting → Complete/Error |

### 4.2 消息模型

| 维度 | VTA（设计中） | Awaken |
|------|---------------|--------|
| **核心实体** | `Message` + `Part` | `Message` |
| **Message 字段** | id, session_id, turn_id, role, parts, metadata, created_at | id, role, content, tool_calls, tool_results |
| **Part 类型** | Text, Reasoning, ToolCall, ToolResult, Image, CompactionSummary | 无 Part 拆分 |
| **工作轨** | MessageStore（可替换） | ThreadRunStore（持久化） |
| **审计轨** | EventStore（不可变） | EventStore + JSONL 日志 |

### 4.3 工具模型

| 维度 | VTA | Awaken |
|------|-----|--------|
| **核心实体** | `ToolSpec` + `ToolRef` | `ToolDescriptor` + `Tool` trait |
| **来源** | BuiltIn / Mcp / Plugin | BuiltIn / MCP / Frontend / Plugin |
| **挂起机制** | 尚未实现 | `SuspendTicket` + `FrontEndTool` |
| **可见性控制** | `visible_tools` 冻结快照 | `ToolGate` + 权限插件 |

---

## 5. 架构哲学差异

### 5.1 "框架 vs 骨架"

| 维度 | Awaken | VTA |
|------|--------|-----|
| **开箱即用程度** | 高。内置默认行为、预设插件、示例项目 | 零。所有能力需通过配置/插件注入 |
| **预设 prompt** | 有（通过 Config API 管理） | 无（通过配置包注入） |
| **预设 tools** | 有（FrontEndTool、工具匹配等） | 无（纯注册表，无内置工具） |
| **预设 skills** | 有（Skills 插件默认行为） | 无（纯声明层） |
| **类比** | Django（全功能 Web 框架） | Flask/Werkzeug（最小化骨架） |

### 5.2 配置管理哲学

| 维度 | Awaken | VTA |
|------|--------|-----|
| **配置形式** | Schema-backed JSON Config API + Admin Console | 文件式配置包（manifest.toml + hbs 模板） |
| **管理界面** | Admin Console（可视化编辑） | 无（或后期补充） |
| **版本控制** | 运行时数据库版本 | Git 版本控制 |
| **热更新** | 通过 Config API | 文件监听 reload |
| **目标用户** | 运营人员、非技术人员 | 开发者、配置工程师 |

### 5.3 Agent 编排哲学

| 维度 | Awaken | VTA |
|------|--------|-----|
| **子 Agent 范围** | 仅支持 A2A 协议的 Awaken Agent | 计划支持任意第三方 Agent |
| **调度能力** | 本地 Agent + A2A 远程 Agent | Master-Slave + 外部工具 Agent |
| **外部集成** | 无（封闭生态） | 开放（ClaudeCode、Codex、OpenCode 等） |
| **生态策略** | 自包含 | 开放生态 |

### 5.4 状态管理哲学

| 维度 | Awaken | VTA |
|------|--------|-----|
| **状态模型** | StateKey 绑定 Rust 类型，run/thread/profile 三层 | Session/Turn + persistent context |
| **变更方式** | 原子提交（Gather → Commit） | 逐事件追加 |
| **一致性保证** | 强（原子 commit） | 弱（事件ual consistency） |
| **回滚能力** | 有（commit 失败回滚） | 无（事件不可变） |

---

## 6. 代码质量与工程实践对比

| 维度 | VTA | Awaken |
|------|-----|--------|
| **文档** | 中文 crate 级文档（详细） | 英文 + 中文 README，GitHub Pages |
| **测试** | 单元测试（各 crate tests/） | e2e/ + 单元测试 + 集成测试矩阵 |
| **示例** | `phase1_manual.rs`、`github_trending_deepseek.rs` | ai-sdk-starter、copilotkit-starter、openui-chat |
| **CI/CD** | 未核实 | lefthook.yml（git hooks） |
| **代码格式化** | 未核实 | rustfmt.toml |
| **unsafe 使用** | 未明确禁止 | 整个 workspace `forbid(unsafe_code)` |
| **发布流程** | `publish = false` | crates.io 自动发布 |
| **社区** | 内部项目 | 开源社区（GitHub Stars 待增长） |

---

## 7. 关键发现汇总

### 7.1 高度重叠领域（同一赛道）

- Rust 优先的生产级 Agent Runtime
- 工具抽象 + MCP 集成 + 插件扩展
- 会话/运行生命周期管理
- 事件驱动架构
- 多 Provider LLM 支持
- 持久化存储（SQLite/Memory）

### 7.2 架构路线分歧（核心差异）

- **框架 vs 骨架**：Awaken 开箱即用，VTA 零预设
- **配置 API vs 配置包**：Awaken 走管理界面路线，VTA 走文件包路线
- **封闭 vs 开放**：Awaken 仅支持自身生态，VTA 计划支持任意第三方 Agent
- **原子提交 vs 事件溯源**：Awaken 强一致性，VTA 审计优先

### 7.3 能力互补领域

- Awaken 成熟而 VTA 缺失：多协议服务端、Admin Console、OpenTelemetry、生产控制路径
- VTA 设计而 Awaken 缺失：Prompt 配置包、租户隔离、外部 Agent 调度、开放平台

# 战略建议与实施路径

> 基于 VTA 与 Awaken 的全维度对比分析，为 VTA 演进提供具体可执行的战略建议
> Awaken 仓库：https://github.com/awakenworks/awaken

---

## 1. 核心决策：VTA 与 Awaken 的关系定位

### 1.1 关系定位声明

**VTA 不是 Awaken 的分支，也不是 Awaken 的上层框架。VTA 是 Awaken 的"平行竞争者"，但在不同维度上各有优劣。**

建议采取 **"独立演进 + 选择性借鉴"** 策略：

| 策略项 | 具体内容 |
|--------|---------|
| **不 fork、不依赖** | 保持 VTA 代码库完全独立，不引入 `awaken-*` crate 作为依赖 |
| **阅读即消化** | 将 Awaken 作为"设计参考书"，阅读其源码理解实现思路后，用自己的 trait 体系重写 |
| **高 ROI 移植** | 多协议适配器、OpenTelemetry 插件、生产控制路径（mailbox/retry/circuit-breaker）的设计可直接参考 |
| **保持差异化** | Pure Agent 骨架、Prompt 配置包、租户隔离、外部 Agent 调度、远程工具执行协议，这些是核心竞争力，必须自研 |

### 1.2 类比说明

| 项目 | 类比 | 特征 |
|------|------|------|
| **Awaken** | Django | 全功能框架，开箱即用，内置 Admin、ORM、Auth |
| **VTA** | Flask + Werkzeug + 自定义中间件栈 | 原子化、可组合、面向特定生态 |

Awaken 适合"我要快速搭一个 Agent 服务"，VTA 适合"我要在一个受控、可审计、可隔离的环境中构建一个像人一样的虚拟员工，并且它能使用各种外部工具和其他 Agent"。

---

## 2. 分层特性清单（必须实现的核心特性）

基于与项目负责人的讨论，VTA 的定位被明确为 **Pure Agent 运行时骨架**（零预设 prompt、零内置 tools、零默认 skills）。虚拟员工是基于 VTA 的高阶应用层封装。

以下特性按 **P0 生存级 → P1 虚拟员工级 → P2 商业级 → P3 生态级** 分层，标注与 Awaken 的关系和实现策略。

### 2.1 P0 — 生存级（没有这些 VTA 就不存在）

| # | 特性 | 必要性说明 | 与 Awaken 关系 | 实现策略 |
|---|------|-----------|---------------|---------|
| 1 | **Pure Agent 运行时骨架** | 零预设 prompt、零内置 tools、零默认 skills。VTA 启动时是一个"空壳"，所有能力通过配置/插件注入 | 与 Awaken 哲学相反 | **必须自研** |
| 2 | **Trait 驱动的全插件体系** | Tools、MCP、Skills、Inference、Storage、Compaction 全部通过 trait 注入，host 组装 | 概念相似，接口设计不同 | **自研** |
| 3 | **配置包加载机制** | 文件式配置包（manifest.toml + 模板文件），支持版本、热更新、多包并存 | 与 Awaken Config API 路线不同 | **自研** |
| 4 | **Agent Loop（推理 + Tool 循环）** | `runtime-agent` 驱动完整 loop：prompt → inference → parse → tool call → result → loop | Awaken 有 9 阶段引擎 | **保持自研**，VTA kernel/agent 分离已验证可行 |
| 5 | **Session/Turn 生命周期** | Kernel 负责创建、状态校验、事件追加、完成/失败收尾 | Awaken 有类似概念 | **保持自研** |
| 6 | **多 Provider 推理抽象** | `runtime-inference` trait + rig 后端，支持 18+ provider | 已基于 rig 实现 | **保持** |

**P0 实施状态**：Phase 1 已实现 4/6（Agent Loop、Session/Turn、多 Provider、基础插件体系），配置包和 Pure Agent 空性验证需 Phase 2-3 完善。

### 2.2 P1 — 虚拟员工级（没有这些就不存在"虚拟员工"）

| # | 特性 | 必要性说明 | 与 Awaken 关系 | 实现策略 |
|---|------|-----------|---------------|---------|
| 7 | **Agent 编排 / Sub-agent 委派** | Master Agent 根据配置/prompt 动态创建 Slave/Sub Agent，独立 Session + parent 链接 | Awaken 有 `AgentTool`（仅支持 Awaken Agent） | **扩展自研**：支持任意第三方 Agent |
| 8 | **外部 Agent 调度协议** | 调度非 VTA 的第三方 Agent（ClaudeCode、Codex、OpenCode 等），通过标准协议或适配器集成 | **Awaken 完全没有** | **必须自研** |
| 9 | **远程工具执行协议** | 工具不在服务端运行，通过协议联络用户本地环境或云环境，结果回传 | Awaken `FrontEndTool` 概念相似但场景不同 | **重新设计** |
| 10 | **审批 / HITL 机制** | Tool call 前用户确认、敏感操作审批、审批结果影响 loop 继续 | Awaken 有 permission 插件和 decision 机制 | **可参考设计，自研实现** |
| 11 | **事件溯源 + 消息双轨** | Events（审计轨，不可变）+ Messages（工作轨，compaction 可替换） | Awaken 有 transcript/event | **自研** |
| 12 | **多协议服务端** | JSON-RPC over WebSocket/stdio，未来扩展 AI SDK v6、AG-UI、A2A | Awaken `awaken-server` 已实现 5 种协议 | **借鉴设计，自研实现** |

**P1 实施状态**：设计中（Phase 2-3），外部 Agent 调度和远程工具执行协议需提前定义接口。

### 2.3 P2 — 商业级（没有这些就不存在"商业虚拟员工"）

| # | 特性 | 必要性说明 | 与 Awaken 关系 | 实现策略 |
|---|------|-----------|---------------|---------|
| 13 | **租户隔离** | 独立上下文、数据体系、配置空间。商业版本每个客户数据完全隔离 | **Awaken 完全没有** | **必须自研** |
| 14 | **SLA 监控 / 可观测性** | OpenTelemetry + GenAI Semantic Conventions，按 session/turn 追踪延迟、成本、成功率 | Awaken `ext-observability` 已实现 | **借鉴设计，自研实现** |
| 15 | **长上下文压缩（Compaction）** | `CompactionStrategy` trait，支持 Full/Partial/SlidingWindow，可用独立轻量模型 | Awaken 有 truncation/summarizer | **自研** |
| 16 | **后台任务 / 定时任务** | 虚拟员工在"离线"时仍可执行定时任务、异步工作流 | Awaken `BackgroundTaskPlugin` + mailbox 已实现 | **借鉴设计，自研实现** |
| 17 | **模型路由（SceneId）** | MainLoop / Scene(动态) / SmallFast 三类别，按任务类型路由不同模型 | **Awaken 无 Scene 概念** | **自研** |
| 18 | **生产控制路径** | 重试、降级模型、熔断器、SSE 回放、取消/中断 | Awaken 已实现 | **借鉴设计，自研实现** |

**P2 实施状态**：规划中（Phase 4-5），租户隔离需 Phase 3 预留数据模型字段。

### 2.4 P3 — 生态级（开放平台 / 应用商店）

| # | 特性 | 必要性说明 | 与 Awaken 关系 | 实现策略 |
|---|------|-----------|---------------|---------|
| 19 | **开放接入协议** | 第三方开发者可将自己开发的 Agent（符合协议）接入 VT 系统 | **Awaken 完全没有** | **必须自研** |
| 20 | **Admin Console / 管理界面** | 运营人员管理虚拟员工、查看会话、调整配置 | Awaken `apps/admin-console` 已存在 | **参考 UI 设计，适配配置包模型** |
| 21 | **SDK / Client 库** | 降低开发者接入门槛（JS/TS、Python、Go 等） | Awaken 有 AI SDK v6 适配 | **自研 VT 专用 SDK** |

**P3 实施状态**：远期规划（Phase 5+）。

---

## 3. Frozen-Plan 调整建议

基于 Awaken 调研，建议对现有 frozen-plan 做以下调整：

### 3.1 Phase 1（当前）调整

**保持现有目标不变**：本地 loop、tool call、MCP、chrome-devtools 示例

**新增关注点**：
- [ ] 验证 `runtime-agent` 作为 Pure Agent 的"空性"——确保它不依赖任何预设 prompt 或内置 tool 也能正确组装和运行
- [ ] 在 `runtime-core` 中预留 `tenant_id` 字段（即使 Phase 1 单租户，也要为后续商业版本预留）

### 3.2 Phase 2 调整

**保持**：MessageStore、PromptManager 最小配置包

**新增（从 P1 提前）**：
- [ ] **外部 Agent 调度协议的接口设计**：定义 `ExternalAgentDispatcher` trait，明确 Master 如何发现、创建、调度第三方 Agent
- [ ] **远程工具执行的 trait 边界**：定义 `RemoteToolExecutor` trait，即使 Phase 2 只有本地 mock 实现，也要先定义接口

**参考 Awaken**：
- [ ] 阅读 `awaken-runtime/src/extensions/a2a/` 的 `AgentTool` 设计，理解其 local/remote 委派模式，作为 VTA 外部 Agent 调度的参考
- [ ] 阅读 `awaken-contract/src/contract/tool.rs` 的 `FrontEndTool` 挂起机制，作为远程工具执行的参考

### 3.3 Phase 3 调整

**保持**：审批 continuation、多轮对话、SQLite MessageStore、Protocol Handler

**新增**：
- [ ] **租户隔离的数据模型扩展**：`Session`/`Store` 中预留 `tenant_id` 字段，Store 查询默认带 tenant 过滤
- [ ] **Protocol Handler 参考 Awaken**：将 `awaken-server/src/protocols/` 的某个适配器（如 MCP JSON-RPC）作为参考，在 VTA `runtime-host` 中实现等效原型

**建议执行移植实验**：
> **实验目标**：将 Awaken 的 `awaken-server/src/protocols/mcp/` 作为参考，在 VTA `runtime-host` 中实现一个最小 MCP JSON-RPC Protocol Handler 原型。
> **预期产出**：
> 1. 验证 Awaken 的协议适配思路是否与 VTA 的 `runtime-protocol` + `runtime-host` 架构兼容
> 2. 评估"借鉴设计后重写"与"从零自研"的效率差异
> 3. 形成一份《Awaken 协议适配层移植指南》
> **时间预算**：1-2 天

### 3.4 Phase 4-5 调整

**保持**：compaction、sub-agent、transport

**新增（从 Awaken 借鉴）**：
- [ ] **后台任务机制**：参考 `awaken-runtime/src/extensions/background/`，在 VTA 中实现 `BackgroundTaskPlugin`
- [ ] **OpenTelemetry 可观测性**：参考 `awaken-ext-observability/`，在 VTA 中实现 `runtime-observability` crate
- [ ] **生产控制路径**：参考 `awaken-runtime/src/engine/` 的 retry、circuit-breaker，在 VTA 中实现

**新增（VTA 独有）**：
- [ ] **Admin Console 最小可行版本**：基于 Awaken 的参考设计，但适配 VTA 的配置包模型

---

## 4. 具体执行建议

### 4.1 立即执行（本周内）

1. **在 `runtime-core` 的 `Session` 模型中新增 `tenant_id` 字段**
   - 即使当前单租户，也要预留字段
   - 影响：数据模型、Store trait、SQLite schema migration

2. **定义 `ExternalAgentDispatcher` trait 草案**
   ```rust
   #[async_trait]
   pub trait ExternalAgentDispatcher: Send + Sync {
       async fn discover(&self, query: AgentQuery) -> Vec<AgentDescriptor>;
       async fn dispatch(&self, request: DispatchRequest) -> Result<DispatchResult, DispatchError>;
       async fn abort(&self, handle: DispatchHandle) -> Result<(), DispatchError>;
   }
   ```
   - 放入 `runtime-agent` 或新建 `runtime-orchestration` crate
   - 先定义接口，Phase 2-3 再实现

3. **定义 `RemoteToolExecutor` trait 草案**
   ```rust
   #[async_trait]
   pub trait RemoteToolExecutor: Send + Sync {
       async fn execute(&self, request: RemoteToolRequest) -> Result<RemoteToolResult, RemoteToolError>;
   }
   ```
   - 放入 `runtime-tools` 或 `runtime-mcp`
   - 先定义接口，Phase 2-3 再实现

### 4.2 短期执行（Phase 2 内）

1. **执行 Awaken 协议适配器移植实验**
   - 选择 MCP JSON-RPC 适配器作为目标
   - 在 VTA `runtime-host` 中实现最小原型
   - 产出移植指南

2. **Prompt 配置包 MVP**
   - 实现 `manifest.toml` 解析
   - 实现 `scenes/*.hbs` 模板加载
   - 实现 `PromptManager::resolve_template()`
   - 验证配置包热更新

3. **MessageStore 内存实现**
   - 基于设计中 `Message`/`Part` 模型
   - 实现 `MessageStore` trait
   - 与 `runtime-agent` 集成

### 4.3 中期执行（Phase 3 内）

1. **Protocol Handler 实现**
   - WebSocket + JSON-RPC 基础
   - 参考 Awaken 的协议适配层设计
   - 集成 `runtime-protocol`

2. **审批/HITL 流程**
   - 与 `ApprovalService` 集成
   - 支持 suspend → wait → resume/abort
   - 参考 Awaken 的 `ToolGateHook` + `SuspendTicket`

3. **SQLite MessageStore**
   - 基于内存实现扩展
   - Schema migration
   - Compaction 支持（replace_messages）

### 4.4 长期执行（Phase 4-5）

1. **生产控制路径**
   - Retry、降级模型、熔断器
   - 参考 Awaken `engine/retry.rs`、`engine/circuit_breaker.rs`

2. **OpenTelemetry 集成**
   - 参考 Awaken `ext-observability/`
   - 对齐 GenAI Semantic Conventions

3. **后台任务机制**
   - 参考 Awaken `extensions/background/`
   - Mailbox-backed 执行

4. **租户隔离完整实现**
   - Store 层 tenant 过滤
   - 配置包 tenant 隔离
   - SLA 监控 per-tenant

---

## 5. 速赢实验：协议适配器移植

### 5.1 实验设计

| 项目 | 内容 |
|------|------|
| **目标** | 验证"借鉴 Awaken 设计后重写"的效率和可行性 |
| **范围** | 最小 MCP JSON-RPC Protocol Handler 原型 |
| **参考** | `awaken-server/src/protocols/mcp/` |
| **实现位置** | VTA `runtime-host/src/protocol/`（新建） |
| **时间预算** | 1-2 天 |

### 5.2 实验步骤

1. **Day 1 — 阅读与设计**
   - 阅读 `awaken-server/src/protocols/mcp/adapter.rs`（MCP 请求映射）
   - 阅读 `awaken-server/src/protocols/mcp/http.rs`（HTTP 路由）
   - 阅读 `awaken-server/src/protocols/mcp/stdio.rs`（stdio 传输）
   - 设计 VTA 的 `McpProtocolHandler` trait 和实现

2. **Day 2 — 实现与验证**
   - 实现最小 MCP JSON-RPC 请求解析
   - 实现到 `runtime-mcp` 的调用桥接
   - 实现响应编码
   - 编写单元测试验证
   - 撰写移植指南文档

### 5.3 成功标准

- [ ] 能正确解析 MCP JSON-RPC `tools/list` 请求
- [ ] 能正确路由到 `runtime-mcp` 的 `list_tools()`
- [ ] 能正确编码 MCP JSON-RPC 响应
- [ ] 单元测试通过
- [ ] 产出《Awaken 协议适配层移植指南》文档

### 5.4 决策依据

| 结果 | 决策 |
|------|------|
| **2 天内完成** | "借鉴设计后重写"策略可行，继续按此策略推进其他协议 |
| **2 天未完成，但方向清晰** | 调整时间预算，继续推进 |
| **架构冲突严重** | 放弃借鉴，完全自研 |

---

## 6. 风险缓解策略

### 6.1 重复造轮子风险

| 风险 | 缓解措施 |
|------|---------|
| Awaken 社区更活跃 | 聚焦差异化（Pure Agent、配置包、开放平台），避免正面竞争 |
| Awaken 功能追平 VTA | 加速生态建设（开放平台、应用商店），形成网络效应 |
| 人才流向 Awaken | 通过差异化场景（虚拟员工）吸引垂直领域开发者 |

### 6.2 追平成本风险

| 风险 | 缓解措施 |
|------|---------|
| 多协议服务端开发成本高 | 选择性借鉴 Awaken 设计，优先实现 JSON-RPC/WS，其他协议后置 |
| Admin Console 开发成本高 | Phase 4-5 再投入，前期用配置包 + CLI 管理 |
| 插件生态建设慢 | 定义清晰的插件接口，鼓励社区贡献 |

### 6.3 架构漂移风险

| 风险 | 缓解措施 |
|------|---------|
| 借鉴过多导致 Awaken 化 | 每次借鉴前明确"为什么 VTA 需要但设计不同" |
| 配置包路线被 Config API 替代 | 坚持文件包路线，这是核心差异化 |
| Pure Agent 骨架被预设填充 | 建立"空性"验收测试，确保零预设 |

---

## 7. 总结

### 7.1 战略定位

VTA 是 **"面向虚拟员工生态的 Pure Agent 运行时骨架"**，与 Awaken 的 **"通用 Agent Runtime 框架"** 形成差异化竞争。

### 7.2 核心原则

1. **骨架不框架**：保持零预设，所有能力通过配置/插件注入
2. **开放不封闭**：支持任意第三方 Agent 和工具，不绑定单一生态
3. **借鉴不依赖**：阅读 Awaken 源码理解设计，用自己的 trait 体系重写
4. **场景驱动**：所有技术决策服务于"虚拟员工"场景

### 7.3 关键里程碑

| 里程碑 | 目标 | 时间 |
|--------|------|------|
| **Phase 1 完成** | 最小可运行 Agent MVP，验证空性 | 当前 |
| **Phase 2 完成** | MessageStore、Prompt 配置包、外部 Agent 调度接口 | 近期 |
| **协议移植实验** | 验证借鉴策略可行性 | Phase 2 内 |
| **Phase 3 完成** | 审批、多协议服务端、租户隔离预留 | 中期 |
| **Phase 4-5 完成** | Compaction、后台任务、可观测性、生产控制路径 | 长期 |
| **P3 生态启动** | 开放平台、Admin Console、SDK | 远期 |

---

## 附录：与 Awaken 的协作可能性（远期）

虽然当前策略是独立演进，但远期不排除与 Awaken 生态协作的可能性：

| 协作形式 | 可能性 | 说明 |
|----------|--------|------|
| VTA 作为 Awaken 的"扩展运行时" | 低 | 架构哲学冲突 |
| Awaken 作为 VTA 的"后端之一" | 中 | VTA 可调度 Awaken Agent（通过 A2A） |
| 共享协议标准 | 高 | A2A、MCP 等是开放标准 |
| 共享工具生态 | 高 | MCP 工具可跨生态复用 |
| 代码贡献（如 rmcp 集成） | 中 | VTA 的 rmcp 经验可回馈社区 |

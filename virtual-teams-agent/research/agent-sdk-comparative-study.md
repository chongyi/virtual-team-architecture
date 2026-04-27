# Agent SDK / CLI 核心架构对比调研报告

> 调研范围：awaken、claude-code、codex、openclaw、opencode（本地源码深度分析）
>
> 注：AutoGPT、LangChain、OpenAI Assistants API、MCP、Vercel AI SDK 等框架因本次会话网络工具限制未做深度源码调研，但其核心设计（如 MCP 协议、Vercel AI SDK 的 streaming 抽象）已通过本地项目的引用关系间接覆盖。
>
> 调研目标：提取 Agent 实现中**高度相似**的设计与架构，得出"一个 Agent 应该拥有什么"的结论。

---

## 一、各项目架构要点速览

### 1. awaken (Rust)
- **核心模型**：`Phase` 驱动的 Hook 系统 + 状态机 (`RunLifecycle`, `ToolCallStates`)
- **主循环**：`orchestrator::run_agent_loop_impl` — Step-based 循环，每个 Step = Inference + Tool Execution
- **扩展机制**：Plugin 注册到 `StateStore`，通过 `PhaseHook`/`ToolGateHook`/`ToolPolicyHook` 拦截生命周期
- **Agent 切换**：`handoff` 特性支持运行中动态切换 Agent（重新 resolve 配置 + 插件热切换）
- **执行策略**：支持 Sequential 和 Parallel 两种 `ToolExecutor`
- **LLM 对接**：通过 `genai` crate 做 provider-neutral 抽象，`GenaiExecutor` 实现 `LlmExecutor`

### 2. claude-code (Python SDK)
- **核心模型**：Client-Server 双向流式控制协议（`ClaudeSDKClient` ↔ CLI Subprocess）
- **主循环**：由底层 CLI 驱动，SDK 通过 `Query` 类处理控制协议（`initialize` → `stream_input` → `receive_messages`）
- **Hook 系统**：基于事件的 Matcher + Callback（`HookEvent` → `HookMatcher` → `HookCallback`）
- **工具权限**：`can_use_tool` 回调支持用户侧拦截/批准工具调用
- **Sub-agents**：支持通过 `AgentDefinition` 定义子 Agent，MCP Server 可内嵌为 SDK 形式

### 3. codex (Rust CLI + TypeScript SDK)
- **核心模型**：Turn-based 架构（`Thread` → `Turn` → `RunResult` / `RunStreamedResult`）
- **主循环**：`Codex` 主类管理 `Thread`，每个 Turn 由底层 Rust CLI 的 `AgentControl` 驱动
- **多 Agent**：`AgentControl` 作为 Control Plane，支持 spawn/monitor/inter-agent-communication
- **工具编排**：`ToolOrchestrator` 统一处理 Approval → Sandbox Selection → Attempt → Retry
- **Sandbox**：`SandboxManager` 管理不同沙箱策略（auto-escalation on denial）
- **LLM 对接**：通过 `api_bridge.rs` 桥接 OpenAI API，支持 streaming + function calling

### 4. openclaw (TypeScript)
- **核心模型**：Gateway-CLI 架构，Gateway 进程管理多个 Session / Lane
- **主循环**：`runGatewayLoop` 管理进程生命周期，`pi-embedded-runner` 执行 Agent Turn
- **Session 管理**：`SessionManager`（来自 @mariozechner/pi-coding-agent）管理对话状态
- **Prompt 组合**：`prompt-composition-scenarios.ts` + `system-prompt.ts` + `context.ts` 多层组合系统提示
- **工具执行**：`cli-runner.ts` 执行 Agent 命令，支持 subagent spawning 和 context forking
- **模型选择**：`model-selection.ts` 处理 provider/model 解析、fallback、override

### 5. opencode (TypeScript)
- **核心模型**：Agent 定义（`Agent.Info`）+ Session Processor + LLM Stream
- **主循环**：`SessionProcessor.create` → `process` → 外层 `while(true)` 循环消费 `streamText` 的 `fullStream`。流中的每个 part 类型（`text-delta` / `reasoning-delta` / `tool-call` / `tool-result` / `step-start` / `step-finish`）都有独立的状态更新逻辑，通过 `Session.updatePart` / `Session.updatePartDelta` 实现增量持久化
- **Agent 系统**：内建 7 种 Agent（`build` / `plan` / `general` / `explore` / `compaction` / `summary` / `title`），`mode` 分为 `primary` / `subagent` / `all`。每个 Agent 有独立的 `Permission.Ruleset`、temperature、prompt、model 覆盖
- **权限系统**：`Permission.Ruleset` 是 `Rule` 数组（`permission + pattern + action`），支持 wildcard 匹配。策略层级：`defaults` → `agent-specific` → `user-config`，合并后按 `allow / ask / deny` 裁决。敏感操作通过 `Permission.ask` 弹出交互式授权，用户可选择 `once / always / reject`
- **Doom Loop 检测**：连续 3 次相同工具+相同参数自动触发权限询问，防止循环调用
- **LLM 对接**：基于 **Vercel AI SDK** 的 `streamText`，通过 `wrapLanguageModel` 统一多 provider。System Prompt 采用 **2-part 结构**（header + rest）以利用 provider 的 prompt caching 机制
- **插件系统**：`Plugin.trigger` 在多个生命周期点注入逻辑：`chat.params`（修改温度、topP 等）、`chat.headers`（注入请求头）、`experimental.chat.system.transform`（动态修改 system prompt）、`experimental.text.complete`（文本完成后处理）。支持从 npm 动态安装加载外部插件
- **状态持久化**：SQLite 作为核心存储，`Session.updatePartDelta` 支持字段级增量更新，减少 I/O
- **Context 压缩**：`SessionCompaction` 在检测到 `ContextOverflowError` 或 token 阈值超标时触发，将历史消息压缩为 summary

---

## 二、共性设计深度对比

### 2.1 Agent 架构

| 维度 | awaken | claude-code | codex | openclaw | opencode |
|------|--------|-------------|-------|----------|----------|
| **循环模型** | Step-based | Streaming Turn | Turn-based | Turn (via PI Runner) | Streaming Turn |
| **状态管理** | StateStore (插件化KV) | 底层CLI管理 | ThreadManager + DB | SessionManager | SQLite + Part 级增量更新 |
| **多Agent** | Handoff 动态切换 | AgentDefinition | AgentControl Spawn | Subagent Spawn | 7 种内建 Agent + 权限隔离 |
| **生命周期** | Phase Hook | 事件流 | Turn Item 事件 | Session Entry | Stream Part 状态机 |

**共性结论：**
1. **Step/Turn 是基本执行单元**：几乎所有 Agent 都将执行拆分为 "一次 LLM 调用 + 可选的工具执行" 作为一个 Step/Turn。
2. **状态机是必要的**：`RunLifecycle` (awaken)、`AgentStatus` (codex)、`SessionStatus` (opencode) — 运行中必须显式建模状态（idle/busy/waiting/done/error）。
3. **多 Agent 是高级标配**：不是简单的一个 Agent 走到底，而是支持子 Agent  spawn、handoff、或权限隔离的不同 Agent 角色。
4. **事件驱动比轮询更优**：claude-code 和 codex 都使用 streaming event / async iterator 模式推送状态变化，而非轮询。

---

### 2.2 与 LLM API 的对接

| 维度 | awaken | claude-code | codex | openclaw | opencode |
|------|--------|-------------|-------|----------|----------|
| **抽象层** | `genai` crate | OpenAI SDK (底层) | 自研 `api_bridge` | PI Runner 内置 | Vercel AI SDK |
| **流式** | `ChatStreamEvent` | SSE/Subprocess | OpenAI Streaming | Stream | `streamText` |
| **Provider 支持** | 多 Provider | OpenAI/Anthropic | OpenAI | 多 Provider | 多 Provider |
| **Function Calling** | `ToolDescriptor` | 底层CLI处理 | `FunctionCallOutputPayload` | 内置 | `ToolSet` (Vercel) |
| **Context 压缩** | `ContextTransformPlugin` + `TruncationState` | 底层CLI | `compact.rs` + `compact_remote.rs` | Context Pruning | `SessionCompaction` + `SessionSummary` |

**共性结论：**
1. **必须有一层 Provider-Neutral 的抽象**：不能直接绑死某个 API，awaken 用 `genai`，opencode 用 Vercel AI SDK，codex 自研 bridge。
2. **流式（Streaming）是默认而非可选项**：所有项目都支持流式接收，因为 Agent 交互是实时的，用户需要看到推理过程。
3. **Function Calling / Tool Use 是核心协议**：LLM 返回的不只是文本，而是结构化的 tool-call 请求，Agent 必须能解析、分发、执行、回填结果。
4. **Context Window 管理是硬需求**：都有 truncation / compaction / summarization 机制，不能简单堆满上下文。
5. **System Prompt 通常分多层**：不是单一字符串，而是 `Base Instructions + Skills + Rules + User Context` 的拼接。

---

### 2.3 工具的实现

| 维度 | awaken | claude-code | codex | openclaw | opencode |
|------|--------|-------------|-------|----------|----------|
| **工具定义** | `ToolDescriptor` + `Tool` trait | 底层CLI管理 | `DynamicToolSpec` | Agent Skills | `Tool` (Vercel) + 自定义 |
| **注册方式** | Registry (MapToolRegistry) | MCP / 内置 | `ToolRegistry` | Skill 扫描 | 代码注册 |
| **执行策略** | Sequential / Parallel | 底层CLI | `ToolOrchestrator` | `cli-runner` | Sequential (stream 内) |
| **结果回填** | `ToolResult` → Message | `ToolResultBlock` | `FunctionCallOutputPayload` | 嵌入消息 | `tool-call` part update |
| **MCP 支持** | 否 | 是（SDK + CLI） | 是（`rmcp-client`） | 否 | 否 |

**共性结论：**
1. **工具 = Schema + Executor + Result**：必须有一个结构化定义（JSON Schema）告诉 LLM 怎么用，有一个执行器真正运行，有一个结果对象回传给 LLM。
2. **工具注册需要动态性**：不能硬编码，awaken 有 `Registry`，codex 有 `ToolRegistry`，claude-code 通过 MCP 动态发现。
3. **执行策略可配置**：简单工具串行执行（Sequential），独立工具并行执行（Parallel）。awaken 显式支持两种策略；codex 也有 `parallel.rs`。
4. **MCP 正成为事实标准**：claude-code 和 codex 都实现了 MCP 客户端，这说明工具生态正在从"内置工具"走向"外部工具服务"。
5. **工具调用需要 Approval Gate**：敏感操作（写文件、执行命令、网络请求）需要用户或策略批准，不是直接执行。

---

### 2.4 消息处理与 Hook 设计的底层机制

| 维度 | awaken | claude-code | codex | openclaw | opencode |
|------|--------|-------------|-------|----------|----------|
| **Hook 模型** | `PhaseHook` (生命周期阶段) | `HookMatcher` (事件匹配) | `Hooks` (事件钩子) | Plugin Hooks | `Plugin.trigger` |
| **介入点** | Phase::RunStart/StepEnd/etc | PreToolUse/PostToolUse/SessionStart | HookEventAfterAgent | 多阶段 | `chat.params` / `chat.headers` / `chat.system.transform` / `text.complete` |
| **消息格式** | `Message` (Role + Content) | `Message` 子类 | `TurnItem` / `ResponseItem` | Message Stream | `MessageV2` Part-based |
| **流式处理** | `EventSink` 推送 | `AsyncIterator[Message]` | `StreamEvents` | Stream Handler | `streamText` fullStream |
| **内部消息** | `Visibility::Internal` | SystemMessage | 多种 Item 类型 | Internal Events | system / user / assistant parts |

**共性结论：**
1. **Hook / Plugin 是扩展 Agent 行为的唯一正确方式**：所有项目都不推荐修改核心循环，而是通过 Hook 在特定生命周期点注入逻辑。
2. **Hook 介入点高度相似**：
   - **Before Inference**：修改 system prompt、注入上下文、调整参数
   - **Before Tool Execution**：权限检查、参数修改、阻断
   - **After Tool Execution**：结果处理、错误处理、日志记录
   - **After Turn / Run End**：状态持久化、compaction、事件通知
3. **消息应该 Part-based**：不是简单字符串，而是结构化 Parts（TextPart / ToolPart / ReasoningPart），支持增量更新（delta）。
4. **Visibility 区分用户可见与内部消息**：awaken 的 `Visibility::Internal` 和 opencode 的 system prompt 注入都是这个思路 — LLM 能看到但用户不直接看到。
5. **Cancellation / Abort 必须支持**：每个项目都有 `CancellationToken` 或 `AbortSignal`，用户随时可以中断当前 Turn。

---

### 2.5 提示词管理

| 维度 | awaken | claude-code | codex | openclaw | opencode |
|------|--------|-------------|-------|----------|----------|
| **System Prompt 结构** | AgentSpec.prompt | SystemPromptPreset + append | `BaseInstructions` | `system-prompt.ts` + `context.ts` | `SystemPrompt.provider` + Agent.prompt |
| **动态注入** | Phase Hook | HookCallback | `build_hook_prompt_message` | Context Engine | `Plugin.trigger("chat.system.transform")` |
| **模板化** | 字符串拼接 | 字符串 | Tera Templates | 函数组合 | 文本文件 import |
| **上下文组装** | `ContextMessageStore` | 底层CLI | `message_history.rs` | `prompt-composition-scenarios.ts` | `messages` array + system |

**共性结论：**
1. **System Prompt 是多层拼接，不是单一字符串**：
   - Layer 1: Base Agent Identity
   - Layer 2: Skills / Tools Description
   - Layer 3: Rules / Permissions
   - Layer 4: Dynamic Context (files, memories, previous turns)
   - Layer 5: User-specific append
2. **必须支持运行时动态修改**：不能写死在代码里，要通过 Hook / Plugin / Config 在运行中调整。
3. **模板引擎有用但非必须**：codex 用 Tera，openclaw 用函数组合，opencode 直接 import txt — 关键是**可维护的分层**而非具体模板语法。
4. **Prompt Caching 需要被考虑**：opencode 显式维护 2-part system prompt 结构（header + rest）以利用 provider 的缓存机制。

---

## 三、Agent 应该拥有什么 —— 结论清单

基于以上对比，一个**合格的 Agent SDK/Runtime** 应该具备以下能力：

### 3.1 核心架构
- [x] **Turn/Step 执行循环**：一次 LLM 调用 + 0-N 次工具调用 = 一个执行单元
- [x] **状态机**：明确建模运行状态（idle → running → waiting/done/error）
- [x] **事件驱动**：通过 Event Sink / Async Iterator 向外部推送状态变化
- [x] **Cancellation**：支持随时中断当前 Turn/Run
- [x] **多 Agent 支持**：至少支持子 Agent spawn 或 Agent 间切换
- [x] **持久化**：Checkpoint / Session Storage，支持 resume

### 3.2 LLM 对接
- [x] **Provider 抽象**：不绑死单一 LLM API，支持多 provider 切换
- [x] **流式优先**：默认支持 streaming，解析 text-delta / reasoning-delta / tool-call-delta
- [x] **Function Calling 协议**：能将 Tool Schema 注入 LLM，解析返回的 tool-call，回填 tool-result
- [x] **Context Window 管理**：Truncation / Compaction / Summarization 策略
- [x] **参数动态调整**：temperature / max_tokens / tool_choice 等可运行时修改

### 3.3 工具系统
- [x] **Tool = Schema + Executor + Result**：结构化定义、可执行、结果可序列化
- [x] **动态注册**：运行时添加/移除工具，支持外部工具发现（MCP）
- [x] **执行策略**：支持 Sequential 和 Parallel 两种模式
- [x] **Approval Gate**：敏感操作需要批准（用户、策略、或自动 reviewer）
- [x] **Sandbox/隔离**：工具执行应在可控环境中（文件系统、网络、命令执行）
- [x] **MCP 客户端**：支持接入外部 MCP Server（趋势）

### 3.4 消息与 Hook
- [x] **Part-based Message**：消息由多个 Part 组成（text / tool / reasoning / image）
- [x] **Hook 系统**：在关键生命周期点（before inference / before tool / after tool / after turn）注入逻辑
- [x] **内部 vs 外部消息**：区分用户可见消息和仅 LLM 可见的内部上下文
- [x] **消息路由**：inbox / 外部事件能注入到当前对话中
- [x] **增量更新**：支持 Part 级别的 delta 更新，而非整消息替换

### 3.5 提示词管理
- [x] **分层 System Prompt**：Base + Skills + Rules + Context + User Append
- [x] **动态注入**：Hook / Plugin 能在运行时修改 prompt
- [x] **Template 支持**：可维护的提示词组织方式
- [x] **Caching 感知**：利用 provider 的 system prompt 缓存机制

---

## 四、其他重要设计

### 4.1 权限与安全（Permission & Safety）
- **opencode** 的权限系统为 `Rule` 数组（`permission + pattern + action`），支持 wildcard 匹配和多层合并（`defaults → agent → user`），运行时通过 `Permission.ask` 发起交互式授权
- **openclaw** 也有 per-tool / per-path 的 allow/ask/deny 规则
- **codex** 有 `guardian` 模块做自动化安全审查
- **claude-code** 有 `PermissionMode` 和 `can_use_tool` 回调
- **结论**：Agent 不是无限制执行，必须有**策略引擎**控制什么能做什么不能做。

### 4.2 Sandbox 与执行隔离
- **codex** 的 `SandboxManager` 支持 Seatbelt / Landlock / Windows Sandbox
- **awaken** 的 `ToolCallContext` 携带执行环境信息
- **结论**：Agent 执行代码/命令必须有沙箱，且策略可配置（auto-escalation on denial）。

### 4.3 Compaction / Context 压缩
- **awaken** 的 `ContextTransformPlugin`
- **codex** 的 `compact.rs` + `compact_remote.rs`（甚至远程 compaction）
- **openclaw** 的 `context-pruning`
- **opencode** 的 `SessionCompaction`
- **结论**：长会话必须进行上下文压缩，策略可以是：总结历史、丢弃旧 message、滑动窗口。

### 4.4 遥测与可观测性
- **awaken** 的 `awaken-ext-observability`（OpenTelemetry / Prometheus）
- **codex** 的 `codex_analytics` 和 `codex_otel`
- **结论**：Agent 是生产系统，必须有 trace / metrics / logging，尤其是 tool decision latency 和 token usage。

### 4.5 实时语音/多模态
- **codex** 有 `RealtimeConversationManager`（语音对话）
- **claude-code** 支持 image input
- **结论**：Agent 正在从文本走向多模态，架构上应预留 audio/image 的输入输出通道。

### 4.6 网络策略
- **codex** 的 `NetworkProxy` + `network_policy_decision.rs`
- **结论**：Agent 访问外部网络需要策略控制（白名单/黑名单/审批），不能默认开放。

### 4.7 文件系统感知
- **codex** 的 `file_watcher.rs`、`git_info`、`environment_context`
- **openclaw** 的 workspace / skills 快照
- **opencode** 的 `Snapshot.track()` + `Snapshot.patch()` 在每个 `step-start` / `step-finish` 之间捕获文件变更，生成 `patch` part 持久化到会话历史中
- **结论**：Agent 需要持续感知工作区状态（文件变化、git 状态、项目结构），而非仅靠用户输入。

### 4.8 重试与容错（Retry & Resilience）
- **opencode** 的 `SessionRetry` 对 `APIError` 等可恢复错误实施指数退避重试，状态机显式进入 `retry` 状态（`attempt` / `next` / `message`）
- **awaken** 的 `PhaseRuntime` 在 Step 失败后有明确的错误传播与重试路径
- **codex** 的 `ToolOrchestrator` 内置 Attempt → Retry 流水线
- **结论**：Agent 必须将 LLM API 视为不可靠依赖，具备指数退避、状态可见、可配置最大重试次数的容错机制。

### 4.9 反模式防护（Anti-pattern Guard）
- **opencode** 的 **Doom Loop 检测**：连续 3 次调用同一工具且参数完全相同，自动弹出权限询问，阻断无意义循环
- **claude-code** 的 `PermissionMode` 限制工具滥用
- **结论**：Agent 需要有内置的运行时防护，检测并打断重复调用、无限循环、权限提升等危险模式。

---

## 五、总结

一个现代 Agent 的核心不是"调用 LLM + 执行工具"这么简单，而是一个**有状态、可扩展、受控、可观测的交互式运行时**。其最小完备集合是：

1. **Turn-based 执行循环**（LLM ↔ Tools 的闭环）
2. **Provider-neutral 的 LLM 抽象**（流式 + Function Calling）
3. **动态工具注册与执行**（含 Approval + Sandbox）
4. **生命周期 Hook 系统**（扩展点而非改核心）
5. **分层 Prompt 管理**（Base → Skills → Rules → Context）
6. **状态机 + 持久化**（支持 resume 和 multi-agent）
7. **权限与策略引擎**（什么能做、什么需要批准）
8. **Context Window 管理**（Compaction / Truncation）
9. **可观测性**（Trace / Metrics / Event Sink）
10. **MCP 兼容**（接入外部工具生态）
11. **重试与容错**（指数退避、状态可见、API 失败恢复）
12. **反模式防护**（Doom Loop 检测、重复调用阻断）

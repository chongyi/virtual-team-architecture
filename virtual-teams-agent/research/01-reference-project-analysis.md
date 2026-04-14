# 参考项目架构分析

> 本文档记录四个参考项目的架构分析结果，作为决策依据。

## 1. ClaudeCode

**版本**：源码泄露版 (2026.3.31) | **语言**：TypeScript/Bun | **维护方**：Anthropic

### 1.1 入口与启动

- 入口文件：`src/entrypoints/cli.tsx`
- 快速路径（`--version`、`--dump-system-prompt`）跳过完整加载
- 主路径：动态导入 `src/main.tsx`（803KB 捆绑文件）→ Commander.js 解析 → `launchRepl()`
- TUI 基于 React/Ink 渲染

### 1.2 核心 Loop

**模式：AsyncGenerator**

核心函数 `query()` 在 `src/query.ts`（68KB）中实现：

```
async function* query(params): AsyncGenerator<StreamEvent | Message> {
    yield* queryLoop(params)  // 主循环
}

async function* queryLoop(params) {
    while (!isTerminal) {
        // 1. 调用 Claude API
        const response = yield* callClaudeAPI(...)
        // 2. 处理 tool calls
        for (const toolUse of assistantMessage.toolUses) {
            const result = yield* executeTool(toolUse)
            messages.push(createToolResultMessage(result))
        }
        // 3. 检查转换条件
        //    - max_output_tokens → 恢复重试
        //    - prompt_too_long → compact 对话
        //    - end_turn → 完成
        //    - tool_use → 继续循环
    }
}
```

**关键特征**：
- yield-based 流式推送，调用方通过 `for await` 消费
- 单线程友好，状态在闭包中维护
- 无显式状态机，流程控制通过 generator 的 yield/return 实现

### 1.3 模块组织

单包结构（非 monorepo），核心目录：
- `src/tools/` — 工具实现（Bash、FileEdit、Agent、MCP 等）
- `src/services/` — API 客户端、MCP、压缩等服务
- `src/screens/` — React/Ink UI 组件
- `src/utils/` — 权限、消息处理、模型选择等

### 1.4 关键设计

- **Provider**：Anthropic-only，无抽象层
- **存储**：内存 + 文件（sessionStorage.ts），无数据库
- **权限**：`useCanUseTool` hook，支持 always-allow 规则
- **子 Agent**：AgentTool 发起独立 `query()` 调用，受限工具集
- **模型选择**：`getMainLoopModel()` + `getSmallFastModel()` 两级体系
- **Prompt**：函数式组装，无外部模板引擎，static/dynamic 分界标记优化缓存

---

## 2. Codex

**版本**：v0.118.0 | **语言**：Rust 核心 + TS 分发包装 | **维护方**：OpenAI

### 2.1 入口与启动

- TS 包装层 `codex-cli/bin/codex.js` 检测平台，分发到预编译 Rust 二进制
- Rust 入口 `codex-rs/cli/src/main.rs`，Clap 解析命令
- 支持多模式：交互 TUI、exec 非交互、MCP server、app-server

### 2.2 核心 Loop

**模式：SQ/EQ（Submission Queue / Event Queue）**

```
Client → Submission { id, op: Op } → submission_loop()
                                          ↓
                                     处理 Op 变体
                                          ↓
Client ← Event { id, msg: EventMsg } ← 事件发射
```

核心结构体：
```rust
pub struct Codex {
    pub tx_sub: Sender<Submission>,           // 提交队列
    pub rx_event: Receiver<Event>,            // 事件队列
    pub agent_status: watch::Receiver<AgentStatus>,
    pub session: Arc<Session>,
}
```

**关键特征**：
- 双队列天然解耦 client 和 agent
- `Op` 枚举定义所有可能的提交操作（UserInput、Interrupt、ExecApproval 等）
- `EventMsg` 枚举定义所有可能的事件（90+ 变体）
- 传输无关：同一套 Op/Event 可走 channel（进程内）或 WebSocket（网络）

### 2.3 模块组织

Rust workspace，核心 crate：
- `codex-rs/core/` — agent 核心（codex.rs 4000+ 行）
- `codex-rs/protocol/` — Op/Event 协议定义
- `codex-rs/tui/` — Ratatui TUI（app.rs 10000+ 行）
- `codex-rs/app-server/` — Axum HTTP/WS 服务
- `codex-rs/sandboxing/` — 平台级沙箱（macOS Seatbelt、Linux Landlock）
- `codex-rs/state/` — SQLite + JSONL 持久化
- `codex-rs/mcp-server/` — MCP 服务端

### 2.4 关键设计

- **Provider**：OpenAI-primary，无多供应商抽象
- **存储**：SQLite 存元数据 + JSONL 存完整对话日志
- **沙箱**：最完善的平台级沙箱（Seatbelt/Landlock/Windows Sandbox）
- **传输**：进程内 channel + 可选 Axum app-server（WS + REST）
- **协议**：JSON-RPC 2.0，Op/Event 枚举编译期类型安全
- **Skills**：SkillsManager 管理技能发现和加载

---

## 3. OpenCode

**版本**：v1.3.0 | **语言**：TypeScript/Bun | **维护方**：社区

### 3.1 入口与启动

- 入口 `packages/opencode/bin/opencode`（Node.js shim）→ `src/index.ts`
- yargs 解析 20+ 命令（run、serve、tui、agent、mcp、session 等）
- 首次运行执行数据库迁移（JSON → SQLite）

### 3.2 核心 Loop

**模式：SessionProcessor for 循环**

```
SessionProcessor.create() → loop {
    SessionPrompt.build()     // 构建上下文
    LLM.stream()              // 调用 AI SDK
    处理响应：
      - text parts → 写入
      - tool calls → 权限检查 → 执行 → 结果写入
      - 继续循环直到 end_turn
    检查：
      - doom loop 检测（连续 3+ 次重试 → 失败）
      - abort signal
}
```

核心文件：
- `src/session/processor.ts` — 主循环
- `src/session/llm.ts` — LLM 调用（Vercel ai-sdk）
- `src/session/prompt.ts` — 上下文构建

### 3.3 模块组织

Bun monorepo（23+ packages），核心包：
- `packages/opencode/src/agent/` — Agent 定义（general、plan、explore、build 等模式）
- `packages/opencode/src/session/` — 会话状态、消息、处理器
- `packages/opencode/src/server/` — Hono HTTP 服务（14 个路由模块）
- `packages/opencode/src/tool/` — 工具注册与执行
- `packages/opencode/src/provider/` — 多 Provider 注册
- `packages/opencode/src/permission/` — 权限系统
- `packages/opencode/src/storage/` — SQLite 存储（Drizzle ORM）
- `packages/sdk/js/` — JavaScript SDK 客户端

### 3.4 关键设计

- **Provider**：40+ 供应商，通过 Vercel ai-sdk 统一。Provider 注册表 + 模型目录
- **CS 架构**：**最干净的 API-first 设计**
  - Hono HTTP 服务，50+ REST 端点
  - SSE 事件推送（10s 心跳）
  - OpenAPI 3.1.1 规范，`/doc` 端点可获取
  - 独立 JS SDK 从 OpenAPI 生成
- **存储**：SQLite 三表模型（Session → Message → Part），结构化查询友好
- **事件**：Bus 抽象 + 通配符订阅，支持多客户端广播
- **权限**：Request/Reply 模式，Deferred Promise 阻塞 loop 等待用户响应
- **Agent 模式**：per-agent 配置（model、temperature、tools），内置隐藏 agent（compaction、title、summary）
- **配置**：Zod schema 验证，文件监听热更新

---

## 4. OpenClaw

**版本**：2026.3.23 | **语言**：TypeScript/Node.js | **维护方**：社区

### 4.1 入口与启动

- 入口 `openclaw.mjs` → `src/entry.ts`
- 检查 Node.js 版本（≥ v22.12）
- 启动 Gateway 长驻服务 + CLI 路由

### 4.2 核心 Loop

**模式：Pi Agent Core 委托**

核心 loop 委托给第三方框架 `@mariozechner/pi-agent-core`：

```
runEmbeddedPiAgent() → loop {
    接收用户消息（via Gateway WebSocket 或 CLI）
    调用 LLM API（带重试/failover）
    处理 tool calls
    流式推送响应
    stop_reason="end_turn" → 结束
}
```

核心文件：
- `src/agents/pi-embedded-runner/run.ts` — 主执行入口（650+ 行）
- `src/agents/pi-embedded-subscribe.ts` — 流订阅和事件处理
- `src/agents/tool-catalog.ts` — 工具目录

### 4.3 模块组织

单包结构，内部高度模块化：
- `src/agents/` — 核心 agent 执行（623 文件）
- `src/gateway/` — WebSocket Gateway 服务（271 文件）
- `src/cli/` — CLI 命令
- `src/plugins/` — 插件系统
- `src/security/` — 安全审计
- `src/channels/` — 多渠道适配（Discord、Slack、Telegram 等）

### 4.4 关键设计

- **Provider**：多供应商，通过 extension 机制实现，支持 failover 和 auth profile 轮换
- **CS 架构**：**最重量级的 Gateway 模式**
  - 自定义帧协议（`{type:"req"/"res"/"event"}`）over WebSocket
  - 70+ API 方法，按命名空间组织（agent.*、chat.*、sessions.* 等）
  - 角色作用域权限（ADMIN/READ/WRITE/APPROVALS）
  - 广播系统 + stateVersion 一致性追踪
- **存储**：Gateway 内存为主，session 文件持久化
- **多渠道**：Discord、Slack、Telegram、GitHub 等渠道适配
- **沙箱**：Docker 容器隔离
- **插件**：完整的插件运行时（发现、安装、生命周期管理）
- **工具**：70+ 内置工具，按权限策略过滤

---

## 5. 横向对比总结

### 5.1 技术栈

| | ClaudeCode | Codex | OpenCode | OpenClaw |
|---|---|---|---|---|
| 语言 | TypeScript/Bun | **Rust** | TypeScript/Bun | TypeScript/Node |
| TUI | React/Ink | Ratatui | Solid.js + @opentui | pi-tui |
| Agent 框架 | 自研 | 自研 | 自研 | Pi Agent Core（第三方） |
| LLM 供应商 | Anthropic-only | OpenAI-primary | 40+ via ai-sdk | 多供应商 via 扩展 |
| 存储 | 内存 + 文件 | SQLite + JSONL | SQLite (Drizzle) | Gateway 内存 |

### 5.2 核心 Loop 模式

| | ClaudeCode | Codex | OpenCode | OpenClaw |
|---|---|---|---|---|
| 模式 | AsyncGenerator | SQ/EQ 双队列 | SessionProcessor | Pi Agent Core |
| CS 友好度 | 低（需适配层） | 高（天然解耦） | 高（API-first） | 高（Gateway） |
| 类型安全 | 中（TS） | 高（Rust 枚举） | 中（TS + Zod） | 中（TS） |
| 实现复杂度 | 低 | 高 | 中 | 低（委托） |

### 5.3 CS 架构成熟度

```
ClaudeCode ──── Codex ──────── OpenCode ──────── OpenClaw
(无 CS)     (可选 app-server)  (API-first)    (完整 Gateway)
   ←─────────────────────────────────────────────────→
   简单                                           复杂
```

### 5.4 关键文件索引

#### ClaudeCode
| 职责 | 文件 |
|------|------|
| Agent Loop | `src/query.ts`, `src/QueryEngine.ts` |
| API 集成 | `src/services/api/claude.ts` |
| 工具 | `src/tools/` |
| 权限 | `src/utils/permissions/` |
| 模型选择 | `src/utils/model/model.ts` |
| Prompt | `src/constants/prompts.ts` |

#### Codex
| 职责 | 文件 |
|------|------|
| Agent Loop | `codex-rs/core/src/codex.rs` |
| 协议 | `codex-rs/protocol/src/protocol.rs` |
| App Server | `codex-rs/app-server/src/lib.rs` |
| 沙箱 | `codex-rs/sandboxing/src/` |
| 状态 | `codex-rs/state/src/` |

#### OpenCode
| 职责 | 文件 |
|------|------|
| Agent Loop | `packages/opencode/src/session/processor.ts` |
| HTTP Server | `packages/opencode/src/server/server.ts` |
| Session 路由 | `packages/opencode/src/server/routes/session.ts` |
| Provider | `packages/opencode/src/provider/provider.ts` |
| 权限 | `packages/opencode/src/permission/index.ts` |
| 存储 | `packages/opencode/src/storage/db.ts` |

#### OpenClaw
| 职责 | 文件 |
|------|------|
| Agent Loop | `src/agents/pi-embedded-runner/run.ts` |
| Gateway | `src/gateway/server.impl.ts` |
| 协议 | `src/gateway/protocol/schema/frames.ts` |
| 工具目录 | `src/agents/tool-catalog.ts` |
| 插件 | `src/plugins/runtime/index.ts` |

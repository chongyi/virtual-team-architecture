# CS 架构深度对比

> 以 OpenCode 为主基准，Codex 和 OpenClaw 为对比参照。
> 聚焦三个维度：API 接口设计、状态归属与 session 管理、事件推送与流式通信。

## 1. API 接口设计与协议

### 1.1 协议选型对比

| | OpenCode | Codex | OpenClaw |
|---|---|---|---|
| **协议** | REST + JSON | JSON-RPC 2.0 | 自定义帧协议 |
| **传输** | HTTP + SSE | WebSocket / stdio | WebSocket |
| **规范** | OpenAPI 3.1.1 | 类型化 Op/EventMsg 枚举 | discriminated union frames |
| **端点数** | ~50+ REST endpoints | ~90+ Op variants | ~70+ methods |
| **认证** | Basic HTTP Auth（可选） | Token/Auth Manager | Token + 角色作用域 |

### 1.2 OpenCode API 设计（主基准）

**框架**：Hono（轻量 HTTP 框架）

**14 个路由模块**：
- `/session` — Session 生命周期（create/list/fork/delete/message）
- `/event` — SSE 事件流
- `/permission` — 权限请求/响应
- `/question` — 用户问题请求/回答
- `/project` — 项目管理
- `/pty` — 伪终端（WebSocket 连接）
- `/file` — 文件搜索/符号查找
- `/config` — 配置读写
- `/provider` — AI Provider 配置
- `/auth` — OAuth 凭证
- `/mcp` — MCP 集成
- `/tui` — TUI 专用路由
- `/experimental` — 实验性功能
- `/global` — 全局事件

**关键 Session 端点**：
```
POST   /session/                          创建 session
GET    /session/:id                       获取 session
POST   /session/:id/message               发送消息（SSE 流式响应）
POST   /session/:id/fork                  Fork session
POST   /session/:id/abort                 中止 session
POST   /session/:id/summarize             压缩历史
GET    /session/:id/message               分页获取消息
DELETE /session/:id/message/:mid          删除消息
```

**设计特点**：
- 标准 REST 语义，任何 HTTP client 可用，curl 可测试
- OpenAPI 3.1.1 规范，`/doc` 端点可获取完整 spec
- 独立 JS SDK（`packages/sdk/js`）从 OpenAPI 生成

### 1.3 Codex 协议设计

**JSON-RPC 2.0 over WebSocket/stdio**

核心词汇表由 Rust 枚举定义：
- `Op` 枚举（客户端 → 服务端）：UserTurn、UserInput、Interrupt、ExecApproval 等
- `EventMsg` 枚举（服务端 → 客户端）：TurnStarted、AgentMessage、ExecApprovalRequest 等（90+ 变体）

**传输无关设计**：
```rust
// 进程内：直接 channel
pub struct Codex {
    pub tx_sub: Sender<Submission>,
    pub rx_event: Receiver<Event>,
}

// 网络：Axum WebSocket，同一套 Op/Event 序列化为 JSON-RPC
```

### 1.4 OpenClaw 协议设计

**自定义帧协议 over WebSocket**：
```
RequestFrame:  { type: "req", id, method, params? }
ResponseFrame: { type: "res", id, ok, payload?, error? }
EventFrame:    { type: "event", event, payload?, seq?, stateVersion? }
```

70+ API 方法按命名空间组织（agent.*、chat.*、sessions.*、tools.* 等）。

### 1.5 综合评估

| 维度 | REST+SSE (OpenCode) | JSON-RPC+WS (Codex) | 自定义+WS (OpenClaw) |
|------|-----|-----|-----|
| 集成友好度 | **最高** | 中 | 低 |
| 双向通信 | 差（SSE+POST 拼凑） | **优** | **优** |
| 类型安全 | 中（OpenAPI 生成） | **高**（编译期） | 中（运行时校验） |
| 实现复杂度 | **低** | 高 | 高 |
| 可观测性 | **高** | 中 | 中 |
| 横向扩展 | **容易** | 需粘性会话 | 需粘性会话 |

---

## 2. 状态归属与 Session 管理

### 2.1 对比总览

| | OpenCode | Codex | OpenClaw |
|---|---|---|---|
| **存储** | SQLite（Drizzle ORM） | SQLite + JSONL | Gateway 内存 + 文件 |
| **数据模型** | Session → Message → Part 三表 | Thread 元数据 + JSONL 日志 | Session 文件 + 内存状态 |
| **状态归属** | 全部 Server 端 | Server 端（kernel 持有） | Gateway 进程内存 |
| **持久化** | 每条消息即时写入 | 元数据 SQLite + 对话 JSONL | 文件快照 |

### 2.2 OpenCode Session 模型（主基准）

**三表结构**：

```
SessionTable
  ├── id, title, archived_at, created_at, updated_at
  ├── directory, roots (工作目录)
  └── agent_id, provider_id, model_id (关联配置)

MessageTable
  ├── id, session_id, role (user/assistant/tool)
  ├── created_at
  └── tool_invocations, annotations (JSON)

PartTable
  ├── id, message_id, type (text/tool-invocation/tool-result/...)
  ├── content (JSON)
  └── created_at
```

**Session 生命周期**：
- 创建：`POST /session/` → 分配 ID，初始化 agent 配置
- 活跃：消息收发，工具执行，状态实时更新
- Fork：`POST /session/:id/fork` → 从指定消息点分叉
- 压缩：`POST /session/:id/summarize` → 压缩历史
- 归档：`PATCH /session/:id` → 设置 archived_at

**运行时状态**：
- 每个 session 持有 `AbortController`（用于取消）
- busy/idle 状态通过 `GET /session/status` 查询
- 多客户端通过 Bus 事件广播同步状态

### 2.3 Codex Session 模型

- SQLite 存储 thread 元数据（ID、创建时间、标题）
- JSONL 文件存储完整对话日志（每行一个事件）
- 支持 resume（恢复）和 fork（分叉）
- 进程内 `Session` 结构体持有运行时状态

### 2.4 OpenClaw Session 模型

- Gateway 进程内存持有活跃 session 状态
- 文件系统持久化 session 快照
- 支持 compact（压缩）、patch（修改）、resolve（解析）
- stateVersion 追踪状态一致性

---

## 3. 事件推送与流式通信

### 3.1 对比总览

| | OpenCode | Codex | OpenClaw |
|---|---|---|---|
| **推送机制** | SSE (Server-Sent Events) | WebSocket 双工 | WebSocket 双工 |
| **事件格式** | JSON（Bus 事件类型） | JSON-RPC notification | 自定义 EventFrame |
| **双向交互** | SSE 推送 + POST 回复 | 同一连接双向 | 同一连接双向 |
| **心跳** | 10s SSE heartbeat | WebSocket ping/pong | 自定义 heartbeat |

### 3.2 OpenCode 事件系统（主基准）

**Bus 抽象**：
```typescript
Bus.publish("session.updated", { sessionID, ... })
Bus.subscribe("session.*", callback)  // 通配符订阅
```

**SSE 端点**：`GET /event`
- 客户端建立 SSE 连接后，服务端推送所有匹配事件
- 10s 心跳防止连接超时
- 事件类型包括：session 变更、message 创建、permission 请求等

**权限交互流程**（SSE + POST 拼凑双向通信）：
```
Server → SSE: permission.requested { requestID, ... }
Client → POST /permission/:requestID/reply { decision }
Server → 内部 Deferred Promise resolve → loop 继续
```

**Question 交互流程**（同理）：
```
Server → SSE: question.requested { requestID, ... }
Client → POST /question/:requestID/reply { answers }
```

### 3.3 Codex 事件系统

**全双工 WebSocket**：
- 请求和事件在同一连接上多路复用
- RequestId 关联请求/响应对
- ServerNotification 异步推送事件
- 审批流程：`ExecApprovalRequest` → 客户端回复 `ExecApproval` Op → 阻塞等待

### 3.4 OpenClaw 事件系统

**广播系统**：
- EventFrame 通过 `seq` 计数器保证顺序
- `stateVersion` 追踪状态一致性
- 支持多客户端广播
- 审批流程：`exec-approval` 方法 → 客户端回复 → Gateway 转发

---

## 4. 对本项目的决策影响

### 4.1 协议选择

OpenCode 的 REST+SSE 集成友好但双向通信弱；Codex 的 JSON-RPC+WS 类型安全但集成成本高。

**决策**：WebSocket + stdio 双传输，统一由 JSON-RPC 2.0 承载。兼顾双向通信能力和类型安全。

### 4.2 状态模型

OpenCode 的三表模型（Session → Message → Part）最适合结构化查询和 CS 场景。

**决策**：Events 审计 + Message 工作状态双轨。Message 表服务 loop 实时查询，Events 保证审计完整性。

### 4.3 事件推送

WebSocket 天然支持双向通信，权限/问题交互无需 SSE+POST 拼凑。

**决策**：WebSocket 上的 JSON-RPC notification 作为事件推送通道，stdio 传输同理。

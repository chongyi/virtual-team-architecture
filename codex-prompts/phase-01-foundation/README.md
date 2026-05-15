# Phase 1：基础建设

> **开始前请先读取**：`CONTEXT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 1 是整个虚拟团队项目的**三条轨道同步启动阶段**。三条轨道完全独立、无相互依赖，可以并行推进。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A1: VTA 最小可运行 MVP | 3 | `runtime-agent` crate 可运行原型：本地跑通 LLM API、最小 loop、tool call、MCP 工具 |
| B | G-B1: 协作应用服务端 | 3 | WebSocket 实时通道 + REST API、消息模型、用户认证（JWT）、消息持久化（PostgreSQL）、多端同步 |
| C | G-C1: 工作环境客户端骨架 | 3 | 服务端注册与心跳保活、沙盒环境基础、能力声明协议、离线/重连处理 |

## 依赖关系

```
G-A1 (VTA MVP)         G-B1 (协作服务端)        G-C1 (WEN骨架)
  ├── U-A1.1               ├── U-B1.1               ├── U-C1.1
  ├── U-A1.2 (→A1.1)      ├── U-B1.2 (→B1.1)      ├── U-C1.2 (→C1.1)
  └── U-A1.3 (→A1.2)      └── U-B1.3 (→B1.2)      └── U-C1.3 (→C1.2)
```

三条轨道之间：**无依赖，可完全并行执行**。

## 执行策略

- **单 Codex 实例线性执行**：本阶段 9 个单元在单机按序执行（轨道间无依赖，可灵活排序）
- **路径配置**：开始前先读取 `{ARCHITECTURE_REPO}/.env-context` 获取 `PROJECT_MONO_REPO` 和 `ARCHITECTURE_REPO`
- **推荐执行顺序**：A1.1→A1.2→A1.3 → B1.1→B1.2→B1.3→B1.4→B1.5 → C1.1→C1.2→C1.3
- 共 **11** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A1.1 | [U-A1.1-vta-core-types.md](units/U-A1.1-vta-core-types.md) | — |
| 2 | U-A1.2 | [U-A1.2-vta-memory-agent-loop.md](units/U-A1.2-vta-memory-agent-loop.md) | A1.1 |
| 3 | U-A1.3 | [U-A1.3-vta-mcp-e2e.md](units/U-A1.3-vta-mcp-e2e.md) | A1.2 |
| 4 | U-B1.1 | [U-B1.1-collab-server-skeleton.md](units/U-B1.1-collab-server-skeleton.md) | — |
| 5 | U-B1.2 | [U-B1.2-message-model-persistence.md](units/U-B1.2-message-model-persistence.md) | B1.1 |
| 6 | U-B1.3 | [U-B1.3-auth-ws-sync.md](units/U-B1.3-auth-ws-sync.md) | B1.2 |
| 7 | U-B1.4 | [U-B1.4-reaction-thread.md](units/U-B1.4-reaction-thread.md) | B1.3 |
| 8 | U-B1.5 | [U-B1.5-file-upload-s3.md](units/U-B1.5-file-upload-s3.md) | B1.3 |
| 9 | U-C1.1 | [U-C1.1-wen-registration-heartbeat.md](units/U-C1.1-wen-registration-heartbeat.md) | — |
| 10 | U-C1.2 | [U-C1.2-wen-sandbox-basic.md](units/U-C1.2-wen-sandbox-basic.md) | C1.1 |
| 11 | U-C1.3 | [U-C1.3-wen-capability-reconnect.md](units/U-C1.3-wen-capability-reconnect.md) | C1.2 |
| 7 | U-C1.1 | [U-C1.1-wen-registration-heartbeat.md](units/U-C1.1-wen-registration-heartbeat.md) | — |
| 8 | U-C1.2 | [U-C1.2-wen-sandbox-basic.md](units/U-C1.2-wen-sandbox-basic.md) | C1.1 |
| 9 | U-C1.3 | [U-C1.3-wen-capability-reconnect.md](units/U-C1.3-wen-capability-reconnect.md) | C1.2 |

## 里程碑 M1

**A1 完成时触发**：VTA 最小可运行 Agent 通过 chrome-devtools MCP 工具完成端到端截图验证。

## 涉及的设计文档

### 轨道 A 文档
- `08-vte-agent-internals/agent-architecture.md` — Agent 架构与 crate 层次
- `08-vte-agent-internals/execution-loop.md` — 执行循环状态机与 Turn 生命周期
- `08-vte-agent-internals/tool-system.md` — 工具注册、路由、可见性机制
- `08-vte-agent-internals/message-model.md` — Message/Part 类型体系
- `virtual-employee-system/technical-design/api-and-protocol.md` — VTA 核心 trait 接口
- `virtual-employee-system/technical-design/technology-selection.md` — crate 与依赖选型
- `development-standards/repository-structure.md` — monorepo workspace 结构
- `development-standards/code-conventions.md` — Rust 编码规范

### 轨道 B 文档
- `04-collaboration-app/technical-design/overview.md` — 基线范围与冻结合约
- `04-collaboration-app/technical-design/server-architecture.md` — 服务端分层架构与模块组成
- `04-collaboration-app/technical-design/api-and-protocol.md` — REST/WebSocket 协议、消息结构、错误语义
- `04-collaboration-app/technical-design/technology-selection.md` — Rust crate 选型
- `04-collaboration-app/technical-design/data-and-permission-model.md` — 核心实体、权限决策路径
- `04-collaboration-app/technical-design/sync-reliability-observability.md` — 重连、幂等、降级
- `04-collaboration-app/im-system.md` — IM 通道体系、消息模型、多端同步

### 轨道 C 文档
- `09-work-environment-node.md` — WEN 架构、沙盒模型、能力声明协议
- `08-vte-agent-internals/tool-system.md` — 远程工具路由机制
- `11-protocol-and-integration/internal-protocol.md` — Agent 服务器 ↔ WEN 消息格式
- `virtual-employee-system/technical-design/api-and-protocol.md` — VE Runner 协议

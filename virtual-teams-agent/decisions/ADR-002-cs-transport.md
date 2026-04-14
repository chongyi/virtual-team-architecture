# ADR-002: CS 传输层

**状态**：已采纳 | **日期**：2026-04-08

## 背景

CS（Client-Server）架构被确定为一等公民。需要选择客户端与服务端之间的通信传输方式。项目已有 `runtime-protocol` crate 定义了 JSON-RPC 2.0 协议类型。同时存在两种使用场景：
- 网络客户端（IDE 插件、Web UI、远程 TUI）需要网络传输
- 本地 daemon（`host-daemon`）需要进程间通信

## 考虑的选项

### A. 纯 REST + SSE（OpenCode 方案）

- 优点：集成友好，标准 HTTP 工具链，可观测性好，横向扩展容易
- 缺点：双向通信弱（权限请求等需要 SSE + POST 拼凑），不够优雅

### B. 纯 WebSocket + JSON-RPC（Codex 方案）

- 优点：全双工，类型安全，双向通信自然
- 缺点：集成成本高，需要专用 SDK，调试不如 REST 直观

### C. WebSocket + stdio 双传输（✅ 采纳）

- 优点：WebSocket 面向网络客户端（全双工），stdio 面向本地 daemon（已有模式）；统一由 JSON-RPC 2.0 承载
- 缺点：需要传输层抽象

## 决策

**采纳选项 C**：WebSocket + stdio 双传输，统一由 JSON-RPC 2.0 协议承载。

## 理由

- 项目已有 `runtime-protocol` 定义了完整的 JSON-RPC 2.0 类型和方法集
- 项目已有 `host-daemon` 使用 stdio 传输
- WebSocket 天然支持双向通信，权限/问题交互无需 SSE+POST 拼凑
- 传输层抽象使上层代码完全传输无关

## 影响

- 需要在 `runtime-host`（或新建 `runtime-transport`）实现传输层抽象 trait
- WebSocket 传输实现（基于 Axum 或 tokio-tungstenite）
- stdio 传输实现（已有基础，在 host-daemon 中）
- 两种传输共享同一套 JSON-RPC 消息处理逻辑

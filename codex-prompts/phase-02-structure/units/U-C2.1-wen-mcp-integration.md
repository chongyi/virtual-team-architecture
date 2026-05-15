# U-C2.1 MCP Server 集成

## 目标 (Goal)

在 WEN 中集成完整的 MCP（Model Context Protocol）Server 能力：通过 stdio 传输连接 MCP Server，实现 tools/list 和 tools/call 两个核心方法，使得 WEN 可以作为 MCP 宿主，为 Agent 提供外部工具能力。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-C1.3（能力声明协议与离线重连）
- 本单元属于：Phase 2 → G-C2（工作环境工具能力） → 轨道 C → 数据层

### 相关设计文档

- `virtual-team/src/09-work-environment-node.md`：MCP 集成部分
- `virtual-team/src/08-vte-agent-internals/tool-system.md`：ToolSpec 定义、工具路由

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/mcp/mod.rs | create | MCP 模块 |
| crates/wen-client/src/mcp/client.rs | create | McpClient（启动子进程、JSON-RPC 通信） |
| crates/wen-client/src/mcp/protocol.rs | create | MCP 协议类型（JSON-RPC 2.0 消息格式） |
| crates/wen-client/src/mcp/manager.rs | create | McpManager（管理多个 MCP Server 连接） |
| crates/wen-client/src/mcp/tool_adapter.rs | create | MCP Tool 到 WEN ToolSpec 的适配 |

### 协议边界

- MCP 协议（外部标准，非本仓库），stdio 传输

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元特殊约束：
- 仅支持 stdio 传输（启动子进程 MCP server），不支持 HTTP/SSE
- MCP Server 进程崩溃后自动重启（最多 3 次）
- 每个 MCP Server 独立进程，互不影响

## 完成条件 (Done When)

### 必须满足

- [ ] McpClient 可启动 MCP Server 子进程
- [ ] `tools/list` 返回工具列表（Vec<ToolSpec>）
- [ ] `tools/call` 调用工具并返回结果
- [ ] MCP Server 进程崩溃后自动重启（3 次上限，超过后标记 server 为 degraded）
- [ ] 工具调用结果正确转换为 WEN 内部 ToolResult 格式
- [ ] `cargo test -p vt-wen-client` 全部通过

### 质量门禁

- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 包含对 mock MCP server 的集成测试

### 提交标准

- [ ] `feat(wen): add MCP Server integration with stdio transport`

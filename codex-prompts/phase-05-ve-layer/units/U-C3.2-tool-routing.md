# U-C3.2 工具调用路由

## 目标 (Goal)

实现完整的工具调用路由链路：VTA Agent 发起 tool call → Agent 服务器路由到绑定 WEN → WEN 执行工具（内置/MCP）→ 结果回传 Agent 服务器 → Agent 继续推理，使 VE 的 tool call 可以真正在远程 WEN 上执行。

## 上下文 (Context)

- 前置：U-C3.1（VE 分配完成）
- 设计文档：`11-protocol-and-integration/internal-protocol.md`、`08-vte-agent-internals/tool-system.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/agent-server/src/management/tool_router.rs | create | 工具调用路由器 |
| crates/wen-client/src/tools/dispatch.rs | modify | 接收远程 tool call 并分发执行 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 工具调用超时链路：Agent (30s) → Agent 服务器 (25s) → WEN (20s)
- 执行结果携带 tool_call_id 以便 Agent 端关联

## 完成条件 (Done When)

- [ ] Agent tool call → Agent 服务器接收 → 查询 VE 绑定节点 → 转发到 WEN
- [ ] WEN 收到 tool call → 分发到内置工具或 MCP Server → 返回执行结果
- [ ] 结果回传链路完整且含 tool_call_id 关联
- [ ] 工具执行超时/失败 → 错误信息正确回传
- [ ] `cargo test` Workspace 全部通过

### 提交标准

- [ ] `feat(core): add end-to-end tool call routing from Agent through Agent Server to WEN`

# U-A1.3 MCP 集成与端到端验证

## 目标 (Goal)

在 `vta-mcp` + `vta-tools` + `vta-inference` + `vta-inference-rig` + `vta-host` 五个 crate 中集成 MCP 客户端、工具注册与路由、LLM 推理管线（Rig 后端），在 `vta-host` 中装配完整依赖链，使用真实 LLM API 完成一次端到端验证：Agent 接收"截个屏"指令 → 调用 LLM → LLM 请求 chrome-devtools MCP 工具 → Agent 执行截图 → 返回结果。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-A1.2（内存后端 + DefaultAgentLoop 原型）
- 本单元属于：Phase 1 → G-A1（VTA 最小可运行 MVP） → 轨道 A → 接口/集成层

### 相关设计文档

- `virtual-team/src/08-vte-agent-internals/tool-system.md`：ToolSpec 定义、ToolRegistry、ToolBridge、双轨工具（remote/platform）、工具路由、visible_tools 白名单、连续失败保护（3 次上限）
- `virtual-team/src/08-vte-agent-internals/execution-loop.md`：AgentLoop 中工具执行阶段的具体流程
- `virtual-team/src/virtual-employee-system/technical-design/technology-selection.md`：LLM SDK 选型（async-openai + Anthropic SDK）
- `virtual-team/src/09-work-environment-node.md`：MCP 协议集成（stdio 传输、tool list、tool call）
- `virtual-team/src/development-standards/code-conventions.md`：外部调用需 tracing span

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/mcp/Cargo.toml | create | 依赖 mcp-rs |
| crates/vta/mcp/src/lib.rs | create | McpClient trait + StdioMcpClient（stdio 传输、tool_list、tool_call） |
| crates/vta/tools/Cargo.toml | create | 依赖 vta-core + vta-mcp |
| crates/vta/tools/src/lib.rs | create | ToolSpec 定义、ToolRegistry、ToolBridge |
| crates/vta/tools/src/registry.rs | create | ToolRegistry（注册、查找、visible_tools 白名单过滤） |
| crates/vta/tools/src/bridge.rs | create | ToolBridge（invoke_routed 方法，错误连败计数） |
| crates/vta/inference/Cargo.toml | create | 依赖 vta-core |
| crates/vta/inference/src/lib.rs | create | 推理管线骨架：Composer → Renderer → Projector → Backend |
| crates/vta/inference-rig/Cargo.toml | create | 依赖 rig / Anthropic SDK |
| crates/vta/inference-rig/src/lib.rs | create | RigBackend（实现推理管线 Backend trait） |
| crates/vta/host/Cargo.toml | create | 依赖所有 vta-* crate |
| crates/vta/host/src/main.rs | create | 组合根：装配 RuntimeKernel + AgentLoop + LLM Backend + MCP Client + ToolRegistry |
| configs/vta-host.example.toml | create | 配置模板（LLM API key、model、MCP server 命令等） |

### 协议边界

- 协议名称：MCP（Model Context Protocol）（外部标准协议，非本项目冻结）
- 首次触及：是
- 本次涉及部分：stdio 传输、tool/list、tools/call 两个核心方法

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。

### 本单元特殊约束

1. **MCP 客户端范围**：仅实现 stdio 传输（启动子进程、通过 stdin/stdout JSON-RPC 通信）。不实现 HTTP/SSE 传输。
2. **工具安全机制**：
   - `visible_tools` 白名单：Agent 只看到配置包中声明的工具列表
   - 连续工具失败计数器：同一 Turn 中连续 3 次工具执行失败 → 立即终止 Turn（状态 = Failed），失败信息写回 history 供 LLM 参考
   - 工具执行超时：单次工具调用超时 30 秒
3. **推理管线 Backend 抽象**：Backend trait 定义最简单的 `chat_completion(messages, tools) -> Result<Vec<Part>>` 方法。RigBackend 使用 Anthropic SDK 实现。
4. **端到端验证场景**：用户输入"帮我截个屏" → Agent 调用 LLM → LLM 返回 tool_use（chrome-devtools MCP take_screenshot）→ Agent 通过 MCP 执行 → 获取截图结果 → LLM 生成最终文本回复。
5. **API Key 管理**：通过环境变量 + 配置文件加载，不在代码中硬编码。支持 `ANTHROPIC_API_KEY` 环境变量。
6. **vta-host 为最小组合根**：不在本单元引入 DI 框架，直接手动装配依赖。host 的 main.rs 约 100-200 行。

## 完成条件 (Done When)

### 必须满足

- [ ] `cargo build` workspace 全量编译通过
- [ ] `McpClient` trait 含 `list_tools() -> Vec<ToolSpec>` 和 `call_tool(name, args) -> Result<ToolResult>` 方法
- [ ] `StdioMcpClient` 可启动子进程 MCP server，完成 tool/list 和 tools/call 交互
- [ ] `ToolRegistry` 含 `register`、`get`、`list_visible(whitelist)` 方法
- [ ] `ToolBridge.invoke_routed()` 含连续失败计数器（3 次上限触发 Turn 终止）
- [ ] 推理管线定义的 Backend trait 含 `chat_completion()` 方法
- [ ] `RigBackend` 可调用 Anthropic API 完成一次推理
- [ ] DefaultAgentLoop 的阶段三（Act）接入 ToolBridge，可正确路由 tool call
- [ ] 端到端验证：`cargo run -p vta-host` → Agent 接收"截个屏"指令 → 调用 chrome-devtools MCP → 截图成功 → 返回 LLM 文本回复
- [ ] 工具连续失败 3 次后 Turn 状态为 Failed，错误信息记录在 Turn 的错误字段中
- [ ] 配置模板 `vta-host.example.toml` 含清晰注释

### 质量门禁

- [ ] `cargo test` 全部通过
- [ ] 测试覆盖：StdioMcpClient 连接 mock MCP server、ToolRegistry 白名单过滤、连续失败计数器逻辑、推理管线 mock backend
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 所有外部调用（LLM API、MCP 进程）有 tracing span
- [ ] MCP 进程异常退出有合适的错误处理（不会 panic）
- [ ] 每个新 crate 有 README.md

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(vta): add MCP integration, tool system, inference pipeline and end-to-end host`

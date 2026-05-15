# U-C1.3 能力声明协议与离线重连

## 目标 (Goal)

在 `vt-wen-client` 中完善能力声明协议（细粒度声明内置工具、MCP Server、第三方 Agent 的支持程度），实现网络断开后的自动重连机制（指数退避 + 状态恢复），使得 WEN 在重连后可以自动重新注册并恢复心跳，同时 Agent 服务器端（mock）可正确感知节点离线/上线状态。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-C1.2（沙盒环境基础）
- 本单元属于：Phase 1 → G-C1（工作环境客户端骨架） → 轨道 C → 接口/集成层

### 相关设计文档

- `virtual-team/src/09-work-environment-node.md`：能力声明协议完整定义、节点在线/离线状态管理、重连策略
- `virtual-team/src/11-protocol-and-integration/internal-protocol.md`：节点事件定义（Registered、Heartbeat、CapabilityChanged、Offline）
- `virtual-team/src/08-vte-agent-internals/tool-system.md`：工具系统对 WEN 能力的消费方式（ToolSpec 映射到 WEN 能力声明）
- `virtual-team/src/virtual-employee-system/technical-design/reliability-and-observability.md`：重连机制的指标与告警

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/capability.rs | modify | 完善 Capability 枚举，细化工具声明格式（内置工具、MCP servers、Agent 集成） |
| crates/wen-client/src/capability/builtin.rs | create | 内置工具能力声明（文件操作、Shell、网络请求等） |
| crates/wen-client/src/capability/mcp.rs | create | MCP Server 能力声明（server_name、transport、tools list） |
| crates/wen-client/src/capability/agent.rs | create | 第三方 Agent 支持声明（Codex、Claude Code 等，Phase 1 声明为空） |
| crates/wen-client/src/reconnect.rs | create | 自动重连管理（指数退避、最大重试、状态恢复、部分重连） |
| crates/wen-client/src/state.rs | create | WEN 运行时状态机（Disconnected → Registering → Registered → Heartbeating → Disconnected） |
| crates/wen-client/src/protocol.rs | modify | 补充节点事件类型：CapabilityChanged 通知、Offline 通知 |

### 协议边界

- 协议名称：内部协议（`virtual-team/src/11-protocol-and-integration/internal-protocol.md`）
- 首次触及：否（在 U-C1.1 中已建立基本注册/心跳通信）
- 本次涉及部分：能力变更通知（CapabilityChanged）、节点离线声明（Offline）、重连后的状态同步

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。

### 本单元特殊约束

1. **能力声明格式**（JSON）：
   ```json
   {
     "node_id": "node_xxx",
     "capabilities": {
       "builtin": ["fs.read", "fs.write", "shell.exec", "http.request"],
       "mcp_servers": [
         {"name": "chrome-devtools", "transport": "stdio", "tools": ["take_screenshot", "navigate_page"]}
       ],
       "third_party_agents": []
     }
   }
   ```
2. **能力变更通知**：
   - WEN 发现本地能力变化时（MCP server 新增/移除），发送 `CapabilityChanged` 通知给 Agent 服务器
   - 通知为增量更新（只发变更部分），非全量
3. **重连机制**：
   - 网络断开 → 进入 Disconnected 状态 → 启动指数退避重连（1s → 2s → 4s → 8s → 16s → 32s，上限 60s）
   - 每次重连尝试：先检查 Agent 服务器可达性（HTTP GET /health），可达则重新注册
   - 重连成功后：恢复心跳循环 + 重新发送能力声明（全量）
   - 最大重连次数：无上限（WEN 应无限尝试重连，直到被主动停止）
4. **状态机**：
   ```
   Disconnected → (register) → Registering → (success) → Registered
   → (start heartbeat) → Heartbeating → (network loss) → Disconnected
   ```
5. **Agent 服务器端 mock**：扩展 mock 支持：记录节点注册时间、最后心跳时间、自动标记超时节点为离线（心跳超过 90 秒无更新 → Offline 事件）、接收 CapabilityChanged 通知
6. **不在本单元实现**：Agent 服务器的生产级节点路由表（Phase 4）、工具调用路由（Phase 5）

## 完成条件 (Done When)

### 必须满足

- [ ] 能力声明数据结构完整：内置工具（枚举所有支持的工具名）、MCP servers（含 server name + transport + tool list）、第三方 Agent（数组占位）
- [ ] 注册时完整能力声明随注册请求发送
- [ ] 网络断开后自动进入重连循环（指数退避：1s → 2s → 4s → ... → max 60s）
- [ ] 重连成功后：重新注册 + 恢复心跳 + 全量发送能力声明
- [ ] 重连期间的心跳请求被暂停（不消耗无效心跳计数）
- [ ] Mock Agent 服务器在节点心跳超时（90s）后标记节点为 Offline
- [ ] WEN 运行时状态变化有 tracing info 日志（状态切换、重连尝试、能力变更）
- [ ] WEN 被 SIGTERM 信号终止时发送 Offline 通知（best-effort，超时 3s）

### 质量门禁

- [ ] `cargo build -p vt-wen-client` 编译通过
- [ ] `cargo test -p vt-wen-client` 全部通过
- [ ] 测试覆盖：
  - 能力声明序列化为正确 JSON 格式
  - 指数退避时间序列正确（1s、2s、4s、8s、16s、32s、60s、60s...）
  - 状态机转换正确（Disconnected → Registering → Registered → Heartbeating → Disconnected）
  - Mock Agent 服务器正确检测心跳超时
  - 重连后恢复心跳
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(wen): add capability declaration protocol and automatic reconnection`

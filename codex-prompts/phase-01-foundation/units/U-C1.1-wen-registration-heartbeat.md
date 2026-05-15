# U-C1.1 WEN 客户端骨架与注册心跳

## 目标 (Goal)

搭建 `vt-wen-client` crate 完整骨架，实现工作环境节点（WEN）向 Agent 服务器注册的完整流程和周期性心跳保活，使得 WEN 启动后可成功注册、Agent 服务器可感知节点在线状态。

## 上下文 (Context)

### 前置条件

- 已完成单元：无（本单元为轨道 C 的起点）
- 本单元属于：Phase 1 → G-C1（工作环境客户端骨架） → 轨道 C → 数据层

### 相关设计文档

- `virtual-team/src/09-work-environment-node.md`：WEN 架构全貌、节点注册协议、心跳机制、能力声明格式、节点 ID 生成
- `virtual-team/src/11-protocol-and-integration/internal-protocol.md`：Agent 服务器 ↔ WEN 的内部协议（JSON-RPC 2.0 消息格式、通知类型、事件定义）
- `virtual-team/src/virtual-employee-system/technical-design/api-and-protocol.md`：VE Runner 协议中关于 WEN 注册的部分
- `virtual-team/src/development-standards/repository-structure.md`：monorepo workspace 结构
- `virtual-team/src/development-standards/code-conventions.md`：Rust 编码规范

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/Cargo.toml | create | 依赖：tokio、reqwest、serde、serde_json、tracing、uuid、chrono |
| crates/wen-client/src/main.rs | create | 入口：加载配置 → 注册 → 启动心跳循环 → 等待信号 |
| crates/wen-client/src/lib.rs | create | `//!` 模块文档 + pub mod 声明 |
| crates/wen-client/src/config.rs | create | 配置加载（节点 ID、Agent 服务器地址、心跳间隔、重连参数） |
| crates/wen-client/src/registration.rs | create | 节点注册协议：HTTP POST /api/v1/nodes/register（含节点 ID、类型、版本、capabilities 占位） |
| crates/wen-client/src/heartbeat.rs | create | 心跳逻辑：周期性 HTTP POST /api/v1/nodes/{id}/heartbeat |
| crates/wen-client/src/capability.rs | create | 能力声明结构体定义（Capability 枚举占位：文件系统、Shell、MCP 等，本单元仅定义类型） |
| crates/wen-client/src/protocol.rs | create | 协议消息类型定义（RegisterRequest、RegisterResponse、HeartbeatRequest、HeartbeatResponse） |
| crates/wen-client/README.md | create | Crate 文档 |
| configs/wen-client.example.toml | create | 配置模板（node_id、server_url、heartbeat_interval_secs 等） |

### 协议边界

- 协议名称：内部协议（`virtual-team/src/11-protocol-and-integration/internal-protocol.md`）
- 首次触及：是
- 本次涉及部分：节点注册（JSON-RPC 2.0 通知格式）、心跳（定时通知）、节点在线/离线状态事件

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。

### 本单元特殊约束

1. **节点 ID**：使用 UUID v4，首次启动时生成并持久化到本地文件（`~/.wen/node_id`），后续启动复用。不使用随机 ID 以免重启后 Agent 服务器无法识别。
2. **注册流程**：
   - 启动 → 检查本地 node_id → 不存在则生成 → HTTP POST 注册 → 成功后进入心跳循环
   - 注册请求含：node_id、node_type（"local" / "cloud"）、version（从 Cargo.toml 读取）、capabilities（本单元为空数组占位）
   - 注册失败重试：最多 3 次，指数退避（1s、2s、4s），全部失败后退出
3. **心跳机制**：
   - 默认间隔 30 秒，可配置
   - 心跳为简单 HTTP POST，Agent 服务器返回 200 OK 即成功
   - 连续 3 次心跳失败 → 标记 Agent 服务器不可达 → 退出心跳循环 → 释放资源 → 退出进程（退出码 1）
4. **Agent 服务器 mock**：本单元不在 Agent 服务器端实现注册/心跳处理，而是提供 mock server（可选）用于 WEN 客户端测试。mock 记录收到的注册和心跳请求即可。
5. **不在本单元实现**：沙盒环境（U-C1.2）、能力声明协议细节（U-C1.3 完善）、工具执行（Phase 2）。

## 完成条件 (Done When)

### 必须满足

- [ ] `cargo run -p vt-wen-client` 启动后生成 node_id 文件（或使用已有文件）
- [ ] WEN 启动后向 Agent 服务器（或 mock）成功发送注册请求（含 node_id、type、version、capabilities）
- [ ] 注册成功后进入心跳循环，每 N 秒发送一次心跳
- [ ] 心跳请求携带 node_id 和 timestamp
- [ ] Agent 服务器（mock）收到注册和心跳请求
- [ ] 连续 3 次心跳无响应 → 进程以非零退出码退出
- [ ] 注册失败 3 次后进程退出
- [ ] 配置文件 `wen-client.example.toml` 含清晰的字段注释
- [ ] 关键操作（注册、心跳成功/失败）有 tracing info/warn 日志

### 质量门禁

- [ ] `cargo build -p vt-wen-client` 编译通过无 warning
- [ ] `cargo test -p vt-wen-client` 全部通过
- [ ] 测试覆盖：node_id 持久化与复用、注册请求格式正确性、心跳间隔控制
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] README.md 说明 WEN 用途、启动方式、配置说明

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(wen): add WEN client skeleton with registration and heartbeat`

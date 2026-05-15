# U-A1.2 内存后端 + DefaultAgentLoop 原型

## 目标 (Goal)

在 `vta-store` + `vta-store-memory` + `vta-kernel` + `vta-agent` 四个 crate 中实现：Store 层 trait 定义与内存后端、DefaultRuntimeKernel、DefaultAgentLoop（准备→推理→工具→收尾的四阶段循环），使得使用 mock LLM backend 可以执行一次完整的 Turn。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-A1.1（VTA 核心类型与 Trait 骨架）
- 本单元属于：Phase 1 → G-A1（VTA 最小可运行 MVP） → 轨道 A → 服务/逻辑层

### 相关设计文档

- `virtual-team/src/08-vte-agent-internals/agent-architecture.md`：crate 层次（runtime-kernel、runtime-agent 的职责边界）
- `virtual-team/src/08-vte-agent-internals/execution-loop.md`：Turn 四阶段执行循环、TurnExecutionContext、AgentLoop trait 方法
- `virtual-team/src/08-vte-agent-internals/message-model.md`：MessageStore trait 定义、消息持久化接口
- `virtual-team/src/08-vte-agent-internals/tool-system.md`：ToolRegistry 概念（本单元仅占位，不实现工具执行）
- `virtual-team/src/08-vte-agent-internals/config-package.md`：PromptManager trait（本单元实现最小版本：返回固定 system prompt）

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/store/Cargo.toml | create | 依赖（async-trait、来自 vta-core 的类型） |
| crates/vta/store/src/lib.rs | create | pub mod 声明 |
| crates/vta/store/src/message.rs | create | MessageStore trait（save_message、get_messages、get_history 等） |
| crates/vta/store/src/event.rs | create | EventStore trait |
| crates/vta/store/src/approval.rs | create | ApprovalStore trait |
| crates/vta/store/src/skill.rs | create | SkillStore trait |
| crates/vta/store-memory/Cargo.toml | create | 依赖 vta-store + vta-core |
| crates/vta/store-memory/src/lib.rs | create | MemoryMessageStore、MemoryEventStore 等 HashMap 实现 |
| crates/vta/kernel/Cargo.toml | create | 依赖 vta-core + vta-store |
| crates/vta/kernel/src/lib.rs | create | DefaultRuntimeKernel（实现 RuntimeKernel trait） |
| crates/vta/agent/Cargo.toml | create | 依赖 vta-core + vta-kernel |
| crates/vta/agent/src/lib.rs | create | AgentLoop trait + DefaultAgentLoop |
| crates/vta/agent/src/prompt.rs | create | PromptManager trait（最小版本：固定 system prompt） |

### 协议边界

无新增协议边界。本单元所有接口为 VTA 内部 Rust trait，不涉及跨轨道通信。

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。

### 本单元特殊约束

1. **trait 与实现分离**：MessageStore / EventStore 等 trait 定义在 `vta-store` crate（不含实现），具体实现在 `vta-store-memory` crate。调用方只依赖 `vta-store` trait crate。
2. **内存后端只为测试/Phase 1 用**：`MemoryMessageStore` 等使用 `HashMap` + `tokio::sync::RwLock`，不需要持久化。接口签名使用 `async fn` 为后续 PostgreSQL/SQLite 实现预留。
3. **DefaultAgentLoop 四阶段**：
   - 阶段一（Prepare）：获取历史消息、渲染 system prompt
   - 阶段二（Reason）：调用 LLM API（本单元使用 mock，返回固定 ToolCall 或 Text）
   - 阶段三（Act）：处理 tool call（本单元返回 "not implemented" 错误）
   - 阶段四（Finalize）：保存消息、更新 Turn 状态
4. **Mock LLM Backend**：构造一个简单的 mock，返回固定的 Part::Text 回复。不接入真实 LLM API。
5. **工具执行阶段占位**：当 LLM 返回 finish_reason=tool_calls 时，DefaultAgentLoop 应记录日志但返回明确的 UnsupportedError（"Tool execution not yet implemented"），不崩溃。
6. **PromptManager 最小版本**：第 1 版 PromptManager trait 只需 build_system_prompt() 方法，返回固定字符串 "You are a helpful assistant."。

## 完成条件 (Done When)

### 必须满足

- [ ] `cargo build -p vta-store -p vta-store-memory -p vta-kernel -p vta-agent` 全部编译通过
- [ ] MessageStore trait 含方法：save_message、get_messages（按 session_id + before/after sequence + limit）、get_history（按 session_id）
- [ ] EventStore trait 含方法：append_event、get_events（按 session_id）
- [ ] ApprovalStore trait 含方法：request_approval、get_approval、resolve_approval
- [ ] SkillStore trait 含方法：get_skill、list_skills
- [ ] MemoryMessageStore 通过 tokio::sync::RwLock<HashMap<...>> 实现，所有方法 async
- [ ] DefaultRuntimeKernel 实现 RuntimeKernel trait 全部 9 个方法
- [ ] AgentLoop trait 含方法：execute_turn(session_id, input) -> Result<Turn>
- [ ] DefaultAgentLoop 实现四阶段循环，用 tracing 记录每个阶段的开始/结束
- [ ] Mock LLM backend 可以返回 Part::Text("mock response")，Turn 状态正确更新为 Completed
- [ ] Tool call 场景下 Turn 状态为 Failed（含 "not implemented" 错误信息），不会 panic

### 质量门禁

- [ ] `cargo test` 全部通过
- [ ] 测试覆盖：DefaultAgentLoop 完整的四阶段一次执行、MemoryMessageStore 读写一致性、DefaultRuntimeKernel 创建/关闭 Session、Turn 状态转换完整性
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 所有公共 trait 和 struct 有 `///` 文档注释
- [ ] 每个新 crate 有 README.md
- [ ] 所有错误类型实现 Display + std::error::Error

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(vta): add store layer, memory backend, kernel and agent loop prototype`

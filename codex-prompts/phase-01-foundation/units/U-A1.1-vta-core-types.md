# U-A1.1 VTA 核心类型与 Trait 骨架

## 目标 (Goal)

在 `vta-core` crate 中定义 VTA Agent Runtime 的全部核心领域类型（Session、Turn、Message、Part、AgentProfile）、ID 类型、事件类型，以及核心 trait（RuntimeKernel、EventBus），使得后续所有 crate 可以基于这些类型定义开始实现。

## 上下文 (Context)

### 前置条件

- 已完成单元：无（本单元为轨道 A 的起点）
- 本单元属于：Phase 1 → G-A1（VTA 最小可运行 MVP） → 轨道 A → 数据层

### 相关设计文档

- `virtual-team/src/08-vte-agent-internals/agent-architecture.md`：Agent 架构整体图，VTA crate 层次定义，AgentProfile / Session / Turn 概念关系
- `virtual-team/src/08-vte-agent-internals/execution-loop.md`：Turn 生命周期状态机（Created → Running → Completed / Failed / Cancelled）
- `virtual-team/src/08-vte-agent-internals/message-model.md`：Message / Part 类型体系，PartKind 枚举（Text / ToolCall / ToolResult / Error / Reason）
- `virtual-team/src/virtual-employee-system/technical-design/api-and-protocol.md`：VTA 核心 trait 接口定义（RuntimeKernel trait 方法签名）
- `virtual-team/src/development-standards/repository-structure.md`：monorepo workspace 结构、crate 命名约定
- `virtual-team/src/development-standards/code-conventions.md`：Rust 编码规范

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/core/Cargo.toml | create | 依赖声明（serde、thiserror、uuid、chrono、tracing） |
| crates/vta/core/src/lib.rs | create | `//!` 模块文档 + pub mod 声明 |
| crates/vta/core/src/types.rs | create | Session、Turn、TurnStatus、Message、Part、PartKind、AgentProfile |
| crates/vta/core/src/id.rs | create | SessionId、TurnId、MessageId（newtype + 前缀生成） |
| crates/vta/core/src/event.rs | create | RuntimeEvent 枚举（SessionCreated、TurnStarted、TurnCompleted 等） |
| crates/vta/core/src/traits.rs | create | RuntimeKernel trait、EventBus trait |
| crates/vta/core/src/error.rs | create | RuntimeError 枚举（thiserror）、SessionError、TurnError |
| crates/vta/core/README.md | create | Crate 说明文档 |

### 协议边界

- 协议名称：VTA 核心 trait 接口（`virtual-team/src/virtual-employee-system/technical-design/api-and-protocol.md`）
- 首次触及：是
- 本次涉及部分：RuntimeKernel trait 的 9 个方法签名（create_session、get_session、close_session、start_turn、get_turn、complete_turn、fail_turn、cancel_turn、summary）

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。本项目重点约束：
- 库层使用 `thiserror` 定义结构化错误枚举，不返回 `Box<dyn Error>`
- 所有公共 trait 和 struct 必须有 `///` 文档注释
- `pub` 模块必须有 `//!` 模块级文档
- Rust 侧 `snake_case`，JSON 侧通过 `#[serde(rename_all = "camelCase")]` 映射
- 使用 `tracing` 非 `log`
- VTA 核心 trait 接口保持最小化，只定义推理循环必需的抽象

### 本单元特殊约束

1. **Pure Agent 骨架原则**：vta-core 中不包含任何预设 prompt、默认工具列表、LLM provider 默认值。所有类型定义中用到 prompt/tool/model 的字段，都用泛型、trait object 或 `serde_json::Value` 占位，不预设具体值。
2. **Session 状态机**：严格按照执行循环文档定义的状态转换。Session 状态：Initializing → Active → Paused → Closed。Turn 状态：Created → Running → Completed / Failed / Cancelled。
3. **ID 类型**：SessionId / TurnId / MessageId 使用 newtype 模式（内部 u64 或 Uuid），带前缀字符串生成方法（如 `session_<uuid>`）。
4. **EventBus trait**：定义最简单的事件发布/订阅接口，不在本单元实现具体的事件总线。
5. 不在本单元引入 LLM SDK 依赖，只定义纯数据类型和 trait。

## 完成条件 (Done When)

### 必须满足

- [ ] `cargo build -p vta-core` 编译通过，无 warning
- [ ] RuntimeKernel trait 包含 create_session、get_session、close_session、start_turn、get_turn、complete_turn、fail_turn、cancel_turn、summary 共 9 个方法
- [ ] Session 结构体含字段：id、profile_id、status、defaults（RuntimeConfig）、model_state（HashMap）、metadata（HashMap）、created_at、updated_at
- [ ] Turn 结构体含字段：id、session_id、status、messages（Vec<Message>）、created_at、updated_at
- [ ] TurnStatus 枚举含 Created、Running、Completed、Failed、Cancelled 五个变体
- [ ] Message 结构体含 id、turn_id、role、parts（Vec<Part>）、created_at
- [ ] Part 结构体含 kind（PartKind 枚举）、content、metadata
- [ ] PartKind 枚举含 Text、ToolCall、ToolResult、Error、Reason 五个变体
- [ ] AgentProfile 结构体含 id、model_policy、prompt_policy、tool_policy、skill_policy、runtime_policy、limits 字段（值类型使用 serde_json::Value 占位）
- [ ] EventBus trait 含 publish、subscribe 方法（返回类型为 async stream 或 channel receiver）
- [ ] RuntimeError 实现 Display + std::error::Error
- [ ] SessionId / TurnId / MessageId 有前缀生成方法（如 `SessionId::new()` 生成 `"session_"` 前缀 + uuid）
- [ ] 所有公共类型和 trait 有 `///` 文档注释
- [ ] `lib.rs` 有 `//!` 模块级文档

### 质量门禁

- [ ] `cargo fmt` 通过
- [ ] `cargo clippy` 无新增 warning
- [ ] 所有 thiserror 错误变体有 `#[error("...")]` 注解
- [ ] README.md 说明 crate 用途和主要类型

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(vta): add vta-core crate with core types and RuntimeKernel trait`

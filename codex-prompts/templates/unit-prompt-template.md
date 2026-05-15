# [单元ID] [单元名称]

## 目标 (Goal)

[一句话描述本单元要完成的确切可验证产出。格式："在 [crate/模块] 中实现 [具体能力]，使得 [可验证的结果]"]

## 上下文 (Context)

### 前置条件

- 已完成单元：[列出依赖的前置单元 ID 和名称]
- 本单元属于：[主阶段] → [功能大组] → [轨道]

### 相关设计文档

- [文档路径](相对路径): [需要阅读的特定章节/内容]
- [文档路径](相对路径): [需要阅读的特定章节/内容]

### 工作范围

本单元涉及以下文件（`create` = 新建，`modify` = 修改已有）：

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/core/Cargo.toml | create | crate 入口，pub mod 声明 |
| crates/vta/core/src/lib.rs | create | crate 文档与模块声明 |
| crates/vta/core/src/types.rs | create | 核心类型定义 |
| crates/vta/core/README.md | create | Crate 说明文档 |

### 协议边界

[如果本单元触及协议边界，在此说明]
- 协议名称：[协议文档路径]
- 是否首次触及：是/否
- 本次涉及部分：[协议中与本单元相关的具体章节]

## 约束 (Constraints)

### 全局规范

所有全局约束详见 `CONTEXT.md`。重点：
- Rust：thiserror（库层）/ anyhow（边界）、tracing 日志、serde camelCase 映射、sqlx 命名参数、`//!` 和 `///` 文档注释
- 架构：Pure Agent 骨架、独立运行·协议对接、`tenant_id` 过滤所有查询
- Commit：`<type>(<scope>): <description>`，（本单元 scope: [选择：vta/collab/agent-server/wen/protocol/flutter/admin]）

### 本单元特殊约束

- [特有的限制和要求，如无可写"无"]

## 完成条件 (Done When)

### 必须满足

- [ ] [具体、可验证的条件1]
- [ ] [具体、可验证的条件2]
- [ ] [具体、可验证的条件3]

### 质量门禁

- [ ] `cargo build` 通过（或 `flutter analyze`）
- [ ] `cargo test` 通过（或 `flutter test`）
- [ ] `cargo fmt` 通过
- [ ] `cargo clippy` 无新增 warning
- [ ] 所有公共项有文档注释（`//!` 模块级 / `///` 项级）
- [ ] 新增 crate 有 README.md
- [ ] 错误类型实现 `Display` 和 `std::error::Error`

### 提交标准

- [ ] 一个逻辑完整的 commit，包含本单元所有变更
- [ ] commit message 格式：`<type>(<scope>): <description>`
- [ ] commit message 描述"做了什么"和"为什么"

# U-A2.1 Message/Part 类型完善与 MessageStore trait

## 目标 (Goal)

在 `vta-core` 中完善 Message/Part 类型体系（增加 SceneId、细化 PartKind 变体、增加 MessageMetadata），在 `vta-store` 中完善 MessageStore trait 的方法签名（使其接近生产级），使得消息类型体系可以支撑后续的完整对话和工具调用场景。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-A1.3（MCP 集成与端到端验证）
- 本单元属于：Phase 2 → G-A2（VTA 结构收敛） → 轨道 A → 数据层

### 相关设计文档

- `virtual-team/src/08-vte-agent-internals/message-model.md`：完整的 Message/Part 类型体系、SceneId 定义、Part 类型细化
- `virtual-team/src/08-vte-agent-internals/execution-loop.md`：Turn 中消息流的处理
- `virtual-team/src/08-vte-agent-internals/compaction-and-context.md`：SceneId 在上下文压缩中的作用
- `virtual-team/src/virtual-employee-system/technical-design/api-and-protocol.md`：MessageStore 接口规格

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/core/src/types.rs | modify | 完善 Message、Part、增加 SceneId、MessageMetadata |
| crates/vta/core/src/id.rs | modify | 增加 SceneId 类型 |
| crates/vta/store/src/message.rs | modify | 完善 MessageStore trait 方法（增加按 session 查询、批量操作） |
| crates/vta/core/README.md | modify | 更新类型说明 |

### 协议边界

无新增协议边界。本单元为 VTA 内部类型体系完善。

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元无特殊约束。

## 完成条件 (Done When)

### 必须满足

- [ ] PartKind 枚举完善：Text、ToolCall（含 tool_name、arguments）、ToolResult（含 tool_name、result、is_error）、Error（含 error_type、message）、Reason（含 reasoning_type、content）
- [ ] Message 增加 metadata 字段（HashMap<String, serde_json::Value>）、scene_id 字段（可选）
- [ ] SceneId 类型定义（newtype Uuid，前缀 "scene_"）
- [ ] MessageStore trait 方法完善：save_message、get_messages_by_session、get_messages_by_scene、get_history、delete_message
- [ ] `cargo build` 全部通过
- [ ] `cargo test` 全部通过

### 质量门禁

- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 所有新增/修改的公共类型有文档注释

### 提交标准

- [ ] `feat(vta): refine Message/Part types and MessageStore trait with SceneId support`

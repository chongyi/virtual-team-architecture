# U-A3.1 SQLite MessageStore 持久化

## 目标 (Goal)

在 vta-store-sqlite crate 中实现基于 SQLite 的 MessageStore、EventStore 持久化后端，替代 Phase 1 的内存后端，使得 Agent 对话历史可在进程重启后恢复。

## 上下文 (Context)

- 前置：U-A2.3（API 冻结）
- 设计文档：`08-vte-agent-internals/message-model.md`、`virtual-employee-system/technical-design/technology-selection.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/store-sqlite/Cargo.toml | create | 依赖 sqlx（sqlite feature）、vta-store trait |
| crates/vta/store-sqlite/src/lib.rs | create | SqliteMessageStore、SqliteEventStore |
| crates/vta/store-sqlite/migrations/ | create | SQLite 表结构迁移 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- SQLite 数据库文件路径可配置（默认 `~/.vta/sessions/{session_id}.db`）
- 一个 Session 一个 SQLite 文件（简单隔离）
- 消息序列化使用 serde_json 存入 TEXT 列

## 完成条件 (Done When)

- [ ] SqliteMessageStore 实现 MessageStore trait 全部方法
- [ ] 消息按 session_id 隔离存储
- [ ] 历史查询支持按 sequence cursor 分页
- [ ] 进程重启后数据可恢复
- [ ] `cargo test -p vta-store-sqlite` 全部通过

### 提交标准

- [ ] `feat(vta): add SQLite MessageStore and EventStore persistence`

# U-B5.2a 类型化多维表格（后端）

## 目标 (Goal)

实现多维表格后端：Table/Column/Row 数据模型、BitableStore + PostgreSQL 持久化、REST API。

## 上下文 (Context)

- 前置：U-B5.1a（文档后端完成）
- 设计文档：`04-collaboration-app/collaboration-tools/bitable.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/bitable.rs | create | Table、Column、Row 结构体 |
| crates/collab-server/src/store/bitable.rs | create | BitableStore + PgBitableStore |
| crates/collab-server/src/routes/bitable.rs | create | REST API |

## 约束 (Constraints)

列类型：text、number、date、select、checkbox（基础版不承诺公式引擎、关联表）。

## 完成条件 (Done When)

- [ ] 表格/列/行 CRUD API 完整
- [ ] 列类型支持 5 种基础类型
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add bitable model, store and REST API`

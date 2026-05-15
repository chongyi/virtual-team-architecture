# U-B5.1a 轻量 Block 文档（后端）

## 目标 (Goal)

实现协作文档工具的后端：Document/Block 数据模型、DocumentStore + PostgreSQL 持久化、REST CRUD API。

## 上下文 (Context)

- 前置：U-B4.3（上下文段与 markers）
- 设计文档：`04-collaboration-app/collaboration-tools/documents.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/document.rs | create | Document、Block 结构体 |
| crates/collab-server/src/store/document.rs | create | DocumentStore trait + PgDocumentStore |
| crates/collab-server/src/routes/document.rs | create | 文档 CRUD API |
| migrations/ | create | documents 表 |

## 约束 (Constraints)

详见 CONTEXT.md。Block 类型：paragraph、heading、bullet_list、code_block、image（基础版不承诺实时协同）。

## 完成条件 (Done When)

- [ ] 文档 CRUD API 完整
- [ ] Block 列表存储为 JSONB 列
- [ ] 文档所有权 + 组织内可见性过滤
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add document model, store and CRUD API`

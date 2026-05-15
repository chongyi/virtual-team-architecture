# U-B5.1 轻量 Block 文档

## 目标 (Goal)

实现基础版协作文档工具：Block-based 轻量文档的数据模型、后端 CRUD API、Flutter 文档编辑器界面，使得用户可以在协作应用中创建和编辑富文本文档。

## 上下文 (Context)

- 前置：U-B4.3（上下文段与 markers）
- 设计文档：`04-collaboration-app/collaboration-tools/documents.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/document.rs | create | Document、Block 结构体 |
| crates/collab-server/src/store/document.rs | create | DocumentStore + PgDocumentStore |
| crates/collab-server/src/routes/document.rs | create | REST API |
| apps/flutter/lib/features/tools/document/ | create | Flutter 文档编辑器 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- Block 类型：paragraph、heading、bullet_list、code_block、image（基础版不承诺实时协同）
- 文档所有权：创建者 + 组织内可见性

## 完成条件 (Done When)

- [ ] 文档 CRUD API 完整
- [ ] Flutter 文档编辑器可创建/编辑文档
- [ ] Block 类型的渲染和编辑
- [ ] 文档列表页（按组织筛选）
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add block-based lightweight document tool`

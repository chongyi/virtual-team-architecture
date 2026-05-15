# U-B5.2 类型化多维表格

## 目标 (Goal)

实现基础版多维表格（Bitable）工具：表格数据模型（列类型定义、行数据）、后端 API、Flutter 表格视图，使得用户可以创建类似 Airtable 的类型化表格。

## 上下文 (Context)

- 前置：U-B5.1（文档工具完成，可复用部分模式）
- 设计文档：`04-collaboration-app/collaboration-tools/bitable.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/bitable.rs | create | Table、Column、Row 结构体 |
| crates/collab-server/src/store/bitable.rs | create | BitableStore |
| crates/collab-server/src/routes/bitable.rs | create | REST API |
| apps/flutter/lib/features/tools/bitable/ | create | Flutter 表格视图 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 列类型：text、number、date、select、checkbox（基础版）
- 不承诺：公式引擎、关联表、视图过滤排序（高级特性在 Phase 6）

## 完成条件 (Done When)

- [ ] 表格 CRUD API 完整
- [ ] 列定义支持 5 种基础类型
- [ ] 行数据创建/编辑/删除
- [ ] Flutter 表格视图可显示和编辑
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add typed multi-dimensional table (bitable) tool`

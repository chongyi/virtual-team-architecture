# U-B5.3 任务看板

## 目标 (Goal)

实现任务看板工具（Board）：看板列（状态列）、卡片（任务卡片，支持标题/描述/标签/负责人）、卡片拖拽（前端交互，不承诺实时协同），后端 API，Flutter 看板视图。

## 上下文 (Context)

- 前置：U-B5.1（文档工具）
- 设计文档：`04-collaboration-app/collaboration-tools/board.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/board.rs | create | Board、Column、Card 结构体 |
| crates/collab-server/src/store/board.rs | create | BoardStore |
| crates/collab-server/src/routes/board.rs | create | REST API |
| apps/flutter/lib/features/tools/board/ | create | Flutter 看板视图 |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] 看板 CRUD API 完整
- [ ] 卡片创建/编辑/移动（切换列）
- [ ] 卡片含标题、描述、标签（多选）、负责人
- [ ] Flutter 看板视图（水平滚动列 + 垂直滚动卡片）
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add kanban board tool with cards and status columns`

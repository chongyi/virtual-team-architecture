# U-B5.1b 轻量 Block 文档（Flutter 编辑器）

## 目标 (Goal)

在 Flutter 中实现协作文档编辑器：Block-based 渲染与编辑、文档列表页，对接 B5.1a 后端 API。

## 上下文 (Context)

- 前置：U-B5.1a（文档后端 API 完成）
- 设计文档：`04-collaboration-app/collaboration-tools/documents.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/tools/document/ | create | 文档编辑/列表 screen、provider、repository |

## 约束 (Constraints)

详见 CONTEXT.md。编辑器支持 5 种 Block 类型的插入、编辑、删除。
- 富文本渲染使用 `flutter_markdown`（`MarkdownBody`），不手写正则解析（已由 U-X4.0 迁移）。

## 完成条件 (Done When)

- [ ] 文档列表页（按组织筛选）
- [ ] 文档编辑页面（Block 列表渲染、点击编辑 Block）
- [ ] 支持添加/编辑/删除 Block（paragraph、heading、bullet_list、code_block）
- [ ] `flutter analyze` 无 error
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(flutter): add document editor with block-based editing`

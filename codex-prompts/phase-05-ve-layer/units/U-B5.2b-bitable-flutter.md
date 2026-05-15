# U-B5.2b 类型化多维表格（Flutter 视图）

## 目标 (Goal)

在 Flutter 中实现多维表格视图：表格数据展示、单元格编辑、列类型渲染，对接 B5.2a 后端 API。

## 上下文 (Context)

- 前置：U-B5.2a（表格后端完成）
- 设计文档：`04-collaboration-app/collaboration-tools/bitable.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/tools/bitable/ | create | 表格视图 screen、provider、repository |

## 完成条件 (Done When)

- [ ] 表格列表页
- [ ] 表格详情页（横向滚动列 + 行数据展示）
- [ ] 单元格内联编辑（按列类型匹配输入控件）
- [ ] `flutter analyze` 无 error
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(flutter): add bitable grid view with inline editing`

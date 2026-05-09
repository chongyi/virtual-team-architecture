# 多维表格

多维表格是工作产物扩展，用于承载结构化数据、分析结果、跟踪清单和可查询记录。面向普通用户时，它应首先像“表格”一样容易理解：有字段、有行、有筛选排序、能被 VE 写入和查询。完整的电子表格、数据库、仪表盘和自动化能力属于后续演进方向。

多维表格采用**基础版 / 完整形态**分层：

- **基础版**是可冻结实施范围，目标是类型化数据表。
- **完整形态**是长期方向，用于指导多视图、公式、关联记录和复杂编辑器评估。

## 基础版定位

基础版多维表格解决 VE 结构化产出的核心问题：

- VE 可以创建表格、定义字段、写入行数据。
- 用户可以查看 Grid 视图，进行基础编辑、筛选和排序。
- 表格可以被文档、消息和工作上下文引用。
- 表格内容可以被搜索、导入、导出和审计。

基础版不承诺：

- 公式引擎。
- 关联记录和跨表聚合。
- 看板、日历、时间线等多视图。
- 类 Excel 的复杂单元格编辑体验。
- 仪表盘、自动化和外部数据同步。

## 基础版数据模型

基础版采用 Base / Table / Field / Row 的低认知模型。

| 概念 | 说明 |
|------|------|
| Base | 一个多维表格对象，可包含一个或多个 Table |
| Table | 一组结构相同的记录 |
| Field | 字段定义，决定每列的类型和配置 |
| Row | 一条记录 |
| Grid View | 基础表格视图，支持显示字段、筛选、排序 |

### 扩展数据

协作应用核心保存通用对象壳，多维表格扩展保存具体表结构和行数据。

```sql
CREATE TABLE bitable_payloads (
    object_id UUID PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    description TEXT,
    work_context_id UUID,
    created_by_type VARCHAR(16),
    created_by_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bitable_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID NOT NULL,
    name VARCHAR(256) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bitable_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL,
    name VARCHAR(256) NOT NULL,
    field_type VARCHAR(32) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE bitable_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

基础版先不定义专门的 `views` 表。Grid View 是默认视图，其显示字段、筛选和排序可以作为用户偏好或查询参数保存。

## 基础版字段类型

基础版字段类型必须足够支撑 VE 常见结构化输出，同时保持实现可控。

| 字段类型 | 存储格式 | 说明 |
|---------|---------|------|
| `text` | `"string"` | 文本 |
| `number` | `123.45` | 数值 |
| `date` | `"2026-05-08"` | 日期或日期时间 |
| `select` | `"option_id"` | 单选 |
| `multi_select` | `["id1", "id2"]` | 多选 |
| `checkbox` | `true/false` | 布尔值 |
| `attachment` | `[{ url, name, size, mime_type }]` | 附件引用 |
| `user` | `"u_xxx"` | 用户引用 |
| `ve` | `"ve_xxx"` | 虚拟员工引用 |

货币、评分、公式、关联记录等字段进入完整形态方向，不进入基础版冻结范围。

## 基础版 API

| API | 说明 |
|-----|------|
| `collab.bitable.create` | 创建多维表格对象和初始表结构 |
| `collab.bitable.add_field` | 添加字段 |
| `collab.bitable.insert_rows` | 批量插入行 |
| `collab.bitable.update_rows` | 批量更新行 |
| `collab.bitable.query` | 查询行，支持基础筛选、排序、分页 |
| `collab.bitable.export` | 导出当前表数据 |

### 创建表格

```json
{
  "name": "Q2 销售数据",
  "organization_id": "org_sales",
  "work_context_id": "wc_xxx",
  "tables": [
    {
      "name": "销售记录",
      "fields": [
        { "name": "月份", "field_type": "select" },
        { "name": "收入", "field_type": "number" },
        { "name": "负责人", "field_type": "user" }
      ]
    }
  ]
}
```

### 查询行

```json
{
  "table_id": "tbl_xxx",
  "filter": {
    "operator": "AND",
    "conditions": [
      { "field": "field_month", "op": "in", "value": ["4月", "5月", "6月"] },
      { "field": "field_revenue", "op": "gte", "value": 100000 }
    ]
  },
  "sort": [{ "field": "field_revenue", "direction": "desc" }],
  "limit": 50
}
```

## Tool Surface

基础版优先使用 Flutter 原生 Grid 和 Schema/Card：

| Surface | 用途 |
|---------|------|
| `flutter_native` | 表格列表、Grid 视图、基础行列编辑 |
| `schema_card` | IM 中的表格预览卡片、统计摘要卡片 |
| `webview_sandbox` | 暂不作为基础版必需项，留给完整形态复杂表格编辑器 |

多维表格链接在 IM 中渲染为预览卡片，包含表格名称、行数、最近更新和打开入口。VE 批量写入行后默认只发送摘要，不逐行刷消息。

## VE 使用场景

1. **数据报告生成**：VE 创建表格，按月份或维度写入行数据，再在文档中引用表格预览。
2. **跟踪清单**：VE 创建跟踪表，定期追加状态记录，用户通过筛选和排序查看进展。
3. **结构化交付**：VE 将非结构化输入整理为表格，例如客户清单、需求列表、风险项清单。

## 完整形态方向

完整形态多维表格面向更复杂的数据工作台，可能包含：

- 公式字段和级联重算。
- 关联记录、查找字段和跨表聚合。
- 看板、日历、时间线、甘特等多视图。
- 表单视图和外部收集入口。
- 仪表盘、图表和聚合分析。
- 自动化规则和外部数据同步。
- 更复杂的权限视图和字段级权限。

完整形态可参考的产品和技术方向包括 Airtable、Lark Base、Notion Database、Univer、AG Grid、Glide Data Grid 等。它们只作为后续评估对象，不在基础版中锁定选型。

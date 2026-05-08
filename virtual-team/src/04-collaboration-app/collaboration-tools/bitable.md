# 多维表格（Bitable）

多维表格是电子表格与数据库的融合——每列有类型约束，支持多视图（表格/看板/日历/甘特图），可以公式计算、关联引用。它是 VE 数据分析和报告输出的核心载体。

## 数据模型

```sql
CREATE TABLE bitables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(512) NOT NULL,
    description TEXT,

    organization_id UUID,
    work_context_id UUID,
    created_by_type VARCHAR(16),
    created_by_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    INDEX idx_bitables_tenant (tenant_id, updated_at DESC)
);

CREATE TABLE bitable_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bitable_id UUID NOT NULL REFERENCES bitables(id) ON DELETE CASCADE,
    name VARCHAR(256) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bitable_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES bitable_tables(id) ON DELETE CASCADE,
    name VARCHAR(256) NOT NULL,
    field_type VARCHAR(32) NOT NULL,
    -- 'text', 'number', 'currency', 'date', 'select', 'multi_select',
    -- 'formula', 'link', 'attachment', 'checkbox', 'rating', 'user', 've'
    config JSONB NOT NULL DEFAULT '{}',
    -- 各类型特有配置，如 currency: { symbol, precision }
    sort_order INTEGER NOT NULL DEFAULT 0
);
```

### 行数据

```sql
CREATE TABLE bitable_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES bitable_tables(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    -- { "field_id_1": "value", "field_id_2": 123 }

    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    INDEX idx_btable_rows_table (table_id)
);
```

### 视图

```sql
CREATE TABLE bitable_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES bitable_tables(id) ON DELETE CASCADE,
    name VARCHAR(256) NOT NULL,
    view_type VARCHAR(16) NOT NULL,
    -- 'grid', 'kanban', 'calendar', 'gantt', 'form'
    config JSONB NOT NULL DEFAULT '{}',
    -- grid: { frozen_columns, row_height }
    -- kanban: { group_by_field_id }
    -- calendar: { date_field_id }
    -- gantt: { start_field_id, end_field_id }

    sort_order INTEGER NOT NULL DEFAULT 0
);
```

### 字段类型详情

| 字段类型 | 存储格式 | 配置项 |
|---------|---------|--------|
| `text` | `"string"` | — |
| `number` | `123.45` | `{ decimal_places, use_separator }` |
| `currency` | `123.45` | `{ symbol, precision }` |
| `date` | `"2026-05-08"` | `{ format }` |
| `select` | `"option_id"` | `{ options: [{id, name, color}] }` |
| `multi_select` | `["id1", "id2"]` | `{ options: [...] }` |
| `formula` | 计算值 | `{ expression, output_type }` |
| `link` | `{ bitable_id, table_id, row_id }` | 关联其他表格的行 |
| `attachment` | `[{ url, name, size, mime_type }]` | — |
| `checkbox` | `true/false` | — |
| `rating` | `3` | `{ max }` |
| `user` | `"u_xxx"` | 指向 User |
| `ve` | `"ver_xxx"` | 指向 VE Runtime |

## 公式引擎

公式字段支持类 Excel 的表达式计算：

| 公式类别 | 示例 | 说明 |
|---------|------|------|
| 算术 | `{price} * {quantity}` | 四则运算 |
| 条件 | `IF({score} >= 80, "A", "B")` | 条件判断 |
| 文本 | `CONCAT({first}, " ", {last})` | 字符串处理 |
| 日期 | `DATEDIFF({end}, {start}, "d")` | 日期计算 |
| 聚合 | `SUM({table}.{field})` | 跨行聚合 |
| 查找 | `LOOKUP({table}.{field}, {key} = {value})` | 关联查找 |

公式在写入时计算并缓存结果，关联字段变更时触发级联重算。

## API

### VE 可调用的 API

| API | 参数 | 返回 |
|-----|------|------|
| `collab.bitable.create` | `{ name, tables: [{ name, fields, views }] }` | `{ id, table_ids }` |
| `collab.bitable.insert_rows` | `{ table_id, rows: [{ data }] }` | `{ row_ids }` |
| `collab.bitable.update_rows` | `{ table_id, rows: [{ id, data }] }` | `{ updated_count }` |
| `collab.bitable.query` | `{ table_id, view_id?, filter?, sort?, limit? }` | `{ rows, total }` |
| `collab.bitable.add_field` | `{ table_id, name, field_type, config }` | `{ field_id }` |
| `collab.bitable.get_schema` | `{ bitable_id }` | `{ tables, fields, views }` |

### REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/bitables` | 创建多维表格 |
| `GET` | `/api/v1/bitables/{id}` | 获取无数据 schema |
| `GET` | `/api/v1/bitables/{id}/tables/{tid}/rows?view={vid}&limit=100` | 按视图查询行 |
| `POST` | `/api/v1/bitables/{id}/tables/{tid}/rows` | 批量插入行 |
| `PUT` | `/api/v1/bitables/{id}/tables/{tid}/rows` | 批量更新行 |

### 查询示例

```json
// collab.bitable.query
{
  "table_id": "tbl_xxx",
  "view_id": "view_grid",
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

## VE 典型使用场景

1. **数据报告生成**：VE 分析数据 → 创建多维表格 → 按月度/维度写入行 → 设置公式计算增长率 → 用户以日历视图查看
2. **数据跟踪**：VE 创建跟踪表 → 定期插入新数据行 → 用户通过看板视图查看进度
3. **关联分析**：VE 在一个表格中分析销售数据 → 关联客户信息表 → 生成交叉分析视图

# 文档

文档是工作产物扩展，用于承载 VE 生成的报告、方案、文案、知识整理和交付说明。它面向普通用户时应像成熟协作应用中的“文档”一样容易理解：能写、能改、能分享、能被消息引用，而不是暴露复杂编辑器或协同算法概念。

文档采用**基础版 / 完整形态**分层：

- **基础版**是可冻结实施范围，目标是轻量 Block 文档。
- **完整形态**是长期方向，用于指导 Tool Surface、协同编辑和开源项目评估，不作为首期承诺。

## 基础版定位

基础版文档只解决最关键的工作产物沉淀问题：

- VE 可以创建文档并写入结构化内容。
- 用户可以打开、阅读、编辑和补充文档。
- 文档可以被 IM 消息、工作上下文和其他协作工具引用。
- 文档可以被搜索、归档、软删除和版本回退。

基础版不承诺：

- 实时多人协同编辑。
- OT / CRDT 协同算法。
- 完整富文本编辑器能力。
- 复杂评论、批注和修订模式。
- 文档模板市场或高级排版能力。

## 基础版内容模型

基础版采用轻量 Block 文档结构。Block 类型保持克制，优先覆盖 VE 交付常见内容。

| Block 类型 | 说明 |
|-----------|------|
| `heading` | 标题，支持 level 1-3 |
| `paragraph` | 段落 |
| `bullet_list` / `ordered_list` | 列表 |
| `code_block` | 代码块，支持语言标记 |
| `quote` | 引用块 |
| `divider` | 分割线 |
| `callout` | 提示块，支持 info/warning/tip |
| `image` | 图片，引用对象存储 URL |
| `file_card` | 文件附件卡片 |
| `embed_ref` | 简单对象嵌入，引用表格、看板卡片或其他文档 |

示例：

```json
{
  "type": "doc",
  "blocks": [
    {
      "id": "blk_title",
      "type": "heading",
      "attrs": { "level": 1 },
      "text": "Q2 销售分析报告"
    },
    {
      "id": "blk_summary",
      "type": "paragraph",
      "text": "本报告基于 Q2 销售数据整理关键趋势。"
    },
    {
      "id": "blk_data",
      "type": "embed_ref",
      "attrs": {
        "object_type": "bitable",
        "object_id": "btb_xxx",
        "display": "preview_card"
      }
    }
  ]
}
```

## 数据边界

文档对象遵循扩展系统的数据边界：协作应用核心保存通用对象壳，文档扩展保存文档业务数据。

### 核心对象壳

核心对象壳保存：

- `object_id`
- `tool_type = document`
- `tenant_id`
- `organization_id`
- `scope`
- `lifecycle_state`
- `permission_policy`
- `audit_state`
- `search_state`
- `preview_state`

### 文档扩展数据

```sql
CREATE TABLE document_payloads (
    object_id UUID PRIMARY KEY,
    title VARCHAR(512) NOT NULL,
    blocks JSONB NOT NULL DEFAULT '[]',
    plain_text TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    work_context_id UUID,
    created_by_type VARCHAR(16),
    created_by_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY,
    object_id UUID NOT NULL,
    version INTEGER NOT NULL,
    blocks JSONB NOT NULL,
    plain_text TEXT,
    created_by_type VARCHAR(16),
    created_by_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (object_id, version)
);
```

`plain_text` 由扩展从 blocks 中提取，交给协作应用核心统一索引。基础版版本历史采用快照策略，先保证可回退和可审计。

## 基础版 API

VE、用户 UI 和系统任务都通过结构化 Tool Action 操作文档。

| API | 说明 | 基础版语义 |
|-----|------|------------|
| `collab.document.create` | 创建文档 | 创建对象壳和文档扩展数据 |
| `collab.document.update` | 更新文档 | 基于 `base_version` 乐观锁替换 blocks |
| `collab.document.get` | 读取文档 | 返回标题、blocks、版本和权限摘要 |
| `collab.document.search` | 搜索文档 | 走统一搜索，按权限过滤 |
| `collab.document.archive` | 归档文档 | 修改对象生命周期 |

### 创建文档

```json
{
  "title": "Q2 销售分析报告",
  "organization_id": "org_sales",
  "work_context_id": "wc_xxx",
  "blocks": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "text": "Q2 销售分析报告"
    }
  ]
}
```

### 更新文档

基础版更新采用版本号乐观锁，不定义 OT/CRDT 操作格式。

```json
{
  "object_id": "doc_xxx",
  "base_version": 3,
  "blocks": [
    {
      "id": "blk_summary",
      "type": "paragraph",
      "text": "更新后的摘要内容。"
    }
  ]
}
```

冲突时返回当前版本号，调用方重新读取后再提交：

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "current_version": 4,
    "message": "文档已被更新，请基于最新版本重试"
  }
}
```

## Tool Surface

基础版优先使用 Flutter 原生组件和 Schema/Card：

| Surface | 用途 |
|---------|------|
| `flutter_native` | 文档列表、文档阅读、基础编辑 |
| `schema_card` | IM 中的文档预览卡片 |
| `webview_sandbox` | 暂不作为基础版必需项，留给完整形态复杂编辑器 |

文档链接在 IM 中渲染为预览卡片，包含标题、摘要、最近更新者和打开入口。VE 多次连续更新同一文档时，不逐条刷消息，只在阶段完成或需要用户确认时发送摘要。

## VE 使用场景

1. **报告交付**：VE 分析数据后创建文档，写入摘要、分析过程和结论，并在消息中发送文档卡片。
2. **方案草稿**：用户提出需求，VE 先生成方案草稿，用户在文档中补充修改。
3. **知识沉淀**：VE 将多轮讨论整理成文档，并关联相关消息、表格或看板卡片。

## 完整形态方向

完整形态文档面向更复杂的协同办公场景，可能包含：

- 实时多人协同编辑。
- OT 或 CRDT 协同算法。
- 评论、批注、修订和建议模式。
- 更完整的富文本能力。
- 复杂 Block 嵌入和交互式组件。
- 模板、目录、权限继承和文档空间。

完整形态可参考的技术方向包括 ProseMirror/Tiptap、Lexical、Yjs、Automerge 等。它们只作为后续评估对象，不在基础版中锁定选型。

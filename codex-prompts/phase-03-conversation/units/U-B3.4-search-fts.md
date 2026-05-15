# U-B3.4 消息搜索（PostgreSQL FTS）

## 目标 (Goal)

在协作应用服务端实现基于 PostgreSQL 全文搜索（FTS）的消息搜索功能：消息内容索引、关键词搜索 API、搜索结果高亮片段，使得用户可以在频道内或全局搜索历史消息。

## 上下文 (Context)

- 前置：U-B3.1（组织 CRUD API 完成）
- 设计文档：`04-collaboration-app/im-system.md`、`16-technical-specs/data-model-reference.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/service/search.rs | create | 搜索服务（tsvector 查询） |
| crates/collab-server/src/routes/search.rs | create | GET /search/messages?q=&channel_id=&limit= |
| migrations/ | create | messages 表增加 search_vector 列（GIN 索引） |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 使用 PostgreSQL 内置 `tsvector` + `ts_query`（不引入 Elasticsearch）
- 搜索结果按 `tenant_id` 隔离
- 搜索结果返回高亮片段（`ts_headline`），最多 50 条
- 搜索范围：用户有权访问的频道内

## 完成条件 (Done When)

- [ ] 消息插入/更新时自动更新 `search_vector`（触发器或应用层）
- [ ] GET /api/v1/search/messages?q=keyword → 返回匹配消息列表 + 高亮片段
- [ ] 搜索结果受 tenant_id 和频道权限约束
- [ ] 分页支持（offset/limit）
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add message full-text search with PostgreSQL tsvector`

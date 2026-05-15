# U-B1.4 消息反应与线程回复

## 目标 (Goal)

在协作应用服务端实现消息反应（reaction/emoji）和线程回复（thread reply）的后端：数据模型、存储、REST API、WebSocket 广播、数据库迁移。

> Flutter UI 部分在 Phase 2 的 U-B2.5 实现。

## 上下文 (Context)

- 前置：U-B1.3（WebSocket 认证与实时推送）
- 设计文档：`04-collaboration-app/im-system.md`、`04-collaboration-app/technical-design/api-and-protocol.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/reaction.rs | create | Reaction 结构体（message_id、user_id、emoji） |
| crates/collab-server/src/store/reaction.rs | create | ReactionStore trait + PgReactionStore |
| crates/collab-server/src/routes/reaction.rs | create | PUT/DELETE /messages/{id}/reactions |
| crates/collab-server/src/models/message.rs | modify | Message 增加 thread_id 字段 |
| crates/collab-server/src/store/message.rs | modify | 增加按 thread_id 查询 |
| crates/collab-server/src/routes/message.rs | modify | 增加 GET /messages/{id}/thread |
| migrations/ | create | reactions 表、messages.thread_id 迁移 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 反应去重：同一用户对同一消息只能有一种反应，重复操作取消
- 线程回复为一级嵌套（不无限深），thread_id 指向根消息
- reactions 通过 WebSocket 广播（复用 B1.3 广播机制）

## 完成条件 (Done When)

- [ ] PUT /messages/{id}/reactions 添加/取消反应
- [ ] 反应变更通过 WebSocket 广播给频道内用户
- [ ] 消息支持 thread_id，发送线程回复时自动设置
- [ ] GET /messages/{id}/thread 返回线程消息列表
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add message reactions and thread reply backend APIs`

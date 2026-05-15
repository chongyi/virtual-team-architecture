# U-B4.3 上下文数据段构建与标记回写

## 目标 (Goal)

实现协作应用的上下文数据段构建（RAG 预处理 + 消息上下文 segment 组装）和消息标记回写 API（Agent 服务器通过 markers 字段回写 intent、work_context_id 等信息），使得 Agent 每次对话都能获得准确的上下文。

## 上下文 (Context)

- 前置：U-B4.2（VE 联系人接入）
- 设计文档：`04-collaboration-app/context-enhancement.md`、`06-message-and-work-context.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/context/builder.rs | create | 上下文段构建器 |
| crates/collab-server/src/context/rag.rs | create | RAG 预处理 |
| crates/collab-server/src/routes/markers.rs | create | markers 回写 API（PUT /messages/{id}/markers） |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] 上下文段构建：从 channel 中获取最近 N 条消息 + 组织上下文 + 用户信息
- [ ] RAG 预处理：消息文本分段、关键词提取（先简单实现，不做向量检索）
- [ ] Markers 回写：Agent 服务器调用 PUT /messages/{id}/markers 写入 intent、work_context_id
- [ ] Markers 版本冲突检测（基于 version 字段）

### 提交标准

- [ ] `feat(collab): add context segment builder and markers write-back API`

# 对接协议

协作应用服务端与 Agent 服务器接入层之间的协议。这是 Virtual Team 两大子系统的**唯一通信边界**。

## 消息格式

### 协作应用 → Agent 服务器（消息转发）

```json
{
  "message_id": "msg_3fa2b1c4",
  "tenant_id": "tn_xxx",
  "channel": {
    "id": "ch_xxx",
    "type": "direct | group | channel",
    "organization_id": "org_xxx"
  },
  "sender": {
    "type": "user",
    "id": "u_xxx",
    "display_name": "Chongyi"
  },
  "recipient": {
    "type": "virtual_employee",
    "id": "ve_sales_01",
    "mention_type": "direct | at_mention | background"
  },
  "content": {
    "type": "text | rich_text | file",
    "body": "帮我分析一下上季度的销售数据",
    "blocks": [...]
  },
  "context_segment": {
    "recent_work_contexts": [
      {
        "id": "wc_xxx",
        "status": "active",
        "summary": "Q1 销售数据整理"
      }
    ],
    "related_messages": [
      {
        "id": "msg_yyy",
        "sender": "u_xxx",
        "summary": "上次分析的 Q1 销售数据已经存入表格",
        "timestamp": "2026-05-06T15:00:00Z"
      }
    ],
    "organization_context": {
      "org_id": "org_xxx",
      "org_name": "销售部",
      "org_description": "负责销售数据分析与客户管理"
    }
  },
  "markers": {
    "work_context_id": null,
    "intent_hint": null
  },
  "timestamp": "2026-05-07T10:30:00Z",
  "sequence_id": 12345
}
```

### 消息字段说明

| 字段 | 说明 |
|------|------|
| `recipient.mention_type` | `direct` = 1:1 私聊直接消息，`at_mention` = 群组/频道中被 @，`background` = 频道背景消息（不触发响应） |
| `context_segment` | 协作应用构建的上下文数据段，详见 [消息上下文增强](../04-collaboration-app/context-enhancement.md) |
| `markers.intent_hint` | 协作应用的初步意图猜测（可选，意图识别 Agent 可以覆盖） |

## Agent 服务器 → 协作应用（回复）

```json
{
  "reply_to": "msg_3fa2b1c4",
  "sender": {
    "type": "virtual_employee",
    "id": "ve_sales_01",
    "display_name": "销售分析师"
  },
  "content": {
    "type": "rich_text",
    "body": "好的，我来分析Q2的销售数据。预计需要5分钟，完成后会通知你。",
    "blocks": [
      {
        "type": "section",
        "text": { "type": "mrkdwn", "text": "好的，我来分析Q2的销售数据。预计需要5分钟，完成后会通知你。" }
      }
    ]
  },
  "work_context": {
    "id": "wc_new_001",
    "action": "created",
    "summary": "Q2 销售数据分析"
  },
  "timestamp": "2026-05-07T10:30:05Z"
}
```

## 标记回写

虚拟员工通过 Agent 服务器回写消息标记：

```
PUT /api/v1/messages/{message_id}/markers
Authorization: Bearer <agent_server_api_key>
Content-Type: application/json

{
  "work_context_id": "wc_new_001",
  "intent": "new_task",
  "related_message_ids": ["msg_yyy"]
}
```

回写后，协作应用更新消息的 markers 字段并通过 WebSocket 推送 `message.update` 事件给用户客户端。

## Agent 服务器 → 协作应用（主动通知）

虚拟员工可主动发起通知（不回复特定消息）：

```json
{
  "notification": {
    "type": "work_complete | work_failed | approval_required | status_update",
    "sender_ve_id": "ve_sales_01",
    "target_user_id": "u_xxx",
    "target_channel_id": "ch_xxx",
    "content": {
      "type": "work_summary",
      "body": "Q2 销售数据分析完成",
      "blocks": [
        {
          "type": "section",
          "text": { "type": "mrkdwn", "text": "Q2 销售数据分析已完成，详见销售数据看板。" }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": "查看看板",
              "action": "open_bitable",
              "target_id": "bitable_xxx"
            }
          ]
        }
      ]
    },
    "work_context_id": "wc_new_001"
  }
}
```

## 协作应用提供给虚拟员工的操作 API

虚拟员工通过 Agent 服务器调用协作应用的 API。这些 API 不直接暴露协作应用内部实现：

### 消息操作

| API | 说明 |
|-----|------|
| `collab.message.send` | 发送消息到指定频道 |
| `collab.message.reply` | 回复特定消息 |
| `collab.message.react` | 添加 emoji 反应 |

### 协作工具操作

| API | 说明 |
|-----|------|
| `collab.document.create` | 创建协作文档 |
| `collab.document.update` | 更新协作文档 |
| `collab.document.get` | 读取协作文档 |
| `collab.bitable.create` | 创建多维表格 |
| `collab.bitable.insert_rows` | 写入表格行 |
| `collab.bitable.query` | 查询表格数据 |
| `collab.board.create_card` | 创建看板卡片 |
| `collab.board.move_card` | 移动看板卡片（状态流转） |
| `collab.approval.create` | 发起审批请求 |
| `collab.approval.get_status` | 查询审批状态 |

### 组织查询

| API | 说明 |
|-----|------|
| `collab.org.query` | 查询组织结构和成员 |
| `collab.org.list_ve` | 列出组织内的虚拟员工 |

### 调用格式

所有 API 调用通过统一的 RPC 格式：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "collab.document.create",
  "params": {
    "title": "Q2 销售数据分析报告",
    "organization_id": "org_xxx",
    "content": {
      "type": "doc",
      "children": [...]
    }
  }
}
```

## 认证与安全

- Agent 服务器到协作应用的连接使用专用的 **API Key** 认证（非用户 JWT）
- API Key 在 Agent 服务器注册时由协作应用下发，绑定到特定租户
- 协作应用验证所有来自 Agent 服务器的请求：操作是否在授权范围内、目标频道/文档是否属于该租户
- 所有通信通过 TLS 加密

## 错误处理

Agent 服务器到协作应用的调用可能失败。错误处理策略：

| 错误类型 | 处理方式 |
|---------|---------|
| 网络超时 | 指数退避重试，最多 3 次 |
| 权限拒绝 | 不重试，记录审计日志，通知虚拟员工 |
| 资源不存在 | 不重试，虚拟员工自行处理（如创建新文档） |
| 速率限制 | 等待后重试（使用 Retry-After 头） |
| 服务不可用 | 退避重试，超时后降级（虚拟员工回复"暂时无法完成操作"） |

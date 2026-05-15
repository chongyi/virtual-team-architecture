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

虚拟员工通过 Agent 服务器调用协作应用的 API。这些 API 不直接暴露协作应用内部实现，所有协作工具操作都必须进入 Tool Action Gateway，并经过 manifest、权限、审批、审计和配额检查。

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
| `collab.document.search` | 搜索协作文档 |
| `collab.bitable.create` | 创建多维表格 |
| `collab.bitable.add_field` | 添加字段 |
| `collab.bitable.insert_rows` | 写入表格行 |
| `collab.bitable.update_rows` | 更新表格行 |
| `collab.bitable.query` | 查询表格数据 |
| `collab.bitable.export` | 导出表格数据 |
| `collab.board.create_card` | 创建看板卡片 |
| `collab.board.move_card` | 移动看板卡片（状态流转） |
| `collab.board.update_card` | 更新看板卡片 |
| `collab.board.query_cards` | 查询看板卡片 |
| `collab.approval.create` | 发起审批请求 |
| `collab.approval.get_status` | 查询审批状态 |
| `collab.schedule.create` | 创建日程 |
| `collab.schedule.update` | 修改日程 |
| `collab.schedule.delete` | 删除日程 |
| `collab.timer.set` | 创建定时器 |
| `collab.timer.cancel` | 取消定时器 |

### 组织查询

| API | 说明 |
|-----|------|
| `collab.org.query` | 查询组织结构和成员 |
| `collab.org.list_ve` | 列出组织内的虚拟员工 |

### 调用格式

所有 API 调用通过统一 JSON-RPC 格式：

```json
{
  "jsonrpc": "2.0",
  "id": "rpc_123",
  "method": "collab.document.create",
  "params": {
    "title": "Q2 销售数据分析报告",
    "organization_id": "org_xxx",
    "blocks": [
      { "type": "heading", "text": "Q2 销售数据分析报告" }
    ]
  },
  "meta": {
    "idempotency_key": "idem_123",
    "correlation_id": "corr_123"
  }
}
```

## 认证与安全

- Agent 服务器到协作应用的连接使用专用的 **API Key** 认证（非用户 JWT）
- API Key 在 Agent 服务器注册时由协作应用下发，绑定到特定租户
- 协作应用验证所有来自 Agent 服务器的请求：操作是否在授权范围内、目标频道或对象是否属于该租户
- VE 只能调用对应 Extension Manifest 中声明为可暴露给 VE 的 Tool Action
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

## Markers 回写失败重试规范

Agent Server 回写 markers 失败时：

- 网络超时、503 → 指数退避重试，最多 3 次（间隔 1s、2s、4s）
- 409 MESSAGE_MARKER_CONFLICT → 读取最新 markers 后重新评估，决定是否覆盖或放弃
- 403/404 → 不重试，记录审计
- 每次回写失败产生 WARN 级别日志，重试耗尽产生 ERROR 级别

## 验收场景

以下场景是协作应用与 Agent Server 集成的最小可测试场景。全部通过后方可认为对接协议冻结。

### 场景 1：Agent Server 注册后 VE 在线状态可见

```
Given: Agent Server 已启动并注册，创建了 VE ve_test_01 并分配到当前租户
When: 用户在协作应用中查看联系人列表
Then: ve_test_01 显示为在线（online），可被搜索和选择
```

### 场景 2：VE 可加入 direct/group/channel

```
Given: ve_test_01 已注册且在线
When: 用户创建 direct 会话、group 或 channel 并添加 ve_test_01 为成员
Then: ve_test_01 出现在成员列表中，类型为 virtual_employee
```

### 场景 3：Direct 消息可转发到 Agent Server

```
Given: 用户与 ve_test_01 的 direct 会话已创建
When: 用户发送消息"帮我查一下今天的天气"
Then:
  1. 消息在协作应用中正常显示
  2. 消息通过对接协议转发到 Agent Server
  3. 转发的消息包含正确的 tenant_id、channel_id、recipient 和 context_segment
```

### 场景 4：Agent Server 可回写 markers

```
Given: 场景 3 中的消息已转发到 Agent Server
When: Agent Server 调用 PUT /api/v1/messages/{message_id}/markers 回写
  {
    "work_context_id": "wc_test_001",
    "intent": "new_task",
    "related_message_ids": [],
    "expected_marker_version": 0
  }
Then:
  1. 协作应用返回 200 OK，marker_version 更新为 1
  2. 消息的 markers 字段更新
  3. 客户端收到 message.updated 事件（change_kind = markers_updated）
```

### 场景 5：Agent Server 可发送 reply 和主动通知

```
Given: 场景 4 已完成，work_context wc_test_001 已创建
When: Agent Server 发送回复消息（reply_to 指向原消息）
Then:
  1. 回复消息在协作应用中正常显示，sender.type = virtual_employee
  2. 回复消息的 markers 中包含 work_context_id = wc_test_001

When: Agent Server 发送主动通知（work_complete）
Then:
  1. 通知在目标频道中以 work_summary 卡片形式展示
  2. 用户可以点击卡片查看关联的工作产物
```

### 场景 6：Agent Server 不可越权访问

```
Given: ve_test_01 仅加入 channel_A，未加入 channel_B
When: Agent Server 尝试以 ve_test_01 身份发送消息到 channel_B
Then: 协作应用返回 403 Forbidden，审计日志记录越权尝试

Given: ve_test_01 属于 tenant_X
When: Agent Server 的 API Key 绑定 tenant_X，但请求访问 tenant_Y 的资源
Then: 协作应用返回 403 Forbidden，审计日志记录跨租户访问尝试
```

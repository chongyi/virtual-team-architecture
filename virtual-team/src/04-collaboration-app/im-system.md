# IM 通讯系统

协作应用的 IM 系统是一个完整的即时通讯基础设施，而非简单的"消息对接层"。它需要在传统 IM 功能之上扩展 Virtual Team 特有的标记和上下文能力。

## 传输协议

```
客户端 ←→ WebSocket ←→ 协作应用服务端
客户端 ←→ HTTPS REST ←→ 协作应用服务端
```

### WebSocket 实时通道

承载所有实时事件推送和双向通讯。选择 WebSocket 的理由：

- **全双工**：服务端可主动推送（新消息、虚拟员工在线状态变化、工作完成通知）
- **多路复用**：一个连接承载多种事件类型，相比 SSE 更适合复杂场景
- **跨平台兼容**：Flutter Web 兼容性优于 gRPC stream
- **协议栈一致**：与 VTA 内部使用的 JSON-RPC 2.0 over WebSocket 协议栈一致

WebSocket 端点：

```
wss://collab.virtual-team.com/ws?token=<jwt>
```

WebSocket 帧统一使用 JSON 格式，帧结构：

```json
{
  "type": "事件类型",
  "seq": 12345,
  "ts": "2026-05-07T10:30:00Z",
  "data": { }
}
```

### HTTPS REST

用于非实时操作：历史消息拉取、文件上传、配置管理、搜索等。统一 API 前缀 `/api/v1/`，认证通过 `Authorization: Bearer <jwt>`。

主要端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/channels/{id}/messages?before={seq}&limit=50` | 拉取历史消息 |
| `POST` | `/channels/{id}/messages` | 发送消息 |
| `PUT` | `/messages/{id}` | 编辑消息 |
| `DELETE` | `/messages/{id}` | 删除消息 |
| `GET` | `/users/{id}/presence` | 查询在线状态 |
| `POST` | `/files/upload` | 上传文件 |
| `GET` | `/search?q=...&type=...` | 全文搜索 |

## 消息模型

### 消息结构

协作应用层消息结构，在传统 IM 字段基础上扩展 Virtual Team 标记：

```json
{
  "id": "msg_3fa2b1c4",
  "channel_id": "ch_xxx",
  "sender": {
    "type": "user | virtual_employee",
    "id": "u_xxx",
    "display_name": "Chongyi",
    "avatar_url": "https://..."
  },
  "content": {
    "type": "text | rich_text | file | system | approval_card | work_summary",
    "body": "...",
    "blocks": [
      {
        "type": "section",
        "text": { "type": "plain_text | mrkdwn", "text": "..." }
      },
      {
        "type": "divider"
      },
      {
        "type": "context",
        "elements": [{ "type": "mrkdwn", "text": "..." }]
      }
    ]
  },
  "thread_id": null,
  "reply_count": 0,
  "reactions": [
    { "name": "thumbsup", "count": 2, "users": ["u_xxx"] }
  ],
  "markers": {
    "work_context_id": "wc_xxx",
    "intent": "new_task | continuation | simple_reply",
    "related_message_ids": ["msg_yyy"]
  },
  "timestamp": 1714608000,
  "sequence": 12345,
  "edited_at": null
}
```

### 关键字段说明

**`content.blocks` — Block-based 富文本**

参考 Slack Block Kit，使用结构化 JSON 块定义消息布局。支持的 block 类型：

| Block 类型 | 用途 |
|-----------|------|
| `section` | 文本段落，支持 plain_text 和 mrkdwn |
| `divider` | 分割线 |
| `context` | 辅助信息（时间戳、来源标注等） |
| `actions` | 交互按钮组 |
| `image` | 图片展示 |
| `file` | 文件附件卡片 |
| `approval_card` | 审批卡片（Virtual Team 特有） |
| `work_summary` | 工作摘要卡片（Virtual Team 特有） |

相比 HTML 的优势：无 XSS 风险、跨端渲染一致、结构化数据可被 Agent 解析。

**`markers` 扩展字段**

Virtual Team 特有，承载工作上下文关联和意图标记：

| 字段 | 类型 | 说明 |
|------|------|------|
| `work_context_id` | string\|null | 关联的工作上下文 ID |
| `intent` | string\|null | 意图分类（由意图识别 Agent 回写） |
| `related_message_ids` | string[] | 关联消息指针列表 |

这些字段不由用户填写，由意图识别 Agent 通过 API 回写。协作应用在拉取消息时可基于标记快速过滤关联消息。

**`sequence` — 服务端分配序号**

单调递增的频道内消息序号，用于排序和多端同步。每个频道独立计数，服务端原子分配。

**`thread_id` — 线程回复**

通过 `thread_id` 指向父消息，保持频道内扁平存储。参考 Slack 的 parent-pointer 模式——不创建独立的"子频道"，而是在同一个频道内通过 thread 组织回复。

### 消息类型

| `content.type` | 说明 | 渲染方式 |
|---------------|------|---------|
| `text` | 纯文本消息 | 标准文本气泡 |
| `rich_text` | Block-based 富文本 | JSON Block 渲染 |
| `file` | 文件附件 | 文件预览卡片 |
| `system` | 系统通知 | 系统消息样式（居中灰字） |
| `approval_card` | 审批请求 | 交互式审批卡片（同意/拒绝按钮） |
| `work_summary` | 工作摘要 | 结构化工作结果卡片 |

## 频道与消息传播模型

### 频道类型

```
协作应用
├── 1:1 私聊（用户 ↔ 虚拟员工）
├── 1:1 私聊（用户 ↔ 用户）
├── 群组聊天（多用户 + 多虚拟员工）
└── 频道（持久化话题空间，支持按组织归属）
```

虚拟员工作为**联系人**出现在通讯录中，可以被拉入群组或频道。从 IM 架构视角看，虚拟员工与真人用户是同一层级的消息接收者——消息路由时只需区分 `sender.type`，不需要特殊的"bot 通道"。

### 频道数据模型

```json
{
  "id": "ch_xxx",
  "type": "direct | group | channel",
  "name": "general",
  "organization_id": "org_xxx",
  "members": [
    { "type": "user", "id": "u_xxx" },
    { "type": "virtual_employee", "id": "ve_xxx" }
  ],
  "created_at": "2026-01-01T00:00:00Z",
  "last_message_at": "2026-05-07T10:30:00Z",
  "last_message_sequence": 12345
}
```

### 消息传播规则

- **1:1 私聊**：点对点，消息仅对两端可见。用户之间、用户与虚拟员工之间均可
- **群组**：1:N 广播，所有成员可见。支持混合成员（用户 + 虚拟员工）
- **频道**：N:N 广播，频道成员可见。支持按组织归属

虚拟员工仅需知道消息来自谁、在什么上下文中、内容是什么。复杂的意图分析在其内部处理，协作应用只负责准确投递。

### 虚拟员工在频道中的行为

在群组和频道中，虚拟员工需要区分"被 @提及"和"背景消息"：

- **直接 @提及**：等同于 1:1 中的直接消息，触发完整意图分析
- **频道中无 @提及**：作为背景上下文，不触发主动响应
- **被问及但未 @**：由意图识别 Agent 判断是否需要介入

## 多端同步

### 同步机制

每个客户端设备维护独立的 WebSocket 连接。同步依赖服务端分配的单调递增 `sequence` 号：

1. 服务端为每个频道的每条消息分配原子递增的 `sequence` 号
2. 客户端在内存中维护每个频道的 `last_received_sequence`
3. WebSocket 断开重连时，客户端通过 REST 请求缺失的消息

重连同步端点：

```
GET /channels/{id}/sync?since={last_sequence}&limit=100
```

响应包含 `since` 之后的所有消息事件（新消息、编辑、删除），按 `sequence` 升序排列。

### 已读状态

服务端维护每个用户在每频道的 `last_read_sequence`：

```
PUT /channels/{id}/read
{
  "last_read_sequence": 12340
}
```

未读计数 = 频道 `last_message_sequence` - 用户 `last_read_sequence`（仅计算可见消息）。

### 在线状态

在线状态通过 WebSocket 连接生命周期管理：

- 客户端建立 WebSocket → 标记为在线
- WebSocket 断开 → 延迟 30s 后标记为离线（容忍短暂网络抖动）
- 定期 ping/pong（30s 间隔）检测连接存活

虚拟员工的在线状态同理——Agent 服务器建立到协作应用的连接后，虚拟员工在联系人列表中显示为在线。

### 多端消息同步

同一用户可能在多个设备同时在线。服务端向所有在线设备广播事件：

- 新消息：所有设备收到 `message.new` 推送
- 已读状态：一台设备标记已读后，通过 `read_state.updated` 同步到其他设备
- 草稿：客户端本地存储，不同步（简化设计）

## 消息持久化

- 消息持久化到 PostgreSQL，按频道分表或分区
- `channel_id` + `sequence` 复合索引，支持高效范围查询
- 文件附件存储到对象存储（S3 兼容），消息中仅保留 URL 引用
- 消息编辑和删除记录操作日志，不物理删除原消息（append-only）

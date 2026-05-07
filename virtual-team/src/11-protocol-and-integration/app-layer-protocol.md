# 协作应用层协议

用户客户端与协作应用服务端之间的通信协议。这是 Virtual Team 系统中用户直接感知的通信层。

## WebSocket 实时通道

### 连接

```
wss://collab.virtual-team.com/ws?token=<jwt>&version=1
```

连接参数：

| 参数 | 必填 | 说明 |
|------|------|------|
| `token` | ✅ | JWT 认证令牌 |
| `version` | ❌ | 客户端支持的协议版本，默认 1 |

连接建立后，服务端发送 `hello` 帧确认连接：

```json
{
  "type": "hello",
  "seq": 0,
  "ts": "2026-05-07T10:30:00Z",
  "data": {
    "server_version": "1.0.0",
    "session_id": "sess_xxx",
    "user_id": "u_xxx",
    "reconnect_url": "wss://collab.virtual-team.com/ws?token=<new_jwt>&session_id=sess_xxx"
  }
}
```

### 事件帧结构

所有 WebSocket 帧使用统一的 JSON 结构：

```json
{
  "type": "事件类型标识",
  "seq": 12345,
  "ts": "2026-05-07T10:30:00Z",
  "data": { }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 事件类型（见下表） |
| `seq` | uint64 | 全局单调递增事件序号 |
| `ts` | ISO 8601 | 服务端时间戳 |
| `data` | object | 事件负载 |

### 事件类型

#### 消息事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `message.new` | S→C | 新消息通知（含完整消息体） |
| `message.update` | S→C | 消息内容或标记更新 |
| `message.delete` | S→C | 消息删除 |
| `message.send` | C→S | 客户端发送消息 |

`message.send` 请求（客户端 → 服务端）：

```json
{
  "type": "message.send",
  "data": {
    "channel_id": "ch_xxx",
    "content": {
      "type": "rich_text",
      "body": "帮我分析一下销售数据",
      "blocks": [...]
    },
    "thread_id": null,
    "client_msg_id": "client_xxx"
  }
}
```

`message.new` 推送（服务端 → 客户端）：

```json
{
  "type": "message.new",
  "seq": 12345,
  "ts": "2026-05-07T10:30:00Z",
  "data": {
    "id": "msg_xxx",
    "channel_id": "ch_xxx",
    "sender": { "type": "user", "id": "u_xxx", "display_name": "Chongyi" },
    "content": { "...完整消息内容..." },
    "thread_id": null,
    "markers": { "work_context_id": null, "intent": null },
    "timestamp": 1714608000,
    "sequence": 12345
  }
}
```

#### 在线状态事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `presence.change` | S→C | 用户/虚拟员工在线状态变化 |
| `presence.query` | C→S | 查询指定用户的在线状态 |
| `typing` | 双向 | 正在输入指示 |

#### 工作上下文事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `work_context.created` | S→C | 虚拟员工创建了新的工作上下文 |
| `work_context.updated` | S→C | 工作上下文状态变化 |
| `work_context.completed` | S→C | 工作上下文完成 |
| `work_context.failed` | S→C | 工作上下文执行失败 |

#### 频道事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `channel.created` | S→C | 新频道创建 |
| `channel.updated` | S→C | 频道元数据变更 |
| `channel.member_added` | S→C | 成员加入 |
| `channel.member_removed` | S→C | 成员离开 |

#### 系统事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `ping` | C→S | 客户端心跳 |
| `pong` | S→C | 服务端心跳响应 |
| `error` | S→C | 服务端错误通知 |
| `reconnect` | S→C | 服务端主动要求重连 |

### 心跳保活

- 客户端每 30s 发送 `ping` 帧
- 服务端回复 `pong` 帧
- 若服务端 60s 未收到 `ping`，主动关闭连接
- 若客户端 60s 未收到 `pong`，主动触发重连

## HTTPS REST API

用于非实时操作。统一前缀 `/api/v1/`，认证通过 `Authorization: Bearer <jwt>`。

### 消息接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/channels/{id}/messages?before={seq}&limit=50` | 拉取历史消息 |
| `GET` | `/channels/{id}/messages?around={seq}&limit=20` | 以某消息为中心的上下文 |
| `POST` | `/channels/{id}/messages` | 发送消息 |
| `PUT` | `/messages/{id}` | 编辑消息 |
| `DELETE` | `/messages/{id}` | 删除消息（软删除） |
| `GET` | `/messages/search?q=...&channel_id=...&from=...&to=...` | 搜索消息 |

### 频道接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/channels` | 列出用户的所有频道 |
| `POST` | `/channels` | 创建新频道 |
| `PUT` | `/channels/{id}` | 更新频道信息 |
| `POST` | `/channels/{id}/members` | 添加成员 |
| `DELETE` | `/channels/{id}/members/{uid}` | 移除成员 |

### 同步接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/channels/{id}/sync?since={seq}&limit=100` | 获取自某序号后的所有事件 |
| `PUT` | `/channels/{id}/read` | 更新已读状态 |

同步响应示例：

```json
{
  "events": [
    { "type": "message.new", "seq": 12345, "data": { "...消息..." } },
    { "type": "message.delete", "seq": 12346, "data": { "message_id": "msg_yyy" } },
    { "type": "presence.change", "seq": 12347, "data": { "user_id": "u_zzz", "status": "offline" } }
  ],
  "has_more": false,
  "latest_seq": 12347
}
```

### 文件和附件

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/files/upload` | 上传文件（multipart/form-data） |
| `GET` | `/files/{id}` | 下载文件 |
| `GET` | `/files/{id}/thumbnail?size=small` | 获取缩略图 |

### 搜索接口

```
GET /api/v1/search?q=销售数据&type=messages,documents,work_contexts&channel_id=ch_xxx&limit=20
```

响应：

```json
{
  "results": [
    {
      "type": "message",
      "id": "msg_xxx",
      "channel_id": "ch_xxx",
      "highlight": "请帮我分析<em>销售数据</em>的季度趋势",
      "score": 0.92,
      "timestamp": "2026-05-07T10:30:00Z"
    },
    {
      "type": "document",
      "id": "doc_yyy",
      "title": "Q2 销售数据分析报告",
      "highlight": "...<em>销售数据</em>显示Q2环比增长12%...",
      "score": 0.85
    }
  ],
  "total": 42,
  "has_more": true
}
```

## 身份认证

### JWT 令牌

用户登录后获取 JWT token，结构：

```json
{
  "sub": "u_xxx",
  "tenant_id": "tn_xxx",
  "display_name": "Chongyi",
  "iat": 1714608000,
  "exp": 1714694400,
  "iss": "virtual-team"
}
```

- 访问令牌（Access Token）：有效期 24 小时
- 刷新令牌（Refresh Token）：有效期 30 天，用于获取新的 Access Token

### 虚拟员工认证

虚拟员工通过服务端下发的专用 API Key 认证，不通过 JWT。API Key 与服务端绑定，不可用于用户客户端。

## 错误响应格式

所有 REST API 在出错时返回统一格式：

```json
{
  "error": {
    "code": "CHANNEL_NOT_FOUND",
    "message": "频道不存在或无权访问",
    "details": {
      "channel_id": "ch_nonexistent"
    }
  },
  "request_id": "req_xxx"
}
```

### 错误码规范

错误码使用 `UPPER_SNAKE_CASE` 格式，按领域分类：

| 前缀 | 领域 | 示例 |
|------|------|------|
| `AUTH_*` | 认证授权 | `AUTH_TOKEN_EXPIRED`, `AUTH_INSUFFICIENT_PERMISSIONS` |
| `CHANNEL_*` | 频道 | `CHANNEL_NOT_FOUND`, `CHANNEL_ACCESS_DENIED` |
| `MESSAGE_*` | 消息 | `MESSAGE_TOO_LONG`, `MESSAGE_RATE_LIMITED` |
| `FILE_*` | 文件 | `FILE_TOO_LARGE`, `FILE_TYPE_NOT_SUPPORTED` |
| `VE_*` | 虚拟员工 | `VE_OFFLINE`, `VE_CONFIG_INVALID` |
| `RATE_LIMIT_*` | 速率限制 | `RATE_LIMIT_EXCEEDED` |
| `INTERNAL_*` | 内部错误 | `INTERNAL_ERROR` |

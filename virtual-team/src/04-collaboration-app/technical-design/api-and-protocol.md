# API 与协议

## 定位

协作应用对外提供三类协议入口：

- HTTPS REST：资源查询、管理类操作、历史消息、搜索、文件和部分工具对象查询。
- WebSocket：实时消息、事件推送、在线状态、断线重连和多端同步。
- Tool Action / JSON-RPC：用户 UI、系统任务和 VE 调用协作工具扩展的统一动作入口。
- Admin API：管理端使用的独立后台 API，与普通用户端 API 权限域隔离。

第 11 章[协作应用层协议](../../11-protocol-and-integration/app-layer-protocol.md)记录项目级协议口径；本文冻结协作应用基础版实施时需要遵守的接口边界。

## 通用约定

| 项 | 约定 |
|----|------|
| Base URL | `/api/v1` |
| Admin Base URL | `/admin/api/v1` |
| Realtime | `/ws?token=<jwt>&version=1` |
| 用户认证 | `Authorization: Bearer <jwt>` |
| 管理端认证 | 独立 Admin Session / Admin Token，强制 MFA 和 Admin RBAC |
| Agent Server 认证 | 专用 API Key 或服务间 token，绑定租户和权限范围 |
| 请求标识 | 所有入口请求生成或透传 `request_id` |
| 业务关联 | 跨消息、工具动作、通知和 Agent 转发透传 `correlation_id` |
| 幂等 | 写请求必须支持 `client_request_id` 或 `idempotency_key` |
| 时间 | 对外使用 ISO 8601 UTC 字符串 |

客户端不得依赖数据库自增 ID 的具体形态。所有公开资源 ID 使用稳定字符串，如 `msg_`、`ch_`、`obj_`、`doc_`、`ve_` 前缀只是示例，不作为协议强约束。

## Actor 上下文

所有写操作都在 Actor 上下文中执行。

| Actor | 来源 | 说明 |
|-------|------|------|
| User | 用户 JWT | 普通用户、管理员、组织成员 |
| VirtualEmployee | Agent Server API Key + VE 身份 | 虚拟员工通过 Agent Server 调用 |
| System | 服务端内部任务 | 定时器触发、索引任务、系统清理 |

服务端根据认证信息注入 `tenant_id` 和 actor，不信任客户端自行提交的 actor 字段。VE 调用工具时，必须同时校验 Agent Server 权限、VE 成员关系、工具 manifest 暴露范围和目标对象权限。

## IM REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/channels` | 列出当前租户/组织可见频道 |
| `POST` | `/channels` | 创建群组或频道 |
| `GET` | `/channels/{channel_id}` | 获取频道详情 |
| `POST` | `/channels/{channel_id}/members` | 添加成员，用户和 VE 使用同一成员模型 |
| `DELETE` | `/channels/{channel_id}/members/{member_id}` | 移除成员 |
| `GET` | `/channels/{channel_id}/messages?before={sequence}&limit=50` | 拉取历史消息 |
| `POST` | `/channels/{channel_id}/messages` | 发送消息 |
| `PUT` | `/messages/{message_id}` | 编辑自己有权编辑的消息 |
| `DELETE` | `/messages/{message_id}` | 软删除消息 |
| `POST` | `/messages/{message_id}/reactions` | 添加 reaction |
| `DELETE` | `/messages/{message_id}/reactions/{name}` | 移除 reaction |
| `GET` | `/messages/{message_id}/thread` | 拉取线程回复 |
| `PUT` | `/messages/{message_id}/markers` | Agent Server 回写 markers |

发送消息请求必须携带幂等键：

```json
{
  "client_request_id": "cli_req_123",
  "thread_id": null,
  "content": {
    "type": "rich_text",
    "body": "帮我整理一下本周进展",
    "blocks": []
  }
}
```

服务端返回消息权威版本：

```json
{
  "message_id": "msg_123",
  "channel_id": "ch_123",
  "sequence": 42,
  "created_at": "2026-05-11T02:00:00Z",
  "status": "confirmed"
}
```

## WebSocket 事件

WebSocket 帧使用统一 envelope：

```json
{
  "type": "message.created",
  "event_id": "evt_123",
  "seq": 10001,
  "ts": "2026-05-11T02:00:00Z",
  "correlation_id": "corr_123",
  "data": {}
}
```

基础版事件：

| 事件 | 说明 |
|------|------|
| `message.created` | 新消息已持久化 |
| `message.updated` | 消息编辑、软删除或 markers 变化 |
| `message.reaction.updated` | reaction 增删 |
| `channel.updated` | 频道名称、成员、归档状态变化 |
| `presence.updated` | 用户或 VE 在线状态变化 |
| `tool.object.created` | 协作对象创建 |
| `tool.object.updated` | 协作对象内容、生命周期或预览变化 |
| `notification.created` | 系统通知、审批卡片、工作摘要 |
| `sync.required` | 服务端要求客户端按 cursor 补拉 |

事件推送采用 at-least-once 语义。客户端必须按 `event_id` 或 `seq` 去重。

## 同步协议

同步使用两类游标：

| 游标 | 范围 | 用途 |
|------|------|------|
| `event_cursor` | 租户级或连接级 | 补拉所有当前用户可见的实时事件 |
| `channel_sequence` | 频道级 | 拉取频道历史消息和判断消息顺序 |

重连流程：

1. 客户端用 refresh 后的 JWT 重新连接 WebSocket。
2. 客户端提交上次确认的 `event_cursor`。
3. 服务端返回缺失事件；若缺口超过保留窗口，返回 `sync.required`。
4. 客户端调用 REST 同步接口补拉频道和对象状态。
5. 客户端重放 pending outbox，服务端按幂等键去重。

同步接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/sync/events?after={event_cursor}&limit=500` | 补拉事件 |
| `GET` | `/sync/channels/{channel_id}?after={sequence}` | 补拉频道消息 |
| `POST` | `/sync/ack` | 上报客户端已处理游标 |

## 协作对象 API

协作应用核心提供对象壳查询，具体业务操作走 Tool Action。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/objects/{object_id}` | 获取对象壳、权限摘要、预览和引用 |
| `GET` | `/objects?tool_type={type}&scope={scope}` | 列出对象 |
| `POST` | `/objects/{object_id}/archive` | 归档对象，内部仍调用对应扩展动作 |
| `POST` | `/objects/{object_id}/restore` | 恢复对象 |
| `DELETE` | `/objects/{object_id}` | 软删除对象，按权限和审批规则执行 |

对象壳只保存通用元数据；文档 blocks、表格行、看板卡片、审批实例和日程条目由对应扩展保存。

## Tool Action / JSON-RPC

工具动作统一通过 Tool Action Gateway 执行。JSON-RPC 是 VE 和部分客户端高级操作的标准线协议；客户端 UI 也可以使用服务端提供的 REST wrapper，但 wrapper 最终必须映射为 Tool Action。

Endpoint：

```text
POST /api/v1/tool-actions/rpc
```

请求：

```json
{
  "jsonrpc": "2.0",
  "id": "rpc_123",
  "method": "collab.document.update",
  "params": {
    "object_id": "obj_doc_123",
    "base_version": 3,
    "blocks": [
      { "type": "paragraph", "text": "更新后的内容" }
    ]
  },
  "meta": {
    "idempotency_key": "idem_123",
    "correlation_id": "corr_123"
  }
}
```

响应：

```json
{
  "jsonrpc": "2.0",
  "id": "rpc_123",
  "result": {
    "object_id": "obj_doc_123",
    "version": 4,
    "changed": true
  }
}
```

错误：

```json
{
  "jsonrpc": "2.0",
  "id": "rpc_123",
  "error": {
    "code": "TOOL_VERSION_CONFLICT",
    "message": "base_version does not match current object version",
    "retryable": false,
    "details": {
      "current_version": 4
    }
  }
}
```

基础版 VE 可调用动作以各工具 manifest 为准，至少包括：

| 工具 | 动作 |
|------|------|
| 文档 | `collab.document.create`、`collab.document.update`、`collab.document.get`、`collab.document.search`、`collab.document.archive` |
| 多维表格 | `collab.bitable.create`、`collab.bitable.add_field`、`collab.bitable.insert_rows`、`collab.bitable.update_rows`、`collab.bitable.query`、`collab.bitable.export` |
| 看板 | `collab.board.create_card`、`collab.board.move_card`、`collab.board.update_card`、`collab.board.query_cards`、`collab.board.add_comment` |
| 审批 | `collab.approval.create`、`collab.approval.get_status`、`collab.approval.cancel` |
| 日程/定时器 | `collab.schedule.create`、`collab.schedule.update`、`collab.schedule.delete`、`collab.schedule.list`、`collab.timer.set`、`collab.timer.cancel`、`collab.timer.list` |

## 文件与搜索 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/files/upload-intents` | 创建上传意图和对象存储签名 |
| `POST` | `/files/{file_id}/complete` | 上传完成回调，写入附件元数据 |
| `GET` | `/files/{file_id}` | 获取文件元数据和下载权限 |
| `GET` | `/search?q={query}&type={types}` | 搜索消息、对象壳和扩展索引内容 |

搜索结果必须经过权限过滤。搜索索引延迟不可影响权威数据读写。

## Admin API

管理端 API 只供独立 Web 管理端调用，不暴露给普通用户端。Admin API 可以跨租户查询和处理平台事务，但必须进入 Admin RBAC、Admin Audit 和高风险操作审批。

基础分组：

| 分组 | 说明 |
|------|------|
| `/admin/tenants` | 租户检索、状态、封禁/解封、配额调整 |
| `/admin/users` | 用户检索、登录风险、账号状态 |
| `/admin/orgs` | 组织树诊断、成员排查 |
| `/admin/ves` | 虚拟员工、Runtime、Agent Server 连接和停用 |
| `/admin/billing` | 套餐、账单、用量、财务调整 |
| `/admin/extensions` | 第一方扩展状态、版本、迁移和异常对象 |
| `/admin/audits` | 用户审计、VE 审计和 Admin Audit 查询 |
| `/admin/support` | 工单、客服备注和处理记录 |
| `/admin/ops` | 队列、失败任务、死信、索引重建和补偿 |
| `/admin/analytics` | 平台运营指标和报表导出 |

高风险写操作统一封装为 Admin Action：

```json
{
  "action_name": "admin.tenant.suspend",
  "target": {
    "type": "tenant",
    "id": "tn_xxx"
  },
  "reason": "confirmed abuse case from risk review",
  "risk_level": "critical",
  "idempotency_key": "admin_idem_123"
}
```

Admin API 规则：

- 不接受普通用户 JWT。
- 每次写操作写入 Admin Audit。
- 敏感读操作也需要审计，例如数据导出、审计日志导出、账单详情查看。
- `high` 或 `critical` 风险动作必须支持二次确认或审批。
- 管理端不得绕过普通业务模块直接修改私有表。

## 错误语义

错误响应统一包含：

| 字段 | 说明 |
|------|------|
| `code` | 稳定错误码 |
| `message` | 面向开发者的简短说明 |
| `request_id` | 本次请求标识 |
| `correlation_id` | 跨模块业务关联标识 |
| `retryable` | 客户端是否可自动重试 |
| `details` | 结构化补充信息 |

常见错误：

| 错误码 | 场景 | 是否自动重试 |
|--------|------|--------------|
| `AUTH_EXPIRED` | JWT 过期 | 刷新 token 后重试 |
| `PERMISSION_DENIED` | 权限不足 | 否 |
| `CHANNEL_NOT_FOUND` | 频道不存在或不可见 | 否 |
| `MESSAGE_VERSION_CONFLICT` | 消息编辑基线过期 | 否 |
| `TOOL_ACTION_NOT_FOUND` | manifest 未声明动作 | 否 |
| `TOOL_VERSION_CONFLICT` | 工具对象版本冲突 | 否 |
| `APPROVAL_REQUIRED` | 动作需要人类审批 | 否，进入审批流程 |
| `RATE_LIMITED` | 触发限流 | 按 `Retry-After` 重试 |
| `DEPENDENCY_UNAVAILABLE` | 搜索、对象存储、Agent Server 等依赖不可用 | 视具体动作决定 |

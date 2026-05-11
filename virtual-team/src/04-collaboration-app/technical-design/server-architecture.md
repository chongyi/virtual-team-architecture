# 服务端架构

## 定位

协作应用服务端是独立的 IM 与协作平台服务。基础版采用模块化单体优先的方式组织代码，内部以清晰模块边界和事件接口隔离职责；远期可按网关、IM、工具平台、搜索、通知等边界拆分服务。

Agent Server 是外部接入方。协作应用服务端可以向 Agent Server 转发消息、接收 markers 回写、接收 VE 主动通知和代理 VE 调用 Tool Action，但不能把 Agent Server 作为自身核心能力的运行前提。

## 模块视图

```mermaid
flowchart TB
    subgraph edge["入口层"]
        http["HTTP API"]
        ws["WebSocket Gateway"]
        auth["Auth / Tenant Context"]
    end

    subgraph core["核心服务"]
        org["Organization / Member"]
        im["IM Service"]
        sync["Sync Service"]
        file["File Service"]
        object["Object Shell Service"]
        action["Tool Action Gateway"]
        permission["Permission / Approval"]
        audit["Audit Service"]
    end

    subgraph extensions["第一方内置扩展"]
        doc["Document Extension"]
        bitable["Bitable Extension"]
        board["Board Extension"]
        approval["Approval Extension"]
        schedule["Schedule / Timer Extension"]
    end

    subgraph platform["平台能力"]
        search["Search Indexer"]
        notification["Notification Aggregator"]
        context["Context Segment Builder"]
        agent["Agent Adapter"]
        quota["Quota / Rate Limit"]
        obs["Observability"]
    end

    subgraph data["数据层"]
        pg["PostgreSQL"]
        redis["Redis"]
        s3["Object Storage"]
    end

    edge --> core
    im --> context
    im --> agent
    object --> action
    action --> extensions
    action --> permission
    action --> audit
    extensions --> search
    extensions --> notification
    core --> data
    platform --> data
```

## 模块职责

| 模块 | 职责 |
|------|------|
| HTTP API | REST 查询、管理类操作、文件上传签名、Tool Action JSON-RPC 入口 |
| WebSocket Gateway | 连接管理、认证、心跳、事件推送、断线重连 |
| Auth / Tenant Context | JWT/API Key 校验、租户上下文注入、Actor 解析 |
| Organization / Member | 租户、组织、成员、频道成员和虚拟员工成员类型 |
| IM Service | 频道、消息、线程、反应、编辑、软删除、markers 和消息路由 |
| Sync Service | 事件序号、频道 sequence、补拉、去重和多端同步 |
| File Service | 上传签名、附件元数据、对象存储引用、下载权限 |
| Object Shell Service | 协作对象通用壳、生命周期、引用、权限策略和索引状态 |
| Tool Action Gateway | 统一接收用户、系统、VE 的工具动作，调度扩展并写入审计 |
| Permission / Approval | 权限判断、配额、风险等级和审批要求 |
| First-party Extensions | 文档、表格、看板、审批、日程/定时器的业务数据和操作语义 |
| Search Indexer | 消息和工具对象索引调度、权限过滤、重建任务 |
| Notification Aggregator | 消息通知、工具变更摘要、审批卡片和工作摘要聚合 |
| Context Segment Builder | markers、近期消息、组织上下文和相关对象摘要构建 |
| Agent Adapter | 消息转发、markers 回写、VE 主动通知、Tool Action 代理 |
| Observability | request id、日志、指标、追踪和健康检查 |

## 代码边界建议

```text
crates/
├── collab-server/              # 进程入口、配置、Router 装配
├── collab-gateway/             # HTTP / WebSocket / auth middleware
├── collab-domain/              # 共享领域模型、Actor、错误、权限语义
├── collab-im/                  # 频道、消息、线程、markers、presence
├── collab-sync/                # event cursor、sequence、补拉与去重
├── collab-tool-platform/       # Object Shell、Registry、Action Gateway
├── collab-extensions/          # 第一方内置扩展集合
├── collab-search/              # 索引任务与查询
├── collab-notification/        # 通知聚合与投递
├── collab-context/             # context segment 构建
├── collab-agent-adapter/       # Agent Server 对接协议
└── collab-observability/       # tracing、metrics、audit helpers
```

这只是工程边界建议，不要求第一阶段拆成多个独立进程。关键约束是模块之间不能绕过领域接口直接修改彼此数据。

## 核心流程

### 用户发送消息

```mermaid
sequenceDiagram
    participant Client as Client
    participant Gateway as WebSocket/HTTP
    participant IM as IM Service
    participant Sync as Sync Service
    participant Ctx as Context Builder
    participant Agent as Agent Adapter
    participant Store as Store

    Client->>Gateway: message.send + client_request_id
    Gateway->>IM: 校验租户、频道成员和幂等键
    IM->>Store: 持久化消息并分配 channel sequence
    IM->>Sync: 生成 message.created 事件
    IM->>Ctx: 异步构建 context segment
    Ctx-->>Agent: 如需触发 VE，投递消息上下文
    Sync-->>Gateway: 推送事件给在线设备
    Gateway-->>Client: 服务端确认 / 实时回显
```

上下文增强和 Agent 转发不能阻塞消息持久化。Agent Server 不可用时，消息仍然进入频道历史，虚拟员工状态显示离线、排队或失败。

### 工具动作调用

```mermaid
sequenceDiagram
    participant Caller as User/System/VE
    participant Gateway as Tool Action Gateway
    participant Registry as Tool Registry
    participant Perm as Permission
    participant Ext as Extension
    participant Audit as Audit/Search/Notify

    Caller->>Gateway: ToolAction / JSON-RPC
    Gateway->>Registry: 根据 action_name 查找 manifest
    Registry-->>Gateway: handler + action policy
    Gateway->>Perm: 权限、配额、审批检查
    Perm-->>Gateway: allow / deny / approval_required
    Gateway->>Ext: handle_action
    Ext-->>Gateway: ToolResult + changed_objects
    Gateway->>Audit: 写审计、调度索引、聚合通知
    Gateway-->>Caller: ToolResult
```

扩展不得直接向 VE 暴露未声明接口。涉及删除、外发、批量修改、权限变更或高成本执行的动作必须支持 `require_approval`。

### Agent 接入

Agent Adapter 只负责协议边界，不承载虚拟员工推理逻辑。

| 方向 | 能力 | 说明 |
|------|------|------|
| 协作应用 -> Agent Server | 消息转发 | 携带消息、频道、sender、recipient、markers 和 context segment |
| Agent Server -> 协作应用 | 回复消息 | 作为虚拟员工 sender 写入 IM |
| Agent Server -> 协作应用 | markers 回写 | 更新消息与工作上下文的关联 |
| Agent Server -> 协作应用 | 主动通知 | 写入工作摘要、审批卡片或状态消息 |
| Agent Server -> 协作应用 | Tool Action 调用 | 以 VE Actor 身份调用已暴露动作 |

## 内部事件

服务端内部通过领域事件解耦同步、搜索、通知、审计和 Agent 转发。

| 事件 | 产生方 | 消费方 |
|------|--------|--------|
| `message.created` | IM Service | Sync、Search、Notification、Context、Agent Adapter |
| `message.updated` | IM Service | Sync、Search、Context、Agent Adapter |
| `message.deleted` | IM Service | Sync、Search、Audit |
| `message.markers.updated` | IM / Agent Adapter | Sync、Context、Audit |
| `tool.object.created` | Tool Action Gateway | Sync、Search、Notification、Audit |
| `tool.object.updated` | Tool Action Gateway | Sync、Search、Notification、Audit |
| `approval.required` | Permission / Tool Action | Notification、IM |
| `schedule.triggered` | Schedule Extension | Agent Adapter、Notification |

事件至少需要包含 `tenant_id`、`actor`、`request_id`、`correlation_id`、发生时间和资源标识。

## 存储边界

| 存储 | 基础版用途 |
|------|------------|
| PostgreSQL | 权威业务数据、消息、对象壳、扩展数据、权限、审计、索引状态 |
| Redis | WebSocket presence、短期缓存、速率限制、事件 fanout 或任务队列 |
| S3 兼容对象存储 | 文件附件、图片、导出文件和缩略图 |

第一阶段可以使用 PostgreSQL 内置全文搜索作为统一搜索基础。搜索系统不可作为写路径强依赖；索引失败时记录状态并异步重试。

## 部署边界

基础版推荐模块化单体部署：

- 一个协作应用 API/WS 服务进程。
- 一个或多个后台 worker 处理搜索索引、通知聚合、导出、清理和定时任务。
- PostgreSQL、Redis、对象存储作为外部依赖。

当规模扩大时，可优先拆分 WebSocket Gateway、后台 worker、搜索服务和文件服务。拆分后仍必须保持同一协议和同一数据所有权规则。

## 服务端验收标准

- 无 Agent Server 时，登录、频道、消息、搜索和基础协作工具可独立运行。
- 所有写请求具备幂等处理和审计记录。
- 用户、VE 和系统任务调用工具动作都经过同一 Tool Action Gateway。
- 搜索、通知、Agent 转发失败不会回滚已持久化消息或工具对象。
- 每条消息和每个工具动作都能通过 correlation id 串起入口请求、内部事件、审计和后台任务。

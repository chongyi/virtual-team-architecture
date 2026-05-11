# 数据与权限模型

## 定位

本文冻结协作应用基础版的数据边界和权限语义，不冻结具体数据库表结构。实施时可以基于 PostgreSQL 建模，但必须保持本文定义的数据所有权、租户隔离、对象壳、扩展数据和权限路径。

## 数据域

| 数据域 | 权威归属 | 说明 |
|--------|----------|------|
| Tenant / User | 协作应用核心 | 租户、账号、登录态、套餐和基础配置 |
| Organization / Member | 协作应用核心 | 组织树、成员关系、角色、VE 成员投影 |
| Channel / Conversation | IM Service | 私聊、群组、频道、成员、归档状态 |
| Message | IM Service | 消息正文、线程、反应、编辑、软删除、sequence |
| Markers | IM Service | 工作上下文关联和意图标记，由 Agent Server 回写但由协作应用校验保存 |
| File Metadata | File Service | 附件、上传意图、对象存储引用、下载权限 |
| Object Shell | Tool Platform | 协作工具通用对象壳、生命周期、权限策略、审计摘要、索引状态 |
| Extension Data | 对应工具扩展 | 文档 blocks、表格行、看板卡片、审批实例、日程条目 |
| Search Index | Search Service | 消息和工具内容的可检索副本，不是权威数据 |
| Audit Log | Audit Service | 用户、VE、系统任务的关键操作记录 |
| Work Context | Agent Server | 协作应用只保存引用和 markers，不拥有完整工作上下文状态 |

## 核心对象壳

所有协作工具对象都必须拥有核心对象壳。

| 字段 | 说明 |
|------|------|
| `object_id` | 全局唯一对象 ID |
| `tool_type` | `document`、`bitable`、`board`、`approval`、`schedule` 等 |
| `tenant_id` | 租户隔离边界 |
| `organization_id` | 组织归属，可为空表示个人或租户级 |
| `owner` | 创建者或负责主体，包含 actor type 和 actor id |
| `scope` | 可见范围，如组织、频道、工作上下文或私有 |
| `lifecycle_state` | `created`、`active`、`archived`、`deleted` |
| `permission_policy_id` | 对象级权限策略引用 |
| `version` | 乐观并发版本 |
| `audit_state` | 最近操作、风险等级和审计摘要 |
| `search_state` | `pending`、`indexed`、`failed` 等索引状态 |
| `preview_state` | IM 引用卡片和列表展示需要的摘要 |
| `created_by` / `updated_by` | User、VirtualEmployee 或 System Actor |
| `created_at` / `updated_at` | 权威时间戳 |

核心对象壳不得保存工具完整业务内容。扩展数据只能通过对应扩展的 Tool Action 修改。

## 消息模型边界

消息采用 append-only 方向设计：原始消息不物理覆盖，编辑、删除、markers 回写和 reaction 变化都形成可审计变更，并通过事件同步到客户端。

基础消息必须包含：

- `message_id`、`tenant_id`、`channel_id`、`sender`。
- `content`：文本、富文本 blocks、文件、系统消息、审批卡片或工作摘要。
- `thread_id`、`reply_count`、`reactions`。
- `markers`：`work_context_id`、`intent`、`related_message_ids`。
- `sequence`：频道内单调递增序号。
- `created_at`、`edited_at`、`deleted_at`。

消息正文由 IM Service 管理。Agent Server 可以通过受控 API 回写 markers，但不能直接修改消息正文。

## 扩展数据边界

| 工具 | 基础版扩展数据 |
|------|----------------|
| 文档 | 标题、轻量 blocks、版本、评论或批注摘要、引用关系 |
| 多维表格 | 表、字段、行、基础筛选排序配置、导出状态 |
| 看板 | 看板、列表、卡片、排序、负责人、截止时间、评论 |
| 审批 | 审批定义、审批实例、审批人、状态、审批记录 |
| 日程/定时器 | 日程条目、触发规则、触发状态、提醒目标、取消状态 |

扩展可以拥有独立表或 JSONB 结构，但必须遵守：

- 每条扩展数据都能追溯到 `object_id` 或明确的父对象。
- 扩展写入必须由 Tool Action Gateway 发起。
- 扩展变更必须返回 changed objects，供审计、搜索和通知消费。
- 扩展不得保存绕过核心权限的私有可见性规则。

## Actor 与权限

### Actor 类型

| Actor | 来源 | 权限边界 |
|-------|------|----------|
| User | 用户登录态 | 基于租户、组织、频道、对象角色和管理员权限 |
| VirtualEmployee | Agent Server 代调用 | 基于 VE 所属租户、组织/频道成员关系、manifest 暴露动作和运行时工具白名单 |
| System | 服务端内部任务 | 只能执行系统声明的后台任务，必须写审计或系统日志 |

### 权限决策链

每次写操作按以下顺序检查：

1. 认证是否有效，能否解析 tenant 和 actor。
2. actor 是否属于目标租户。
3. actor 是否拥有目标组织、频道或对象的可见性。
4. 操作是否被工具 manifest 声明。
5. VE 是否被允许调用该 action。
6. 操作是否超过租户、组织、用户或 VE 配额。
7. 操作风险等级是否需要审批。
8. 对象版本或消息版本是否满足乐观并发条件。

任何一步失败都不得进入扩展业务写入。

### 基础权限矩阵

| 操作 | User | VirtualEmployee | System |
|------|------|-----------------|--------|
| 发送消息 | 频道成员可发送 | 频道成员且触发/授权范围内 | 系统通知允许 |
| 读取频道历史 | 频道成员按历史策略读取 | 只能读取所在频道且受 context 规则限制 | 后台任务按最小范围读取 |
| 创建对象 | 有组织/频道写权限 | manifest 暴露且 VE 有目标范围权限 | 系统任务允许 |
| 更新对象 | 对象协作者、创建者或管理员 | 对象授权给 VE 或所属工作上下文，且 action 暴露 | 系统任务允许 |
| 删除对象 | 创建者或管理员，必要时审批 | 默认不允许，除非显式配置且审批通过 | 系统清理允许 |
| 导出文件 | 有对象读取和导出权限 | 默认需要显式 action 和配额 | 系统导出任务允许 |
| 发起审批 | 有审批权限 | manifest 暴露且目标范围允许 | 系统触发允许 |

## 租户隔离

租户隔离是数据模型的第一约束。

- 所有权威业务数据必须包含 `tenant_id` 或能通过父对象唯一推导 tenant。
- 所有查询必须注入 tenant 条件，不允许客户端传入 tenant 后由服务端直接信任。
- Agent Server API Key 绑定租户和权限范围，不能跨租户调用。
- 搜索索引、通知队列、对象存储路径和缓存 key 都必须包含租户隔离维度。
- 审计日志不可跨租户查询，除非进入平台运维审计通道。

## 审计模型

审计日志至少记录：

| 字段 | 说明 |
|------|------|
| `audit_id` | 审计记录 ID |
| `tenant_id` | 租户 |
| `actor` | User、VirtualEmployee 或 System |
| `action` | 稳定动作名，如 `collab.document.update` |
| `resource` | 消息、频道、对象、文件或配置 |
| `scope` | 组织、频道、工作上下文等 |
| `risk_level` | `low`、`medium`、`high` |
| `approval_id` | 如本次操作经过审批 |
| `request_id` / `correlation_id` | 请求和业务关联 |
| `result` | success、denied、failed、approval_required |
| `created_at` | 时间 |

审计记录不要求保存大段正文，但必须能定位权威数据和版本。

## 搜索与通知数据

搜索索引和通知摘要都是派生数据。

- 搜索索引可延迟、可重建、可失败重试。
- 搜索结果必须在返回前做权限过滤。
- 通知摘要由核心聚合，扩展只提供可读摘要和预览信息。
- 工具变更不得直接向聊天框刷入大量过程消息。

## 数据模型验收标准

- 任意对象、消息、文件、审计记录都能追溯到 tenant。
- VE 无法通过 Tool Action 访问自己不在成员范围内的频道或对象。
- 文档、表格、看板、审批、日程都通过对象壳统一进入权限、搜索、通知和审计。
- 消息编辑、删除和 markers 回写都有版本或审计记录。
- 搜索索引删除后可以从权威数据重建，不影响用户读取权威对象。

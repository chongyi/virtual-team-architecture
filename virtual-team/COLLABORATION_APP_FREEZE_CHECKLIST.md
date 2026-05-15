# 协作应用方案冻结检查

> 本文件是协作应用方案推进过程中的工作清单，不属于 mdBook 正文内容。`src/` 下文档应保持为项目体系文档与开发实施方案正文。

## 目标

本文用于判断协作应用方案是否已经达到可冻结状态。冻结不是指实现不可变，而是指后续开发可以把当前文档作为稳定契约：不同开发轨道可以基于这些边界并行实现，集成时不需要反复重定义核心概念、协议和数据归属。

协作应用的核心前提是：它是独立成立的 IM 与协作工具系统，虚拟员工系统通过协议接入它，而不是它依赖虚拟员工系统才能运行。

## 冻结原则

| 原则 | 要求 |
|------|------|
| 独立性 | Agent Server 不可用时，协作应用基础 IM、组织、协作工具仍可运行 |
| 协议优先 | 客户端、Agent Server、协作工具都通过明确协议或 trait 交互 |
| 数据归属清晰 | 每类数据必须明确由哪个服务写入、哪个服务只读、哪个服务可回写 |
| Append-only 优先 | 消息和审计类数据默认追加，编辑和删除通过状态字段表达 |
| Agent 特化可选 | markers、context segment、approval_card、work_summary 是增强能力，不破坏普通 IM 模型 |
| 可降级 | 每个外部依赖不可用时都要有明确降级行为 |
| 可验收 | 每个模块都应有最小端到端验收场景 |

## 当前完成度

| 模块 | 当前状态 | 冻结判断 |
|------|----------|----------|
| 总览与定位 | 已明确独立 IM + VE 接入平台双重身份 | 基本可冻结 |
| 架构设计 | 已有客户端、服务端、crate、数据流和技术决策 | 基本可冻结，仍需补充部署形态与模块边界验收 |
| IM 通讯系统 | 已有传输协议、消息模型、频道、同步、在线状态、权限矩阵、消息更新语义 | 接近可冻结，后续可补更细的 API 示例 |
| 上下文增强 | 已有 markers、context segment、RAG 策略、一致性、失败降级和索引更新策略 | 接近可冻结，后续可补重建 API |
| 协作工具 | 已拆分文档、表格、看板、审批、日程、扩展，并补充统一生命周期、权限基线和通知策略 | 接近可冻结 |
| 协议 | app-layer protocol 已较完整 | 需和实现阶段 API 命名保持一致 |
| 数据模型 | 技术规格中已有集中定义 | 需和各章节局部 SQL 保持字段一致 |

## 结构性缺口

### 1. IM 权限矩阵不足

当前 IM 文档说明了频道类型和消息传播规则，但还缺少按角色和成员类型展开的权限矩阵。

需要补充：

- 用户、虚拟员工、系统成员分别能否创建频道、邀请成员、发消息、编辑消息、删除消息。
- direct、group、channel 三类频道的成员可见性。
- 虚拟员工在频道背景消息中的监听权限和触发规则。
- thread 回复是否继承父消息权限。
- 删除频道、移除成员、归档频道的权限规则。

### 2. 消息编辑与删除语义不足

当前确定了 append-only 和软删除方向，但需要冻结事件语义：

- `message.update` 是否只允许更新 content，还是可更新 markers。
- 用户编辑消息后，是否重新触发上下文增强和 Agent 分析。
- 删除消息后，已关联的 work_context 是否保留引用。
- markers 回写冲突时采用覆盖、合并还是版本检查。
- 客户端离线重放时如何处理 update/delete 顺序。

### 3. Context Segment 一致性需要补充

上下文增强服务前移了 Agent 上下文构建，这是正确方向，但需要冻结失败模式：

- RAG 服务不可用时是否只携带 markers 和最近消息。
- markers 为空但语义检索命中多个工作上下文时如何排序。
- context segment 是一次性快照还是可被后续刷新。
- Agent Server 是否可以拒绝协作应用提供的 context segment 并请求重建。
- related messages 的摘要由谁生成、何时更新、是否可缓存。

### 4. 协作工具统一生命周期不足

各工具已有独立模型，但缺少统一状态口径：

- 文档、表格、看板、审批、Schedule/Timer 的创建、归档、删除、恢复规则。
- 工具对象与 work_context 的绑定是否可变更。
- VE 修改协作工具对象时是否需要写入审计事件。
- 用户和 VE 同时修改时的冲突处理。
- 协作工具通知到 IM 的规则，避免刷屏。

### 5. Agent 接入边界需要独立验收

协作应用作为被接入方，需要定义 Agent Server 接入的最小验收：

- Agent Server 注册成功后，虚拟员工在线状态可见。
- 虚拟员工可加入 direct/group/channel。
- 用户发 direct 消息后，消息可转发到 Agent Server。
- Agent Server 可回写 markers。
- Agent Server 可发送 reply 和主动通知。
- Agent Server 不可越权访问其他 Tenant、频道或协作工具对象。

## 文档拆分建议

当前协作工具已经完成合理拆分，不建议再合并回单文件。

后续当文档继续增长时，建议按以下阈值拆分：

| 当前文档 | 拆分触发 | 建议拆分方向 |
|----------|----------|--------------|
| `im-system.md` | 超过 350 行或权限/状态机明显增多 | `message-model.md`、`channel-and-membership.md`、`sync-and-presence.md` |
| `context-enhancement.md` | 超过 250 行或 RAG/markers 细节扩张 | `markers.md`、`context-segment.md`、`search-index.md` |
| `architecture.md` | 实现细节继续增加 | `client-architecture.md`、`server-architecture.md` |
| `collaboration-tools/overview.md` | trait/API 表继续扩张 | 保持 overview 简洁，将通用权限和生命周期拆到 `collaboration-tools/lifecycle-and-permission.md` |

## 冻结检查清单

### 产品边界

- [x] 无 Agent Server 时，IM、组织、协作工具路径完整。
- [x] Agent Server 不可用时，虚拟员工显示离线，普通消息不受影响。
- [x] 虚拟员工作为联系人而非 Bot 通道的模型已贯穿 IM、频道和在线状态。
- [x] 用户可见的 Agent 特化能力只表现为消息类型、markers、工作上下文视图和 VE 管理界面。

### 协议边界

- [x] WebSocket 事件和 REST API 覆盖消息、频道、文件、搜索、组织、VE 管理、协作工具。
- [x] Agent Server 对接协议覆盖消息转发、回复、主动通知、markers 回写。
- [x] 所有协议有版本字段或版本协商路径。
- [x] 所有写接口有幂等键或冲突处理语义。
- [x] 错误码与 `16-technical-specs/error-handling.md` 对齐。

### 数据边界

- [x] 所有业务表包含 `tenant_id` 或能从父实体强约束到 Tenant。
- [x] 消息、频道、协作工具、markers、work_context 关联字段与数据模型参考一致。
- [x] 消息编辑和删除不破坏 append-only 审计能力。
- [x] 搜索索引的数据来源、更新时机和权限过滤明确。
- [x] context segment 不作为权威数据，只作为转发时快照。

### 状态边界

- [x] 频道成员、在线状态、消息已读、线程回复的状态变更事件明确。
- [x] 协作工具对象的生命周期明确。
- [x] Schedule/Timer 触发、取消、过期、失败的状态明确。
- [x] 审批卡片与审批流状态机一致。
- [x] Agent Server 断连、重连、恢复后的虚拟员工在线状态明确。

### 降级与失败

- [x] Agent Server 不可用时不影响普通 IM。
- [x] RAG 不可用时 context segment 降级为 markers + recent messages。
- [x] 对象存储不可用时文件上传失败有用户可见提示。
- [x] 搜索不可用时不影响消息收发。
- [x] WebSocket 断开后客户端可通过 REST sync 补齐事件。
- [x] markers 回写失败时 Agent Server 有重试和审计记录。

### 验收场景

- [x] 用户注册后进入个人 Tenant，可创建 direct/group/channel。
- [x] 两个客户端登录同一账号，消息、已读、编辑、删除可同步。
- [x] 创建虚拟员工占位联系人，可加入频道并显示在线状态。
- [x] Agent Server mock 接入后，可完成消息转发、回复、markers 回写。
- [x] 用户创建文档/表格/看板，VE mock 可通过平台工具 API 创建或更新对象。
- [x] 发起审批后，用户可在 IM 卡片中同意/拒绝，状态可同步到调用方。
- [x] Schedule/Timer 到点后可向 Agent Server 投递触发事件。

## 解决记录

冻结检查清单全部项已于 2026-05 解决。具体变更：

1. `im-system.md`：补充了按成员类型展开的权限矩阵、消息编辑/删除精确事件语义、离线重放排序规则、markers 回写冲突策略。
2. `context-enhancement.md`：补充了 RAG 不可用时的降级策略、多个 work context 排序规则、context segment 快照与重建机制、关联消息摘要生命周期。
3. `api-and-protocol.md`：补充了 `message.updated` 事件细分（content_edited/soft_deleted/markers_updated）、各变更类型的 WebSocket 事件示例。
4. `collaboration-tools/overview.md`：统一生命周期规则中增加了审计要求、乐观锁冲突处理、通知聚合窗口等约束。
5. `integration-protocol.md`：新增 6 个集成验收场景和 markers 回写失败重试规范。
6. `error-handling.md`：错误码新增 `MessageVersionConflict`、`MessageMarkerConflict` 以匹配协议中的冲突处理语义。

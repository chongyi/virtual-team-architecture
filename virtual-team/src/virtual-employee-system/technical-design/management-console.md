# 虚拟员工管理方案

## 管理范围

VE 管理涉及两个层面，通过不同界面承载：

| 层面 | 承载界面 | 操作者 |
|------|---------|--------|
| **用户侧管理** | 协作应用客户端（VE 管理面板） | 租户用户 |
| **平台侧管理** | 管理端 Web 应用（Admin API） | 平台运营 |

本文覆盖两者：用户侧管理是 VE 系统提供的功能需求，平台侧管理是独立管理端的扩展。

## 用户侧管理

协作应用客户端中的 VE 管理面板提供以下功能：

### VE 入职引导

新 VE Runtime 创建后的入职流程：

1. **基本设置**：用户为 VE 命名、选择头像、分配归属组织
2. **Duty 定义**：用户以自然语言描述 VE 的岗位职责（系统生成结构化 Duty 配置草稿，用户确认或编辑）
3. **权限确认**：展示配置包声明的工具权限，用户可收窄（不可放宽）
4. **WEN 分配**：选择在线的工作环境节点（如只有一个在线节点则自动分配）
5. **激活**：入职完成后 VE 进入 Idle 状态，在联系人列表中显示为在线

### VE 日常管理

| 功能 | API | 说明 |
|------|-----|------|
| 查看 VE 列表 | `GET /api/v1/ves?tenant_id=` | 按组织过滤 |
| VE 详情（状态、统计） | `GET /api/v1/ves/{ve_id}` | 含活跃工作上下文数、token 用量 |
| 编辑 Duty | `PUT /api/v1/ves/{ve_id}/config` | 更新岗位职责 |
| 编辑行为规范 | `PUT /api/v1/ves/{ve_id}/config` | 通信风格、主动性级别 |
| 查看工作历史 | `GET /api/v1/ves/{ve_id}/work-contexts?status=archived` | 已完成的任务摘要 |
| 查看 Runtime Data | `GET /api/v1/ves/{ve_id}/data` | 记忆、偏好、学习行为 |
| 暂停 VE | `POST /api/v1/ves/{ve_id}/suspend` | 暂停后不响应消息 |
| 移除 VE | `POST /api/v1/ves/{ve_id}/unmount` | 归档所有工作上下文后移除 |
| 升级配置包 | `POST /api/v1/ves/{ve_id}/upgrade-config` | 用户手动确认后升级 |

### 监控面板

VE 管理面板中的每个 VE 卡片展示：

- 在线状态 + 当前活跃工作上下文数
- 过去 7 天完成任务数、平均完成时间
- 本月 token 用量和预估费用
- 最近错误或审批请求

## 平台侧管理

平台侧管理覆盖跨租户的 VE 运营和治理：

### VE 全局管理

| 功能 | 说明 |
|------|------|
| 配置包注册表 | 审核和下架第三方配置包 |
| VE 实例全局注册表 | 查看所有活跃的 VE Instance 及其 Runtime 分布 |
| Runtime 跨租户查询 | 了解哪个租户安装了哪个配置包，用于兼容性通知 |
| 异常 VE 标记 | 标记行为异常的 VE 实例（滥用、提示注入受攻击） |

### VE 资源治理

| 功能 | API | 说明 |
|------|-----|------|
| 租户配额管理 | `PUT /admin/api/v1/tenants/{id}/quota` | 修改 VE 数量、并发上限 |
| Runner 节点管理 | `GET /admin/api/v1/runners` | Runner 列表、负载、健康状态 |
| VE Runner 调度 | `POST /admin/api/v1/runners/{id}/drain` | 优雅驱逐 Runner 上的 VE |
| LLM 用量监控 | `GET /admin/api/v1/reports/llm-usage` | 按租户、按模型类别的 token 用量报表 |

### 高风险操作治理

| 操作 | 审批要求 | 审计 |
|------|---------|------|
| 修改租户配额 | Admin RBAC + MFA | Admin Audit |
| 下架配置包 | Admin RBAC | Admin Audit |
| 强制移除 VE | Admin RBAC + 二次确认 | Admin Audit |
| 跨租户数据查询 | Admin RBAC + 审批 + 理由 | Admin Audit |
| Runner 驱逐 | Admin RBAC | Admin Audit |

## 与协作应用管理端的关系

VE 系统的平台侧管理是[协作应用管理端](../../04-collaboration-app/technical-design/admin-console.md)的扩展模块——复用同一 Admin API 前缀（`/admin/api/v1`）、同一 Admin RBAC 体系、同一 Admin Audit 基础设施。

VE 管理作为一个功能模块（`features/ve/`）嵌入管理端 Web 应用，不能自建独立的后台系统。

## 管理 API 认证

- 用户侧管理 API：使用用户 JWT（含 `tenant_id`），只能操作自己 Tenant 的 VE
- 平台侧管理 API：使用 Admin Session / Admin Token，强制 MFA 和 Admin RBAC
- VE 系统内部管理 API（如 Runner 管理）：使用 Agent 服务器内部服务间 token

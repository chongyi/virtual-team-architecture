# 虚拟员工系统数据与权限模型

## 数据边界

VE 系统的数据分为两层权威归属：

| 数据 | 权威来源 | 存储位置 | 说明 |
|------|----------|---------|------|
| VE 注册表 | Agent 服务器 | PostgreSQL | 全局 VE Instance 的定义和配置包引用 |
| VE Runtime 状态 | Agent 服务器 | PostgreSQL | Runtime 生命周期状态、租户路由 |
| Runtime Config | Agent 服务器 | PostgreSQL（JSONB） | Duty、附加 Prompt、行为规范 |
| Runtime Data | Agent 服务器 | PostgreSQL（JSONB） | 记忆、偏好、工作历史摘要 |
| VTA Session/Message | VE Runner（VTA） | SQLite | 单 VE 的对话历史 |
| WorkContext | Agent 服务器 | PostgreSQL | 工作上下文的状态和关联 |
| WEN 路由表 | Agent 服务器 | PostgreSQL | 工作环境节点的注册和状态 |
| 消息 markers | 协作应用 | PostgreSQL | Agent Server 通过回写 API 更新 |

VE 系统不直接读写协作应用的 IM 消息表、频道表或文档表。所有写入通过对接协议回调协作应用 API。

## 核心实体扩展

以下实体在[数据模型参考](../../16-technical-specs/data-model-reference.md)的集中定义基础上，补充 VE 系统实现所需的字段细节和索引策略。集中定义是权威来源，本文的扩展是实施口径。

### WorkContext 详细字段

```sql
CREATE TABLE work_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ve_id UUID NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'new',
    -- 'new', 'active', 'paused', 'fork', 'archived'

    -- 启动方式
    initiation_type VARCHAR(16) NOT NULL DEFAULT 'message',
    -- 'message', 'schedule', 'duty', 'hook'

    -- 任务信息
    summary TEXT,
    task_description TEXT,
    task_type VARCHAR(32),
    priority VARCHAR(8) NOT NULL DEFAULT 'normal',

    -- 关联资源
    organization_id UUID,
    channel_id UUID,
    linked_message_ids UUID[] DEFAULT '{}',
    linked_document_ids UUID[] DEFAULT '{}',
    linked_bitable_ids UUID[] DEFAULT '{}',

    -- Fork
    parent_work_context_id UUID,
    fork_checkpoint JSONB,

    -- WEN 绑定
    wen_id UUID,

    -- VTA Session 映射
    vta_sessions JSONB NOT NULL DEFAULT '[]',
    -- [{"session_id": "sess_xxx", "type": "main|intent|sub", "status": "active|archived", "token_used": 12345}, ...]

    -- Compaction
    compaction_count INTEGER NOT NULL DEFAULT 0,
    last_compaction_at TIMESTAMPTZ,

    -- 统计
    total_turns INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    total_tool_calls INTEGER DEFAULT 0,
    total_sub_agents INTEGER DEFAULT 0,

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    -- 索引
    INDEX idx_wc_tenant_ve (tenant_id, ve_id, status),
    INDEX idx_wc_tenant_active (tenant_id, last_active_at DESC)
        WHERE status IN ('active', 'paused'),
    INDEX idx_wc_parent (parent_work_context_id),
    INDEX idx_wc_org (organization_id),
    INDEX idx_wc_channel (channel_id)
);
```

### Runtime Config 结构化定义

```json
{
  "ve_id": "ver_xxx",
  "tenant_id": "tn_xxx",
  "version": 1,

  "duty": {
    "summary": "负责 Q2 销售数据的追踪、分析和报告",
    "responsibilities": [
      "每周一生成上周销售汇总报告",
      "监控关键 SKU 的库存与销售匹配",
      "发现异常数据波动时主动告警"
    ],
    "organization_scope": "org_sales",
    "report_to_ve": "ve_assistant_01",
    "check_interval_minutes": 30
  },

  "behavior": {
    "additional_prompt": "你是一个资深销售分析师，分析风格偏重数据驱动和可视化表达。回复用户时优先以表格或图表形式呈现结论。",
    "communication_style": "professional",
    "initiative_level": "proactive",
    "language": "zh-CN",
    "timezone": "Asia/Shanghai"
  },

  "constraints": {
    "max_concurrent_work_contexts": 3,
    "max_tokens_per_turn": 8192,
    "max_tool_calls_per_turn": 10,
    "max_sub_agents": 3,
    "approval_required_for": ["file_delete", "send_external_message"]
  },

  "schedule_hooks": [
    {
      "name": "weekly_report",
      "cron": "0 9 * * 1",
      "action": "generate_sales_report",
      "description": "每周一早 9 点生成上周销售报告"
    }
  ],

  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-10T10:00:00Z",
  "updated_by": "u_xxx"
}
```

### Runtime Data 结构化定义

```json
{
  "ve_id": "ver_xxx",
  "tenant_id": "tn_xxx",
  "version": 5,

  "memories": [
    {
      "id": "mem_001",
      "type": "user_preference",
      "content": "用户偏好数据以表格形式呈现，避免纯文字描述",
      "confidence": 0.92,
      "source_work_context": "wc_xxx",
      "created_at": "2026-05-03T10:00:00Z"
    }
  ],

  "learned_behaviors": [
    {
      "id": "lb_001",
      "pattern": "每次生成报告后用户都会要求补充趋势对比图",
      "adaptation": "生成报告时自动附带趋势对比可视化",
      "confidence": 0.85
    }
  ],

  "work_history_summary": {
    "total_completed": 12,
    "total_failed": 1,
    "avg_completion_time_minutes": 8.5,
    "most_common_task_type": "data_analysis",
    "user_satisfaction_score": 4.2
  }
}
```

## 权限模型

### VE 权限声明

VE 的能力边界在配置包中声明，由 Agent 服务器在执行时强制执行。权限声明遵循最小授权原则——声明了不代表一定有，还需 Runtime Config 和运行时上下文收窄。

```toml
[remote.filesystem]
read = ["/workspace"]
write = ["/workspace"]
deny = ["/etc", "/usr", "/.ssh", "/.aws"]

[remote.tools]
allowed = ["file_read", "file_write", "shell_exec", "web_search"]
require_approval = ["shell_exec", "file_delete"]
deny = ["system_shutdown"]

[platform.tools]
allowed = ["send_message", "create_document", "query_org", "schedule.create"]
require_approval = ["invite_user_to_channel"]
deny = ["delete_organization"]
```

### 权限执行链

```
VE 工具调用请求
  → Agent 服务器拦截
  → 检查配置包声明的权限白名单
  → 检查 Runtime Config 是否进一步收窄
  → 检查当前 work_context 是否对目标资源有访问权
  → 检查是否需要审批 → 如需要，发起审批请求给用户
  → 通过 → 转发到 WEN（远程工具）或协作应用 API（平台工具）
```

### 跨租户隔离保证

- Agent 服务器所有查询通过 `TenantScopedStore` trait 自动附加 `WHERE tenant_id = $current_tenant`
- 消息路由前验证 `message.tenant_id == ve_runtime.tenant_id`
- VE 不能通过工具调用访问其他租户的协作应用资源
- 跨租户访问尝试记录为严重审计事件（`tenant.cross_access_attempt`）

## 索引策略

VE 系统专有数据的索引策略：

| 表 | 核心索引 | 说明 |
|----|---------|------|
| work_contexts | `(tenant_id, ve_id, status)` | 按租户和 VE 查询活跃工作上下文 |
| work_contexts | `(tenant_id, last_active_at DESC) WHERE status IN ('active','paused')` | 热数据查询 |
| virtual_employees | `(tenant_id, status)` | 按租户查询 VE |
| virtual_employees | `(status, last_active_at)` | 冷热调度扫描 |
| ve_wen_bindings | `(ve_id, wen_id) WHERE released_at IS NULL` | 活跃绑定查询 |
| audit_events | `(tenant_id, created_at DESC)` | 按租户审计查询 |

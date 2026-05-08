# 审批流

审批流让用户对 VE 的高危操作有决策权——VE 发起审批，用户在 IM 中通过卡片一键同意或拒绝。

## 设计动机

VE 虽然是自主工作的 Agent，但某些操作需要人类确认：
- 代码执行、文件删除、外部 API 调用等高危操作
- 超过一定金额的决策
- 涉及敏感数据的操作

审批是 VE 权限模型的一部分——不是所有操作都需要审批，由配置包的 `permissions.toml` 和 Runtime Config 共同决定。

## 数据模型

```sql
CREATE TABLE approval_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,

    -- 表单定义
    form_schema JSONB NOT NULL DEFAULT '{}',

    -- 流程定义
    flow_config JSONB NOT NULL,
    -- { "steps": [...], "rules": [...] }

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID REFERENCES approval_templates(id),

    -- 审批内容
    title VARCHAR(512) NOT NULL,
    description TEXT,
    form_data JSONB NOT NULL DEFAULT '{}',
    -- 用户/VЕ 填写的表单数据

    -- 来源
    ve_runtime_id UUID,              -- 发起审批的 VE
    work_context_id UUID,
    channel_id UUID,                 -- 审批消息发送到的频道

    -- 流程状态
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    -- 'pending', 'approved', 'rejected', 'expired', 'cancelled'
    current_step INTEGER NOT NULL DEFAULT 0,

    -- 结果
    decided_by UUID,                 -- User ID
    decided_at TIMESTAMPTZ,
    decision_comment TEXT,

    -- 会话记住
    remember_in_session BOOLEAN NOT NULL DEFAULT false,

    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    INDEX idx_approvals_tenant (tenant_id, status),
    INDEX idx_approvals_ve (ve_runtime_id, status),
    INDEX idx_approvals_expires (expires_at) WHERE status = 'pending'
);

-- 审批步骤记录
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    approver_type VARCHAR(16) NOT NULL,
    -- 'user', 'role'

    -- 如果 approver_type = 'user'
    approver_user_id UUID,
    -- 如果 approver_type = 'role'
    approver_role VARCHAR(32),

    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    decided_at TIMESTAMPTZ,
    decision VARCHAR(16),             -- 'approved', 'rejected'
    comment TEXT,

    UNIQUE (approval_id, step_index)
);
```

## 流程引擎

### 流程定义示例

```json
{
  "flow_config": {
    "type": "sequential",
    "steps": [
      {
        "name": "直接主管确认",
        "approver": { "type": "role", "role": "tenant_admin" },
        "timeout_minutes": 60,
        "auto_approve_on_timeout": false
      },
      {
        "name": "最终确认",
        "approver": { "type": "user", "user_id": "u_owner" },
        "timeout_minutes": 120,
        "auto_approve_on_timeout": false
      }
    ],
    "rules": [
      {
        "condition": "form_data.amount < 1000",
        "skip_steps": [1]
      }
    ]
  }
}
```

### 流程类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `sequential` | 顺序审批，步骤依次执行 | 多级审批 |
| `parallel` | 并行审批，所有步骤同时进行 | 多方会签 |
| `single` | 单人审批（默认） | 简单确认 |

## 审批卡片

审批以特殊的 IM 消息类型 `approval_card` 在频道中呈现：

```json
{
  "type": "message.new",
  "data": {
    "id": "msg_approval_xxx",
    "channel_id": "ch_xxx",
    "sender": { "type": "virtual_employee", "id": "ver_sales_01" },
    "content": {
      "type": "approval_card",
      "approval_id": "appr_xxx",
      "title": "执行数据分析脚本",
      "description": "即将在本地执行 `python analyze.py --full`，预计耗时 60s",
      "status": "pending",
      "form_data": {
        "script": "analyze.py",
        "params": "--full",
        "target_dir": "/workspace/projects/sales"
      }
    }
  }
}
```

用户在 IM 中看到卡片，直接在卡片上点击**"同意"**或**"拒绝"**，无需跳转到其他页面。

## API

### VE 可调用的 API

| API | 说明 |
|-----|------|
| `collab.approval.create` | 发起审批 |
| `collab.approval.get_status` | 查询审批状态 |
| `collab.approval.cancel` | 取消自己发起的审批 |

### 发起审批

```json
// collab.approval.create
{
  "title": "执行数据导出脚本",
  "description": "即将导出客户数据到 CSV，涉及敏感字段：姓名、手机号",
  "form_data": {
    "operation": "shell_exec",
    "command": "python export_customers.py",
    "risk_level": "high"
  },
  "channel_id": "ch_direct_xxx",
  "timeout_minutes": 5
}
```

### REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/approvals/{id}/decide` | 用户做出审批决定 |
| `GET` | `/api/v1/approvals/{id}` | 查询审批详情 |
| `GET` | `/api/v1/approvals?status=pending` | 列出待审批项 |

### 审批决定

```json
// POST /api/v1/approvals/{id}/decide
{
  "decision": "approved",
  "comment": "可以执行，注意脱敏处理",
  "remember_in_session": true   // 本次工作上下文内同类操作不再审批
}
```

## 审批超时

- 默认超时时间：5 分钟
- 超时后自动拒绝
- 用户可配置默认超时
- VE 收到超时结果后可将拒绝结果注入上下文，调整执行策略

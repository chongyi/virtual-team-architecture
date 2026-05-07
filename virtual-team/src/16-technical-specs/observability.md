# 可观测性设计

## 概述

Virtual Team 的可观测性基于三大支柱：**日志（Logging）**、**指标（Metrics）**、**链路追踪（Tracing）**。所有服务组件统一接入可观测性基础设施。

## 技术选型

| 支柱 | 技术 | 说明 |
|------|------|------|
| 日志 | `tracing` crate (Rust) → OpenTelemetry → Loki / Elasticsearch | 结构化 JSON 日志 |
| 指标 | `metrics` crate → Prometheus → Grafana | 应用与业务指标 |
| 链路追踪 | OpenTelemetry → Jaeger / Tempo | 分布式追踪 |
| 仪表盘 | Grafana | 统一可视化 |
| 告警 | Grafana AlertManager / PagerDuty | 多通道告警 |

## 日志规范

### 日志级别使用约定

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| **ERROR** | 需要立即关注的问题：服务崩溃、数据丢失、安全事件 | VE 创建失败、跨租户访问尝试、数据库连接丢失 |
| **WARN** | 潜在问题或降级行为：重试成功、资源接近上限、配置缺失 | VE 冷启动、审批超时、速率限制触发、WEN 心跳延迟 |
| **INFO** | 关键业务事件：状态变更、操作完成、生命周期事件 | VE 创建/销毁、工作上下文完成、用户登录 |
| **DEBUG** | 开发调试信息：详细的请求/响应、中间状态 | 工具调用参数、Session 创建详情、路由表更新 |
| **TRACE** | 极度详细的逐行追踪：仅本地开发环境开启 | VTA Turn 的每次 LLM 交互原始内容 |

### 日志结构

所有日志使用结构化 JSON 格式：

```json
{
  "timestamp": "2026-05-07T10:30:00.123Z",
  "level": "INFO",
  "target": "agent_server::ve_mgmt",
  "span": {
    "trace_id": "abc123",
    "span_id": "def456"
  },
  "fields": {
    "tenant_id": "tn_xxx",
    "ve_id": "ve_sales_01",
    "message": "VE mounted successfully",
    "config_package": "sales-analyst@1.2.0",
    "runner_id": "runner_01",
    "duration_ms": 2340
  }
}
```

### 关键日志字段

| 字段 | 说明 | 必含 |
|------|------|------|
| `tenant_id` | 租户 ID | ✅ 所有多租户操作 |
| `ve_id` | 虚拟员工 ID | VE 相关操作 |
| `work_context_id` | 工作上下文 ID | 工作上下文相关操作 |
| `trace_id` | 分布式追踪 ID | ✅ 所有请求 |
| `request_id` | 请求 ID | API 请求 |
| `duration_ms` | 操作耗时 | 涉及外部调用的操作 |

### 敏感数据脱敏

- LLM 请求/响应的完整内容：仅在 TRACE 级别记录，生产环境关闭
- 用户消息内容：不在日志中记录原始文本，记录消息 ID 和长度
- API Key、Token：**禁止**在任何日志级别出现
- 文件路径：记录相对于工作空间的路径，而非绝对路径

## 指标

### 应用指标

| 指标名 | 类型 | 标签 | 说明 |
|--------|------|------|------|
| `vt_messages_received_total` | Counter | `tenant_id`, `channel_type` | 消息接收总数 |
| `vt_messages_sent_total` | Counter | `sender_type` | 消息发送总数（按 user/ve 分类） |
| `vt_ve_active_count` | Gauge | `runner_id` | 当前活跃 VE 数 |
| `vt_ve_create_duration_seconds` | Histogram | — | VE 创建耗时分布 |
| `vt_ve_lifecycle_transitions_total` | Counter | `from_status`, `to_status` | VE 状态转换计数 |
| `vt_work_context_active_count` | Gauge | `tenant_id` | 当前活跃工作上下文数 |
| `vt_work_context_duration_minutes` | Histogram | `task_type` | 工作上下文从创建到完成的耗时 |
| `vt_tool_calls_total` | Counter | `tool_name`, `location`, `outcome` | 工具调用计数（按工具名、位置、结果分类） |
| `vt_approvals_total` | Counter | `operation`, `decision` | 审批计数（按操作和决策分类） |
| `vt_llm_tokens_total` | Counter | `provider`, `model_id`, `token_type` | LLM token 消耗（按 provider/模型/input-output 分类） |
| `vt_llm_request_duration_seconds` | Histogram | `provider`, `model_id` | LLM 请求延迟分布 |

### 基础设施指标

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `vt_ws_connections_active` | Gauge | 活跃 WebSocket 连接数 |
| `vt_http_requests_total` | Counter | HTTP 请求总数 |
| `vt_http_request_duration_seconds` | Histogram | HTTP 请求延迟 |
| `vt_runner_cpu_percent` | Gauge | VE Runner CPU 使用率 |
| `vt_runner_memory_bytes` | Gauge | VE Runner 内存使用量 |
| `vt_wen_online_count` | Gauge | 在线工作环境节点数 |
| `vt_db_connections_active` | Gauge | 数据库活跃连接数 |
| `vt_mq_depth` | Gauge | 消息队列深度 |

### 业务指标

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `vt_users_active_daily` | Gauge | 日活跃用户数 |
| `vt_ve_created_total` | Counter | VE 创建总数 |
| `vt_work_contexts_completed_total` | Counter | 完成的工作上下文总数 |
| `vt_config_package_installs_total` | Counter | 配置包安装次数 |
| `vt_user_plan_distribution` | Gauge | 各付费计划的用户分布 |

## 链路追踪

### Span 层级结构

以"用户发消息 → VE 回复"为例：

```
HTTP POST /messages (root span)
├── db.insert_message
├── context.build_segment
│   ├── markers.lookup
│   └── rag.search
├── agent_server.route_message
│   ├── tenant.verify
│   ├── ve.locate
│   └── ve.deliver_message
│       ├── intent_agent.analyze (VE Runner)
│       │   └── llm.chat (Claude Haiku)
│       ├── main_agent.execute (VE Runner)
│       │   ├── llm.chat (Claude Sonnet)
│       │   ├── tool.call (→ WEN)
│       │   │   └── wen.forward → wen.execute
│       │   └── llm.chat (continue)
│       └── message.reply
│           └── collab.message.send
└── message.push_to_subscribers
```

### Trace 上下文传播

所有服务间通信自动传播 `trace_id` 和 `span_id`：

```
协作应用服务端 → Agent 服务器 → VE Runner → WEN
         │              │            │         │
         └── trace_id ──┴────────────┴─────────┘（全程传播）
```

- HTTP 调用：通过 `traceparent` header（W3C Trace Context 标准）
- WebSocket：通过连接建立时的 metadata
- 消息队列：通过在消息体 metadata 中携带 trace 信息

## 仪表盘

### 核心仪表盘

| 仪表盘 | 受众 | 关键面板 |
|--------|------|---------|
| **系统概览** | 全员 | 活跃用户数、活跃 VE 数、消息吞吐量、错误率、P95 延迟 |
| **VE 运行状态** | 工程 | VE 生命周期转换、冷启动耗时、LLM token 消耗、工具调用成功率 |
| **协作应用** | 工程 | WebSocket 连接数、消息投递延迟、REST API 延迟和错误率 |
| **基础设施** | 运维 | 节点 CPU/内存、数据库连接、消息队列深度、WEN 在线率 |
| **业务指标** | 产品 | DAU、VE 创建数、工作完成数、付费转化率、配置包安装数 |

### 告警规则

| 告警名 | 条件 | 严重级别 | 通知方式 |
|--------|------|---------|---------|
| VE 创建失败率过高 | `ve_create_errors / ve_create_total > 0.05` 持续 5 min | Critical | PagerDuty + Slack |
| 消息投递 P95 > 3s | `message_delivery_seconds{p95}` > 3s 持续 10 min | Warning | Slack |
| VE Runner CPU > 90% | `runner_cpu_percent` > 90% 持续 5 min | Critical | PagerDuty |
| WEN 离线率 > 20% | `wen_offline_ratio` > 0.2 持续 10 min | Warning | Slack |
| LLM API 错误率 > 10% | `llm_errors / llm_requests > 0.1` 持续 5 min | Critical | PagerDuty + Slack |
| 数据库连接池耗尽 | `db_connections_active / max > 0.9` | Critical | PagerDuty |
| 审计日志写入失败 | `audit_write_errors > 0` | Critical | PagerDuty |
| 日活用户下降 > 30% | `dau` vs 7 天前下降 > 30% | Warning | Slack（产品） |

## 成本追踪

LLM API 调用是主要成本来源。需要按租户、VE、工作上下文维度追踪 token 消耗：

```sql
CREATE MATERIALIZED VIEW token_usage_daily AS
SELECT
    date_trunc('day', created_at) AS day,
    tenant_id,
    ve_id,
    provider,
    model_id,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(cost_cents) AS total_cost_cents
FROM llm_token_events
GROUP BY 1, 2, 3, 4, 5;
```

成本相关的告警：

- 单租户日成本超过其计划预算的 80% → Warning
- 平台整体 LLM 日成本环比增长 > 50% → Warning

## 实现要点

- 所有 Rust 服务统一使用 `tracing` crate + OpenTelemetry exporter
- 日志、metrics、traces 通过 OpenTelemetry Collector 统一采集和路由
- 生产环境 INFO 级别，开发环境 DEBUG 级别，本地开发可配置 TRACE
- 所有 `tenant_id`、`ve_id` 等关键维度在 span 初始化时设置，自动注入后续日志

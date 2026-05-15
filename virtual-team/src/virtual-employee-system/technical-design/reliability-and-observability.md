# 虚拟员工系统可靠性与观测

## 冷启动优化

VE 从 Suspended 状态恢复（冷启动）是用户可感知的关键延迟。基础版冷启动路径和优化策略：

### 冷启动路径

```
收到消息 → Agent 服务器路由
  → 检查 VE 状态
  → 若 Suspended → 从 PostgreSQL 恢复 Runtime 状态
  → 重建 VE Runner 进程/协程
  → 从 SQLite 恢复 VTA Session（如有未归档 Session）
  → 注入压缩的上下文
  → 进入 Idle → Working
```

### 优化策略

| 策略 | 说明 | 目标延迟 |
|------|------|---------|
| **温实例保持** | 最后活跃 10-30 分钟内的 VE 保持内存但不占用推理资源 | < 3s（仅重置 Session） |
| **Runtime 状态缓存** | Runtime Config/Data 在 Agent 服务器内存中 LRU 缓存（5 分钟 TTL） | 减少一次 PostgreSQL 查询 |
| **异步预热** | 协作应用检测到用户在 VE 所在频道活跃时，向 Agent 服务器发预热信号 | 用户实际发消息时 VE 已进入 Idle |
| **分代恢复** | Runtime 元数据优先恢复（立即可路由），VTA Session 和 Tool Connection 延迟恢复 | 首字回复延迟可接受 |

### 冷启动 SLA

| 场景 | P50 | P95 | P99 |
|------|-----|-----|-----|
| 温实例恢复（内存中） | < 1s | < 2s | < 3s |
| 冷启动（无 VTA Session） | < 3s | < 8s | < 12s |
| 冷启动（含 VTA Session 恢复） | < 5s | < 10s | < 15s |

## 消息队列可靠性

Agent 服务器使用 Redis Streams 作为接入层和管理服务之间的消息队列。

### 消息队列拓扑

```
协作应用 → 接入层 → Redis Streams → 管理服务 → VE Runner
                    │
                    ├── consumer_group: ve-management
                    │   ├── consumer: mgmt-1
                    │   ├── consumer: mgmt-2
                    │   └── consumer: mgmt-3
                    │
                    └── partition_key: ve_id（保证同 VE 消息有序）
```

### 可靠性参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 消息 TTL | 5 分钟 | 超时未消费的消息丢弃并告警 |
| 消费者心跳 | 30s | 管理服务定期上报 |
| 重试策略 | 指数退避，最多 3 次 | 消费失败后的重试 |
| 死信队列 | `ve:dlq:{tenant_id}` | 重试耗尽的消息进入死信 |
| 背压阈值 | 队列深度 > 10,000 | 接入层开始拒收新消息（返回 429） |

### 消息丢失保护

- 消息在队列中持久化（Redis RDB + AOF）
- 管理服务在消费消息并确认持久化到 PostgreSQL 后才 ACK
- 管理服务崩溃时，未 ACK 的消息重新分配给其他 consumer

## VE Runner 健康检查与重启

### 健康检查

| 指标 | 健康阈值 | 降级阈值 | 离线判定 |
|------|---------|---------|---------|
| 心跳间隔 | < 15s | 15-45s | > 45s × 3 次 |
| CPU 使用率 | < 80% | 80-95% | > 95% |
| 可用内存 | > 20% total | 10-20% | < 10% |
| 活跃 VE 数 | < 上限 80% | 80-100% | 拒绝新 VE |
| Turn 执行错误率 | < 1% | 1-5% | > 5% |

### 重启策略

| 场景 | 策略 | 恢复方式 |
|------|------|---------|
| Runner 心跳超时 | 标记该 Runner 所有 VE 为 Suspended | 在其他 Runner 上逐个恢复（冷启动） |
| Runner 内存不足 | 驱逐温实例到其他 Runner，标记本 Runner 为 degraded | 不接受新 VE |
| Runner 崩溃恢复 | 从 PostgreSQL 恢复路由表，从 SQLite 恢复 Session | 由管理服务触发 |
| 单 VE 异常 | 隔离该 VE 的 Runner 进程/协程，标记 VE 为 Suspended | 用户发新消息时清理重启 |

## VE 专属指标

### 关键指标

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| `ve_active_count` | 活跃 VE 数（per Runner, per Tenant） | Runner > 容量 80% |
| `ve_cold_start_latency_ms` | VE 冷启动延迟 | p95 > 10,000ms |
| `ve_turn_latency_ms` | Turn 执行延迟（含 LLM 推理） | p95 > 15,000ms |
| `ve_turn_error_rate` | Turn 执行错误率 | > 2% |
| `ve_message_route_latency_ms` | 消息路由延迟（接入层到管理服务） | p95 > 500ms |
| `ve_tool_call_latency_ms` | 工具调用转发延迟 | p95 > 200ms |
| `ve_queue_depth` | Redis 消息队列深度 | > 8,000 |
| `ve_dlq_depth` | 死信队列深度 | > 0（每条产生告警） |
| `llm_api_error_rate` | LLM API 调用错误率 | > 5% |
| `llm_api_latency_ms` | LLM API 调用延迟 | 按模型类别分别告警 |
| `wen_offline_ratio` | WEN 离线率（per Tenant） | > 10% |

### 追踪跨度

VE 系统的关键追踪跨度层级：

```
message_route
  ├── auth_verify
  ├── ve_lookup
  ├── ve_resume_if_suspended
  │   ├── db_restore_runtime
  │   └── runner_restore_session
  ├── ve_execute_turn
  │   ├── prompt_build
  │   ├── llm_api_call
  │   └── tool_calls (per call)
  └── ve_reply_format
```

## 降级矩阵

VE 系统降级策略与协作应用降级矩阵互补：

| 故障 | 影响 | 降级行为 | 用户感知 |
|------|------|---------|---------|
| Agent 服务器宕机 | VE 不可用 | 其他节点承载，协作应用展示 VE 离线 | "销售分析师已离线" |
| VE Runner 宕机 | 该 Runner 的 VE 不可用 | 管理服务检测后在其他 Runner 冷启动恢复 | VE 短暂不可用后恢复 |
| LLM 主模型不可用 | 主 Agent 推理中断 | 降级链：Claude Opus → Sonnet → Haiku → 规则 | "AI 正在使用备用模型，回复质量可能降低" |
| WEN 离线 | 远程工具不可用 | 平台工具仍可用，VE 告知用户检查 WEN | "我暂时无法操作本地文件，请检查工作环境" |
| Redis 不可用 | 消息路由中断 | 接入层直连管理服务（跳过队列），削峰能力丧失 | 延迟增加（p99 上升），高负载时 429 |
| PostgreSQL 不可用 | 状态读写中断 | 恢复中的 VE 阻塞；已运行的 VE 继续使用 SQLite 本地数据 | 新消息处理暂停 |

## 日志规范

| 级别 | 场景 |
|------|------|
| ERROR | VE 创建失败、Turn 执行崩溃、消息路由失败、WEN 连接异常 |
| WARN | 冷启动、LLM 降级、审批超时、速率限制触发、队列深度接近阈值 |
| INFO | VE 生命周期变更、消息路由成功、Turn 完成、工作上下文状态转换 |
| DEBUG | LLM 请求/响应详情、工具调用参数/结果（脱敏）、Session 创建/销毁 |

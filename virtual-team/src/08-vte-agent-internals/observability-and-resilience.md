# 可观测性与容错

## 可观测性三大支柱

### 日志

VTA 使用 `tracing` crate 进行结构化日志。关键日志点和级别：

| 级别 | 场景 | 关键字段 |
|------|------|---------|
| INFO | AgentLoop 启动/完成、Turn 开始/结束 | session_id, turn_id, output_len |
| WARN | 工具调用失败、模型降级、压缩触发 | session_id, tool_name, error |
| ERROR | Turn 执行崩溃、LLM API 不可达、MessageStore 写入失败 | session_id, turn_id, error_code |
| DEBUG | LLM 请求/响应详情、工具调用参数/结果、Session 创建/销毁 | 完整上下文 |

### 指标

核心指标分类及告警阈值：

| 类别 | 指标 | 告警阈值 |
|------|------|---------|
| **Turn 性能** | turn_duration_ms | p95 > 30,000ms |
| | turn_success_rate | < 95% |
| **LLM 调用** | llm_latency_ms | p95 > 15,000ms |
| | llm_token_usage | 按模型预算监控 |
| | llm_error_rate | > 5% |
| **工具执行** | tool_execution_duration_ms | p95 > 5,000ms |
| | tool_success_rate | < 90% |
| | approval_required_rate | 监控异常增长 |
| **上下文** | context_token_usage | > 80% 预警 |
| | compaction_frequency | > 3 次/Turn |
| **系统** | active_sessions | > Runner 容量 80% |
| | message_queue_depth | > 5,000 |

### 追踪

跨服务 Span 层级：

```
message_route
  ├── auth_verify
  ├── ve_lookup
  ├── ve_resume_if_suspended
  │   ├── db_restore_runtime
  │   └── runner_restore_session
  ├── turn_execute (AgentLoop)
  │   ├── prompt_build
  │   ├── llm_inference
  │   └── tool_execution (per call)
  └── ve_reply_format
```

每个 Span 携带：session_id、turn_id、model、prompt_tokens、completion_tokens。

## 重试策略

### 可恢复 vs 不可恢复错误

| 错误类型 | 可重试？ | 策略 |
|---------|---------|------|
| 速率限制（429） | ✅ | 遵守 Retry-After 头，指数退避，最多 5 次 |
| 服务不可用（503） | ✅ | 指数退避，最多 3 次 |
| 网络超时 | ✅ | 指数退避，最多 3 次 |
| 认证失败（401） | ❌ | 立即失败，提示用户 |
| 上下文溢出 | ❌ | 触发压缩，不重试 |
| 内容过滤 | ❌ | 通知用户，不重试 |
| 权限拒绝 | ❌ | 立即失败 |

### 指数退避

```
delay = min(base_delay * 2^attempt + jitter, max_delay)
base_delay = 1s, max_delay = 30s, jitter = ±10%
```

### 熔断器

对 LLM API 调用使用熔断器模式：

```
CLOSED →（连续失败 5 次）→ OPEN
OPEN →（等待 30s）→ HALF_OPEN
HALF_OPEN →（连续成功 3 次）→ CLOSED
HALF_OPEN →（任意失败）→ OPEN
```

熔断器打开（OPEN）时：
- 新请求直接被拒绝，不调用 LLM API
- VE 回复用户"AI 服务暂时不可用，请稍后重试"
- 可观测性中 `circuit_breaker_state` 指标变更

## 降级模型选择

当主模型不可用时：

```
主模型（Claude Opus）
  → 降级模型（Claude Sonnet）
    → 低成本模型（Claude Haiku）
      → 规则匹配（关键词）
        → "AI 服务暂时不可用"
```

每次降级产生 WARN 日志 + `model_fallback` counter 递增。最终降级到规则匹配时通知用户。

## 当前实施状态

- `tracing` 集成：✅ 已实现（AgentLoop 中 info/warn/debug span）
- 重试与指数退避：✅ 已实现（LLM API 调用层）
- 熔断器：📋 Phase 5
- 指标收集与导出（OpenTelemetry/Prometheus）：📋 Phase 5
- 模型降级链自动切换：📋 Phase 3（降级链手动选择在 Phase 1 已支持）

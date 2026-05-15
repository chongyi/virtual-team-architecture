# 上下文管理与压缩

## 上下文预算模型

LLM 的上下文窗口是有限的共享资源。VTA 将上下文窗口划分为四个区域：

| 区域 | 占比 | 内容 |
|------|------|------|
| System Prompt | 20-30% | 角色定义、工具声明、技能上下文、规则约束 |
| Message History | 50-60% | 当前 Session 的对话和工具调用历史 |
| Working Memory | 10-15% | 资源上下文、文件内容、数据片段 |
| Safety Margin | 10% | 预留空间，防止溢出 |

## 压缩触发条件

当 Token 使用量接近模型上下文窗口上限时触发压缩。触发阈值因场景而异：

| 条件 | 阈值 | 说明 |
|------|------|------|
| Token 使用量 | > 上下文窗口 80% | 主要触发条件 |
| Turn 数量 | > 50 轮 | 辅助检测，即使 Token 未满但轮数过多也会触发 |
| 活跃时长 | > 2 小时 | 长时间工作中周期性触发 |

## 压缩策略

VTA 定义 `CompactionStrategy` trait，支持可替换的压缩策略：

```rust
trait CompactionStrategy: Send + Sync {
    /// 判断当前 Session 是否需要压缩
    fn should_compact(&self, session: &Session, token_count: u64) -> bool;
    /// 执行压缩，返回新的消息列表替换原历史
    async fn compact(&self, messages: Vec<Message>) -> Result<Vec<Message>, CompactionError>;
}
```

### 内置策略

| 策略 | 行为 | 适用场景 |
|------|------|---------|
| **FullCompaction** | LLM 摘要全部历史，压缩为一条 CompactionSummary Part | Token 严重溢出（> 95%） |
| **PartialCompaction** | LLM 摘要最早 50% 的历史，保留最近消息原文 | 中度溢出（80-95%） |
| **SlidingWindowCompaction** | 丢弃最早 N 条消息，保留最近消息 | 轻度溢出（< 80%），简单快速 |

### 智能选择

根据溢出程度自动选择策略：

1. **轻度溢出**（< 20% 超出）：优先压缩工具调用（工具结果可压缩，但调用参数需保留），使用 SlidingWindowCompaction
2. **中度溢出**（< 50% 超出）：PartialCompaction — 摘要早期历史，保留最近上下文
3. **重度溢出**（> 50% 超出）：FullCompaction — 全量摘要 + 截断

### CompactionSummary Part

压缩结果使用专用的 `PartKind::CompactionSummary`：

```json
{
  "kind": "CompactionSummary",
  "content": {
    "original_range": {"start": 0, "end": 45},
    "summary": "用户要求分析 Q2 销售数据。已完成数据获取和清洗...",
    "key_findings": ["Q2 总销售额 ¥2,847,000，环比增长 12.3%"],
    "pending_items": ["生成最终报告", "写入多维表格"]
  }
}
```

## 热历史 vs 冷历史

| 区域 | 范围 | 保留方式 |
|------|------|---------|
| **热历史** | 最近 3-5 轮 | 完整保留原文 |
| **温历史** | 5-15 轮 | 保留原文，可被 PartialCompaction 处理 |
| **冷历史** | 15 轮以上 | 优先压缩/摘要 |

## 压缩与 Resume 的关系

压缩是 Turn 内的操作（不影响 WorkContext 结构），Resume 是 WorkContext 级的操作（创建新 VTA Session 并注入压缩上下文）：

- **Compaction**：Turn 内压缩 → 替换 MessageStore 中的消息 → 同 Session 继续
- **Resume**：归档旧 Session → 生成结构化摘要 → 创建新 Session → 注入压缩上下文

详见 [消息与工作上下文](../06-message-and-work-context.md) 中的 Resume 机制。

## 当前实施状态

- Compaction 策略（`CompactionStrategy` trait）属于 Phase 4，代码中未实现
- 基础版的上下文管理依赖 Resume 机制（通过结构化摘要创建新 Session）
- Token 监控在 AgentLoop 的每次迭代中间接生效（LLM API 在上下文溢出时返回错误）

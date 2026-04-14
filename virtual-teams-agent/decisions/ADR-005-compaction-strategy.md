# ADR-005: 长上下文处理（Compaction）

**状态**：已采纳 | **日期**：2026-04-08

## 背景

长对话会导致 token 超出模型上下文窗口。所有参考项目都面临这个问题，且都选择了 LLM 驱动的摘要方案：
- ClaudeCode：`BASE_COMPACT_PROMPT` / `PARTIAL_COMPACT_PROMPT`，使用小快模型
- OpenCode：内置 compaction agent，可配置独立模型
- Codex：`UsageAccumulator` 追踪 token，触发压缩

需要确定压缩机制在架构中的位置和扩展方式。

## 考虑的选项

### A. 硬编码在 agent loop 中

直接在循环中实现压缩逻辑。

- 优点：简单直接
- 缺点：策略不可替换；不同场景可能需要不同压缩策略

### B. CompactionStrategy trait（✅ 采纳）

定义独立 trait，由 host 注入具体实现。

- 优点：策略可替换；可用不同模型；可独立测试；与现有 trait 驱动架构一致
- 缺点：多一层抽象

### C. 特殊 Turn 类型

压缩作为一种特殊的 Turn 执行。

- 优点：复用 Turn 生命周期
- 缺点：语义不清（压缩不是用户发起的 turn）；增加 Turn 类型复杂度

## 决策

**采纳选项 B**：`CompactionStrategy` 作为独立 trait。

```rust
#[async_trait]
pub trait CompactionStrategy: Send + Sync {
    async fn should_compact(&self, context: &CompactionContext) -> Result<bool, RuntimeError>;
    async fn compact(&self, context: &CompactionContext) -> Result<CompactionResult, RuntimeError>;
}
```

## 理由

- 与现有架构风格一致（`InferenceBackend` 是 trait，`StoreProvider` 是 trait）
- 不同策略（全量压缩、部分压缩、滑动窗口）可通过不同实现切换
- 压缩可使用独立模型（通过 `SceneId::Compaction` 路由到 SceneModel）
- host 组装时注入，agent loop 只调用 trait 方法

## 影响

- `CompactionStrategy` trait 定义在 `runtime-agent`
- 默认实现（LLM 驱动摘要）也在 `runtime-agent`
- `runtime-host` 负责组装时注入具体策略
- Agent loop 在 token 阈值触发时调用 `should_compact()` → `compact()`
- 压缩结果写入 Message 表，替换被压缩的消息

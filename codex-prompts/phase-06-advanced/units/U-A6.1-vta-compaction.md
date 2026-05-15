# U-A6.1 CompactionStrategy 实现

## 目标 (Goal)

实现上下文压缩系统：CompactionStrategy trait + 三种策略（Summarize：LLM 总结历史 / Trim：按 token 裁剪 / Hybrid：摘要+近期保留），集成到 DefaultAgentLoop 的上下文预算管理中。

## 上下文 (Context)

- 前置：U-A5.3（配置包扩展）
- 设计文档：`08-vte-agent-internals/compaction-and-context.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/agent/src/compaction.rs | create | CompactionStrategy trait + 三种实现 |

## 约束 (Constraints)

详见 CONTEXT.md。Compaction 由上下文预算模型（budget tokens）触发。

## 完成条件 (Done When)

- [ ] CompactionStrategy trait：`compact(session, budget) -> CompactedContext`
- [ ] Summarize 策略：调用模型总结历史为摘要
- [ ] Trim 策略：仅保留最近 N 条消息
- [ ] Hybrid 策略：摘要 + 最近 N 条
- [ ] 集成到 AgentLoop：Token 超预算时自动触发压缩
- [ ] `cargo test -p vta-agent` 全部通过

### 提交标准

- [ ] `feat(vta): add CompactionStrategy with Summarize/Trim/Hybrid implementations`

# Agent 架构调研与设计文档索引

> 本目录包含 Agent 生产实现的完整调研过程、参考项目分析和架构决策记录。

## 文档结构

### 架构设计

- [agent-architecture-design.md](agent-architecture-design.md) — 最终架构设计方案（7 项决策 + 4 阶段实施路径）

### 冻结实施方案（frozen-plan/）

| 文档 | 内容 |
|------|------|
| [frozen-plan/README.md](frozen-plan/README.md) | 冻结实施方案索引与阅读顺序 |
| [frozen-plan/phase-1-2-implementation-plan.md](frozen-plan/phase-1-2-implementation-plan.md) | Phase 1-2 冻结版主实施计划 |
| [frozen-plan/baseline-alignment-checklist.md](frozen-plan/baseline-alignment-checklist.md) | 基线校正门：职责、术语、文档漂移修正清单 |
| [frozen-plan/interfaces/agent-loop-and-message-store.md](frozen-plan/interfaces/agent-loop-and-message-store.md) | AgentLoop 与 MessageStore 接口冻结说明 |
| [frozen-plan/interfaces/protocol-handler-boundary.md](frozen-plan/interfaces/protocol-handler-boundary.md) | Protocol Handler 边界冻结说明 |

### 调研过程（research/）

| 文档 | 内容 |
|------|------|
| [00-research-overview.md](research/00-research-overview.md) | 调研总览：目标、方法、参考项目、话题清单 |
| [01-reference-project-analysis.md](research/01-reference-project-analysis.md) | 四个参考项目的架构分析（ClaudeCode、Codex、OpenCode、OpenClaw） |
| [02-cs-architecture-comparison.md](research/02-cs-architecture-comparison.md) | CS 架构深度对比（API 设计、状态管理、事件推送） |
| [03-supplementary-research.md](research/03-supplementary-research.md) | 补充调研：动态模型选择、渐进式工具披露、Prompt 角色分配 |
| [04-prompt-system-analysis.md](research/04-prompt-system-analysis.md) | Prompt 体系分析：内置 prompt 清单、模板机制、Provider 特化 |

### 架构决策记录（decisions/）

| 文档 | 决策 |
|------|------|
| [ADR-001-agent-loop-location.md](decisions/ADR-001-agent-loop-location.md) | Agent Loop 归属 → runtime-agent 新 crate |
| [ADR-002-cs-transport.md](decisions/ADR-002-cs-transport.md) | CS 传输层 → WebSocket + stdio 双传输 |
| [ADR-003-state-persistence.md](decisions/ADR-003-state-persistence.md) | 状态持久化 → Events 审计 + Message 工作状态双轨 |
| [ADR-004-sub-agent-model.md](decisions/ADR-004-sub-agent-model.md) | Sub-agent → 独立 Session + parent 链接 |
| [ADR-005-compaction-strategy.md](decisions/ADR-005-compaction-strategy.md) | 长上下文 → CompactionStrategy trait |
| [ADR-006-model-selection.md](decisions/ADR-006-model-selection.md) | 动态模型选择 → 三类别模型体系 |
| [ADR-007-prompt-management.md](decisions/ADR-007-prompt-management.md) | Prompt 管理 → PromptManager + 配置包驱动 |

## 参考项目来源

| 项目 | 版本 | 本地路径 |
|------|------|---------|
| ClaudeCode | 源码泄露版 (2026.3.31) | `agent-sdk-origin-references/claude-code/claude-code-source` |
| Codex | v0.118.0 | `agent-sdk-origin-references/codex/codex-v0.118.0` |
| OpenCode | v1.3.0 | `agent-sdk-origin-references/opencode/opencode-v1.3.0` |
| OpenClaw | 2026.3.23 | `agent-sdk-origin-references/openclaw/openclaw-2026.3.23` |

> `agent-sdk-origin-references` 在该路径下：`/Users/chongyi/Projects/tosimpletech/jisi-project/agent-sdk-origin-references`

## 阅读建议

1. 先读 [00-research-overview.md](research/00-research-overview.md) 了解调研全貌
2. 按兴趣深入各参考项目分析和话题对比
3. 读 [agent-architecture-design.md](agent-architecture-design.md) 了解最终方案
4. 读 [frozen-plan/README.md](frozen-plan/README.md) 进入冻结后的实施方案文档
5. 对具体决策有疑问时查阅对应 ADR

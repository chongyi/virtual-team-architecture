# 调研总览

> 日期：2026-04-07 ~ 2026-04-08 | 参与者：Chongyi + Claude Opus 4.6

## 1. 调研目标

基于四个主流 coding agent 参考项目，从架构、机制、设计模式等维度进行系统性调研，为本项目的生产可用 Agent 实现建立决策依据。

## 2. 调研方法

- **角色分工**：Claude 作为架构调研助理，负责代码阅读和结构化分析；Chongyi 负责方向判断和决策
- **并行探索**：使用多个 Explore 子代理并行读取四个参考项目代码
- **逐话题推进**：按预定义话题逐一展开，每个话题产出结构化摘要 + 关键发现，由 Chongyi 提问深入
- **决策驱动**：调研服务于决策，每个话题最终收敛为一个或多个架构决策

## 3. 参考项目

| 项目 | 语言 | 维护方 | 特点 |
|------|------|--------|------|
| **ClaudeCode** | TypeScript/Bun | Anthropic | 单进程 AsyncGenerator loop，React/Ink TUI，Anthropic-only |
| **Codex** | Rust + TS wrapper | OpenAI | SQ/EQ 双队列，Ratatui TUI，平台级沙箱，OpenAI-primary |
| **OpenCode** | TypeScript/Bun | 社区 | SessionProcessor loop，Hono HTTP + SSE，40+ provider via ai-sdk |
| **OpenClaw** | TypeScript/Node | 社区 | Pi Agent Core 委托，Gateway WebSocket，多渠道（Discord/Slack/Telegram） |

### 选择理由

- ClaudeCode：行业标杆，prompt 工程和工具编排最成熟
- Codex：唯一 Rust 实现，与本项目技术栈一致，SQ/EQ 模式有参考价值
- OpenCode：CS 架构最干净（API-first），多 provider 支持最广
- OpenClaw：Gateway 模式代表了重量级 CS 方案，多渠道接入有参考价值

## 4. 调研话题清单

| # | 话题 | 状态 | 产出文档 |
|---|------|------|---------|
| 1 | 基本结构与架构对比 | ✅ 完成 | [01-reference-project-analysis.md](01-reference-project-analysis.md) |
| 2 | CS 架构深度对比 | ✅ 完成 | [02-cs-architecture-comparison.md](02-cs-architecture-comparison.md) |
| 3 | 补充调研（模型选择/工具披露/Prompt 角色） | ✅ 完成 | [03-supplementary-research.md](03-supplementary-research.md) |
| 4 | Prompt 体系分析 | ✅ 完成 | [04-prompt-system-analysis.md](04-prompt-system-analysis.md) |
| 5 | **Awaken 深度对比调研** | ✅ 完成 | **[awaken-comparative-study/README.md](awaken-comparative-study/README.md)** |

## 5. 决策产出

调研共产出 7 项架构决策（详见 [decisions/](../decisions/) 目录）：

1. Agent Loop 归属 → `runtime-agent` 新 crate
2. CS 传输层 → WebSocket + stdio 双传输
3. 状态持久化 → Events 审计 + Message 工作状态双轨
4. Sub-agent 模型 → 独立 Session + parent 链接
5. 长上下文处理 → CompactionStrategy trait
6. 动态模型选择 → MainLoopModel / SceneModel / SmallFastModel 三类别
7. Prompt 管理 → PromptManager + 配置包驱动

## 6. 调研过程中的关键发现

### 跨项目共性

- 所有项目的核心都是一个 **LLM call → tool execution → loop** 循环
- 所有项目都有某种形式的 **权限/审批机制**（tool call 前的用户确认）
- 所有项目都面临 **长上下文压缩** 问题，且都选择了 LLM 驱动的摘要方案
- **事件驱动** 是通用模式——无论 CS 还是单进程，都通过事件推送实时状态

### 关键差异

- **CS 成熟度差异巨大**：从 ClaudeCode 的无 CS 到 OpenClaw 的完整 Gateway，跨度很大
- **Provider 策略两极分化**：ClaudeCode/Codex 锁死单供应商，OpenCode 支持 40+
- **第三方依赖策略**：OpenClaw 将核心 loop 委托给第三方框架（pi-agent-core），其他都自研
- **Prompt 注入时机**：ClaudeCode 大量使用 user role + `<system-reminder>` 标签做运行时注入

### 对本项目的启示

- Rust 实现参考 Codex 的 SQ/EQ 模式和类型安全设计
- CS 架构参考 OpenCode 的 API-first 设计，但传输层用 WebSocket 替代 SSE
- Provider 抽象参考 OpenCode 的多供应商策略，通过 rig 生态实现
- Prompt 管理走配置包路线，超越所有参考项目的硬编码方式

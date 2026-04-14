# ADR-004: Sub-agent 模型

**状态**：已采纳 | **日期**：2026-04-08

## 背景

Agent 在执行复杂任务时需要派生子 agent（如：并行探索代码库、独立执行子任务）。需要确定子 agent 与父 agent 之间的关系模型。

参考项目做法：
- ClaudeCode：AgentTool 发起独立 `query()` 调用，受限工具集，独立上下文
- Codex：独立 Session，通过 thread_manager 管理
- OpenCode：独立 Session，支持 fork

## 考虑的选项

### A. 独立 Session + parent 链接（✅ 采纳）

子 agent 拥有独立 Session，通过 `parent_session_id` + `parent_turn_id` 关联父 agent。

- 优点：CS 友好（子 agent 对客户端就是另一个可观测的 session）；生命周期独立；天然隔离
- 缺点：上下文不共享，需要额外机制传递信息

### B. 嵌套 Turn

子 agent 作为父 Session 内的嵌套 Turn 执行。

- 优点：共享 session 上下文；实现简单
- 缺点：CS 不友好（客户端难以区分父/子 agent 的消息）；生命周期耦合

### C. 独立 Session + 共享上下文通道

独立 Session + 显式共享内存，子 agent 可读取父 agent 部分状态。

- 优点：最强大，信息共享灵活
- 缺点：复杂度高，共享内存的一致性和安全性难以保证

## 决策

**采纳选项 A**：独立 Session + parent 链接。

## 理由

用户的核心判断：**上下文共享的复杂度是正交的能力维度**。无论现在还是未来实现，这个复杂度不会因为选择哪种基础模型而增减。因此基础模型应该选最简单的（独立 Session），上下文共享通过额外机制（资源注入、显式传参等）按需叠加。

## 影响

- `runtime-core` 的 Session 类型新增 `parent_session_id: Option<SessionId>` 和 `parent_turn_id: Option<TurnId>`
- `runtime-agent` 实现子 agent 派生逻辑：创建新 Session → 执行 → 结果写回父 Turn
- 客户端可通过 `runtime.session.list` 查询子 session（按 parent 过滤）
- 未来上下文共享机制作为独立特性叠加，不影响基础模型

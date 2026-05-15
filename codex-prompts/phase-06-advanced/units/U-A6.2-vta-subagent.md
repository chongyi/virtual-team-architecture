# U-A6.2 Sub-agent 调度

## 目标 (Goal)

实现 Sub-agent 调度机制：主 Agent 可将子任务委派给 Sub-agent（独立的 AgentLoop + 受限工具集），Sub-agent 完成后结果回传主 Agent，支持并发 Sub-agent（最多 N 个并行）。

## 上下文 (Context)

- 前置：U-A6.1（Compaction）
- 设计文档：`08-vte-agent-internals/agent-architecture.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/agent/src/subagent.rs | create | Sub-agent 管理与调度 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：Sub-agent 使用独立 Session、限制工具集（subset of parent tools）、最大并发 3 个。

## 完成条件 (Done When)

- [ ] Sub-agent 可接收主 Agent 委派的子任务
- [ ] Sub-agent 使用独立 Session（parent_session_id 指向主 Session）
- [ ] Sub-agent 完成后结果回传主 Agent
- [ ] 并发 Sub-agent 调度（Round-robin）
- [ ] Sub-agent 超时自动终止（默认 120s）

### 提交标准

- [ ] `feat(vta): add sub-agent scheduling with concurrent execution support`

# U-A5.1 意图识别 Agent 与主 Agent 协作

## 目标 (Goal)

实现 VE 封装层核心：意图识别 Agent（使用低成本模型分析用户消息意图并创建/关联工作上下文）和主 Agent 协作链路（意图 Agent 分发任务 → 主 Agent 执行），使 VE 可以根据消息意图智能路由。

## 上下文 (Context)

- 前置：U-A4.3（Agent 服务器冷热管理）
- 设计文档：`06-message-and-work-context.md`、`05-virtual-employee-system.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/agent-server/src/ve/intent_agent.rs | create | 意图识别 Agent（低成本模型） |
| crates/agent-server/src/ve/main_agent.rs | create | 主 Agent 调用封装 |
| crates/agent-server/src/ve/collaboration.rs | create | 意图 Agent ↔ 主 Agent 协作链路 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 意图 Agent 使用 Cheap 模型（低延迟），仅做意图分类
- 意图类型：general_qa / create_task / query_status / use_tool
- 主 Agent 使用 Balanced/Powerful 模型

## 完成条件 (Done When)

- [ ] 意图 Agent 可分析消息并输出 intent 类型
- [ ] 意图 Agent 可自动创建/关联 WorkContext
- [ ] 主 Agent 根据 intent 类型执行（如 use_tool → 触发工具调用）
- [ ] 协作链路完整：用户消息 → 意图分析 → 主 Agent → 回复

### 提交标准

- [ ] `feat(ve): add intent agent and main agent collaboration pipeline`

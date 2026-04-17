# Virtual Teams Agent 冻结实施总计划

> 状态：冻结版  
> 范围：定义 `Phase 0-5` 的阶段边界；其中 `Phase 1-3` 进入实现级细化，`Phase 4-5` 保持里程碑级边界。

## 0. 文档角色

本文件是 `frozen-plan/` 的主计划文档，只负责：

- 定义新的阶段序列与阶段目标
- 固定各阶段的边界与依赖顺序
- 为后续执行阶段提供统一的验收口径

进入具体阶段后，应继续阅读：

- `Phase 0`： [baseline-alignment-checklist.md](baseline-alignment-checklist.md)
- `Phase 1`： [phase-1/README.md](phase-1/README.md)
- `Phase 2`： [phase-2/README.md](phase-2/README.md)
- `Phase 3`： [phase-3/README.md](phase-3/README.md)
- 跨阶段接口： `interfaces/` 下两份冻结说明

## 1. 总体目标

本轮调整的目标不是继续沿用“结构先行”的推进顺序，而是把方案重排成“小步可运行优先”的路线：

- 保留 `Phase 0` 基线校正门
- 引入新的 `Phase 1`，先交付最小可运行 agent MVP
- 将原有结构化能力整体后移，避免在最早阶段绑定 MessageStore、Prompt 配置包与 Protocol Handler
- 确保每个阶段都能作为后续 AI Agent 的独立执行输入

## 2. 实施原则

- 先跑通可工作的最小 agent，再做结构收敛
- `runtime-agent` 从第一阶段开始进入主线，但 `MessageStore` 从第二阶段开始进入主线
- `runtime-kernel` 保持生命周期内核职责，不重新吸收推理循环
- `Protocol Handler` 后移到 `Phase 3`，不与最小可运行 MVP 绑定
- transport 继续后置到 `Phase 4`
- 当前目录只负责冻结方案文档；真实项目仓库改动由后续执行阶段按计划落地

## 3. Phase 0：基线校正门

### 3.1 目标

在进入实现前，先校正文档职责、术语和阶段映射，避免后续阶段继续沿用旧编号和旧职责分工。

### 3.2 必做事项

- 统一新的 `Phase 0-5` 编号
- 校正所有正式文档中关于 `runtime-kernel / runtime-agent / runtime-host / protocol handler / transport` 的旧表述
- 明确 `Phase 1` 是“最小可运行 agent MVP”，而不是结构完备阶段

### 3.3 验收标准

- 正式文档中不再残留旧的 `Phase 1/2` 语义
- 主计划、阶段子计划、接口文档之间的阶段映射一致

## 4. Phase 1：最小可运行 Agent MVP

### 4.1 目标

交付一个本地/in-process 可运行的最小 agent，使其至少具备：

- LLM API 接入
- 最小 loop
- tool call 与 tool execution
- MCP 工具使用
- 基于提示词驱动 `chrome-devtools` 浏览器操作并输出分析结果

### 4.2 实施项

- 新增 `runtime-agent` 的最小可运行执行入口
- 支持用户 prompt -> LLM -> tool call -> MCP -> tool result -> final answer
- 采用进程内临时 history
- 采用轻量 prompt 组装，不引入 Prompt 配置包
- 提供 `chrome-devtools` MCP example 文档

### 4.3 明确不做的内容

- `MessageStore`
- sqlite / migration
- Protocol Handler
- WebSocket / stdio transport
- approval continuation
- PromptManager 配置包
- provider override / 热更新
- compaction / sub-agent

### 4.4 进入 Phase 1 时应继续阅读

- [phase-1/minimal-runnable-agent.md](phase-1/minimal-runnable-agent.md)
- [phase-1/mcp-browser-example.md](phase-1/mcp-browser-example.md)

## 5. Phase 2：结构基础收敛

### 5.1 目标

在 MVP 跑通后，把临时实现重构到更稳定的结构基础：

- MessageStore
- PromptManager 最小配置包
- runtime-agent 与工作轨接线

### 5.2 实施项

- 引入 `MessageStore` 与 memory backend
- 将 loop 上下文从临时 history 过渡到工作轨
- 引入最小 Prompt 配置包方案
- 对 `runtime-agent` 做 foundation refactor，使后续阶段能承接完整对话能力

### 5.3 进入 Phase 2 时应继续阅读

- [phase-2/runtime-agent-foundation-refactor.md](phase-2/runtime-agent-foundation-refactor.md)
- [phase-2/message-store-work-track.md](phase-2/message-store-work-track.md)
- [phase-2/prompt-manager-minimal-package.md](phase-2/prompt-manager-minimal-package.md)

## 6. Phase 3：完整对话与协议承接

### 6.1 目标

在稳定结构基础上补齐完整对话能力与 host 内协议承接：

- approval continuation
- multi-turn
- sqlite MessageStore
- Protocol Handler
- ModelPolicy / SceneId / session parent 字段

### 6.2 实施项

- 在已有 tool loop 基础上扩展审批挂起与 continuation
- 扩展到多轮对话
- 引入 sqlite `MessageStore` 与 migration
- 在 `runtime-host` 内承接 Protocol Handler
- 扩展 `ModelPolicy.fast_selector / scene_selectors`
- 预留 `Session.parent_session_id / parent_turn_id`

### 6.3 进入 Phase 3 时应继续阅读

- [phase-3/tool-loop-and-approval-continuation.md](phase-3/tool-loop-and-approval-continuation.md)
- [phase-3/sqlite-message-store-and-migration.md](phase-3/sqlite-message-store-and-migration.md)
- [phase-3/host-protocol-handler.md](phase-3/host-protocol-handler.md)

## 7. Phase 4：高级特性

### 7.1 目标

补齐高级能力：

- compaction
- sub-agent
- transport
- prompt 热更新

## 8. Phase 5：生产加固

### 8.1 目标

补齐生产要求：

- observability
- recovery
- perf

## 9. 测试要求

- `Phase 1` 验证最小 MCP 工具链闭环
- `Phase 2` 验证从临时 history 到 MessageStore 的结构迁移
- `Phase 3` 验证 approval、多轮、sqlite、Protocol Handler 的配合语义
- 外部 provider 网络型验证继续作为非阻塞集成检查，不作为文档冻结验收门

## 10. 默认假设

- 保留 `Phase 0`
- 旧 `Phase 1/2/3/4` 整体顺延为新 `Phase 2/3/4/5`
- 新 `Phase 1` 采用本地/in-process MVP 路线
- 新 `Phase 1` 默认使用进程内临时 history 与轻量 prompt
- `MessageStore` 从新 `Phase 2` 开始进入主线
- `Protocol Handler` 从新 `Phase 3` 开始进入主线
- `note.md` 不纳入任何分析、引用或变更范围

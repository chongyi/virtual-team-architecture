# Phase 1-3 实施影响清单

> 用途：说明 `Phase 1-3` 后续阶段在真实项目仓库中会涉及哪些改动类型，以及这些改动在本方案目录中的计划表达方式。  
> 原则：当前 `architecture/virtual-teams-agent` 目录只做冻结方案文档；所有真实项目文件改动都由后续阶段的执行 agent 按计划落地。

## 0. 文档角色

本文件不是主计划，也不是职责校正清单。它只回答两件事：

- 后续阶段执行时，真实项目仓库大致会改哪些类别
- 每一类改动在进入执行前，方案文档至少要写清楚什么

如果需要看阶段目标或职责边界，应分别回到：

- [implementation-plan.md](implementation-plan.md)
- [baseline-alignment-checklist.md](baseline-alignment-checklist.md)

## 1. 使用原则

- 只要改动目标位于真实项目仓库，而不是 `architecture/virtual-teams-agent` 目录，就不在当前目录直接执行
- 这类改动必须先在本目录形成阶段实施计划输入
- 本文件只标记“改动类别”，不直接展开具体实现方案

## 2. Phase 1-3 预计会影响的真实项目改动类型

### 2.1 workspace 与 crate 结构

后续执行阶段预计需要处理：

- 新增 `runtime-agent` crate
- 更新 workspace `Cargo.toml`
- 调整 `runtime-host` 的组装依赖

### 2.2 核心领域模型

后续执行阶段预计需要处理：

- `runtime-core` 增加 `Message` / `Part` / `MessageRole` / `PartKind` / `SceneId`
- `Session` 增加 parent 字段
- `ModelPolicy` 增加 `fast_selector` 与 `scene_selectors`

### 2.3 存储与 migration

后续执行阶段预计需要处理：

- `runtime-store` 增加 `MessageStore`
- `RuntimeStores` 与事务接口增加 messages 门面
- `runtime-store-memory` 增加消息工作轨实现
- `runtime-store-sqlite` 增加 `messages` / `parts`
- migration crate 增加对应 schema 迁移

### 2.4 runtime 组装与协议处理

后续执行阶段预计需要处理：

- `runtime-host` 组装 `runtime-agent`
- `runtime-host` 内新增 Protocol Handler
- `runtime.turn.run/get/cancel`、`runtime.approval.respond`、`runtime.event.subscribe` 的内部承接实现

### 2.5 Prompt 与 loop

后续执行阶段预计需要处理：

- `runtime-agent` 最小可运行 MVP
- 轻量 prompt 组装
- tool loop 与 MCP 接线
- `chrome-devtools` 示例所需的最小文档输入
- `PromptManager` 与最小配置包目录
- 审批挂起/恢复 continuation

### 2.6 测试与文档

后续执行阶段预计需要处理：

- `runtime-agent` 单元测试
- host memory/sqlite 集成测试
- 真实项目仓库中的 crate README 职责修正

## 3. 阶段实施计划输入的最小内容要求

后续每一项真实项目改动，在进入执行阶段前，至少要在本目录文档中写清楚：

- 改动目标
- 所属阶段
- 涉及的子系统
- 为什么要改
- 不改会产生什么偏差
- 验收标准
- 明确后置项

如果这几个要素没写清楚，就不应进入执行阶段。

## 4. 与现有文档的关系

- 总体目标与阶段划分：见 [implementation-plan.md](implementation-plan.md)
- 文档职责与术语校正：见 [baseline-alignment-checklist.md](baseline-alignment-checklist.md)
- loop 与消息工作轨边界：见 [interfaces/agent-loop-and-message-store.md](interfaces/agent-loop-and-message-store.md)
- Protocol Handler 边界：见 [interfaces/protocol-handler-boundary.md](interfaces/protocol-handler-boundary.md)

本文件不替代这些文档；它只负责把“冻结规划方案”和“后续阶段执行”之间的边界写清楚。

## 5. 本文不负责的内容

- 不负责重复定义阶段目标
- 不负责重复定义职责边界
- 不负责展开具体接口设计

## 6. 完成定义

以下条件满足时，视为实施边界定义完成：

- 团队成员不会再要求当前目录直接修改真实项目仓库文件
- 所有真实项目改动都先在本目录形成阶段实施计划输入
- 执行 agent 能仅根据本目录文档明确实现目标与验收边界

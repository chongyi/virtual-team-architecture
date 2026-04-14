# Frozen Plan 文档地图

> 本目录存放 `virtual-teams-agent` 的冻结实施方案文档。这里只放后续阶段执行会直接使用的计划文档，不放调研、ADR 或宽泛背景说明。

## 目录定位

- 根目录 `agent-architecture-design.md`：总览、总体阶段划分、目标架构
- `research/`：调研依据与参考项目分析
- `decisions/`：架构决策记录
- `frozen-plan/`：冻结后的实施方案、执行边界、验收标准

## 如何使用本目录

先明确一点：

- 本目录不是背景材料区，而是实施计划区
- 本目录不直接改真实项目仓库，只定义后续阶段要做什么、为什么做、如何验收
- 后续 AI Agent 会按这里的阶段文档执行

如果只是想快速进入当前方案，建议按下面路径阅读：

1. 先读 [phase-1-2-implementation-plan.md](phase-1-2-implementation-plan.md)
2. 再读 [baseline-alignment-checklist.md](baseline-alignment-checklist.md)
3. 再读 [implementation-impact-map.md](implementation-impact-map.md)
4. 最后按阶段进入 [phase-1/README.md](phase-1/README.md) 或 [phase-2/README.md](phase-2/README.md)

## 文档分层

### A. 基础控制文档

| 文档 | 角色 |
|------|------|
| [phase-1-2-implementation-plan.md](phase-1-2-implementation-plan.md) | 本目录主文档；定义 `Phase 1-2` 总体目标、阶段边界、依赖顺序、验收标准 |
| [baseline-alignment-checklist.md](baseline-alignment-checklist.md) | `Phase 0` 校正门；统一职责、术语、现状与目标增量的表达 |
| [implementation-impact-map.md](implementation-impact-map.md) | 实施边界文档；说明哪些内容属于后续真实项目改动，以及本目录如何表达这些改动 |

### B. 分阶段子计划

| 文档 | 角色 |
|------|------|
| [phase-1/README.md](phase-1/README.md) | `Phase 1` 子计划入口，聚焦最小可用 loop |
| [phase-2/README.md](phase-2/README.md) | `Phase 2` 子计划入口，聚焦完整对话能力 |

### C. 跨阶段接口冻结

| 文档 | 角色 |
|------|------|
| [interfaces/agent-loop-and-message-store.md](interfaces/agent-loop-and-message-store.md) | `runtime-agent`、`MessageStore`、消息工作轨的长期边界 |
| [interfaces/protocol-handler-boundary.md](interfaces/protocol-handler-boundary.md) | host 内部 Protocol Handler 的长期边界 |

## 建议阅读路径

### 路径一：先看全局

1. [phase-1-2-implementation-plan.md](phase-1-2-implementation-plan.md)
2. [baseline-alignment-checklist.md](baseline-alignment-checklist.md)
3. [implementation-impact-map.md](implementation-impact-map.md)

### 路径二：直接进入 Phase 1

1. [phase-1/README.md](phase-1/README.md)
2. [phase-1/runtime-agent-minimal-loop.md](phase-1/runtime-agent-minimal-loop.md)
3. [phase-1/message-store-work-track.md](phase-1/message-store-work-track.md)
4. [phase-1/prompt-manager-minimal-package.md](phase-1/prompt-manager-minimal-package.md)

### 路径三：直接进入 Phase 2

1. [phase-2/README.md](phase-2/README.md)
2. [phase-2/tool-loop-and-approval-continuation.md](phase-2/tool-loop-and-approval-continuation.md)
3. [phase-2/sqlite-message-store-and-migration.md](phase-2/sqlite-message-store-and-migration.md)
4. [phase-2/host-protocol-handler.md](phase-2/host-protocol-handler.md)

## 维护规则

- 新增冻结实施文档统一放在本目录，不散落到根目录、`research/` 或 `decisions/`
- 本目录文档可以引用 ADR 和 research，但不重复承载其完整内容
- 涉及真实项目仓库的改动，必须先在本目录形成阶段实施计划输入说明
- 后续若补充 `Phase 3+`，继续在本目录按 phase 或专题扩展，不回写到调研或 ADR 目录

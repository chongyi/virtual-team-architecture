# Phase 3：完整对话 + 组织管理

## 阶段概览

Phase 3 为两轨并行（轨道 C 空闲）。轨道 A 实现完整对话能力，轨道 B 实现组织管理。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A3: VTA 完整对话 | 3 | SQLite MessageStore、三类别模型选择器、Approval continuation + 多轮对话 |
| B | G-B3: 组织管理 | 3 | 组织 CRUD API、组织管理 + VE 管理 UI（Flutter）、Admin Console 初步 |

## 依赖关系

- G-A3 依赖 G-A2（Phase 2 产出）
- G-B3 依赖 G-B2（Phase 2 产出）
- 两条轨道之间无相互依赖

## 涉及的设计文档

### 轨道 A
- `08-vte-agent-internals/message-model.md`（SQLite 持久化）
- `08-vte-agent-internals/execution-loop.md`（Approval 机制）
- `virtual-employee-system/technical-design/technology-selection.md`（SQLite crate 选型）

### 轨道 B
- `04-collaboration-app/technical-design/server-architecture.md`
- `04-collaboration-app/technical-design/admin-console.md`
- `10-tenant-and-org-model.md`

# Phase 3：完整对话 + 组织管理

> **开始前请先读取**：`CONTEXT.md`、`PREFLIGHT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 3 为两轨并行（轨道 C 空闲）。轨道 A 实现完整对话能力，轨道 B 实现组织管理。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A3: VTA 完整对话 | 3 | SQLite MessageStore、三类别模型选择器、Approval continuation + 多轮对话 |
| B | G-B3: 组织管理 | 4 | 组织 CRUD API、组织管理 + VE 管理 UI（Flutter）、Admin Console 初步、消息搜索（FTS） |
| M | M2 验收 | 1 | M2 里程碑基础就绪端到端验证 |

## 依赖关系

- G-A3 依赖 G-A2（Phase 2 产出）
- G-B3 依赖 G-B2（Phase 2 产出）
- 两条轨道之间无相互依赖，推荐先完成 A3 轨道再完成 B3 轨道（A3 先交付 VTA 稳定接口）

## 执行策略

- **单 Codex 实例线性执行**，推荐顺序：A3.1→A3.2→A3.3 → B3.1→B3.2→B3.3→B3.4 → M2.1
- 共 **8** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A3.1 | [U-A3.1-vta-sqlite-store.md](units/U-A3.1-vta-sqlite-store.md) | A2.3 |
| 2 | U-A3.2 | [U-A3.2-vta-model-selector.md](units/U-A3.2-vta-model-selector.md) | A3.1 |
| 3 | U-A3.3 | [U-A3.3-vta-approval-multiturn.md](units/U-A3.3-vta-approval-multiturn.md) | A3.2 |
| 4 | U-B3.1 | [U-B3.1-org-crud-api.md](units/U-B3.1-org-crud-api.md) | B2.3 |
| 5 | U-B3.2 | [U-B3.2-org-ve-ui.md](units/U-B3.2-org-ve-ui.md) | B3.1 |
| 6 | U-B3.3 | [U-B3.3-admin-console.md](units/U-B3.3-admin-console.md) | B3.2 |
| 7 | U-B3.4 | [U-B3.4-search-fts.md](units/U-B3.4-search-fts.md) | B3.1 |
| 8 | U-M2.1 | [U-M2-foundation-e2e.md](units/U-M2-foundation-e2e.md) | 全部 |

## 涉及的设计文档

### 轨道 A
- `08-vte-agent-internals/message-model.md`（SQLite 持久化）
- `08-vte-agent-internals/execution-loop.md`（Approval 机制）
- `virtual-employee-system/technical-design/technology-selection.md`（SQLite crate 选型）

### 轨道 B
- `04-collaboration-app/technical-design/server-architecture.md`
- `04-collaboration-app/technical-design/admin-console.md`
- `10-tenant-and-org-model.md`

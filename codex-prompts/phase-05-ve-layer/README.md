# Phase 5：VE 封装层 + 协作工具集

> **开始前请先读取**：`CONTEXT.md`、`PREFLIGHT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 5 是**第二个关键集成点（M5）**。轨道 A 实现 VE 封装层（意图 Agent + 工作上下文），轨道 B 实现基础版协作工具集。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A5: VE 封装层 | 3 | 意图识别 Agent + 主 Agent 协作 → 工作上下文状态机 → 配置包高阶扩展 |
| B | G-B5: 基础版协作工具集 | 8 | 文档后端/前端 → 表格后端/前端 → 看板 → 审批流 → 日程 → Tool Action Gateway |
| X | G-X5: 内测质量 gate | 2 | Tool Action 权限审计 + 离线链路验收、基础审计事件 |
| M | M5 验收 | 1 | M5 内测版端到端场景验收 |

## 里程碑 M5：内测版

完整虚拟员工行为 + 基础版协作工具集。用户可以通过工具与 VE 协作产出内容。

## 执行策略

- **单 Codex 实例线性执行**
- 推荐顺序：A5.1→A5.2→A5.3 → B5.1a→B5.1b → B5.2a→B5.2b → B5.3→B5.4→B5.5→B5.6 → X5.1→X5.2 → M5.1
- B5.3/B5.4/B5.5 之间互相独立（都依赖 B5.1b），可任意顺序
- B5.6 依赖 B5.2b/B5.3/B5.4/B5.5 全部完成
- 共 **14** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A5.1 | [U-A5.1-ve-intent-agent.md](units/U-A5.1-ve-intent-agent.md) | A4.3 |
| 2 | U-A5.2 | [U-A5.2-ve-work-context.md](units/U-A5.2-ve-work-context.md) | A5.1 |
| 3 | U-A5.3 | [U-A5.3-ve-config-extension.md](units/U-A5.3-ve-config-extension.md) | A5.2 |
| 4 | U-B5.1a | [U-B5.1a-documents-backend.md](units/U-B5.1a-documents-backend.md) | B4.3 |
| 5 | U-B5.1b | [U-B5.1b-documents-flutter.md](units/U-B5.1b-documents-flutter.md) | B5.1a |
| 6 | U-B5.2a | [U-B5.2a-bitable-backend.md](units/U-B5.2a-bitable-backend.md) | B5.1a |
| 7 | U-B5.2b | [U-B5.2b-bitable-flutter.md](units/U-B5.2b-bitable-flutter.md) | B5.2a |
| 8 | U-B5.3 | [U-B5.3-tool-board.md](units/U-B5.3-tool-board.md) | B5.1b |
| 9 | U-B5.4 | [U-B5.4-tool-approval.md](units/U-B5.4-tool-approval.md) | B5.1b |
| 10 | U-B5.5 | [U-B5.5-tool-schedule.md](units/U-B5.5-tool-schedule.md) | B5.1b |
| 11 | U-B5.6 | [U-B5.6-tool-action-gateway.md](units/U-B5.6-tool-action-gateway.md) | B5.2b–5.5 |
| 12 | U-X5.1 | [U-X5.1-tool-permission-audit.md](units/U-X5.1-tool-permission-audit.md) | 全部功能单元 |
| 13 | U-X5.2 | [U-X5.2-audit-events.md](units/U-X5.2-audit-events.md) | U-X5.1 |
| 14 | U-M5.1 | [U-M5-beta-acceptance.md](units/U-M5-beta-acceptance.md) | 全部 gate 单元 |

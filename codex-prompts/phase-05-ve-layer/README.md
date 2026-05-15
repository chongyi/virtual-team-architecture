# Phase 5：VE 封装层 + 协作工具集

> **开始前请先读取**：`CONTEXT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 5 是**第二个关键集成点（M5）**。轨道 A 实现 VE 封装层（意图 Agent + 工作上下文），轨道 B 实现基础版协作工具集（文档/表格/看板/审批/日程 + Tool Action Gateway），轨道 C 实现 VE 绑定。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A5: VE 封装层 | 3 | 意图识别 Agent + 主 Agent 协作 → 工作上下文状态机 → 配置包高阶扩展 |
| B | G-B5: 基础版协作工具集 | 6 | 轻量文档 → 类型化表格 → 看板 → 审批流 → 日程定时器 → Tool Action Gateway |
| C | G-C3: VE 绑定 | 3 | VE 分配 → 工具调用路由 → 多 VE 共享与隔离 |

## 里程碑 M5：内测版

完整虚拟员工行为 + 基础版协作工具集。用户可以通过工具与 VE 协作产出内容。

## 执行策略

- **单 Codex 实例线性执行**
- 推荐顺序：先完成 A5 轨道（A5.1→A5.2→A5.3），再完成 C3 轨道（C3.1→C3.2→C3.3，跨轨依赖 G-A4 已满足），最后完成 B5 轨道
- B5 轨道内部：B5.1 先完成（文档工具），然后 B5.2/B5.3/B5.4/B5.5 可任意顺序（互相独立），最后 B5.6 汇总
- 共 **12** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A5.1 | [U-A5.1-ve-intent-agent.md](units/U-A5.1-ve-intent-agent.md) | A4.3 |
| 2 | U-A5.2 | [U-A5.2-ve-work-context.md](units/U-A5.2-ve-work-context.md) | A5.1 |
| 3 | U-A5.3 | [U-A5.3-ve-config-extension.md](units/U-A5.3-ve-config-extension.md) | A5.2 |
| 4 | U-C3.1 | [U-C3.1-ve-node-assignment.md](units/U-C3.1-ve-node-assignment.md) | C2.3 |
| 5 | U-C3.2 | [U-C3.2-tool-routing.md](units/U-C3.2-tool-routing.md) | C3.1 |
| 6 | U-C3.3 | [U-C3.3-multi-ve-sharing.md](units/U-C3.3-multi-ve-sharing.md) | C3.2 |
| 7 | U-B5.1 | [U-B5.1-tool-documents.md](units/U-B5.1-tool-documents.md) | B4.3 |
| 8 | U-B5.2 | [U-B5.2-tool-bitable.md](units/U-B5.2-tool-bitable.md) | B5.1 |
| 9 | U-B5.3 | [U-B5.3-tool-board.md](units/U-B5.3-tool-board.md) | B5.1 |
| 10 | U-B5.4 | [U-B5.4-tool-approval.md](units/U-B5.4-tool-approval.md) | B5.1 |
| 11 | U-B5.5 | [U-B5.5-tool-schedule.md](units/U-B5.5-tool-schedule.md) | B5.1 |
| 12 | U-B5.6 | [U-B5.6-tool-action-gateway.md](units/U-B5.6-tool-action-gateway.md) | B5.2–5.5 |

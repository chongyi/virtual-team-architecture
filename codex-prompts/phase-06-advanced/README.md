# Phase 6：高级特性 + 全平台

> **开始前请先读取**：`CONTEXT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 6 是最终阶段，三条轨道实现生产级高级特性，达到 M6 公测版里程碑。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A6: VTA 高级特性 | 3 | CompactionStrategy → Sub-agent 调度 → Transport + 可观测性加固 |
| B | G-B6: 全平台与工具增强 | 4 | 移动端适配 → 第三方 IM 渠道 → 推送通知 → 完整协作工具形态 |
| C | G-C4: 高级特性 | 3 | 第三方 Agent 集成 → 云端托管 → 专属工具定制 |

## 里程碑 M6：公测版

高级特性就绪 + 全平台支持 + 工具增强 + 云端工作环境。

## 执行策略

- **单 Codex 实例线性执行**，推荐顺序：A6.1→A6.2→A6.3 → B6.1→B6.2→B6.3→B6.4 → C4.1→C4.2→C4.3
- 共 **10** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A6.1 | [U-A6.1-vta-compaction.md](units/U-A6.1-vta-compaction.md) | A5.3 |
| 2 | U-A6.2 | [U-A6.2-vta-subagent.md](units/U-A6.2-vta-subagent.md) | A6.1 |
| 3 | U-A6.3 | [U-A6.3-vta-transport-observability.md](units/U-A6.3-vta-transport-observability.md) | A6.2 |
| 4 | U-B6.1 | [U-B6.1-mobile-adaptation.md](units/U-B6.1-mobile-adaptation.md) | B5.6 |
| 5 | U-B6.2 | [U-B6.2-third-party-im.md](units/U-B6.2-third-party-im.md) | B6.1 |
| 6 | U-B6.3 | [U-B6.3-push-notification.md](units/U-B6.3-push-notification.md) | B6.1 |
| 7 | U-B6.4 | [U-B6.4-advanced-tools.md](units/U-B6.4-advanced-tools.md) | B6.1 |
| 8 | U-C4.1 | [U-C4.1-third-party-agent.md](units/U-C4.1-third-party-agent.md) | C3.3 |
| 9 | U-C4.2 | [U-C4.2-cloud-hosting.md](units/U-C4.2-cloud-hosting.md) | C4.1 |
| 10 | U-C4.3 | [U-C4.3-custom-tools.md](units/U-C4.3-custom-tools.md) | C4.2 |

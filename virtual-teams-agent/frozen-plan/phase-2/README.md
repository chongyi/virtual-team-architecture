# Phase 2 子计划索引

> 用途：把新的 `Phase 2` 结构基础收敛阶段拆成可独立执行的计划输入。

## 范围

本目录只覆盖新的 `Phase 2`，对应主计划中的三条主线：

- runtime-agent foundation refactor
- `MessageStore` 与消息工作轨
- 最小 Prompt 配置包

## 当前文档

| 文档 | 用途 |
|------|------|
| [runtime-agent-foundation-refactor.md](runtime-agent-foundation-refactor.md) | 冻结从 MVP 到稳定结构的 `runtime-agent` 重构边界 |
| [message-store-work-track.md](message-store-work-track.md) | 冻结 `MessageStore`、memory backend、事务与消息工作轨边界 |
| [prompt-manager-minimal-package.md](prompt-manager-minimal-package.md) | 冻结最小 Prompt 配置包、目录结构、解析与后置项 |

## 文档关系

- `runtime-agent-foundation-refactor.md` 是结构收敛主线文档
- `message-store-work-track.md` 是状态与持久化支撑文档
- `prompt-manager-minimal-package.md` 是输入构建支撑文档

三者组合后，才构成完整的 `Phase 2` 执行输入。

## 建议执行顺序

1. 先完成 [message-store-work-track.md](message-store-work-track.md)
2. 再并行推进 [prompt-manager-minimal-package.md](prompt-manager-minimal-package.md)
3. 最后完成 [runtime-agent-foundation-refactor.md](runtime-agent-foundation-refactor.md)

原因：

- `runtime-agent` 结构收敛依赖 `MessageStore` 的抽象边界
- Prompt 配置包可部分并行，但最终仍要与重构后的 `runtime-agent` 接线

# Phase 1 子计划索引

> 用途：把 `Phase 1` 的“最小可用 Loop”拆成可独立执行的计划输入，供后续阶段按子目标推进。

## 范围

本目录只覆盖 `Phase 1`，对应主计划中的三条主线：

- `runtime-agent` 最小 loop
- `MessageStore` 与消息工作轨
- 最小 `PromptManager` 与配置包

## 当前文档

| 文档 | 用途 |
|------|------|
| [runtime-agent-minimal-loop.md](runtime-agent-minimal-loop.md) | 冻结 `runtime-agent` 的最小 loop、执行路径与验收标准 |
| [message-store-work-track.md](message-store-work-track.md) | 冻结 `MessageStore`、memory backend、事务与消息工作轨边界 |
| [prompt-manager-minimal-package.md](prompt-manager-minimal-package.md) | 冻结最小 Prompt 配置包、目录结构、解析与后置项 |

## 文档关系

- `runtime-agent-minimal-loop.md` 是主线文档，定义最小闭环
- `message-store-work-track.md` 是状态与持久化支撑文档
- `prompt-manager-minimal-package.md` 是输入构建支撑文档

三者组合后，才构成完整的 `Phase 1` 执行输入。

## 建议阅读顺序

1. 先读 [runtime-agent-minimal-loop.md](runtime-agent-minimal-loop.md)
2. 再读 [message-store-work-track.md](message-store-work-track.md)
3. 最后读 [prompt-manager-minimal-package.md](prompt-manager-minimal-package.md)

## 使用方式

- 这些文档不是替代总计划，而是把 `Phase 1` 拆成可独立执行的计划输入
- 后续执行阶段可按文档拆分子任务，但不应偏离这里冻结的边界与后置项
- 如果某项实现只改 loop，不涉及消息轨或 prompt 包，也仍然需要回看另外两份文档，避免局部实现偏离整体冻结边界

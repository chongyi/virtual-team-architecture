# Phase 1 子计划索引

> 用途：把新的 `Phase 1` 最小可运行 agent MVP 拆成可独立执行的计划输入。

## 范围

本目录只覆盖新的 `Phase 1`，对应主计划中的两条主线：

- 最小可运行 agent
- `chrome-devtools` MCP example

## 当前文档

| 文档 | 用途 |
|------|------|
| [minimal-runnable-agent.md](minimal-runnable-agent.md) | 冻结本地/in-process 最小 agent MVP 的能力边界、控制流与验收标准 |
| [mcp-browser-example.md](mcp-browser-example.md) | 冻结 `chrome-devtools` MCP example 的任务类型、提示词样例与验收关注点 |

## 文档关系

- `minimal-runnable-agent.md` 定义新的 `Phase 1` 核心能力
- `mcp-browser-example.md` 定义新的 `Phase 1` 标准验收场景

两者组合后，才构成完整的 `Phase 1` 执行输入。

## 建议阅读顺序

1. 先读 [minimal-runnable-agent.md](minimal-runnable-agent.md)
2. 再读 [mcp-browser-example.md](mcp-browser-example.md)

## 使用方式

- 这些文档不是替代总计划，而是把新的 `Phase 1` 拆成可独立执行的计划输入
- 后续执行阶段可以继续细分任务，但不能引入 MessageStore、Protocol Handler 或 transport 作为本阶段前置条件

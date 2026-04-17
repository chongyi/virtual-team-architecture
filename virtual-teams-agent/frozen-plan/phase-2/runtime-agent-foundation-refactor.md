# Phase 2：runtime-agent Foundation Refactor

> 用途：冻结新的 `Phase 2` 中 `runtime-agent` 从 MVP 过渡到稳定结构的重构边界。

## 1. 目标

在新的 `Phase 1` 最小可运行 agent 基础上，把临时实现收敛到后续阶段可持续扩展的结构：

- 接入 `MessageStore`
- 接入最小 Prompt 配置包
- 把临时 history 替换为工作轨

## 2. 本阶段必须具备的能力

- `runtime-agent` 不再依赖临时 history 作为唯一上下文来源
- `runtime-agent` 能与最小 Prompt 配置包接线
- 保持已有 tool loop 能力，不因结构收敛而回退

## 3. 固定边界

- 本阶段是结构基础收敛，不是完整对话扩展
- tool loop 继续保留，但 approval continuation 与多轮优化后置到 `Phase 3`
- Protocol Handler 不进入本阶段

## 4. 验收标准

- MVP 路线可平滑过渡到工作轨结构
- 后续 `Phase 3` 不需要回退到临时 history
- 本阶段完成后，agent 的核心执行能力不弱于新的 `Phase 1`

## 5. 本文不负责的内容

- 不负责定义 approval continuation
- 不负责定义 sqlite 生产落地
- 不负责定义 Protocol Handler

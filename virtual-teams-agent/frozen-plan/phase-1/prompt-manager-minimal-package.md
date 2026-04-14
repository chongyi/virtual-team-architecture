# Phase 1：PromptManager 最小配置包

> 用途：冻结 `PromptManager` 在 `Phase 1` 的最小能力，防止后续阶段一次性把 provider override、热更新、复杂缓存全部提前塞进实现。

## 0. 与其他文档的关系

本文只定义 `Phase 1` 的最小 Prompt 配置包落地范围。

- `Phase 1` 的最小 loop 约束见 [runtime-agent-minimal-loop.md](runtime-agent-minimal-loop.md)
- `AgentLoop` 与消息工作轨的长期边界见 [../interfaces/agent-loop-and-message-store.md](../interfaces/agent-loop-and-message-store.md)

## 1. 目标

在 `Phase 1` 内落地最小 Prompt 配置包方案，使 agent loop 可以从外部配置读取基础模板，而不是继续依赖硬编码 prompt。

## 2. 本阶段必须具备的能力

- 单配置包
- 固定目录结构
- 基础模板解析
- 基础 scene 路由
- 与现有 `PromptComposer / PromptRenderer / PromptProjector` 接线

## 3. 最小目录约束

本阶段只要求支持最小目录语义：

- `manifest`
- 默认 system 模板
- 最小 scene 模板

是否使用具体扩展名、模板引擎语法和 manifest 字段细节，可由后续更细的实现文档继续冻结，但不得突破“单配置包 + 固定结构 + 基础解析”边界。

## 4. 固定边界

- `PromptManager` 属于 `runtime-agent`
- `Phase 1` 只允许单配置包
- scene 路由只要求支持最小能力
- provider override 不进入本阶段
- 热更新不进入本阶段

## 4.1 执行前提

- `runtime-agent` 最小 loop 已确定通过外部配置包而非硬编码 prompt 取模板
- Prompt 组装链路仍沿用 `PromptComposer / PromptRenderer / PromptProjector`
- 多配置包与 provider 特化能力明确后置

## 5. 明确后置项

以下内容全部后置：

- provider 特化覆盖
- 文件监听与显式 reload
- 静态/动态模板缓存优化
- 多配置包并行切换
- 更复杂的模板变量策略

## 6. 验收标准

- `runtime-agent` 能从配置包读取最小模板
- 最小 scene 路由可用
- Prompt 组装链路能跑通
- 文档和实现都不把 provider override、热更新写成 `Phase 1` 已实现内容

## 6.1 最小完成产物

- 一份可供实现的最小配置包目录约束
- 一条清晰的 Prompt 配置读取与组装接线范围
- 一组能判断“硬编码 prompt 已退出主路径”的验收条件

## 7. 本文不负责的内容

- 不负责定义 `AgentLoop` 的完整控制流
- 不负责定义 provider override 或热更新机制
- 不负责定义多配置包切换策略

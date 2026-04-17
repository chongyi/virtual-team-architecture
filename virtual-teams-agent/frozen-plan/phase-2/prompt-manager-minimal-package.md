# Phase 2：PromptManager 最小配置包

> 用途：冻结新的 `Phase 2` 中 Prompt 配置包的最小能力，确保结构基础收敛后不再依赖轻量临时 prompt 组装。

## 1. 目标

在新的 `Phase 2` 内落地最小 Prompt 配置包方案，使 agent 从轻量 prompt 组装过渡到可维护的配置包路径。

## 2. 本阶段必须具备的能力

- 单配置包
- 固定目录结构
- 基础模板解析
- 基础 scene 路由
- 与 `PromptComposer / PromptRenderer / PromptProjector` 接线

## 3. 固定边界

- `PromptManager` 从本阶段开始进入主线
- 本阶段只允许单配置包
- provider override 与热更新不进入本阶段

## 4. 明确不做的内容

- provider 特化覆盖
- 文件监听与显式 reload
- 多配置包并行切换
- 更复杂的模板变量策略

## 5. 验收标准

- `runtime-agent` 能从最小配置包读取模板
- Prompt 组装链路不再依赖 `Phase 1` 的轻量临时拼装
- 后续 `Phase 3` 不需要为了完整对话能力再回头重做 Prompt 输入层

## 5.1 检查清单

- 检查项：存在单配置包目录约束与最小模板集合
- 检查项：`PromptComposer / PromptRenderer / PromptProjector` 仍沿用现有接线
- 检查项：provider override 与热更新未被提前纳入本阶段

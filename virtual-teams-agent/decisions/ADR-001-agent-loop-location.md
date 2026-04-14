# ADR-001: Agent Loop 归属

**状态**：已采纳 | **日期**：2026-04-08

## 背景

项目需要实现完整的 LLM 推理循环（prompt → inference → tool call → loop）。现有架构中：
- `runtime-kernel` 管理 Session/Turn 生命周期和状态转换，但不包含推理循环
- `runtime-host` 是组装层，持有所有组件引用但职责是组装而非业务逻辑
- `runtime-inference` 定义推理契约但不编排循环

推理循环需要协调 inference backend、tool execution、prompt composition、compaction 等多个子系统，是一个独立的编排职责。

## 考虑的选项

### A. 在 runtime-kernel 内扩展

kernel 已有 Turn 生命周期管理，直接在其中加入推理循环。

- 优点：无需新 crate，Turn 状态转换和推理循环在同一处
- 缺点：kernel 职责膨胀，从"状态管理"变成"状态管理 + 业务编排"；kernel 需要新增对 inference、tools 等 crate 的依赖，破坏现有依赖图

### B. 新建 runtime-agent crate（✅ 采纳）

独立 crate 专注推理循环编排，kernel 保持纯净。

- 优点：职责单一；kernel 不膨胀；agent 可独立演进；依赖图清晰
- 缺点：多一个 crate；kernel 和 agent 之间需要明确接口

### C. 在 runtime-host 中实现

host 已持有所有组件引用，最方便。

- 优点：无需新 crate，组件引用现成
- 缺点：host 的职责是组装而非业务逻辑，会模糊边界

## 决策

**采纳选项 B**：新建 `runtime-agent` crate。

依赖关系：
```
runtime-core, runtime-kernel, runtime-inference, runtime-tools, runtime-skills
  ↑
runtime-agent ← 推理循环编排（新 crate）
  ↑
runtime-host ← 组装 + 注入
```

## 理由

- 与现有架构风格一致（每个 crate 职责单一）
- kernel 保持"状态管理 + 事件广播"的纯净职责
- agent 可独立测试（mock kernel + mock inference）
- 未来子 agent、多 agent 编排等高级特性有清晰的归属

## 影响

- 新增 `runtime-agent` crate 到 workspace
- `runtime-host` 新增对 `runtime-agent` 的依赖，负责注入所有组件
- kernel 的 `StartTurnRequest` / `CompleteTurnRequest` 等接口成为 agent 和 kernel 之间的契约

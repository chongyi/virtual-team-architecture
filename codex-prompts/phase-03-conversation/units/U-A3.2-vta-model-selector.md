# U-A3.2 三类别模型选择器

## 目标 (Goal)

实现 ModelSelector trait 和三类别模型策略（Cheap/Balanced/Powerful），支持根据任务复杂度、成本预算、延迟要求自动选择模型，使 Agent 在意图识别等低成本场景和主推理场景中使用不同模型。

## 上下文 (Context)

- 前置：U-A3.1（SQLite Store）
- 设计文档：`08-vte-agent-internals/agent-architecture.md`、`virtual-employee-system/technical-design/technology-selection.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/model-selector/Cargo.toml | create | 新 crate |
| crates/vta/model-selector/src/lib.rs | create | ModelSelector trait + DefaultModelSelector |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 三类模型：Cheap（低成本快速，如 Haiku）、Balanced（适中，如 Sonnet）、Powerful（最强，如 Opus）
- 模型配置支持 api_base、api_key、model_name 覆盖
- 模型选择策略可被 AgentProfile 中的 model_policy 覆盖

## 完成条件 (Done When)

- [ ] ModelSelector trait 含 `select(category, policy) -> ModelConfig` 方法
- [ ] 三种类别各自有默认模型名，可被配置覆盖
- [ ] 与推理 Backend 正确集成（替换硬编码的模型选择）
- [ ] `cargo test -p vta-model-selector` 全部通过

### 提交标准

- [ ] `feat(vta): add three-tier model selector with Cheap/Balanced/Powerful categories`

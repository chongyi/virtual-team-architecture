# ADR-006: 动态模型选择

**状态**：已采纳 | **日期**：2026-04-08

## 背景

不同任务场景对 LLM 模型的需求不同：主对话需要强推理能力，压缩/标题生成只需要快速廉价的模型，特定场景（Plan、DeepThinking）可能需要特定模型。

参考项目做法：
- ClaudeCode：两级体系（MainLoopModel + SmallFastModel），运行时按条件切换
- OpenCode：per-agent 配置，无自动切换
- Codex：单一模型，无动态选择

现有架构中 `runtime-core` 已有 `ModelPolicy` 和 `ModelSelector`，但 `ModelSwitchPolicy` 仅支持 `Fixed`。

## 考虑的选项

### A. 命名槽位（Named Slots）

预定义固定槽位（main、fast、plan、compaction 等）。

- 优点：简单明确
- 缺点：加新场景 = 加新字段 = 改代码；不够灵活

### B. 三类别模型体系（✅ 采纳）

用户提出的方案：MainLoopModel / SceneModel(动态) / SmallFastModel。

- 优点：SceneModel 通过 `BTreeMap<SceneId, ModelSelector>` 实现，加新场景 = 加配置；SceneId 可作为策略索引键
- 缺点：比命名槽位稍复杂

### C. 完全动态路由

运行时根据上下文（token 数、任务复杂度等）自动选择模型。

- 优点：最智能
- 缺点：实现复杂，行为不可预测

## 决策

**采纳选项 B**：三类别模型体系。

### 三类别定义

| 类别 | 用途 | 配置方式 |
|------|------|---------|
| **MainLoopModel** | 主 agent 对话循环 | `ModelPolicy.default_selector` |
| **SceneModel** | 场景特化模型 | `ModelPolicy.scene_selectors: BTreeMap<SceneId, ModelSelector>` |
| **SmallFastModel** | 轻量辅助任务 | `ModelPolicy.fast_selector: Option<ModelSelector>` |

### 场景标识符（SceneId）

```rust
pub struct SceneId(pub String);

// 预定义场景
impl SceneId {
    pub const PLAN: &str = "plan";
    pub const CHAT: &str = "chat";
    pub const COMPACTION: &str = "compaction";
    pub const DEEP_THINKING: &str = "deep_thinking";
    pub const TITLE_GENERATION: &str = "title_generation";
}
```

### 解析优先级

```
请求 SceneModel(scene_id)
  → scene_selectors[scene_id]
  → 未配置 → default_selector (MainLoopModel)

请求 SmallFastModel
  → fast_selector
  → 未配置 → default_selector (MainLoopModel)
```

## 理由

- SceneId 是动态的字符串标识符，加新场景只需加配置，无需改代码
- 三类别覆盖了所有参考项目的模型选择需求
- CompactionStrategy 等组件可直接声明自己需要的 SceneId，agent loop 按 scene 查模型
- 回退链清晰，配置灵活度高

## 影响

- `runtime-core` 新增 `SceneId` 类型
- `ModelPolicy` 扩展 `scene_selectors` 和 `fast_selector` 字段
- `runtime-agent` 的 AgentLoop 在不同阶段使用不同 SceneId 请求模型
- CompactionStrategy 实现声明 `SceneId::COMPACTION`
- PromptManager 可按 SceneId 选择不同 prompt 模板

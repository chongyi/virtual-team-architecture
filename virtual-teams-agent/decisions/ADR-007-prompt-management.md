# ADR-007: Prompt 模板与管理机制

**状态**：已采纳 | **日期**：2026-04-08

## 背景

Agent 的角色、风格、行为细节需要通过 prompt 定义。参考项目的做法各有局限：
- ClaudeCode：函数式组装，prompt 硬编码在 TypeScript 中，定制需改代码
- OpenCode：`.txt` 文件按 provider 分，有一定灵活度但无统一管理层
- Codex：`{{variable}}` 模板引擎，但模板仍嵌入代码

本项目的核心需求是：**无需修改代码，通过配置包下发即可调整 agent 角色、风格和行为细节**。

现有架构中已有完整的 prompt 管线：
- `PromptComposer`：将多层 prompt 组合为 `PromptBundle`
- `PromptRenderer`：将 `PromptBundle` 渲染为 `PromptProjection`
- `PromptBundle` 支持 9 类 layer（system/runtime/profile/skill/plugin/mcp/tool/resource/user）

缺失的是：**谁来加载、解析、缓存模板文件，并将它们喂给 PromptComposer？**

## 考虑的选项

### A. PromptComposer 直接加载文件

扩展现有 PromptComposer 使其具备文件加载能力。

- 优点：无需新组件
- 缺点：PromptComposer 定义在 `runtime-inference`，不应依赖文件系统；职责混淆

### B. 独立 PromptManager 在 runtime-agent 内（✅ 采纳）

新建 PromptManager 作为 PromptComposer 的上游数据源。

- 优点：职责清晰；配置包驱动；可独立测试；与 agent loop 同层
- 缺点：多一个组件

### C. PromptManager 作为独立 trait 在 runtime-inference

定义 trait 在 inference 层，实现在 host 层。

- 优点：trait 驱动，可替换
- 缺点：PromptManager 是上层业务逻辑，不属于 inference 契约层

## 决策

**采纳选项 B**：PromptManager 在 `runtime-agent` 内实现。

## 设计

### 核心职责

```
配置包（文件目录）
  ↓ 加载/解析/缓存
PromptManager（模板注册表 + 变量解析器）
  ↓ 按 profile/scene/provider 解析
PromptBundleInput（已有类型）
  ↓ 喂给
PromptComposer → PromptBundle → PromptRenderer → InferenceBackend
```

### 配置包结构

```
agent-config/
  ├── manifest.toml              # 元数据（名称、版本、兼容性）
  ├── prompts/
  │   ├── system.md              # 默认系统 prompt
  │   ├── system.anthropic.md    # Anthropic 特化
  │   ├── system.openai.md       # OpenAI 特化
  │   ├── compaction.md          # 压缩指令
  │   └── scenes/
  │       ├── plan.md            # Plan 场景
  │       ├── chat.md            # Chat 场景
  │       └── deep-thinking.md   # 深度思考场景
  ├── tools/                     # 工具定义
  └── skills/                    # 技能定义
```

### 模板解析

支持 `{{variable}}` 变量替换，变量来源于 `PromptTemplateContext`（已有类型）：

```rust
pub struct PromptTemplateContext {
    pub session: Value,    // session 信息
    pub turn: Value,       // turn 信息
    pub runtime: Value,    // 运行时信息（OS、时间等）
    pub workspace: Value,  // 工作目录信息
    pub profile: Value,    // agent profile
    pub skills: Value,     // 活跃技能
    pub tools: Value,      // 可用工具
    pub resources: Value,  // 资源上下文
    pub metadata: Value,   // 扩展元数据
}
```

### Provider 回退链

```
请求 prompt(scene_id, provider_id)
  → prompts/scenes/{scene_id}.{provider_id}.md
  → prompts/scenes/{scene_id}.md
  → prompts/system.{provider_id}.md
  → prompts/system.md
  → 内嵌默认 prompt（include_str! 兜底）
```

### 缓存策略

- 启动时加载配置包，解析所有模板
- 文件监听（可选），检测变更时重新加载
- 静态模板内容标记为可缓存（对应 ClaudeCode 的 DYNAMIC_BOUNDARY 思路）
- 动态变量在每轮 Turn 开始时解析

## 理由

- PromptManager 是 agent 层的业务逻辑，归属 `runtime-agent` 最自然
- 配置包机制使 agent 定制完全外部化，支持：
  - 多租户场景（不同 agent 不同人格）
  - A/B 测试 prompt 变体
  - 快速迭代 prompt 工程（无需重新部署）
  - 客户自定义
- 与现有 PromptComposer/PromptRenderer 管线无缝衔接

## 影响

- `runtime-agent` 新增 PromptManager 模块
- 定义配置包格式规范（manifest.toml schema）
- 模板引擎实现（`{{variable}}` 替换 + 条件渲染）
- Provider 回退链解析逻辑
- 可选：文件监听热更新

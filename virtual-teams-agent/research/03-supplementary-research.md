# 补充调研：模型选择、工具披露、Prompt 角色

> 针对三个具体细节问题的跨项目对比调研。

## 1. 动态模型选择

### 1.1 ClaudeCode — 最完整的分层体系

**两级模型**：

| 级别 | 函数 | 用途 |
|------|------|------|
| 主循环模型 | `getMainLoopModel()` | 主 agent 对话 |
| 小快模型 | `getSmallFastModel()` | 压缩、标题生成、轻量查询 |

**文件**：`src/utils/model/model.ts`

**主循环模型选择优先级**：
1. Session 内 `/model` 命令覆盖
2. 启动参数 `--model`
3. 环境变量 `ANTHROPIC_MODEL`
4. 用户设置
5. 默认值

**运行时切换条件**：
- `permissionMode === 'plan'` → 切换到 plan 模型
- `exceeds200kTokens` → 切换到 1M 上下文模型
- 用户等级（Max/Team Premium → Opus，其他 → Sonnet）

**小快模型**：
- 环境变量 `ANTHROPIC_SMALL_FAST_MODEL` 可覆盖
- 默认 Haiku
- 用于：对话压缩、标题生成、简单查询

### 1.2 OpenCode — 配置驱动的 per-agent 模型

**文件**：`packages/opencode/src/agent/agent.ts`

每个 agent 定义中有可选 `model` 字段：
```typescript
model: z.object({
    modelID: ModelID.zod,
    providerID: ProviderID.zod,
}).optional()
```

- 用户在 config 中按 agent 名称配置模型
- 内置隐藏 agent（compaction、title、summary）可配置不同模型
- 无自动"复杂度感知"切换，完全靠配置

### 1.3 Codex — 固定模型 + 协作模式

- 默认模型硬编码（`codex-1`）
- `--model` 参数覆盖
- 无运行时动态切换
- 协作模式（collaboration modes）影响行为但不切换模型

### 1.4 对比总结

| | ClaudeCode | OpenCode | Codex |
|---|---|---|---|
| 模型层级 | 主模型 + 小快模型 | per-agent 配置 | 单一模型 |
| 运行时切换 | 有（plan/token/tier） | 无 | 无 |
| 配置灵活度 | 中（环境变量+设置） | 高（per-agent） | 低 |
| 场景感知 | 有（plan mode） | 有（agent mode） | 无 |

### 1.5 对本项目的启示

→ 采用三类别模型体系（MainLoopModel / SceneModel / SmallFastModel），结合 ClaudeCode 的分层思想和 OpenCode 的配置灵活度，通过 SceneId 实现动态场景路由。

---

## 2. 渐进式工具披露

### 2.1 ClaudeCode — Skills 发现模式

**文件**：`src/tools/AgentTool/`, `src/services/mcp/`

- 初始只暴露基础工具集
- Skills 通过 "discovery tool" 模式渐进披露：先给一个 `listSkills` 工具，LLM 按需调用发现更多能力
- MCP 工具在启动时发现并注册，但可按权限过滤
- 子 Agent 使用受限工具集（由父 agent 指定）

### 2.2 OpenCode — 权限过滤

**文件**：`packages/opencode/src/tool/registry.ts`

- `resolveTools()` 函数按 agent 配置过滤可用工具
- 不同 agent 模式（general、plan、explore）有不同工具集
- Plan 模式下禁用写操作工具
- 无 Skills 发现模式

### 2.3 Codex — SkillsManager

**文件**：`codex-rs/core/src/skills.rs`

- SkillsManager 管理技能发现和加载
- 配置驱动的工具过滤
- 审批策略（approval policy）控制工具执行权限

### 2.4 对比总结

| 机制 | ClaudeCode | OpenCode | Codex |
|------|-----------|----------|-------|
| 基础过滤 | ✅ 权限 + agent 模式 | ✅ agent 配置 | ✅ 配置 + 审批策略 |
| Skills 发现 | ✅ discovery tool | ❌ | ✅ SkillsManager |
| 动态加载 | ✅ MCP 运行时发现 | ✅ MCP | ✅ MCP |
| 子 agent 限制 | ✅ 受限工具集 | ✅ per-agent | ✅ 配置 |

### 2.5 对本项目的启示

→ 基础工具过滤通过 AgentProfile.tool_policy 实现（已有）。Skills 发现模式作为高级优化预留接口，不在 Phase 1 实现。

---

## 3. Prompt 角色分配（System vs User）

### 3.1 核心问题

LLM API 支持 system/assistant/user 三种角色。哪些内容应该放 system prompt，哪些应该放 user prompt + 标记？

### 3.2 ClaudeCode 的做法

**System Role**（静态/会话级）：
- 主系统 prompt（身份定义、工具规范、行为准则）
- 压缩指令（NO_TOOLS_PREAMBLE + COMPACT_PROMPT）
- 子 agent 默认 prompt

**User Role + `<system-reminder>` 标签**（动态/运行时）：
- MCP 服务器指令
- 工具结果中的上下文提示
- 运行时注入的约束和提醒
- 会话中途的行为调整

**分界原则**：
- 静态 → system role（全局缓存友好）
- 动态 → user role + 语义标签（不破坏缓存）

### 3.3 OpenCode 的做法

- System prompt 按 provider 分文件（`anthropic.txt`、`gemini.txt`、`default.txt`）
- 运行时注入通过 `<system-reminder>` 标签包装在 user 消息中
- 与 ClaudeCode 模式一致

### 3.4 Codex 的做法

- 使用 `developer` role（OpenAI 特有）承载系统指令
- `user` role 仅用于实际用户输入
- 无 `<system-reminder>` 标签机制

### 3.5 判断原则总结

| 内容特征 | 推荐角色 | 原因 |
|---------|---------|------|
| 会话全程不变 | system | 语义正确 + prompt cache 友好 |
| 每轮可能变化 | user + 语义标签 | 不破坏 system prompt 缓存 |
| Provider 特有指令 | system（按 provider 分文件） | 不同模型理解方式不同 |
| 工具结果附带提示 | user + `<system-reminder>` | 上下文相关，非全局指令 |
| 安全/合规约束 | system | 最高优先级，不可被覆盖 |

### 3.6 对本项目的启示

→ PromptBundle 的分层设计（system_layers / runtime_layers / profile_layers 等）已经天然支持这种分离。PromptRenderer 在渲染时根据 layer 的 source 和 mutability 决定映射到哪个 API role。

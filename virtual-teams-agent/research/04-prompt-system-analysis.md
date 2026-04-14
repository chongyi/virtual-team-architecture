# Prompt 体系分析

> 深入分析各参考项目的内置 prompt 清单、模板机制和 Provider 特化策略。

## 1. ClaudeCode 内置 Prompt 清单

### 1.1 System Role Prompt

| Prompt | 文件 | 场景 |
|--------|------|------|
| 主系统 prompt | `src/constants/prompts.ts` | 主 agent 身份、工具规范、行为准则 |
| 压缩前导 | `src/services/compact/prompt.ts` (NO_TOOLS_PREAMBLE) | 压缩时禁止 tool call |
| 全量压缩指令 | `src/services/compact/prompt.ts` (BASE_COMPACT_PROMPT) | 全量对话摘要（9 个章节） |
| 部分压缩指令 | `src/services/compact/prompt.ts` (PARTIAL_COMPACT_PROMPT) | 仅压缩近期消息 |
| 子 agent 默认 prompt | `src/tools/AgentTool/runAgent.ts` | 子 agent 无自定义 prompt 时兜底 |

### 1.2 User Role + `<system-reminder>` 标签

| Prompt | 注入时机 | 场景 |
|--------|---------|------|
| MCP 服务器指令 | 每轮构建上下文时 | MCP 服务器提供的使用说明 |
| 工具结果上下文提示 | tool result 返回时 | 引导 LLM 理解工具输出 |
| 运行时约束 | 会话中途 | 行为调整、安全提醒 |
| 权限模式提示 | 模式切换时 | plan/auto 模式的行为约束 |
| 文件状态提示 | 文件操作后 | 告知 LLM 文件已变更 |
| Git 状态提示 | Git 操作后 | 当前分支、变更状态 |
| 环境信息 | 每轮 | OS、shell、工作目录等 |
| 用户偏好 | 每轮 | CLAUDE.md 中的用户指令 |

### 1.3 主系统 Prompt 结构

ClaudeCode 的主系统 prompt 由多个函数动态组装（`src/constants/prompts.ts`）：

```
getSystemPrompt()
  ├── 静态部分（可缓存）
  │   ├── 身份定义（"You are Claude..."）
  │   ├── 核心能力描述
  │   ├── 工具使用规范
  │   ├── 安全与合规约束
  │   └── 输出格式要求
  │
  ├── SYSTEM_PROMPT_DYNAMIC_BOUNDARY ← 缓存分界标记
  │
  └── 动态部分（每次重建）
      ├── 环境信息（OS、CWD、时间）
      ├── 用户偏好（CLAUDE.md）
      ├── 活跃 MCP 服务器列表
      ├── 可用工具列表
      └── 条件段落（feature flags 控制）
```

**关键设计**：`SYSTEM_PROMPT_DYNAMIC_BOUNDARY` 将 system prompt 分为静态和动态两部分。静态部分在多轮对话中可被 Anthropic API 的 prompt cache 命中，减少 token 消耗。

---

## 2. OpenCode Prompt 体系

### 2.1 Provider 分文件

**目录**：`packages/opencode/src/session/prompt/`

| 文件 | 用途 |
|------|------|
| `default.txt` | 默认 prompt（简洁、CLI 风格） |
| `anthropic.txt` | Anthropic 模型专用 |
| `gemini.txt` | Gemini 模型专用 |
| `codex.txt` | Codex 模型专用 |
| `plan.txt` | 只读 plan 模式（禁止文件修改） |
| `max-steps.txt` | 步骤限制提示 |
| `build-switch.txt` | 构建配置切换 |
| `trinity.txt` / `beast.txt` / `copilot-gpt-5.txt` | 特定模型变体 |

### 2.2 动态注入

- `<system-reminder>` 标签包装运行时指令
- 环境信息、Git 状态、工具列表等动态注入
- 与 ClaudeCode 模式一致

### 2.3 Agent 级 Prompt

每个 agent 定义中可指定 system prompt 和 instructions：
```typescript
agents: {
    general: { system: "...", instructions: "..." },
    plan: { system: "...", instructions: "..." },
    // ...
}
```

---

## 3. Codex Prompt 体系

### 3.1 模板引擎

**文件**：`codex-rs/core/src/prompt/`

Codex 使用专用模板引擎 `codex_utils_template`：
- `{{variable}}` 语法做变量替换
- 支持条件渲染
- 模板文件与代码分离

### 3.2 动态变量

| 变量 | 来源 |
|------|------|
| `{{base_branch}}` | Git 分支名 |
| `{{merge_base_sha}}` | Merge base commit |
| `{{sha}}` | 当前 commit |
| `{{title}}` | Commit 标题 |
| `{{KNOWN_MODE_NAMES}}` | 可用协作模式 |
| `{{REQUEST_USER_INPUT_AVAILABILITY}}` | 用户输入能力 |

### 3.3 角色映射

- `developer` role（OpenAI 特有）承载系统指令
- `user` role 仅用于实际用户输入
- 无 `<system-reminder>` 机制

---

## 4. 模板机制对比

| | ClaudeCode | OpenCode | Codex |
|---|---|---|---|
| **模板引擎** | 无（函数式组装） | 无（文件加载 + 字符串拼接） | `codex_utils_template`（`{{var}}`） |
| **模板存储** | 代码内嵌字符串 | `.txt` 文件 | 代码内嵌 + 模板文件 |
| **Provider 特化** | 无（Anthropic-only） | `.txt` 文件按 provider 分 | 无（OpenAI-only） |
| **动态值注入** | 函数参数 + 条件拼接 | 字符串替换 | `{{variable}}` 替换 |
| **缓存优化** | `DYNAMIC_BOUNDARY` 分界 | 无 | 无 |
| **热更新** | 无（需重启） | 文件监听 + reload | 无 |
| **外部可配置** | 低（CLAUDE.md 有限定制） | 中（config 文件） | 低 |

---

## 5. 对本项目的设计启示

### 5.1 PromptManager 设计要点

基于调研，PromptManager 应具备：

1. **配置包加载**：从外部目录加载 prompt 模板文件，支持热更新
2. **模板引擎**：支持 `{{variable}}` 变量替换（参考 Codex）
3. **Provider 分层**：按 provider 维护不同版本的 prompt（参考 OpenCode）
4. **Static/Dynamic 分离**：标记哪些内容可缓存（参考 ClaudeCode 的 DYNAMIC_BOUNDARY）
5. **Layer 映射**：模板内容映射到 PromptBundle 的不同 layer（system/runtime/profile/skill 等）
6. **回退链**：provider 特化 → 默认模板 → 内嵌兜底

### 5.2 配置包结构（建议）

```
agent-config/
  ├── manifest.toml              # 配置包元数据
  ├── prompts/
  │   ├── system.md              # 默认系统 prompt
  │   ├── system.anthropic.md    # Anthropic 特化
  │   ├── system.openai.md       # OpenAI 特化
  │   ├── compaction.md          # 压缩指令
  │   ├── plan.md                # Plan 模式
  │   └── scenes/
  │       ├── chat.md            # Chat 场景
  │       └── deep-thinking.md   # 深度思考场景
  ├── tools/
  │   └── ...                    # 工具定义
  └── skills/
      └── ...                    # 技能定义
```

### 5.3 与现有架构的衔接

PromptManager 的输出是 `PromptBundleInput` 的一部分，喂给已有的 `PromptComposer` → `PromptRenderer` → `InferenceBackend` 管线。PromptManager 不替代这条管线，而是作为管线的上游数据源。

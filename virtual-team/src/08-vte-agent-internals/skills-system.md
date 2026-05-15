# 技能系统

## 定位

Skill 是 Agent 的高阶能力单元，封装底层工具、领域知识和执行模式。它是面向用户的概念——用户说"帮我审查代码"，而不是"请分别调用 read_file、analyze_complexity、write_file"。

## Skill vs Tool

| 维度 | Tool | Skill |
|------|------|-------|
| **粒度** | 原子操作（读文件、搜索） | 高阶任务（代码审查、数据分析） |
| **面向对象** | Runtime/开发者 | 用户/LLM |
| **组合** | 不可再分 | 编排多个 Tool |
| **上下文** | 无 | 携带知识、约束、模板 |
| **生命周期** | 静态注册 | 可动态启用/禁用 |

## Skill 结构

代码中 Skill 由 `runtime-skills` crate 定义：

```rust
struct Skill {
    id: SkillId,
    name: String,
    description: String,       // LLM 据此决定何时激活 Skill
    version: SkillVersion,     // SemVer
    tools: Vec<ToolRef>,       // 引用的工具（共享工具池）
    knowledge: Value,          // 领域知识
    workflows: Vec<Workflow>,  // 预定义执行流程
    prompts: Vec<PromptTemplate>, // 专用提示词模板
    constraints: Value,        // 行为约束
    required_context: Vec<String>, // 执行前必须收集的上下文
    output_schema: Option<Value>,  // 输出格式约束
}
```

## Skill 注册与发现

`SkillRegistry` 独立于 `ToolRegistry`：

```rust
trait SkillRegistry: Send + Sync {
    fn register(&self, skill: Skill) -> Result<(), SkillError>;
    fn enable(&self, skill_id: &SkillId, session: &SessionId) -> Result<(), SkillError>;
    fn disable(&self, skill_id: &SkillId, session: &SessionId) -> Result<(), SkillError>;
    fn list_available(&self) -> Vec<SkillSummary>;
    fn list_active(&self, session: &SessionId) -> Vec<SkillId>;
}
```

Skill 启用时：
1. 验证 Skill 的完整性（检查所有工具依赖存在）
2. 将 Skill 的工具注入会话的 Tool Registry
3. 将 Skill 的上下文（描述、约束、工作流）注入 System Prompt（通过 `active-skills` instruction segment）

Skill 禁用时反向操作：移出工具，清理上下文。

## Skill 发现

Skill 基于文件系统组织：

```
skills/code_review/
├── skill.json          # Skill 清单（id/name/description/version/tools/knowledge）
├── prompts/
│   ├── system.md       # System Prompt 模板
│   └── review.md       # 审查专用 Prompt
├── knowledge/
│   └── conventions.md  # 领域知识（如代码规范）
└── workflows/
    └── review_flow.json # 预定义工作流
```

## Skill Prompt 注入

启用 Skill 时，其信息以 LLM 可理解的结构化格式注入 System Prompt：

```
Active skills: code_review, debugging

Skill: code_review v2.1.0
Description: 审查代码质量、安全性和最佳实践
Available tools: read_file, search_code, analyze_complexity
Constraints: 不直接修改代码，仅给出建议
Typical workflow: read_file → analyze → report
```

## 多 Skill 编排

- 复杂任务可能涉及多个 Skill（如"重构代码"涉及 code_review + refactoring + testing）
- Skill 切换时保存/恢复上下文，避免冲突
- Skill 间解耦：最小化跨 Skill 状态依赖

## 内置 vs 外部 Skill

| 类型 | 来源 | 信任级别 | 示例 |
|------|------|---------|------|
| **内置** | 随 VTA Runtime 打包 | 高（可访问本地文件系统） | code_review, file_operations |
| **外部** | MCP / 插件市场 | 需用户显式授权 | 第三方数据库查询、API 集成 |

## 当前实施状态

`runtime-skills` crate 已实现（Phase 1），包含 Skill 模型和基础注册表。技能启用/禁用的完整生命周期和 Session 级隔离在 Phase 2-3 中完善。

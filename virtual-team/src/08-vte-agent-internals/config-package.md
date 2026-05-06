# 配置包规范

虚拟员工的所有能力通过**文件式配置包**定义。配置包是文件资产，可版本控制、代码审查、CI/CD 部署——虚拟员工的"角色定义"本质上是代码资产，而非运行时可随意篡改的数据库状态。

## 设计原则

1. **文件即契约**：配置包的全部内容在文件系统中可见，不依赖数据库状态
2. **分层可覆盖**：通用配置 → 场景特化 → 模型特化，逐层覆盖
3. **声明式**：声明"需要什么"而非"如何实现"
4. **可移植**：配置包可在不同 Virtual Team 实例间迁移

## 目录结构

```
virtual-employee-package/
├── manifest.toml              # 虚拟员工元信息（必填）
├── identity.hbs               # 虚拟员工身份定义（必填）
├── intent-agent/
│   ├── prompt.hbs             # 意图识别 Agent 的 system prompt（必填）
│   └── model.toml             # 意图识别 Agent 模型配置（必填）
├── main-agent/
│   ├── system.hbs             # 主 Agent 的 system prompt（必填）
│   ├── instruction.hbs        # 主 Agent 的角色指令（可选）
│   ├── scenes/                # 按场景路由的 prompt 覆盖（可选）
│   │   ├── code_review.hbs
│   │   ├── data_analysis.hbs
│   │   └── content_writing.hbs
│   ├── model.toml             # 主 Agent 模型配置（必填）
│   └── execution_strategies.toml  # 执行策略定义（可选）
├── tools/                     # 可用工具声明（可选，可继承工作环境节点能力）
│   └── tools.toml
├── skills/                    # 技能声明（可选）
│   └── skills.toml
└── permissions.toml           # 权限边界（必填）
```

## manifest.toml

```toml
[package]
name = "sales-analyst"
version = "1.2.0"
display_name = "销售数据分析师"
description = "负责销售数据的分析、报告生成和趋势预测"
author = "Virtual Team Official"
license = "MIT"
keywords = ["sales", "data-analysis", "reporting"]

[compatibility]
min_vta_version = "0.2.0"
supported_model_providers = ["anthropic", "openai", "deepseek"]
```

### 字段规范

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|---------|
| `package.name` | string | ✅ | `[a-z0-9-]+`，长度 3-64 |
| `package.version` | string | ✅ | SemVer |
| `package.display_name` | string | ✅ | 用户可见名称，长度 1-32 |
| `package.description` | string | ✅ | 长度 10-500 |
| `package.author` | string | ✅ | — |
| `package.license` | string | ❌ | SPDX license identifier |
| `package.keywords` | string[] | ❌ | 每个 2-20 字符 |
| `compatibility.min_vta_version` | string | ✅ | SemVer 范围 |
| `compatibility.supported_model_providers` | string[] | ❌ | 枚举：`anthropic`, `openai`, `deepseek`, `google` |

## identity.hbs

虚拟员工在协作应用中的身份定义。此为 Handlebars 模板，支持变量注入。

```handlebars
你是一名专业的{{role}}，名叫{{display_name}}。

## 身份
- 岗位：{{role}}
- 所属组织：{{organization_name}}
- 工作语言：{{language}}

## 专业领域
{{#each expertise}}
- {{this}}
{{/each}}

## 工作风格
{{work_style}}

## 沟通规范
- 回复风格：简洁专业，直接给出结论和建议
- 工作产出：详细内容输出到协作文档，聊天框仅做摘要沟通
- 不确定性处理：明确告知不确定的内容，提供获取准确信息的建议方案
```

### 模板变量

| 变量 | 来源 | 说明 |
|------|------|------|
| `{{role}}` | manifest.toml | 角色名称 |
| `{{display_name}}` | manifest.toml | 显示名称 |
| `{{organization_name}}` | 运行时注入 | 分配的组织名称 |
| `{{language}}` | 用户设置 | 工作语言 |
| `{{expertise}}` | skills/skills.toml | 技能列表 |
| `{{work_style}}` | 可选配置 | 工作风格描述 |

## intent-agent/

### prompt.hbs

意图识别 Agent 的 system prompt，需保持精简：

```handlebars
你是一个意图分析器。分析传入消息并判断意图类型。

## 输出格式
以 JSON 格式输出：
{
  "intent": "simple_reply | new_task | continuation | fork",
  "work_context_id": "wc_xxx | null",
  "confidence": 0.0-1.0,
  "reasoning": "简短说明判断依据",
  "suggested_action": "直接回复 | 创建新工作上下文 | 关联已有工作上下文"
}

## 判断规则
- simple_reply：问候、感谢、确认类消息，无需执行任务
- new_task：新的工作请求，与已有工作上下文无明显关联
- continuation：与某个已有工作上下文明显相关
- fork：基于已有工作上下文但需要独立探索

## 当前虚拟员工信息
- 角色：{{role}}
- 已有工作上下文：{{recent_work_contexts}}
```

### model.toml

```toml
[intent_agent.model]
provider = "anthropic"
model_id = "claude-haiku-4-5"
max_tokens = 1024
temperature = 0.1
top_p = 1.0

[intent_agent.model.fallback]
# 主模型不可用时的降级链
providers = ["openai"]
model_ids = ["gpt-4o-mini"]
```

### 模型选择约束

| 约束项 | 要求 | 理由 |
|--------|------|------|
| max_tokens | ≤ 4096 | 意图分析仅需简短 JSON 输出 |
| temperature | ≤ 0.3 | 分类任务需要一致性和可预测性 |
| 延迟 SLA | < 2s | 每条消息都经过意图分析，延迟直接影响用户体验 |

## main-agent/

### system.hbs

主 Agent 的完整 system prompt，是虚拟员工行为的核心定义。

```handlebars
你是{{display_name}}，一名专业的{{role}}。

## 身份
{{> identity}}

## 工作流程
1. 接收工作上下文后，先理解任务目标和约束
2. 制定执行策略（参考执行策略参考表）
3. 需要更多信息时主动向用户提问（而非猜测）
4. 使用工具完成任务
5. 完成前自我审查产出质量
6. 将详细工作产物写入协作工具（文档/表格/看板）
7. 通过消息向用户汇报完成情况和产物位置

## 可用工具
{{#each tools}}
- **{{name}}**：{{description}}
  参数：{{parameters}}
{{/each}}

## 约束
- 不确定时明确说明，不要编造
- 需要用户审批的操作必须等待确认后再执行
- 工作产物放入指定的协作工具而非聊天框堆砌
- 可以创建子 Agent 处理独立子任务
```

### scenes/ 场景路由

场景文件是 prompt 片段，在运行时根据任务类型动态拼接到 system prompt 中。场景路由由 `execution_strategies.toml` 定义。

按场景切换 prompt 的目的：让主 Agent 在不同任务类型下有不同的思维框架和输出格式要求，而非在一个巨大的 system prompt 中包含所有可能场景。

**场景示例 — data_analysis.hbs**：

```handlebars
## 场景：数据分析

### 执行步骤
1. 确认数据源和获取方式
2. 数据清洗和预处理
3. 探索性分析（描述性统计、分布、相关性）
4. 深度分析（按任务目标）
5. 可视化产出（表格 + 图表）
6. 结论和建议

### 输出规范
- 数据表格使用多维表格（bitable）呈现
- 关键发现通过消息摘要同步
- 详细分析过程放入协作文档
- 图表使用协作工具内置图表组件
```

### model.toml

```toml
[main_agent.model]
provider = "anthropic"
model_id = "claude-sonnet-4-6"
max_tokens = 16384
temperature = 0.3

[main_agent.model.scene_overrides]
# 特定场景可覆盖模型选择
"code_review" = { model_id = "claude-opus-4-7", max_tokens = 32768 }
"data_analysis" = { model_id = "claude-sonnet-4-6", max_tokens = 16384 }
"content_writing" = { provider = "openai", model_id = "gpt-4.1" }

[main_agent.model.fallback]
providers = ["openai", "deepseek"]
model_ids = ["gpt-4.1", "deepseek-v4"]
```

### execution_strategies.toml

```toml
[strategies.code_review]
scene = "code_review"
description = "代码审查任务"
recommended_model_override = "claude-opus-4-7"
tools_whitelist = ["file_read", "shell_exec"]
requires_git_worktree = true

[strategies.data_analysis]
scene = "data_analysis"
description = "数据分析任务"
tools_whitelist = ["file_read", "shell_exec", "web_search"]
requires_database_connection = true
output_preferred_tool = "bitable"

[strategies.content_writing]
scene = "content_writing"
description = "内容创作任务"
tools_whitelist = ["web_search", "create_document", "update_document"]
output_preferred_tool = "document"
```

## permissions.toml

```toml
# 远程工具权限（工作环境节点）
[remote.filesystem]
read = ["/workspace", "/shared"]
write = ["/workspace"]
deny = ["/etc", "/usr", "/.ssh", "/.aws"]

[remote.network]
allow_outbound = true
allow_inbound = false
restricted_hosts = ["internal.corp.com"]

[remote.tools]
allowed = ["file_read", "file_write", "shell_exec", "browser_navigate"]
require_approval = ["shell_exec", "file_delete", "browser_form_submit"]
deny = ["system_shutdown", "docker_destroy"]

# 平台工具权限（服务端执行）
[platform.tools]
allowed = ["send_message", "create_document", "update_document",
           "create_bitable", "web_search", "query_org"]
require_approval = ["invite_user_to_channel"]
deny = ["delete_organization", "delete_user"]

[approval]
remember_in_session = true
file_write_size_threshold_bytes = 1048576
shell_exec_duration_threshold_seconds = 60
```

### 权限字段规范

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `remote.filesystem.read` | string[] | 允许读取的路径（glob 支持） |
| `remote.filesystem.write` | string[] | 允许写入的路径 |
| `remote.filesystem.deny` | string[] | 禁止访问的路径（优先级高于 allow） |
| `remote.network.allow_outbound` | bool | 是否允许外网访问 |
| `remote.network.restricted_hosts` | string[] | 可访问的内网主机白名单 |
| `remote.tools.allowed` | string[] | 允许的远程工具 |
| `remote.tools.require_approval` | string[] | 需要用户审批的工具 |
| `remote.tools.deny` | string[] | 禁止的工具 |
| `platform.tools.allowed` | string[] | 允许的平台工具 |
| `platform.tools.require_approval` | string[] | 需要审批的平台工具 |
| `platform.tools.deny` | string[] | 禁止的平台工具 |
| `approval.remember_in_session` | bool | 同一会话内是否记住审批选择 |

## 配置包校验

Agent 服务器在加载配置包时执行校验：

1. **结构完整性**：必填文件是否存在（manifest.toml、identity.hbs、intent-agent/、main-agent/、permissions.toml）
2. **字段类型校验**：manifest.toml 中字段的类型和范围
3. **模板语法校验**：Handlebars 模板是否可解析
4. **工具引用校验**：permissions.toml 中声明的工具名是否在 tools/tools.toml 或工作环境节点能力中存在
5. **模型可用性校验**：model.toml 中指定的模型是否在支持的 provider 列表中
6. **版本兼容性**：`min_vta_version` 是否 ≤ 当前 VTA Runtime 版本

校验失败时，Agent 服务器拒绝加载配置包并返回结构化错误信息，包含具体的失败文件和原因。

## 配置包版本管理

- 配置包使用 SemVer 进行版本管理
- 虚拟员工创建时锁定配置包的精确版本（不自动升级）
- 用户可在协作应用中看到可用的配置包更新，手动触发升级
- 升级前自动对比新旧权限变化，突出的权限变更需要用户确认

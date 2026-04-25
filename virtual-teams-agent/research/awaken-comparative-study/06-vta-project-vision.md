# VTA 项目目标与定位声明

> 本文档用于帮助后续参与项目的人员快速理解 VTA 的核心目标、定位以及与 Awaken 等参考项目的关系。
> 撰写日期：2026-04-25 | 基于与项目负责人的多轮讨论整理

---

## 1. 一句话定位

**VTA（Virtual Teams Agent）是一个面向虚拟员工生态的 Pure Agent 运行时骨架。**

它不是 Agent 应用本身，而是支撑 Agent 应用运行的底层基座。

---

## 2. 核心设计哲学

### 2.1 Pure Agent 骨架——"空性"

VTA 启动时是一个**空壳**，必须满足以下"空性"原则：

| 维度 | VTA 的设计 | 常见框架的做法 |
|------|-----------|--------------|
| **Prompt** | 零预设 system prompt，所有 prompt 通过配置包注入 | 内置默认 system prompt 或预设角色 |
| **Tools** | ToolRegistry 初始为空，所有工具由使用者显式注册 | 内置常用工具（文件读写、网络请求等） |
| **Skills** | Skills 注册表初始为空，纯声明层 | 内置默认技能或预设 skill 包 |

**为什么坚持空性？**

因为 VTA 的上层应用是"虚拟员工"——每个虚拟员工都是一个独特的角色（销售助理、技术支持、运营专员等），它们的 prompt、工具集、技能组合完全不同。如果骨架层面有任何预设，就会污染上层角色的纯粹性，导致"一个框架只能做好一种角色"的困境。

### 2.2 配置包驱动

VTA 的所有能力通过**文件式配置包**注入：

```
my-virtual-employee/
├── manifest.toml          # 包元信息：名称、版本、依赖、场景路由
├── prompts/
│   ├── system.hbs         # 系统提示模板
│   └── instruction.hbs    # 角色指令模板
├── scenes/
│   ├── chat.hbs           # 闲聊场景 prompt
│   ├── plan.hbs           # 任务规划场景 prompt
│   └── review.hbs         # 代码审查场景 prompt
├── providers/
│   └── anthropic/
│       └── system.hbs     # 针对 Anthropic 模型的覆盖模板
└── skills/
    └── manifest.toml      # 技能声明
```

**配置包 vs 配置 API**：
- 配置包是**文件**，可版本控制、可代码审查、可 CI/CD 部署
- 配置 API 是**运行时数据库状态**，适合运营人员在线调整
- VTA 选择配置包路线，因为虚拟员工的"角色定义"本质上是一份代码资产，需要版本管理和审计追踪

---

## 3. 上层应用：虚拟员工

### 3.1 什么是虚拟员工？

虚拟员工是基于 VTA 运行时的**高阶应用层封装**。它不仅仅是"一个能聊天的 Agent"，而是：

- **像人一样工作**：有明确的岗位职责（销售、客服、运营、开发）
- **像人一样使用工具**：调用文件系统、查询数据库、操作浏览器、使用 API
- **像人一样协作**：与其他虚拟员工或人类员工配合完成任务
- **像人一样学习**：通过配置包更新获得新技能，通过对话积累用户偏好

### 3.2 虚拟员工 vs 通用 Agent 服务

| 维度 | 通用 Agent 服务（如 ChatGPT、Claude） | 虚拟员工 |
|------|--------------------------------------|---------|
| **角色固定性** | 无固定角色，用户每次重新定义任务 | 有固定岗位和长期记忆的用户偏好 |
| **上下文连续性** | 单 Session 级别 | 跨 Session、跨任务的长期上下文 |
| **工具集** | 通用工具（搜索、代码执行等） | 岗位专用工具（CRM、ERP、内部 API） |
| **协作能力** | 无 | 与其他虚拟员工或人类协作 |
| **商业属性** | 消费级产品 | 企业级服务，需租户隔离、SLA 保障 |

---

## 4. 关键差异化能力

以下能力是 VTA 区别于 Awaken 及其他通用 Agent Runtime 的核心竞争力：

### 4.1 外部 Agent 调度

虚拟员工需要"使用其他 Agent 作为工具"。例如：
- 销售虚拟员工遇到技术问题 → 调用 ClaudeCode 分析代码
- 运营虚拟员工需要测试 API → 调用 OpenCode 执行请求
- 所有虚拟员工需要写文档 → 调用专用写作 Agent

VTA 的 `ExternalAgentDispatcher` trait 支持调度**任意第三方 Agent**（不限于 VTA 生态），这是 Awaken 的 `AgentTool`（仅支持 A2A 协议的 Awaken Agent）无法覆盖的场景。

### 4.2 租户隔离

商业虚拟员工必须以 SaaS 形式交付，每个客户的数据、配置、上下文必须完全隔离。VTA 在数据模型层面预留 `tenant_id`，在 Store 层默认带租户过滤，这是 Awaken 作为通用开源框架不会深入的方向。

### 4.3 远程工具执行

虚拟员工可能需要操作**用户的本地环境**（本地文件、私有网络、内部系统），而非在服务端执行。VTA 定义了 `RemoteToolExecutor` 协议，允许工具在用户本地或云环境中执行，结果异步回传。这与 Awaken 的 `FrontEndTool`（面向浏览器前端执行）安全模型和场景完全不同。

### 4.4 开放平台与应用商店

远期目标是构建一个**虚拟员工开放平台**：
- 第三方开发者可将自己开发的 Agent（符合协议）接入 VT 系统
- 企业客户可从"应用商店"选择并部署虚拟员工
- 支持私有化部署和自定义虚拟员工接入

---

## 5. 与 Awaken 的关系（给后来者的说明）

Awaken（https://github.com/awakenworks/awaken）是一个与 VTA **高度趋同**的 Rust Agent Runtime 项目。两者在核心能力（Agent Loop、工具调用、MCP 集成、事件驱动、多 Provider 支持）上大量重叠。

**关键区别不在"能做什么"，而在"默认怎么做"**：

| 维度 | Awaken | VTA |
|------|--------|-----|
| **哲学** | 全功能框架，开箱即用（Django） | Pure Agent 骨架，零预设（Flask/Werkzeug） |
| **配置管理** | Config API + Admin Console | 文件式配置包（manifest.toml + hbs） |
| **生态策略** | 自包含，仅支持 A2A 协议的 Awaken Agent | 开放生态，支持任意第三方 Agent |
| **商业特性** | 无 | 租户隔离、SLA 监控、开放平台 |

**对后续开发者的建议**：
- 阅读 Awaken 源码是理解 Agent Runtime 设计的**最佳参考**，但不应直接引入依赖
- 将 Awaken 视为"设计参考书"：理解其思路后，用 VTA 自己的 trait 体系重写
- 高 ROI 借鉴项：多协议适配器设计、OpenTelemetry 可观测性、生产控制路径（retry/circuit-breaker/mailbox）
- 必须自研项：Pure Agent 空性验证、配置包体系、租户隔离模型、外部 Agent 调度协议

---

## 6. 技术架构速览

```
VTA 架构分层：
┌─────────────────────────────────────────────┐
│  虚拟员工应用层（配置包 + 业务逻辑）            │
├─────────────────────────────────────────────┤
│  host-cli / host-daemon（运行入口）           │
├─────────────────────────────────────────────┤
│  runtime-host（组件装配 + 生命周期协调）       │
├─────────────────────────────────────────────┤
│  runtime-agent（推理循环 + PromptManager）    │
├─────────────────────────────────────────────┤
│  runtime-kernel（Session/Turn 生命周期）      │
├─────────────────────────────────────────────┤
│  runtime-core（领域模型 + 核心 trait）        │
├─────────────────────────────────────────────┤
│  runtime-store-* / runtime-inference-*       │
│  runtime-tools / runtime-mcp / runtime-skills│
│  runtime-plugins / runtime-protocol          │
└─────────────────────────────────────────────┘
```

---

## 7. 关键术语表

| 术语 | 含义 |
|------|------|
| **Pure Agent** | 零预设 prompt、零内置 tools、零默认 skills 的 Agent 骨架 |
| **配置包** | 文件式配置集合（manifest.toml + 模板文件），定义一个虚拟员工的能力 |
| **Scene** | 按任务类型切换的 prompt 场景（如 chat/plan/review），通过 `SceneId` 路由不同模型 |
| **Event 溯源** | 所有状态变更以不可变事件形式追加存储，形成审计轨 |
| **Message 工作轨** | 可替换的 LLM 消息上下文，支持 compaction（压缩/摘要） |
| **Tenant** | 商业虚拟员工的客户隔离单位，每个租户拥有独立的数据和配置空间 |
| **外部 Agent 调度** | Master Agent 发现并调用第三方 Agent（ClaudeCode、Codex 等）的能力 |
| **远程工具执行** | 工具不在服务端运行，而是通过协议联络用户本地/云环境执行 |

---

## 8. 参考资料

- VTA 代码仓库：`/Users/chongyi/Projects/tosimpletech/virtual-teams/virtual-teams-agent/dev/`
- Awaken 仓库：https://github.com/awakenworks/awaken
- 前期调研总览：[../00-research-overview.md](../00-research-overview.md)
- 调研决策产出：[../decisions/](../decisions/)

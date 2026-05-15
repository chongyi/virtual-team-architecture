# 虚拟员工系统技术方案总览

## 定位

本文是虚拟员工（VE）系统的技术方案冻结入口，用于把 VE 系统从产品概念推进到可实施的工程方案。它不替代[VE 系统设计总览](../../05-virtual-employee-system.md)和各子系统设计文档，而是在产品边界已经明确后，冻结基础版的 VE 运行时、Agent 服务器、工作环境节点和协议口径。

VE 系统是 Virtual Team 的 Agent 运行时核心，独立于协作应用。协作应用通过对接协议向 VE 系统投递消息和接收回复；VE 系统的内部推理、调度和工具执行与协作应用不共享进程或数据库。

## 文档分工

| 文档 | 职责 |
|------|------|
| [VE 技术选型](./technology-selection.md) | VTA 内部 crate 选型、模型提供商 SDK、存储后端、MCP 库、沙箱方案，默认与候选矩阵，不做事项 |
| [VE API 与协议](./api-and-protocol.md) | VTA 核心 trait 接口规格、VE 内部 JSON-RPC 细节、VE Runner 协议、Runtime Config API、错误码 |
| [VE 数据与权限模型](./data-and-permission-model.md) | WorkContext 详细字段、Runtime Config/Data schema、消息与 markers 映射、工具路由表、Schedule/Timer 条目、审批记录、权限对象模型、租户隔离规则、索引策略 |
| [VE 系统可靠性与观测](./reliability-and-observability.md) | 冷启动优化、消息队列可靠性、VE Runner 健康检查与重启、专属指标与追踪、告警阈值、降级矩阵 |
| [VE 管理方案](./management-console.md) | VE 管理需求（入职、Duty 设置、Runtime 审查、监控面板）、管理 API 表面、与协作应用管理端的关系 |
| [VE 调研结论与设计决策](./research-decisions.md) | VTA 核心设计决策记录、模型选择原理、沙箱隔离决策、协议选型理由、不做事项 |

相关背景文档：

- [虚拟员工系统总览](../../05-virtual-employee-system.md)：VE 系统组成、生命周期、多租户模型、消息交互模式。
- [Agent 服务器](../../07-agent-server.md)：接入层、管理服务、冷热分离调度、扩容设计。
- [虚拟员工 Agent 内部设计](../../08-vte-agent-internals/overview.md)：意图 Agent / 主 Agent / 子 Agent 的架构、协作协议。
- [工作环境节点](../../09-work-environment-node.md)：远程工具承载环境、沙盒与隔离。
- [消息与工作上下文](../../06-message-and-work-context.md)：消息处理流程、工作上下文状态机、Fork/Resume 机制。

## 基础版实施边界

基础版要求做到"虚拟员工可接收消息、执行推理、调用工具、回复用户"，而不是一次性实现完整的 Agent 高级特性。

必须冻结并实施：

- VTA 核心 trait 接口的稳定定义：AgentLoop、PromptManager、MessageStore、ModelSelector、ToolExecutor。
- Agent 服务器的接入层和管理服务：消息接收与路由、VE 生命周期管理、冷热分离调度、多租户隔离。
- VE 实例与 Runtime 的创建、挂载、挂起、恢复和卸载生命周期。
- 意图识别 Agent（低成本模型）+ 主 Agent（主力模型）的基本协作链路。
- 工作上下文创建、关联、Fork、归档和 Resume 的完整状态机。
- 远程工具（经 WEN）和平台工具（经协作应用 API）的双轨调用。
- 对接协议：消息转发、回复、主动通知、markers 回写、context segment 重建。
- Runtime Config（Duty / 附加 Prompt / 行为规范）和 Runtime Data（记忆 / 偏好）的存储和查询。
- VE 系统级可观测性：指标、追踪、告警、审计日志。

基础版不承诺：

- 子 Agent 的动态创建和调度。
- 第三方 Agent 通过 WEN 的委托执行（Claude Code、Codex 等）。
- 配置包市场的开放。
- VE 高级特性：compaction 策略的完整实现、多模型 provider 的自动 failover。
- 云端托管工作环境节点。

## 核心原则

### 独立运行，协议对接

VE 系统通过对接协议与协作应用通信，不共享数据库、不共享进程。Agent 服务器不可用时，协作应用的 IM、组织和协作工具不受影响。VE 系统内部各组件（接入层、管理服务、VE Runner）也通过明确的内部协议交互。

### Pure Agent 骨架

VTA Runtime 遵循"空性"原则：零预设 prompt、零内置工具、零默认技能。所有 VE 能力通过配置包注入。技术方案中冻结的 VTA trait 接口必须保持最小化——只定义推理循环必需的抽象，不预设具体 LLM、工具或 prompt 实现。

### 配置包驱动，运行时积累

配置包定义 VE Instance 的"基因"（静态），Runtime Config 和 Runtime Data 承载 Tenant 级的"成长"（动态）。静态与动态严格分离，互不覆盖。技术方案中冻结的数据模型必须体现这一分离。

### 可降级，可观测

VE 系统的每个外部依赖（LLM API、WEN、协作应用）都有明确的降级路径。降级行为必须在可观测性指标中可见——静默降级是不可接受的。

## 冻结验收口径

VE 技术方案达到冻结状态时，实施团队应能明确回答：

- VTA 的每个核心 trait 接口的输入、输出和错误类型是什么。
- Agent 服务器的模块划分、进程模型和部署边界是什么。
- VE 实例/Runtime 的完整生命周期状态转换和资源影响。
- VE 如何通过对接协议与协作应用交互（消息转发、回复、markers、通知）。
- VE 数据模型与协作应用数据模型的权威归属边界。
- VE 调用远程工具（WEN）和平台工具（协作应用 API）的完整权限链路。
- LLM API、WEN、消息队列不可用时的降级行为和用户感知。
- VE 系统的关键可观测性指标和告警规则。

# 术语表

| 术语 | 英文 | 含义 |
|------|------|------|
| **虚拟团队** | Virtual Team | 整个项目的名称，包含协作应用和虚拟员工系统 |
| **协作应用** | Collaboration App | 类 Slack/飞书的用户入口，提供 IM 通讯和协作工具 |
| **虚拟员工系统** | Virtual Employee System | Agent 运行时系统，管理虚拟员工生命周期和消息处理 |
| **虚拟员工** | Virtual Employee (VE) | 面向用户的一等 Agent 实体，内部由多个 VTA Agent 构成 |
| **VTA** | Virtual Teams Agent | Pure Agent 运行时骨架，虚拟员工底层的 Agent 基座 |
| **Agent 服务器** | Agent Server | 虚拟员工系统的服务端，包含接入层和虚拟员工管理服务 |
| **虚拟员工管理服务** | VE Management Service | Agent 服务器的核心组件，管理虚拟员工生命周期和租户隔离 |
| **接入层** | Access Layer | Agent 服务器中负责对接协作应用的协议适配层 |
| **意图识别 Agent** | Intent Agent | 虚拟员工内部的分析型 Agent，使用低成本模型判断消息意图并路由 |
| **主 Agent** | Main Agent | 虚拟员工内部的工作型 Agent，实际执行工作任务 |
| **子 Agent** | Sub Agent | 主 Agent 动态创建的 Agent，处理特定子任务 |
| **工作上下文** | Work Context | 虚拟员工处理一项工作任务时的独立工作空间 |
| **工作环境节点** | Work Environment Node | 虚拟员工执行工具的物理/虚拟环境，由用户安装的工作环境客户端承载 |
| **工作环境客户端** | Work Environment Client | 用户安装的本地应用，承载工作环境节点，提供工具、MCP、沙盒 |
| **用户** | User | 平台上的个人账号，可属于多个 Tenant |
| **租户** | Tenant | 数据空间边界与计费单位，所有业务数据的隔离容器。一个 Tenant 可包含多个 User（远期） |
| **组织** | Organization | Tenant 内部的树状部门结构，用于虚拟团队的层级管理。不是现实世界的公司（公司对应 Tenant） |
| **助理** | Assistant | 一种特殊的虚拟员工，负责引导、协调和管理 |
| **配置包** | Config Package | 文件式配置集合，定义虚拟员工的角色、能力、工具和模型 |
| **消息标记** | Message Marker | 协作应用消息的扩展字段，标注关联的工作上下文和意图分类 |
| **上下文数据段** | Context Segment | 协作应用在转发消息时附带的前置分析数据，减少 Agent token 消耗 |
| **Fork** | Fork | 从已有工作上下文的检查点分叉出新的工作上下文 |
| **Resume** | Resume | 恢复已有工作上下文继续执行 |
| **场景 (Scene)** | Scene | 按任务类型切换的 prompt 和模型路由策略 |
| **Pure Agent** | Pure Agent | VTA 的设计原则：零预设 prompt、零内置工具、零默认技能 |
| **双轨持久化** | Dual-track Persistence | VTA 的状态管理策略：Events 审计轨 + Message 工作轨 |
| **MCP** | Model Context Protocol | 工具生态的标准协议，VTA 和工作环境节点均支持 |

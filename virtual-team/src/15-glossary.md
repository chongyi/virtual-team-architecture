# 术语表

| 术语 | 英文 | 含义 |
|------|------|------|
| **虚拟团队** | Virtual Team | 整个项目的名称，包含协作应用和虚拟员工系统 |
| **协作应用** | Virtual Team Collaboration (VTC) | 类 Slack/飞书的用户入口，提供 IM 通讯、协作工具和日程管理。正式名称 Virtual Team Collaboration，简称 VTC |
| **虚拟员工系统** | Virtual Employee System | Agent 运行时系统，管理 VE Instance 和 Runtime 的生命周期 |
| **用户** | User | 平台上的个人账号，可属于多个 Tenant |
| **租户** | Tenant | 数据空间边界与计费单位，所有业务数据的隔离容器 |
| **组织** | Organization | Tenant 内部的树状部门结构。不是现实世界的公司（公司对应 Tenant） |
| **VE Instance** | Virtual Employee Instance | 由配置包定义的、可复用的 Agent 实体——映射为"一个人" |
| **VE Runtime** | Virtual Employee Runtime | VE Instance 在一个 Tenant 中的"一份工作"——包含 Duty、记忆、行为规范 |
| **配置包** | Config Package | 文件式配置集合，定义 VE Instance 的静态基因（名称、性格、技能、Hook 点） |
| **Runtime Config** | Runtime Configuration | VE 加入 Tenant 时被赋予的确定性配置：Duty、附加 Prompt、行为规范 |
| **Runtime Data** | Runtime Data | VE 在工作中积累的动态数据：记忆、用户偏好、成长轨迹 |
| **VTA** | Virtual Teams Agent | Pure Agent 运行时骨架，虚拟员工底层的 Agent 基座 |
| **Agent 服务器** | Agent Server | 虚拟员工系统的服务端，管理 Instance/Runtime 生命周期、配置和数据 |
| **接入层** | Access Layer | Agent 服务器中负责对接协作应用的协议适配层 |
| **意图识别 Agent** | Intent Agent | 使用低成本模型判断消息意图并路由 |
| **主 Agent** | Main Agent | 实际执行工作任务的主力 Agent |
| **子 Agent** | Sub Agent | 主 Agent 动态创建，处理特定子任务 |
| **工作上下文** | Work Context | 虚拟员工处理一项工作任务时的独立工作空间，含 `initiation_type`（message/schedule/duty/hook） |
| **工作环境节点** | Work Environment Node | 虚拟员工执行工具的物理/虚拟环境 |
| **助理** | Assistant | 一种特殊的虚拟员工，负责引导、协调和管理 |
| **Duty** | Duty | 岗位职责——Runtime Config 的核心，定义 VE 在该 Tenant 中持续负责什么 |
| **Schedule** | Schedule | 协作应用提供的日程工具，定时触发 VE 工作。支持 cron/once/interval |
| **Timer** | Timer | 协作应用提供的定时器工具，倒计时触发 VE 工作 |
| **Hook** | Hook | VE 内部的事件响应机制——Hook 点由配置包定义，注册可预置或运行时追加 |
| **自驱动** | Self-driven | VE 通过 tool call 自行设定触发节点（Schedule/Timer） |
| **外驱动** | External-driven | 用户或其他 VE 为 VE 设定触发节点 |
| **消息标记** | Message Marker | 协作应用消息的扩展字段，标注关联的工作上下文和意图分类 |
| **上下文数据段** | Context Segment | 协作应用在转发消息时附带的前置分析数据 |
| **Fork** | Fork | 从已有工作上下文的检查点分叉出新的工作上下文 |
| **Resume** | Resume | 恢复已有工作上下文继续执行 |
| **Pure Agent** | Pure Agent | VTA 的设计原则：零预设 prompt、零内置工具、零默认技能 |
| **MCP** | Model Context Protocol | 工具生态的标准协议 |

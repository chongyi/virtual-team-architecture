# 05. AgentServer

## 1. 定位

AgentServer 是 VT 服务端中负责管理虚拟员工 Agent 的服务，名称暂定。

它不是 VTA 本身，也不是普通消息服务。它位于 VT 产品层和 VTA Runtime 之间，负责把“组织中的虚拟员工”转换成可以运行、恢复、调度和审计的 Agent 资源。

## 2. 核心职责

AgentServer 负责：

- 虚拟员工注册与发现。
- 虚拟员工实例生命周期管理。
- 消息事件到 VTE 的路由。
- 工作上下文创建、恢复、fork 和状态管理。
- VTA Session 创建、恢复、重建。
- 模型、prompt、工具和权限策略装配。
- WorkEnvironmentNode 分配和工具调用转发。
- 租户隔离。
- Agent 状态、成本和审计记录。
- 对应用服务暴露虚拟员工状态和任务进展。

## 3. AgentServer 不负责的内容

AgentServer 不应直接负责：

- 普通 IM 消息存储。
- 组织和频道的全部业务规则。
- 客户端 UI 状态。
- 具体工具的本地执行。
- VTA 内部 Agent loop 的细节。
- WorkEnvironmentNode 内部沙箱实现。

这些职责分别属于虚拟团队应用服务、WorkEnvironmentNode 和 VTA。

## 4. 资源模型

AgentServer 至少需要管理以下资源：

- VTEDefinition：虚拟员工定义。
- VTEInstance：虚拟员工在租户或组织中的实例。
- VTEBinding：虚拟员工与组织、频道、用户、工作环境节点的绑定。
- WorkContext：工作上下文。
- AgentSessionRef：对应 VTA Session 的引用。
- ToolPolicy：工具可用性与审批策略。
- ModelPolicy：模型选择和成本策略。
- PromptPackageRef：prompt 配置包引用。
- MemoryScope：员工级、用户级、组织级记忆范围。
- RuntimeState：在线、离线、运行中、等待用户、等待工具、错误等。

## 5. 创建、恢复、重建

当消息进入 AgentServer 后，AgentServer 需要根据租户、组织、虚拟员工和工作上下文决定如何获得可运行 Agent 资源。

### 5.1 创建

当 VTE 首次处理某个工作上下文时：

1. 加载虚拟员工定义。
2. 加载组织和用户上下文。
3. 装配 prompt 配置包。
4. 装配模型策略。
5. 装配服务端工具和可用 WorkEnvironmentNode 工具。
6. 创建 VTA Session。
7. 建立 WorkContext 与 AgentSessionRef 的关系。

这个 AgentSessionRef 可以指向 VTE 自身的主 Session，也可以指向 VTE 为该工作上下文派生的独立子 Session。AgentServer 需要保留这种关系，方便后续恢复、审计和产品层展示。

### 5.2 恢复

当已有工作上下文继续收到消息时：

1. 读取 WorkContext。
2. 找到对应 AgentSessionRef。
3. 加载 VTA MessageStore 工作轨或压缩摘要。
4. 补充最新 VT 消息和组织上下文。
5. 继续执行。

### 5.3 重建

当 Agent 资源不存在、失效、迁移或需要重新装配时：

1. 读取 WorkContext、相关消息、交付物和摘要。
2. 根据当前 VTEDefinition 和策略重新装配运行资源。
3. 创建新的 VTA Session 或恢复到兼容状态。
4. 保留审计链路，记录重建原因。

重建能力是 VTA 配置包驱动和纯运行时设计的重要价值：只要有配置、上下文和状态引用，就可以重新拉起 Agent。

## 6. 多租户隔离

AgentServer 的所有操作都必须带 tenant_id。

隔离边界包括：

- VTE 定义和实例。
- 工作上下文。
- Agent Session。
- prompt 配置包。
- 工具配置。
- WorkEnvironmentNode。
- 记忆。
- 审计事件。
- 队列任务。
- 缓存。

任何跨租户引用都必须显式建模并经过授权，不能依赖隐式查询。

## 7. 与消息网关的关系

消息网关负责标准化消息和路由事件，AgentServer 负责理解虚拟员工语义。

消息网关交给 AgentServer 的输入应包含：

- 标准化消息。
- 租户、组织和会话上下文。
- 目标虚拟员工。
- 触发原因：提及、私聊、频道监听、系统事件等。
- 幂等键。

AgentServer 返回或发出的输出包括：

- 回复消息。
- 消息标记。
- 工作上下文关联。
- 任务状态变更。
- 交付物引用。
- 审批请求。
- Agent 状态事件。

## 8. 与 WorkEnvironmentNode 的关系

AgentServer 不直接执行本地工具，而是通过协议调用 WorkEnvironmentNode。

它需要负责：

- 选择可用节点。
- 检查节点是否被授权给该 VTE。
- 检查工具权限。
- 发起审批。
- 转发工具调用。
- 接收执行结果。
- 将结果写入工作上下文和 VTA 工作轨。

## 9. 与 VTA 的关系

AgentServer 使用 VTA 运行 VTE 的底层 Agent Session。

AgentServer 负责产品层装配：

- 当前虚拟员工是谁。
- 当前组织和频道是什么。
- 当前工作上下文是什么。
- 当前有哪些工具和权限。
- 当前需要使用什么模型策略。

VTA 负责运行时执行：

- PromptManager。
- 推理循环。
- 工具调用循环。
- 消息工作轨。
- 状态持久化。
- 上下文压缩。
- 子 Agent Session。

## 10. 关键接口方向

后续可以围绕以下接口展开设计：

- `agent.employee.register`
- `agent.employee.bind`
- `agent.employee.status`
- `agent.message.handle`
- `agent.work_context.create`
- `agent.work_context.resolve`
- `agent.work_context.fork`
- `agent.session.create`
- `agent.session.resume`
- `agent.tool.invoke`
- `agent.approval.request`
- `agent.event.subscribe`

这些不是最终 API，只用于表达 AgentServer 的职责边界。

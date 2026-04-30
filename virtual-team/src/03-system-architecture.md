# 系统总体架构

## 宏观分层

Virtual Team 系统分为两大子系统：

```mermaid
flowchart TB
    subgraph collabApp["协作应用"]
        direction LR
        im["IM 通讯"]
        ct["协作工具"]
        om["组织/员工管理"]
    end

    collabApp -->|"协议层"| veSystem

    subgraph veSystem["虚拟员工系统"]
        subgraph agentServer["Agent 服务器"]
            direction LR
            access["接入层"]
            veMgmt["虚拟员工管理服务"]
        end

        agentServer --> veInstance

        subgraph veInstance["虚拟员工实例"]
            direction LR
            intentAgent["意图识别 Agent"]
            mainAgent["主 Agent"]
            subAgent["子 Agent（动态）"]
        end

        vtaRuntime["VTA Runtime (Agent 基座)"]
    end

    veSystem -->|"协议层"| workNode

    subgraph workNode["工作环境节点"]
        direction LR
        mcpSrv["MCP Srv"]
        builtin["内置工具"]
        thirdParty["第三方 Agent"]
        sandbox["沙盒/文件系统隔离"]
    end
```

## 子系统关系

### 协作应用 vs 虚拟员工系统

协作应用是**独立系统**，即使未挂载虚拟员工系统，它仍然可以作为纯粹的即时通讯协作工具运行。虚拟员工系统挂载后，用户才能与虚拟员工通讯——正如真实员工未注册登录时也无法与之对话。

虚拟员工不是协作应用的"内置功能"，而是通过协议**接入**协作应用的外部实体，与用户通过 IM 客户端接入的方式平行。

### 消息流转整体路径

```mermaid
flowchart TD
    A[用户发消息] --> B[协作应用<br/>IM 前端]
    B --> C[协作应用服务端]
    C --> C1[利用标记/RAG<br/>构建上下文数据段]
    C1 --> D[转发至<br/>Agent 服务器接入层]
    D --> E[Agent 服务器接入层]
    E --> E1[解析消息结构]
    E --> E2[识别目标虚拟员工]
    E1 & E2 --> F[转发至<br/>虚拟员工管理服务]
    F --> G[虚拟员工管理服务]
    G --> G1[多租户路由]
    G --> G2[恢复/创建<br/>虚拟员工实例]
    G1 & G2 --> H[投递消息至虚拟员工]
    H --> I[虚拟员工内部]

    I --> I1[意图识别 Agent<br/>分析消息]
    I1 --> I1a[简单消息 → 直接回复]
    I1 --> I1b[工作消息 → 创建工作上下文<br/>或关联已有]

    I --> I2[主 Agent 执行工作<br/>需要时]
    I2 --> I2a[调度工具 → 工作环境节点]
    I2 --> I2b[创建子 Agent 处理子任务]

    I1a & I1b & I2a & I2b --> J[回复消息<br/>沿原路径返回]
```

## 关键设计决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 两大子系统分离 | 协作应用 + 虚拟员工系统独立 | 降低耦合，协作应用可独立迭代，虚拟员工系统可独立扩展 |
| 虚拟员工系统内部两层结构 | 接入层 + 管理服务 | 接入层处理协议、管理服务处理生命周期和租户隔离 |
| Agent 基座 | VTA (virtual-teams-agent) | Pure Agent 骨架，零预设，配置包驱动 |
| 虚拟员工内部多 Agent 并行 | 意图 Agent + 主 Agent 独立并行 | 职责清晰，意图识别不阻塞主 Agent 工作 |
| 工具执行远程化 | 工作环境节点 | 适应客户本地环境和云端环境，保持灵活性和安全边界 |
| 多租户隔离 | 租户 = 用户级别 | 一个用户 = 一个独立数据空间 |

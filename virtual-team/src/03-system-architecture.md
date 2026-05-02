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

        platformTools["平台工具<br/>协作应用 API / 网络检索 / VE 间通讯"]
    end

    veSystem -->|"协议层"| workNode

    subgraph workNode["工作环境节点（远程工具）"]
        direction LR
        mcpSrv["MCP Srv"]
        builtin["文件/Shell/浏览器"]
        thirdParty["第三方 Agent"]
        sandbox["沙盒/文件系统隔离"]
    end

    mainAgent -.-> platformTools
    mainAgent -.-> workNode
```

## 子系统关系

### 协作应用 vs 虚拟员工系统

协作应用是**独立系统**，即使未挂载虚拟员工系统，它仍然可以作为纯粹的即时通讯协作工具运行。虚拟员工系统挂载后，用户才能与虚拟员工通讯——正如真实员工未注册登录时也无法与之对话。

虚拟员工不是协作应用的"内置功能"，而是通过协议**接入**协作应用的外部实体，与用户通过 IM 客户端接入的方式平行。

### 消息流转整体路径

```mermaid
sequenceDiagram
    actor User as 用户
    participant Frontend as 协作应用<br/>IM 前端
    participant AppSvr as 协作应用<br/>服务端
    participant Access as Agent 服务器<br/>接入层
    participant VEMgmt as 虚拟员工<br/>管理服务
    participant VE as 虚拟员工内部
    participant WEN as 工作环境节点

    User->>Frontend: 发消息
    Frontend->>AppSvr: 投递消息
    AppSvr->>AppSvr: 利用标记/RAG<br/>构建上下文数据段
    AppSvr->>Access: 转发消息<br/>附带上下文数据段

    Access->>Access: 解析消息结构<br/>识别目标虚拟员工
    Access->>VEMgmt: 转发消息

    VEMgmt->>VEMgmt: 多租户路由<br/>恢复/创建虚拟员工实例
    VEMgmt->>VE: 投递消息

    alt 简单消息
        VE->>VE: 意图识别 Agent 分析<br/>判断为简单问候/确认
        VE-->>Access: 直接回复
    else 需要工作
        VE->>VE: 意图识别 Agent 分析<br/>创建工作上下文/关联已有
        VE->>VE: 主 Agent 执行工作
        VE->>WEN: 调度工具（经 Agent 服务器转发）
        WEN-->>VE: 执行结果回传
        opt 复杂子任务
            VE->>VE: 创建子 Agent 处理
        end
        VE-->>Access: 工作结果回复
    end

    Access-->>AppSvr: 回复消息
    AppSvr-->>Frontend: 推送消息
    Frontend-->>User: 显示回复
```

## 关键设计决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 两大子系统分离 | 协作应用 + 虚拟员工系统独立 | 降低耦合，协作应用可独立迭代，虚拟员工系统可独立扩展 |
| 虚拟员工系统内部两层结构 | 接入层 + 管理服务 | 接入层处理协议、管理服务处理生命周期和租户隔离 |
| Agent 基座 | VTA (virtual-teams-agent) | Pure Agent 骨架，零预设，配置包驱动 |
| 虚拟员工内部多 Agent 并行 | 意图 Agent + 主 Agent 独立并行 | 职责清晰，意图识别不阻塞主 Agent 工作 |
| 工具分类双轨 | 远程工具（工作环境节点）+ 平台工具（服务端） | 适应不同执行位置需求：需要用户环境的用远程工具，平台通用能力用服务端工具 |
| 工具执行远程化 | 工作环境节点 | 适应客户本地环境和云端环境，保持灵活性和安全边界 |
| 多租户隔离 | 租户 = 用户级别 | 一个用户 = 一个独立数据空间 |

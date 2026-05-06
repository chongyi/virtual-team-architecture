# 系统总体架构

## 宏观分层

Virtual Team 系统分为两大子系统、五个逻辑层：

```mermaid
flowchart TB
    subgraph client["客户端层"]
        flutter["Flutter 客户端<br/>iOS / Android / Desktop / Web"]
    end

    client -->|"WebSocket + REST"| collabSvr

    subgraph collabApp["协作应用（两大子系统之一）"]
        subgraph collabSvr["协作应用服务端（Rust）"]
            im["IM 引擎"]
            collab["协作工具引擎"]
            org["组织管理"]
            ctx["上下文增强"]
        end
    end

    collabSvr -->|"对接协议<br/>JSON-RPC 2.0 + REST"| agentServer

    subgraph veSystem["虚拟员工系统（两大子系统之二）"]
        subgraph agentServer["Agent 服务器"]
            access["接入层"]
            veMgmt["虚拟员工管理服务"]
        end

        agentServer --> veInstance

        subgraph veInstance["虚拟员工实例"]
            intent["意图识别 Agent"]
            main["主 Agent"]
            sub["子 Agent"]
        end

        vta["VTA Runtime<br/>Agent 基座"]
        platformTools["平台工具"]
    end

    veInstance -.-> platformTools
    agentServer -->|"工具调用转发"| workNode

    subgraph workNode["工作环境节点层（用户侧/云端）"]
        mcp["MCP Server"]
        builtin["内置工具"]
        thirdParty["第三方 Agent"]
        sandbox["沙盒隔离"]
    end

    subgraph data["数据层"]
        pg["PostgreSQL<br/>业务数据"]
        objStore["对象存储<br/>文件附件"]
        mq["消息队列<br/>异步通信"]
    end

    collabSvr --> data
    agentServer --> data
```

## 技术栈

### 技术选型及理由

| 组件 | 技术 | 理由 |
|------|------|------|
| 协作应用客户端 | **Flutter** | 跨平台单代码库（iOS/Android/Desktop/Web）；富 UI 表现力（Block-based 消息渲染、协作工具）；成熟的 WebSocket 和状态管理生态 |
| 协作应用服务端 | **Rust** (tokio, axum) | 高性能异步 IO；内存安全；与 VTA 技术栈一致减少认知负担；tokio 异步生态成熟（WebSocket、gRPC） |
| VTA Agent Runtime | **Rust** | 与协作应用服务端一致；零成本抽象适合 Agent 推理循环的性能敏感路径；trait 系统天然适合 Agent 组件的可替换设计 |
| 数据存储 | **PostgreSQL** | 成熟的事务支持；JSONB 适合消息和配置的灵活存储；全文搜索能力；丰富的扩展生态 |
| 对象存储 | **S3 兼容**（MinIO/AWS S3） | 文件附件和配置包存储；标准化接口便于部署迁移 |
| 消息队列 | **Redis Streams / NATS** | Agent 服务器与 VE 实例间异步通信；冷热分离的事件驱动 |

### 技术栈一致性

服务端统一使用 Rust：协作应用服务端、Agent 服务器、VTA Runtime 共享同一技术栈，降低运维复杂度和团队认知负担。只有客户端使用 Flutter（跨平台 UI 的唯一合理选择）。

## 部署拓扑

### 逻辑部署视图

```mermaid
flowchart TB
    subgraph userDevice["用户设备"]
        fe["Flutter 客户端"]
        wenLocal["工作环境客户端<br/>（可选，本地节点）"]
    end

    subgraph platform["Virtual Team 平台"]
        subgraph edge["边缘层"]
            lb["负载均衡 / TLS 终结"]
            cdn["CDN（静态资源）"]
        end

        subgraph svc["服务层"]
            collabNodes["协作应用服务端<br/>无状态 × N"]
            agentNodes["Agent 服务器<br/>无状态 × N"]
            veRunners["VE Runner<br/>VE 实例宿主 × N"]
        end

        subgraph data["数据层"]
            pgPrimary["PostgreSQL<br/>（主）"]
            pgReplica["PostgreSQL<br/>（只读副本）"]
            redis["Redis<br/>缓存 / 消息队列"]
            s3["对象存储<br/>S3 兼容"]
        end
    end

    subgraph cloudEnv["云端工作环境（可选）"]
        wenCloud["托管工作环境节点"]
    end

    fe --> lb
    lb --> collabNodes
    collabNodes --> agentNodes
    agentNodes --> veRunners
    wenLocal --> agentNodes
    wenCloud --> agentNodes

    collabNodes --> pgPrimary
    collabNodes --> pgReplica
    collabNodes --> redis
    agentNodes --> pgPrimary
    agentNodes --> redis
    veRunners --> pgPrimary
```

### 扩展策略

| 组件 | 扩展方式 | 扩展触发条件 |
|------|---------|------------|
| 协作应用服务端 | 水平扩展（无状态） | CPU / 连接数 |
| Agent 服务器 | 水平扩展（无状态） | 消息吞吐量 |
| VE Runner | 垂直 + 水平扩展 | 活跃 VE 数 × 每 VE 内存占用 |
| PostgreSQL | 读写分离（主 + 副本） | 查询负载 |
| Redis | 集群分片 | 内存 / 吞吐量 |

## 关键数据流

### 场景一：用户发送消息到虚拟员工回复

```mermaid
sequenceDiagram
    actor User as 用户
    participant FE as Flutter 客户端
    participant Collab as 协作应用服务端
    participant PG as PostgreSQL
    participant Agent as Agent 服务器
    participant VE as 虚拟员工实例
    participant WEN as 工作环境节点

    User->>FE: 输入消息
    FE->>Collab: WebSocket message.send
    Collab->>PG: 持久化消息
    Collab->>Collab: 构建上下文数据段（RAG + markers）
    Collab->>Agent: 转发消息 + 上下文数据段
    Agent->>Agent: 租户路由 + 定位 VE 实例
    Agent->>VE: 投递消息到意图识别 Agent
    VE->>VE: 意图分析 → 创建/关联工作上下文
    VE->>Agent: 回写 markers
    Agent->>Collab: PUT /messages/{id}/markers
    Collab->>PG: 更新消息标记
    Collab->>FE: message.update 推送

    VE->>VE: 主 Agent 执行工作
    VE->>Agent: 工具调用请求
    Agent->>WEN: 转发工具调用
    WEN-->>Agent: 执行结果
    Agent-->>VE: 返回结果

    VE->>Agent: 工作完成，生成回复
    Agent->>Collab: 发送回复消息
    Collab->>PG: 持久化回复
    Collab->>FE: message.new 推送
    FE-->>User: 显示回复
```

### 场景二：虚拟员工主动通知

```mermaid
sequenceDiagram
    participant VE as 虚拟员工实例
    participant Agent as Agent 服务器
    participant Collab as 协作应用服务端
    participant FE as Flutter 客户端
    actor User as 用户

    VE->>VE: 长期任务完成
    VE->>Agent: 主动通知请求
    Agent->>Collab: POST notification
    Collab->>Collab: 生成 work_summary 消息
    Collab->>FE: message.new 推送
    FE-->>User: 工作完成通知卡片
```

### 场景三：工作环境节点离线恢复

```mermaid
sequenceDiagram
    participant WEN as 工作环境节点
    participant Agent as Agent 服务器
    participant VE as 虚拟员工实例
    participant User as 用户

    WEN--xAgent: 心跳超时（网络断开）
    Agent->>Agent: 标记节点离线
    Agent->>VE: 通知节点不可用
    VE->>User: 回复"工作环境已断开"

    WEN->>Agent: 重连 + 重新注册
    Agent->>Agent: 验证 + 更新路由表
    Agent->>Agent: 标记节点在线
    Agent->>VE: 通知节点恢复
    VE->>User: 回复"工作环境已恢复，继续工作"
```

## 故障域与降级策略

| 故障场景 | 影响范围 | 降级行为 |
|---------|---------|---------|
| 协作应用服务端宕机 | 用户无法收发消息 | 其他节点承载，FE 自动重连 |
| Agent 服务器宕机 | 虚拟员工不可用 | VE 在协作应用中显示为离线，协作应用 IM 功能正常 |
| VE Runner 宕机 | 该节点上的 VE 不可用 | 管理服务检测心跳超时，在其他 Runner 上恢复冷实例 |
| 工作环境节点离线 | 该节点的 VE 远程工具不可用 | VE 告知用户，平台工具仍可用 |
| PostgreSQL 主库宕机 | 写入不可用 | 读操作切换至副本，写操作等待主库恢复或 failover |
| LLM API 不可用 | Agent 推理中断 | 指数退避重试，超时后通知用户"服务暂时不可用" |

## 配置管理

### 配置层级

```
平台级配置（环境变量 / 配置中心）
  ├── 协作应用服务端配置
  ├── Agent 服务器配置
  ├── VTA Runtime 默认配置
  └── 租户级配置
       ├── 用户偏好（语言、通知、默认模型）
       ├── 组织级策略（权限模板、审批规则）
       └── 虚拟员工配置包（角色、工具、权限）
```

### 配置包版本锁定

虚拟员工创建时锁定配置包的精确版本（SemVer），不自动升级。用户在协作应用中看到可用更新提示，手动确认后触发升级。升级前系统自动对比新旧版本权限变化，新增的权限需求需用户明确确认。

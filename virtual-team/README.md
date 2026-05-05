# Virtual Team

> 面向无技术背景用户的 AI Agent 应用平台。以协作应用为入口，让用户像管理真实团队一样创建、配置和使用 AI 虚拟员工。

---

## 为什么需要 Virtual Team

当前 AI Agent 生态面向开发者：命令行安装、概念繁多（MCP、Prompt、Context Window）、权限配置依赖用户自身判断。Virtual Team 的目标是让 AI Agent **回归应用本身**——用户不需要理解 Agent 如何工作，只需要知道"我雇了一个能帮我做事的人"。

## 核心拟合

| 现实世界 | Virtual Team |
|---------|-------------|
| 公司创始人 | 用户 |
| 公司/部门 | 组织 |
| 真实员工 | 虚拟员工（有岗位、能力、工具） |
| 管理型员工 | 助理（协调、分配、汇报） |
| 员工工位 | 工作区（独立文件系统、工具环境） |

## 系统组成

Virtual Team 由两个独立子系统构成，通过协议层对接：

```
┌─────────────────┐         协议层          ┌─────────────────────┐
│   协作应用       │  ◄──────────────────►  │    虚拟员工系统       │
│  (Flutter/Rust) │   WebSocket + REST     │  (VTA + Agent 服务器) │
│                 │                        │                     │
│ • IM 通讯        │                        │ • 虚拟员工生命周期    │
│ • 协作工具       │                        │ • 消息路由与调度      │
│ • 组织管理       │                        │ • 工具执行           │
└─────────────────┘                        └─────────────────────┘
                                                    │
                                           ┌────────┘
                                           ▼
                              ┌─────────────────────┐
                              │   工作环境节点        │
                              │  (MCP / 沙盒 / 工具)  │
                              └─────────────────────┘
```

- **协作应用**：类 Slack/飞书的即时通讯与协作工具。虚拟员工作为"联系人"出现在用户的聊天列表中。
- **虚拟员工系统**：Agent 运行时核心。每个虚拟员工是一个独立的 Agent 实体，由配置包驱动，零预设能力。
- **工作环境节点**：虚拟员工的远程工位，提供文件系统隔离、MCP 工具、沙盒执行环境。

## 关键设计决策

1. **配置包驱动**：虚拟员工的所有能力（prompt、工具、权限、模型）通过文件式配置包注入，runtime 本身零预设。
2. **双轨工具**：远程工具（在工作环境节点执行，如文件读写、代码运行）与平台工具（在服务端执行，如发送消息、查询组织）分离。
3. **工作上下文**：任务级别的独立工作空间，支持 New / Fork / Resume，类似真实员工开启一个新项目。
4. **三轨并行开发**：VTA Agent 核心链、协作应用、工作环境客户端三条轨道可独立推进，在协议冻结点后汇合。
5. **租户 = 用户级**：每个用户是一个独立租户，数据完全隔离；组织是租户内的管理单元。

## 文档导航

设计指南共 16 章，建议按以下路径阅读：

**快速通读（30 分钟）**
1. [00-项目总览](./src/00-overview.md) — 全貌
2. [02-核心概念模型](./src/02-core-concepts.md) — 术语定义
3. [03-系统总体架构](./src/03-system-architecture.md) — 宏观分层与消息流
4. [14-路线图](./src/14-roadmap.md) — 三轨并行路径与里程碑

**深入各子系统**
- 协作应用：[04-协作应用](./src/04-collaboration-app.md) → [06-消息与工作上下文](./src/06-message-and-work-context.md)
- 虚拟员工系统：[05-虚拟员工系统总览](./src/05-virtual-employee-system.md) → [07-Agent 服务器](./src/07-agent-server.md) → [08-虚拟员工 Agent 内部设计](./src/08-vte-agent-internals.md)
- 工作环境：[09-工作环境节点](./src/09-work-environment-node.md)

**横向主题**
- 协议与集成：[11-协议与集成](./src/11-protocol-and-integration.md)
- 安全与隔离：[12-安全、权限与隔离](./src/12-security-and-isolation.md)
- 租户与组织：[10-租户与组织模型](./src/10-tenant-and-org-model.md)
- 商业化：[13-商业化模型](./src/13-commercialization.md)

## 当前状态

- 架构设计与体系化文档阶段
- 4 项协议边界已冻结：VTA 核心 trait 接口、Agent 服务器协议、工作环境节点协议、协作应用消息模型
- 三轨并行开发就绪

## 技术栈

| 层级 | 技术 |
|-----|------|
| 协作应用前端 | Flutter |
| 协作应用/Agent 服务端 | Rust |
| Agent Runtime (VTA) | Rust |
| 工作环境节点 | Rust + MCP |
| 消息协议 | WebSocket + REST + JSON-RPC 2.0 |
| 数据存储 | PostgreSQL + SQLite |

## 本地构建

设计指南使用 [mdBook](https://github.com/rust-lang/mdBook) 构建。

### 安装 mdBook

```bash
cargo install mdbook
```

> 如果文档中包含 Mermaid 图表，需额外安装 mdbook-mermaid 插件：
> ```bash
> cargo install mdbook-mermaid
> ```

### 构建与预览

```bash
# 进入文档目录
cd virtual-team

# 本地实时预览（默认 http://localhost:3000）
mdbook serve

# 仅构建（输出到 book/ 目录）
mdbook build
```

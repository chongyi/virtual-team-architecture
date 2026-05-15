# Virtual Team 项目设计指南

[项目总览](./00-overview.md)

---

# 项目基础

## 绪论

- [项目愿景与场景拟合](./01-project-vision.md)
- [核心概念模型](./02-core-concepts.md)

## 系统架构

- [系统总体架构](./03-system-architecture.md)

---

# 协作应用

> 独立的即时通讯与协作系统，Virtual Team 的用户入口。

## 设计

- [协作应用总览](./04-collaboration-app/overview.md)
- [架构设计](./04-collaboration-app/architecture.md)
- [IM 通讯系统](./04-collaboration-app/im-system.md)
- [消息上下文增强](./04-collaboration-app/context-enhancement.md)
- [协作工具](./04-collaboration-app/collaboration-tools/overview.md)
  - [文档](./04-collaboration-app/collaboration-tools/documents.md)
  - [多维表格](./04-collaboration-app/collaboration-tools/bitable.md)
  - [任务看板](./04-collaboration-app/collaboration-tools/board.md)
  - [审批流](./04-collaboration-app/collaboration-tools/approval.md)
  - [日程与定时器](./04-collaboration-app/collaboration-tools/schedule-and-timer.md)
  - [协作工具扩展与插件系统](./04-collaboration-app/collaboration-tools/extension-system.md)

## 技术方案

- [技术方案冻结包总览](./04-collaboration-app/technical-design/overview.md)
  - [客户端架构](./04-collaboration-app/technical-design/client-architecture.md)
  - [服务端架构](./04-collaboration-app/technical-design/server-architecture.md)
  - [技术选型与配套设施](./04-collaboration-app/technical-design/technology-selection.md)
  - [API 与协议](./04-collaboration-app/technical-design/api-and-protocol.md)
  - [数据与权限模型](./04-collaboration-app/technical-design/data-and-permission-model.md)
  - [同步、可靠性与观测](./04-collaboration-app/technical-design/sync-reliability-observability.md)
  - [管理端技术方案](./04-collaboration-app/technical-design/admin-console.md)
  - [调研结论与设计决策](./04-collaboration-app/technical-design/research-decisions.md)

---

# 虚拟员工系统

> Agent 运行时核心，管理虚拟员工生命周期、路由消息、调度执行。

## 设计

- [虚拟员工系统总览](./05-virtual-employee-system.md)
- [消息与工作上下文](./06-message-and-work-context.md)
- [Agent 服务器](./07-agent-server.md)
- [虚拟员工 Agent 内部设计](./08-vte-agent-internals/overview.md)
  - [内部 Agent 架构](./08-vte-agent-internals/agent-architecture.md)
  - [工具体系](./08-vte-agent-internals/tool-system.md)
  - [配置包规范](./08-vte-agent-internals/config-package.md)
  - [Runtime 配置与数据](./08-vte-agent-internals/runtime-config-and-data.md)
- [工作环境节点](./09-work-environment-node.md)

## 技术方案

- [VE 技术方案总览](./virtual-employee-system/technical-design/overview.md)
- [VE 技术选型](./virtual-employee-system/technical-design/technology-selection.md)
- [VE API 与协议](./virtual-employee-system/technical-design/api-and-protocol.md)
- [VE 数据与权限模型](./virtual-employee-system/technical-design/data-and-permission-model.md)
- [VE 系统可靠性与观测](./virtual-employee-system/technical-design/reliability-and-observability.md)
- [VE 管理方案](./virtual-employee-system/technical-design/management-console.md)
- [VE 调研结论与设计决策](./virtual-employee-system/technical-design/research-decisions.md)

---

# 跨领域主题

- [租户与组织模型](./10-tenant-and-org-model.md)
- [安全、权限与隔离](./12-security-and-isolation.md)
- [协议与集成总览](./11-protocol-and-integration/overview.md)
  - [协作应用层协议](./11-protocol-and-integration/app-layer-protocol.md)
  - [对接协议](./11-protocol-and-integration/integration-protocol.md)
  - [内部协议](./11-protocol-and-integration/internal-protocol.md)
- [商业化模型](./13-commercialization.md)
- [路线图](./14-roadmap.md)

---

# 开发与实施

## 开发规范

- [仓库结构](./development-standards/repository-structure.md)
- [代码规范](./development-standards/code-conventions.md)

## 技术规范参考

- [数据模型参考](./16-technical-specs/data-model-reference.md)
- [非功能需求](./16-technical-specs/non-functional-requirements.md)
- [可观测性设计](./16-technical-specs/observability.md)
- [错误处理规范](./16-technical-specs/error-handling.md)
- [部署架构](./16-technical-specs/deployment-architecture.md)

## 规划模板

> 用于基于本设计指南构建具体开发计划的参考模板。实际的任务和进度独立维护。

- [Sprint 规划模板](./planning-templates/sprint-planning.md)
- [任务拆解模板](./planning-templates/task-breakdown.md)
- [验收标准模板](./planning-templates/acceptance-criteria.md)

---

# 附录

- [术语表](./15-glossary.md)

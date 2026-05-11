# 管理端 Web 技术调研

## 调研问题

Virtual Team 需要面向内部运营、客服、财务、风控和系统运维的管理端。该管理端不是普通用户协作应用的一部分，而是平台全后台。用户预设技术栈为 Vite + React + React Router 7 + Tailwind CSS + shadcn/ui + Zustand。

## 资料来源

- [Vite Getting Started](https://vite.dev/guide/)
- [React Router Home](https://reactrouter.com/home)
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui with Vite](https://ui.shadcn.com/docs/installation/vite)
- [Zustand Introduction](https://zustand.docs.pmnd.rs/getting-started/introduction)
- [TanStack Query React Overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Microsoft Teams administrator roles](https://learn.microsoft.com/en-us/microsoftteams/using-admin-roles)

## 关键结论

### 管理端应作为独立 Web 应用

管理端面向内部人员，具备高风险操作、密集表格、审计、工单、配置和补偿任务。它的交互密度、权限域、发布节奏和安全要求都不同于普通用户协作应用。

决策：

- 管理端是独立 Web 应用，不嵌入 Flutter 用户端。
- 第一阶段前端独立发布，后端 Admin API 可先在协作应用服务端内作为独立模块实现。
- 管理端路由、鉴权、审计、权限角色和操作审批与用户端 API 隔离。

### 预设技术栈合理，但需要补充服务端状态管理边界

Vite 适合现代 React SPA 的快速开发和生产构建。React Router 7 支持多种模式，管理端第一阶段适合使用 Data/Declarative 方向，不引入不必要 SSR 复杂度。Tailwind + shadcn/ui 适合构建可控的内部设计系统。Zustand 适合保存客户端 UI 状态，但服务端数据应交给专门的数据请求层。

决策：

- 使用 Vite + React + TypeScript。
- React Router 7 用于路由、权限守卫和页面级数据加载。
- Tailwind CSS + shadcn/ui 作为 UI 基础。
- Zustand 仅保存 UI 状态、筛选条件、侧边栏、临时选择等客户端状态。
- 服务端状态建议引入 TanStack Query 或等价封装，负责缓存、重试、分页、失效和后台刷新。

### 管理端角色需要比租户管理员更高一层

成熟协作产品通常区分组织管理员、服务管理员、支持人员、设备/通信管理员等角色。Virtual Team 的平台后台还需要财务、风控、运营、客服、只读审计和系统运维角色。

决策：

- 管理端使用独立 Admin RBAC。
- 角色至少包括：Platform Super Admin、Operations Admin、Support Agent、Finance Admin、Risk Reviewer、System Operator、Read-only Auditor。
- 高风险动作必须支持审批、二次确认、审计和必要时的双人复核。

### 平台全后台能力需要覆盖商业化和运维

管理端不仅是“用户管理页面”，还应覆盖套餐、计费、资源配额、扩展管理、工单、系统状态、任务补偿、数据分析和运营配置。

决策：

- 管理端技术方案按平台全后台范围设计。
- 第一阶段可以分优先级实现，但文档必须冻结信息架构和权限边界。

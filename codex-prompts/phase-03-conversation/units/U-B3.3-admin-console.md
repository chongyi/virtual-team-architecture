# U-B3.3 Admin Console 初步搭建

## 目标 (Goal)

搭建 React 管理端（Vite + React + TypeScript + shadcn/ui + TanStack Query）的初始项目，实现租户管理页面（租户列表、租户详情、资源配额展示），为后续的平台运营管理打基础。

## 上下文 (Context)

- 前置：U-B3.2（组织管理 UI 完成）
- 设计文档：`04-collaboration-app/technical-design/admin-console.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/admin/package.json | create | React 项目配置 |
| apps/admin/vite.config.ts | create | Vite 配置 |
| apps/admin/src/main.tsx | create | 入口 |
| apps/admin/src/routes/ | create | React Router 路由 |
| apps/admin/src/features/tenants/ | create | 租户管理功能模块 |
| apps/admin/src/lib/api.ts | create | API 客户端（TanStack Query） |
| apps/admin/src/components/ | create | 共享 UI 组件 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- shadcn/ui 组件库（通过 MCP tool 安装）
- Admin Console 为独立应用，不混入 Flutter 代码
- Phase 3 仅实现租户管理，其他管理功能在后续阶段逐步添加

## 完成条件 (Done When)

- [ ] `npm run dev` 启动开发服务器
- [ ] 租户列表页面（显示所有租户的基本信息）
- [ ] 租户详情页面（显示成员数、组织数、资源使用量）
- [ ] TanStack Query 数据请求与缓存
- [ ] shadcn/ui 组件（Table、Card、Dialog）正常使用
- [ ] `npm run build` 成功

### 提交标准

- [ ] `feat(admin): add React admin console with tenant management page`

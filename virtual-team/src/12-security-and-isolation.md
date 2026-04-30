# 安全、权限与隔离

## 安全模型概述

Virtual Team 安全模型基于现实场景拟合：虚拟员工像真实员工一样，有明确的权限边界和工作空间限制。

安全策略分为三个层面：

| 层面 | 关注点 | 实现位置 |
|------|--------|---------|
| **租户隔离** | 用户之间数据不可交叉访问 | Agent 服务器 + 数据层 |
| **虚拟员工权限** | 确定虚拟员工能做什么 | 配置包 + VTA 权限引擎 |
| **工作环境隔离** | 工具执行的物理/虚拟边界 | 工作环境节点 |

## 租户隔离

### 数据层

- 所有核心实体（Session、Message、Event、工作上下文）带 `tenant_id`
- Store 层面默认按 `tenant_id` 过滤
- 无法通过 API 跨越租户边界

### 运行时层

- 虚拟员工管理服务在路由消息前验证租户归属
- 工作环境节点的分配验证所有权
- 租户间无共享内存或进程

## 虚拟员工权限

### 权限由配置包定义

虚拟员工的能力边界在配置包中声明，不通过运行时动态授权：

```toml
# permissions.toml（配置包内）
[filesystem]
read = ["/workspace"]
write = ["/workspace"]
deny = ["/etc", "/usr"]

[network]
allow_outbound = true
allow_inbound = false
restricted_hosts = ["internal.corp.com"]

[tools]
allowed = ["file_read", "file_write", "web_search", "code_execute"]
require_approval = ["code_execute", "file_delete"]
deny = ["system_config"]
```

### 审批机制

- 高危操作（代码执行、文件删除、外部 API 调用）需要用户确认
- 审批在协作应用中通过消息卡片呈现——用户在 IM 中直接点"同意/拒绝"
- 审批状态通过 VTA Approval Service 管理
- 支持"本次会话内记住选择"以减少审批频率

## 工作环境隔离

### 文件系统级别隔离

工作环境节点为每个虚拟员工分配独立的工作目录，类似操作系统的用户目录 `/home/ve_xxx/`：

```
/workspaces/
├── ve_sales_01/         # 销售助理的工作空间
│   ├── downloads/
│   ├── projects/
│   └── temp/
├── ve_dev_01/           # 开发员工的工作空间
│   ├── repos/
│   ├── builds/
│   └── temp/
└── shared/              # 授权共享区（可选）
    └── sales_reports/
```

### 共享策略

在用户授权下，允许有限共享：

- 只读共享：虚拟员工 B 可读取虚拟员工 A 的工作产物
- 读写共享：多虚拟员工协作同一个文件区域
- 完全隔离：默认模式

### 沙盒

- 工作环境节点支持沙盒模式（容器或虚拟环境）
- 沙盒内操作不影响宿主系统
- 沙盒生命周期与工作上下文绑定（任务完成 → 沙盒清理）

## 网络安全

- 虚拟员工系统内部通信加密（TLS）
- 工作环境节点与服务端的通信加密
- API 认证与授权（token-based）
- 支持网络访问白名单（限制虚拟员工可访问的网络范围）

## 审计

- 所有操作通过 VTA Event 体系记录不可变审计日志
- 关键操作（工具调用、文件访问、审批通过/拒绝）持久化
- 审计日志可用于合规审查和问题追溯

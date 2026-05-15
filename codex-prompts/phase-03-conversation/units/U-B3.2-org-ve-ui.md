# U-B3.2 组织管理与 VE 管理界面

## 目标 (Goal)

在 Flutter 客户端中实现组织管理界面（组织列表、成员管理、角色设置）和虚拟员工管理界面（VE 创建/配置/分配），使得管理员可以在移动端管理组织和虚拟员工。

## 上下文 (Context)

- 前置：U-B3.1（组织 API 完成）
- 设计文档：`10-tenant-and-org-model.md`、`05-virtual-employee-system.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/org/ | create | 组织管理模块（screens、providers、repositories） |
| apps/flutter/lib/features/ve/ | create | VE 管理模块（screens、providers、repositories） |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- VE 管理界面先以 mock 数据为主（Agent 服务器 Phase 4 才实现）
- 组织界面的权限控制（仅 owner/admin 可见管理入口）

## 完成条件 (Done When)

- [ ] 组织列表页面显示用户所属组织
- [ ] 组织详情页显示成员列表和角色
- [ ] 邀请成员功能（输入用户名 → 发送邀请）
- [ ] VE 列表页面（显示组织内的 VE）
- [ ] VE 创建表单（名称、配置包选择、工作环境分配）——先 mock
- [ ] `flutter analyze` 无 error

### 提交标准

- [ ] `feat(flutter): add organization management and VE management screens`

# U-B3.1 组织 CRUD 后端 API

## 目标 (Goal)

在协作应用服务端实现组织管理后端 API：组织 CRUD（创建、查询、更新、解散）、成员管理（邀请、移除、角色变更）、组织树结构查询，使得管理员可以通过 API 管理组织。

## 上下文 (Context)

- 前置：U-B2.3（频道管理完成，服务端已稳定）
- 设计文档：`10-tenant-and-org-model.md`、`04-collaboration-app/technical-design/data-and-permission-model.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/org.rs | create | Org、OrgMember 结构体 |
| crates/collab-server/src/store/org.rs | create | OrgStore trait + PgOrgStore |
| crates/collab-server/src/service/org.rs | create | OrgService |
| crates/collab-server/src/routes/org.rs | create | REST 路由：POST/GET/PUT/DELETE /orgs |
| migrations/ | create | orgs + org_members 表 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 组织是租户内的树形结构（支持父子组织）
- 成员角色：owner / admin / member
- 所有查询带 tenant_id 过滤

## 完成条件 (Done When)

- [ ] 组织 CRUD API 完整（创建、查询、更新名称、解散）
- [ ] 成员管理 API（邀请、移除、角色变更）
- [ ] 组织树查询（查询子组织列表）
- [ ] 权限：仅 owner/admin 可管理成员
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add organization CRUD API with member management`

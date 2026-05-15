# U-B2.4 租户切换

## 目标 (Goal)

在 Flutter 客户端中实现租户切换功能：用户头像菜单中的租户切换 UI、切换后重新加载全部数据（频道列表、联系人、组织信息）、JWT token 刷新，使得多租户用户可以在不同数据空间之间无缝切换。

## 上下文 (Context)

- 前置：U-B2.2（联系人列表 + IM UI）
- 设计文档：`10-tenant-and-org-model.md`、`04-collaboration-app/technical-design/client-architecture.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/tenant/ | create | 租户切换模块（provider、screen、repository） |
| apps/flutter/lib/core/auth/provider.dart | modify | 增加当前 tenant_id 状态、切换逻辑 |
| apps/flutter/lib/core/network/api.dart | modify | 增加 X-Tenant-ID header 注入 |

## 约束 (Constraints)

详见 CONTEXT.md。切换租户后清空本地缓存（Drift 数据库），重新拉取所有数据。

## 完成条件 (Done When)

- [ ] 用户头像区域显示当前租户名称
- [ ] 点击展示租户列表（用户所属的所有 tenant）
- [ ] 切换租户 → 清空本地状态 → token 刷新 → 重载频道/联系人/组织
- [ ] WebSocket 断开当前连接并重新认证
- [ ] `flutter analyze` 无 error
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(flutter): add tenant switch with data reload and JWT refresh`

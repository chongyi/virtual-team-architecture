# U-B2.3 频道与群组管理界面

## 目标 (Goal)

在 Flutter 客户端中实现频道/群组管理界面：频道列表、创建频道（direct/group/channel）、频道详情（成员管理）、会话列表（按最近消息时间排序），使得用户可以管理频道的完整生命周期。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-B2.2（IM 聊天界面与联系人列表）
- 本单元属于：Phase 2 → G-B2 → 轨道 B → 接口/集成层

### 相关设计文档

- `virtual-team/src/04-collaboration-app/im-system.md`：频道/群组模型
- `virtual-team/src/04-collaboration-app/technical-design/client-architecture.md`

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/im/data/models/channel.dart | create | 频道 DTO |
| apps/flutter/lib/features/im/presentation/screens/channel_list_screen.dart | create | 频道列表页面 |
| apps/flutter/lib/features/im/presentation/screens/channel_detail_screen.dart | create | 频道详情页面 |
| apps/flutter/lib/features/im/presentation/screens/create_channel_screen.dart | create | 创建频道页面 |
| apps/flutter/lib/features/im/presentation/providers/channel_provider.dart | create | 频道 Provider |
| apps/flutter/lib/features/im/data/repositories/channel_repo.dart | create | 频道数据仓库 |

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元无特殊约束。

## 完成条件 (Done When)

### 必须满足

- [ ] 频道列表页：显示用户的所有频道（direct/group/channel 分类）
- [ ] 会话列表按最近消息时间降序排列
- [ ] 创建频道：选择类型（1:1 direct / group / channel）、输入名称、选择成员
- [ ] 频道详情：显示成员列表、频道名称
- [ ] 从频道列表点击进入聊天页面
- [ ] `flutter test` 全部通过
- [ ] `flutter analyze` 无 error

### 提交标准

- [ ] `feat(flutter): add channel list, create channel and channel detail screens`

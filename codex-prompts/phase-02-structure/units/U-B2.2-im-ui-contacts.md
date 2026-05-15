# U-B2.2 IM 聊天界面与联系人列表

## 目标 (Goal)

在 Flutter 客户端中实现 IM 聊天核心界面：消息列表（支持富文本 Block 渲染、上拉加载更多）、消息输入框（文本 + 发送）、联系人列表（用户列表 + 虚拟员工占位），使得用户可以浏览联系人并发起聊天。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-B2.1（Flutter 项目骨架与 WebSocket 连接）
- 本单元属于：Phase 2 → G-B2 → 轨道 B → 服务/逻辑层

### 相关设计文档

- `virtual-team/src/04-collaboration-app/im-system.md`
- `virtual-team/src/04-collaboration-app/technical-design/client-architecture.md`

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/im/data/models/message.dart | create | 消息 DTO |
| apps/flutter/lib/features/im/data/repositories/message_repo.dart | create | 消息仓库 |
| apps/flutter/lib/features/im/presentation/providers/message_provider.dart | create | 消息 Provider |
| apps/flutter/lib/features/im/presentation/screens/chat_screen.dart | create | 聊天页面 |
| apps/flutter/lib/features/im/presentation/widgets/message_bubble.dart | create | 消息气泡组件 |
| apps/flutter/lib/features/im/presentation/widgets/chat_input.dart | create | 输入框组件 |
| apps/flutter/lib/features/contacts/presentation/screens/contacts_screen.dart | create | 联系人页面 |
| apps/flutter/lib/features/contacts/presentation/providers/contacts_provider.dart | create | 联系人 Provider |

### 协议边界

协作应用层协议（消息查询 API、WebSocket 消息帧）

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元特殊约束：
- 消息列表使用无限滚动 + 上拉加载（基于 cursor 分页）
- 富文本渲染支持：普通文本 + 粗体 + 斜体 + 代码块（不需要完整 Markdown）
- VE 占位在联系人列表中用特殊图标标识

## 完成条件 (Done When)

### 必须满足

- [ ] 聊天页面显示消息列表（从服务端拉取）
- [ ] 消息气泡渲染：文本、时间戳、发送者名称
- [ ] 输入框可输入文本并发送（调用 REST API 发送，WebSocket 接收新消息）
- [ ] 新消息通过 WebSocket 实时出现在消息列表底部
- [ ] 联系人列表显示用户（含在线状态指示）
- [ ] 点击联系人进入聊天页面
- [ ] `flutter test` 全部通过

### 质量门禁

- [ ] `flutter analyze` 无 error
- [ ] 滚动性能流畅（消息列表使用 ListView.builder）

### 提交标准

- [ ] `feat(flutter): add IM chat UI with message list, input field and contacts screen`

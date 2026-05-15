# U-B2.5 消息反应与线程回复（Flutter UI）

## 目标 (Goal)

在 Flutter 客户端中实现消息反应显示与选择器、线程回复视图，对接 B1.4 后端 API。

## 上下文 (Context)

- 前置：U-B2.2（IM 聊天界面）+ U-B1.4（reaction/thread 后端）
- 设计文档：`04-collaboration-app/im-system.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/im/presentation/widgets/message_reaction.dart | create | 反应显示与 emoji 选择器 |
| apps/flutter/lib/features/im/presentation/widgets/thread_view.dart | create | 线程回复视图 |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] 消息气泡上显示反应 emoji 和计数
- [ ] 点击 reaction 添加/取消（调用 B1.4 API）
- [ ] 线程回复视图：点击进入，显示根消息 + 回复列表
- [ ] `flutter analyze` 无 error
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(flutter): add message reaction display and thread reply view`

# U-B4.2 VE 联系人接入与在线状态

## 目标 (Goal)

在协作应用中实现虚拟员工作为联系人接入：VE 联系人出现在用户联系人列表中、VE 在线状态同步（Agent 服务器 → 协作应用）、用户可直接向 VE 发送消息，使得用户感知 VE 如同一个真实的团队成员。

## 上下文 (Context)

- 前置：U-B4.1（对接协议完成）
- 设计文档：`04-collaboration-app/im-system.md`、`06-message-and-work-context.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/service/ve_contact.rs | create | VE 联系人服务 |
| crates/collab-server/src/routes/ve_contact.rs | create | VE 联系人 API |
| apps/flutter/lib/features/contacts/ | modify | 联系人列表支持 VE |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] VE 联系人列表 API（GET /api/v1/ve-contacts）
- [ ] VE 在线状态通过 WebSocket 实时同步到客户端
- [ ] Flutter 联系人列表中 VE 用特殊标识区分
- [ ] 向 VE 发消息 → 消息正确路由到 Agent 服务器 → VE 回复
- [ ] VE 离线时发消息 → 降级提示

### 提交标准

- [ ] `feat(collab): add VE as contact with online status sync`

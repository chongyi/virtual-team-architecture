# U-B5.5 日程与定时器

## 目标 (Goal)

实现日程与定时器工具：日程事件（日历视图、事件创建/编辑）、定时器/提醒、循环事件（daily/weekly/monthly），后端 API + Flutter 日历视图。

## 上下文 (Context)

- 前置：U-B5.1（文档工具）
- 设计文档：`04-collaboration-app/collaboration-tools/schedule-and-timer.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/schedule.rs | create | CalendarEvent、Reminder 结构体 |
| crates/collab-server/src/store/schedule.rs | create | ScheduleStore |
| crates/collab-server/src/service/scheduler.rs | create | 定时触发服务（基于 Redis 或 tokio timer） |
| crates/collab-server/src/routes/schedule.rs | create | REST API |
| apps/flutter/lib/features/tools/schedule/ | create | Flutter 日历视图 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 定时器触发后生成系统通知（消息推送到频道）
- 循环事件：支持 daily/weekly/monthly

## 完成条件 (Done When)

- [ ] 日程 CRUD + 日历视图 API
- [ ] 定时器创建 + 到期触发通知
- [ ] 循环事件支持
- [ ] Flutter 日历视图（月视图 + 事件列表）
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add schedule, calendar events and timer/reminder system`

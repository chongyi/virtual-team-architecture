# U-M5.1 M5 里程碑内测版验收

## 目标 (Goal)

对 M5 内测版进行完整端到端验收：VE + 全部 5 类协作工具（文档/表格/看板/审批/日程）+ Tool Action Gateway 全链路可用。

## 上下文 (Context)

- 前置：Phase 5 全部功能单元 + 全部 gate 单元完成
- M5 = A5（VE 封装层）+ B5（协作工具集）

## 完成条件 (Done When)

- [ ] VE 通过 Tool Action Gateway 创建协作文档 → 用户在 Flutter 中可见，标记 source=ve
- [ ] VE 在表格中写入数据行 → 用户可查看/编辑
- [ ] VE 在看板中创建卡片 → 用户可移动卡片到不同列
- [ ] 审批流：用户发起审批 → 审批人处理 → VE 可查询审批状态
- [ ] 日程：用户创建日程事件 → 定时器触发系统通知
- [ ] VE 意图识别 → 工作上下文创建 → 多轮对话 → 正确归档
- [ ] 全链路 tracing correlation_id 一致
- [ ] 审计事件包含上述所有关键操作记录

### 提交标准

- [ ] `test: add M5 beta acceptance end-to-end scenario tests`

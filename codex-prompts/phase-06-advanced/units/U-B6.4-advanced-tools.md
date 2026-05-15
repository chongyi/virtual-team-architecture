# U-B6.4 完整协作工具形态

## 目标 (Goal)

将 Phase 5 的基础版协作工具升级为完整形态：文档增加实时协同编辑提示（OT/CRDT 评估，不强制实现）、多维表格增加视图（过滤/排序/分组）、看板增加泳道、扩展系统支持自定义 Tool Surface。

## 上下文 (Context)

- 前置：U-B6.1（移动端适配）
- 设计文档：`04-collaboration-app/collaboration-tools/` 下各文档

## 工作范围

增强 Phase 5 中 5 类协作工具的数据模型和后端 API。

## 约束 (Constraints)

详见 CONTEXT.md。本单元为增强升级，不重写基础版。

## 完成条件 (Done When)

- [ ] 文档：版本历史（revision list）
- [ ] 表格：过滤器 + 排序 + 分组视图
- [ ] 看板：泳道（按负责人分组）
- [ ] 扩展系统：Extension 可声明自定义 Tool Surface（自定义 UI 组件注入）
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): upgrade collaboration tools with advanced features and custom Tool Surfaces`

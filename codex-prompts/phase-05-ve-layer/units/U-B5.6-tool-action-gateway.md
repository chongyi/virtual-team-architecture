# U-B5.6 Tool Action Gateway

## 目标 (Goal)

实现 Tool Action Gateway 与 Extension Manifest：统一工具操作入口（VE 可通过标准化 Tool Action 在协作工具中创建/修改内容）、Extension Manifest 注册机制（第三方工具声明），使得 VE 可以跨所有协作工具产出内容。

## 上下文 (Context)

- 前置：U-B5.2-B5.5（所有协作工具完成）
- 设计文档：`04-collaboration-app/collaboration-tools/extension-system.md`、`04-collaboration-app/collaboration-tools/overview.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/tool_action/mod.rs | create | Tool Action Gateway |
| crates/collab-server/src/tool_action/registry.rs | create | Extension Manifest 注册表 |
| crates/collab-server/src/tool_action/dispatch.rs | create | Tool Action 分发器 |
| crates/collab-server/src/routes/tool_action.rs | create | Tool Action API |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- Tool Action 格式：`{tool_type}/{action}`（如 `document/create`、`bitable/update_row`）
- Extension Manifest 声明工具提供的 Tool Action 列表
- 权限：VE 的 Tool Action 权限由配置包 tools.toml 中声明
- VE 创建的内容自动标记 source=ve (方便用户识别)

## 完成条件 (Done When)

- [ ] Tool Action Gateway 统一入口
- [ ] Extension Manifest 注册：工具声明提供的 action 列表
- [ ] 分发器根据 tool_type 路由到正确的工具处理器
- [ ] VE 成功通过 Tool Action 创建文档/表格行/看板卡片
- [ ] VE 创建的内容在前端显示 source=ve 标记
- [ ] `cargo test -p vt-collab-server` 全部通过

### 提交标准

- [ ] `feat(collab): add Tool Action Gateway with Extension Manifest registry`

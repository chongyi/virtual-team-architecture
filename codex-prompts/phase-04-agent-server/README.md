# Phase 4：Agent 服务器 + VE 集成

> **开始前请先读取**：`CONTEXT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 4 是**第一个关键集成点（M4）**。轨道 A 实现 Agent 服务器（接入层 + VE 管理服务），轨道 B 实现协作应用的 VE 集成。两条轨道需在 Phase 4 结束时完成首次三方集成验证。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A4: Agent 服务器 | 3 | 接入层（协议适配）→ VE 管理服务（生命周期/多租户路由）→ 冷热实例管理 |
| B | G-B4: VE 集成 | 3 | 对接协议实现 → VE 作为联系人接入 → 上下文数据段构建 + markers 回写 |

## 里程碑 M4：首次三方集成

用户可在协作应用中向虚拟员工发消息，虚拟员工可调用工作环境工具，回复出现在协作应用中。

## 执行策略

- **单 Codex 实例线性执行**，推荐顺序：A4.1→A4.2→A4.3（Agent 服务器就绪） → B4.1→B4.2→B4.3（VE 集成，依赖 Agent 服务器）
- 注意：B4 跨轨依赖 G-A4，必须先完成 A4 轨道全部单元
- 共 **6** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A4.1 | [U-A4.1-agent-server-access.md](units/U-A4.1-agent-server-access.md) | A3.3 |
| 2 | U-A4.2 | [U-A4.2-agent-server-management.md](units/U-A4.2-agent-server-management.md) | A4.1 |
| 3 | U-A4.3 | [U-A4.3-agent-server-instances.md](units/U-A4.3-agent-server-instances.md) | A4.2 |
| 4 | U-B4.1 | [U-B4.1-ve-protocol-implementation.md](units/U-B4.1-ve-protocol-implementation.md) | B3.3 |
| 5 | U-B4.2 | [U-B4.2-ve-contact-integration.md](units/U-B4.2-ve-contact-integration.md) | B4.1 |
| 6 | U-B4.3 | [U-B4.3-ve-context-markers.md](units/U-B4.3-ve-context-markers.md) | B4.2 |

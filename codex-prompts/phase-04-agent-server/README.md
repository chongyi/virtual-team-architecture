# Phase 4：Agent 服务器 + VE 集成 + WEN 绑定

> **开始前请先读取**：`CONTEXT.md`、`PREFLIGHT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 4 是**第一个关键集成点（M4）**。轨道 A 实现 Agent 服务器，轨道 B 实现协作应用的 VE 集成，轨道 C 实现 VE 到 WEN 绑定（从 Phase 5 移入），完成后进行首次三方集成验收。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| — | X4.0 生态迁移 | 1 | SeaORM 实体 + validator + reqwest-middleware + Flutter 库升级 |
| A | G-A4: Agent 服务器 | 3 | 接入层（协议适配）→ VE 管理服务（生命周期/多租户路由）→ 冷热实例管理 |
| B | G-B4: VE 集成 | 3 | 对接协议实现 → VE 作为联系人接入 → 上下文数据段构建 + markers 回写 |
| C | G-C3: WEN 绑定 | 3 | VE 分配与节点选择 → 工具调用路由 → 多 VE 共享与隔离 |
| X | G-X4: 集成质量 gate | 2 | 降级与独立运行验收、安全基线（JWT/tenant 隔离/markers 幂等） |
| M | M4 验收 | 1 | M4 里程碑三方集成端到端验证 |

## 里程碑 M4：首次三方集成

用户可在协作应用中向虚拟员工发消息，虚拟员工可调用工作环境工具，回复出现在协作应用中。

## 执行策略

- **单 Codex 实例线性执行**
- **关键依赖**：B4 跨轨依赖 G-A4（Agent 服务器），C3 跨轨依赖 G-A4 + G-C2（WEN 工具）。因此必须先完成 A4 全部 3 单元，再执行 C3 和 B4
- 推荐顺序：X4.0 → A4.1→A4.2→A4.3 → C3.1→C3.2→C3.3 → B4.1→B4.2→B4.3 → X4.1→X4.2 → M4.1
- 共 **13** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 0 | U-X4.0 | [U-X4.0-ecosystem-migration.md](units/U-X4.0-ecosystem-migration.md) | P3 全部 |
| 1 | U-A4.1 | [U-A4.1-agent-server-access.md](units/U-A4.1-agent-server-access.md) | U-X4.0 |
| 2 | U-A4.2 | [U-A4.2-agent-server-management.md](units/U-A4.2-agent-server-management.md) | A4.1 |
| 3 | U-A4.3 | [U-A4.3-agent-server-instances.md](units/U-A4.3-agent-server-instances.md) | A4.2 |
| 4 | U-C3.1 | [U-C3.1-ve-node-assignment.md](units/U-C3.1-ve-node-assignment.md) | C2.3 |
| 5 | U-C3.2 | [U-C3.2-tool-routing.md](units/U-C3.2-tool-routing.md) | C3.1 |
| 6 | U-C3.3 | [U-C3.3-multi-ve-sharing.md](units/U-C3.3-multi-ve-sharing.md) | C3.2 |
| 7 | U-B4.1 | [U-B4.1-ve-protocol-implementation.md](units/U-B4.1-ve-protocol-implementation.md) | B3.3 |
| 8 | U-B4.2 | [U-B4.2-ve-contact-integration.md](units/U-B4.2-ve-contact-integration.md) | B4.1 |
| 9 | U-B4.3 | [U-B4.3-ve-context-markers.md](units/U-B4.3-ve-context-markers.md) | B4.2 |
| 10 | U-X4.1 | [U-X4.1-degradation-testing.md](units/U-X4.1-degradation-testing.md) | 全部功能单元 |
| 11 | U-X4.2 | [U-X4.2-security-baseline.md](units/U-X4.2-security-baseline.md) | U-X4.1 |
| 12 | U-M4.1 | [U-M4-trilateral-e2e.md](units/U-M4-trilateral-e2e.md) | 全部 gate 单元 |

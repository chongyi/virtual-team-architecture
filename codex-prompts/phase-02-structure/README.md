# Phase 2：结构收敛

> **开始前请先读取**：`CONTEXT.md`、`PREFLIGHT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 2 继续三条轨道并行推进。轨道 A 完成类型体系收敛与 API 冻结，轨道 B 搭建 Flutter 前端基础，轨道 C 实现工具能力。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A2: VTA 结构收敛 | 3 | Message/Part 类型完善、PromptManager + 配置包基础加载、稳定 API 接口冻结 |
| B | G-B2: 协作应用前端基础 | 6 | Flutter 骨架、IM 聊天界面、频道管理、租户切换、reaction/thread UI、附件/图片 UI |
| C | G-C2: 工具能力 | 3 | MCP Server 集成、内置工具实现（文件/Shell/网络）、多 VE 隔离与本地测试 |
| X | G-X2: 基础质量 gate | 2 | Workspace/CI 基线、tenant_id 查询审计、API 冻结校验 |

## 依赖关系

```
G-A2 (VTA 结构收敛)    G-B2 (协作前端)              G-C2 (工具能力)
  ├── U-A2.1 (→A1.3)     ├── U-B2.1 (→B1.3)          ├── U-C2.1 (→C1.3)
  ├── U-A2.2 (→A2.1)     ├── U-B2.2 (→B2.1)          ├── U-C2.2 (→C2.1)
  └── U-A2.3 (→A2.2)     ├── U-B2.3 (→B2.2)          └── U-C2.3 (→C2.2)
                          ├── U-B2.4 (→B2.2)
                          ├── U-B2.5 (→B2.2, B1.4)
                          └── U-B2.6 (→B2.2, B1.5)
```

B2.5/B2.6 是 B1.4/B1.5 后端对应的 Flutter UI，依赖 Flutter 骨架(B2.1)和 IM 界面(B2.2)已就绪。

## 执行策略

- **单 Codex 实例线性执行**，推荐顺序：A2.1→A2.2→A2.3 → B2.1→B2.2→B2.3→B2.4→B2.5→B2.6 → C2.1→C2.2→C2.3 → X2.1→X2.2
- 共 **14** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A2.1 | [U-A2.1-vta-message-types.md](units/U-A2.1-vta-message-types.md) | A1.3 |
| 2 | U-A2.2 | [U-A2.2-vta-prompt-manager.md](units/U-A2.2-vta-prompt-manager.md) | A2.1 |
| 3 | U-A2.3 | [U-A2.3-vta-api-freeze.md](units/U-A2.3-vta-api-freeze.md) | A2.2 |
| 4 | U-B2.1 | [U-B2.1-flutter-skeleton.md](units/U-B2.1-flutter-skeleton.md) | B1.3 |
| 5 | U-B2.2 | [U-B2.2-im-ui-contacts.md](units/U-B2.2-im-ui-contacts.md) | B2.1 |
| 6 | U-B2.3 | [U-B2.3-channel-management.md](units/U-B2.3-channel-management.md) | B2.2 |
| 7 | U-B2.4 | [U-B2.4-tenant-switch.md](units/U-B2.4-tenant-switch.md) | B2.2 |
| 8 | U-B2.5 | [U-B2.5-reaction-thread-ui.md](units/U-B2.5-reaction-thread-ui.md) | B2.2, B1.4 |
| 9 | U-B2.6 | [U-B2.6-attachment-ui.md](units/U-B2.6-attachment-ui.md) | B2.2, B1.5 |
| 10 | U-C2.1 | [U-C2.1-wen-mcp-integration.md](units/U-C2.1-wen-mcp-integration.md) | C1.3 |
| 11 | U-C2.2 | [U-C2.2-wen-builtin-tools.md](units/U-C2.2-wen-builtin-tools.md) | C2.1 |
| 12 | U-C2.3 | [U-C2.3-wen-multi-ve-test.md](units/U-C2.3-wen-multi-ve-test.md) | C2.2 |
| 13 | U-X2.1 | [U-X2.1-workspace-ci-baseline.md](units/U-X2.1-workspace-ci-baseline.md) | 全部功能单元 |
| 14 | U-X2.2 | [U-X2.2-api-audit.md](units/U-X2.2-api-audit.md) | U-X2.1 |

## 里程碑 M2

> G-X2 是 M2 的前置质量 gate。M2 正式验收在 Phase 3 结束（A3 完成后）通过 U-M2.1 执行。
> 本阶段的 X2 gate 确保 M2 的 B1/C1/A2 组件达到质量基线。

## 涉及的设计文档

### 轨道 A 文档
- `08-vte-agent-internals/message-model.md`
- `08-vte-agent-internals/config-package.md`
- `08-vte-agent-internals/execution-loop.md`
- `virtual-employee-system/technical-design/api-and-protocol.md`

### 轨道 B 文档
- `04-collaboration-app/technical-design/client-architecture.md`
- `04-collaboration-app/im-system.md`
- `04-collaboration-app/technical-design/api-and-protocol.md`

### 轨道 C 文档
- `09-work-environment-node.md`
- `08-vte-agent-internals/tool-system.md`
- `11-protocol-and-integration/internal-protocol.md`

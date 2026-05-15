# Phase 2：结构收敛

> **开始前请先读取**：`CONTEXT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 2 继续三条轨道并行推进。轨道 A 完成类型体系收敛与 API 冻结，轨道 B 搭建 Flutter 前端基础，轨道 C 实现工具能力。

| 轨道 | 大组 | 单元数 | 目标 |
|------|------|--------|------|
| A | G-A2: VTA 结构收敛 | 3 | Message/Part 类型完善、PromptManager + 配置包基础加载、稳定 API 接口冻结 |
| B | G-B2: 协作应用前端基础 | 3 | Flutter 项目骨架与导航、IM 聊天界面与联系人列表、频道/群组管理界面 |
| C | G-C2: 工具能力 | 3 | MCP Server 集成、内置工具实现（文件/Shell/网络）、多 VE 隔离与本地测试 |

## 依赖关系

```
G-A2 (VTA 结构收敛)    G-B2 (协作前端)         G-C2 (工具能力)
  ├── U-A2.1 (→A1.3)     ├── U-B2.1 (→B1.3)     ├── U-C2.1 (→C1.3)
  ├── U-A2.2 (→A2.1)     ├── U-B2.2 (→B2.1)     ├── U-C2.2 (→C2.1)
  └── U-A2.3 (→A2.2)     └── U-B2.3 (→B2.2)     └── U-C2.3 (→C2.2)
```

三条轨道之间：**无相互依赖**，但实际单机线性执行。推荐按 A→B→C 顺序逐轨完成。

## 执行策略

- **单 Codex 实例线性执行**，推荐顺序：A2.1→A2.2→A2.3 → B2.1→B2.2→B2.3 → C2.1→C2.2→C2.3
- 共 **9** 个单元

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-A2.1 | [U-A2.1-vta-message-types.md](units/U-A2.1-vta-message-types.md) | A1.3 |
| 2 | U-A2.2 | [U-A2.2-vta-prompt-manager.md](units/U-A2.2-vta-prompt-manager.md) | A2.1 |
| 3 | U-A2.3 | [U-A2.3-vta-api-freeze.md](units/U-A2.3-vta-api-freeze.md) | A2.2 |
| 4 | U-B2.1 | [U-B2.1-flutter-skeleton.md](units/U-B2.1-flutter-skeleton.md) | B1.3 |
| 5 | U-B2.2 | [U-B2.2-im-ui-contacts.md](units/U-B2.2-im-ui-contacts.md) | B2.1 |
| 6 | U-B2.3 | [U-B2.3-channel-management.md](units/U-B2.3-channel-management.md) | B2.2 |
| 7 | U-C2.1 | [U-C2.1-wen-mcp-integration.md](units/U-C2.1-wen-mcp-integration.md) | C1.3 |
| 8 | U-C2.2 | [U-C2.2-wen-builtin-tools.md](units/U-C2.2-wen-builtin-tools.md) | C2.1 |
| 9 | U-C2.3 | [U-C2.3-wen-multi-ve-test.md](units/U-C2.3-wen-multi-ve-test.md) | C2.2 |

## 里程碑 M2

**A2 + B1 + C1 触发**：三轨基础就绪——VTA API 稳定 + IM 服务端可部署 + WEN 可连接。

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

# 仓库结构

## 仓库边界

Virtual Team 涉及两类仓库：

| 仓库 | 用途 | 内容 |
|------|------|------|
| **architecture**（本仓库） | 项目设计指南与协议规范 | mdBook 文档、调研结论、协议冻结稿、Codex 开发计划 |
| **monorepo**（代码仓库） | 全部子系统的代码实现 | Rust workspace、Flutter 应用、React 管理端 |

本仓库（architecture）不包含业务代码。以下描述 monorepo 的推荐结构——该结构已通过 Phase 1 验证，与 `codex-prompts/` 中的开发计划一致。

## Monorepo 顶层布局

```
virtual-team/                          # monorepo 根目录
├── Cargo.toml                         # Rust workspace root
├── Cargo.lock
├── .gitignore
├── .env-context                       # 环境变量（不入库，被 .gitignore 忽略）
├── .github/                           # CI/CD workflows
├── crates/                            # Rust crates（全部子系统）
│   ├── vta/                           # VTA Agent Runtime workspace
│   │   ├── core/                      #   核心类型、trait、事件（vta-core）
│   │   ├── store/                     #   Store trait（vta-store）
│   │   ├── store-memory/              #   内存实现（vta-store-memory）
│   │   ├── store-sqlite/              #   SQLite 实现 + 迁移（vta-store-sqlite）
│   │   ├── inference/                 #   推理管线 Composer/Renderer/Projector
│   │   ├── inference-rig/             #   Rig LLM 后端（vta-inference-rig）
│   │   ├── tools/                     #   工具注册表（vta-tools）
│   │   ├── skills/                    #   技能系统（vta-skills）
│   │   ├── mcp/                       #   MCP 集成（vta-mcp）
│   │   ├── kernel/                    #   Session/Turn 生命周期（vta-kernel）
│   │   ├── agent/                     #   AgentLoop + PromptManager（vta-agent）
│   │   └── host/                      #   组合根（vta-host）
│   ├── collab-server/                 # VTC 服务端
│   ├── agent-server/                  # Agent 服务器
│   ├── wen-client/                    # 工作环境节点客户端
│   └── shared/                        # 公共类型与工具
│       ├── protocol/                  #   协议类型定义（共享）
│       ├── error/                     #   统一错误类型
│       └── id/                        #   ID 前缀与生成
├── apps/
│   ├── flutter/                       # VTC Flutter 客户端
│   │   ├── lib/
│   │   │   ├── app/                   #   入口与路由
│   │   │   ├── core/                  #   基础设施（网络、存储、认证、平台适配）
│   │   │   ├── features/             #   功能模块（im/contacts/org/ve/tools）
│   │   │   └── shared/               #   共享 Widget、模型
│   │   ├── ios/ / android/ / macos/ / windows/ / web/
│   │   └── test/
│   └── admin/                         # VTC 管理端（React）
│       ├── src/
│       │   ├── routes/
│       │   ├── features/             # tenants/users/ve/billing/risk/operations
│       │   ├── components/
│       │   └── lib/                  # API client、Auth、状态管理
│       └── vite.config.ts
├── docker/                            # Dockerfiles（按服务）
│   ├── collab-server.Dockerfile
│   ├── agent-server.Dockerfile
│   ├── ve-runner.Dockerfile
│   └── wen-client.Dockerfile
├── configs/                           # 配置模板（.example.toml 入 Git，实际值不入）
├── migrations/                        # 数据库迁移
└── scripts/                           # 工具脚本
```

## Crate 命名约定

- `vt-` 前缀：Virtual Team 全平台公共组件（`vt-protocol`、`vt-error`、`vt-id`）
- `vta-` 前缀：VTA Agent Runtime 专属组件（`vta-core`、`vta-agent`、`vta-kernel` 等）

### Cargo.toml 规范

- 每个 crate 独立 `Cargo.toml`，workspace root 声明成员
- 版本号由 workspace root `[workspace.package]` 统一管理
- 依赖版本在 workspace root `[workspace.dependencies]` 统一声明
- 公共 API crate 必须含 `README.md`

```toml
# 根 Cargo.toml
[workspace]
members = [
    "crates/vta/core",
    "crates/vta/store",
    # ...
    "crates/collab-server",
    "crates/agent-server",
    "crates/wen-client",
    "crates/shared/protocol",
    "crates/shared/error",
    "crates/shared/id",
]
resolver = "3"

[workspace.package]
version = "0.1.0"
edition = "2024"

[workspace.dependencies]
tokio = { version = "1", features = ["full"] }
axum = "0.8"
sqlx = { version = "0.8", features = ["runtime-tokio", "tls-rustls", "postgres"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tracing = "0.1"
# ...
```

## Flutter 项目布局

每个功能模块按 Repository 模式组织：

```
feature/
├── data/
│   ├── models/          # DTO
│   ├── repositories/    # 数据仓库实现
│   └── datasources/     # 数据源（Remote / Local）
├── domain/
│   ├── entities/        # 领域实体
│   └── repositories/    # 仓库接口（abstract）
├── presentation/
│   ├── providers/       # Riverpod providers
│   ├── screens/         # 页面
│   └── widgets/         # UI 组件
└── feature.dart         # 公共导出
```

平台差异通过 `core/platform/` 适配层处理，禁止在功能模块中直接使用 `dart:io` 平台判断。

## 管理端布局

管理端为独立 Vite + React 应用，通过 `/admin/api/v1` 调用 Admin API，不与 Flutter 客户端代码混合。

## 协议文件与设计文档的关系

- **设计仓库**：维护协议规范的人读版本（`virtual-team/src/11-protocol-and-integration/`）
- **Monorepo**：以 Rust crate（`crates/shared/protocol/`）形式引入协议类型定义
- 协议变更流程：先更新设计仓库文档 → 冻结 → monorepo 同步更新代码

## 开发阶段

开发按 6 个 Phase 分阶段推进，当前状态：

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | 基础建设（VTA MVP + VTC 服务端 + WEN 骨架） | ✅ 已完成 |
| Phase 2 | 结构收敛（VTA 类型完善 + Flutter 前端 + 工具能力） | 🔧 进行中 |
| Phase 3 | 完整对话与组织管理 | 📋 计划中 |
| Phase 4 | Agent 服务器 + VE 集成 | 📋 计划中 |
| Phase 5 | VE 封装层 + 协作工具集 | 📋 计划中 |
| Phase 6 | 高级特性 + 全平台 | 📋 计划中 |

每个 Phase 的单元计划位于 `codex-prompts/` 目录，独立于 mdBook。

# 仓库结构

## 总体决策

Virtual Team 采用 **monorepo** 策略。三个子系统（协作应用、虚拟员工系统、工作环境客户端）共享一个代码仓库，通过 workspace 机制组织。这确保协议变更时所有子系统同步可见，降低集成摩擦。

协议冻结后的三条开发轨道（VTA Agent 核心链、协作应用、工作环境客户端）可在 monorepo 内独立构建和测试。

## 顶层布局

```
virtual-team/
├── Cargo.toml                 # Rust workspace root
├── Cargo.lock
├── .gitignore
├── .github/                   # CI/CD workflows
├── docker/                    # Dockerfiles（按服务）
│   ├── collab-server.Dockerfile
│   ├── agent-server.Dockerfile
│   ├── ve-runner.Dockerfile
│   └── wen-client.Dockerfile
├── docs/                      # 本设计指南（mdBook）
│   └── virtual-team/
│       ├── book.toml
│       └── src/
├── research/                  # 调研文档（独立于 mdBook）
├── crates/                    # Rust crates
│   ├── collab-server/         # 协作应用服务端
│   ├── agent-server/          # Agent 服务器
│   ├── vta/                   # VTA Agent Runtime 核心
│   │   ├── core/              #   核心 trait 定义
│   │   ├── message-store/     #   MessageStore 实现
│   │   ├── prompt-manager/    #   PromptManager 实现
│   │   ├── model-selector/    #   模型选择器
│   │   └── transport/         #   传输层抽象
│   ├── wen-client/            # 工作环境节点客户端
│   └── shared/                # 公共类型与工具
│       ├── protocol/          #   协议类型定义（共享）
│       ├── error/             #   统一错误类型
│       └── id/                #   ID 前缀与生成
├── apps/
│   ├── flutter/               # Flutter 客户端（单代码库）
│   │   ├── lib/
│   │   │   ├── app/           #   应用入口与路由
│   │   │   ├── core/          #   基础设施（网络、存储、认证）
│   │   │   ├── features/      #   功能模块
│   │   │   │   ├── im/        #     IM 聊天
│   │   │   │   ├── contacts/  #     联系人
│   │   │   │   ├── org/       #     组织管理
│   │   │   │   ├── ve/        #     虚拟员工管理
│   │   │   │   └── tools/     #     协作工具 Surface
│   │   │   └── shared/        #   共享 Widget、模型、状态
│   │   ├── ios/
│   │   ├── android/
│   │   ├── macos/
│   │   ├── windows/
│   │   └── web/
│   └── admin/                 # 管理端（React）
│       ├── src/
│       │   ├── routes/
│       │   ├── features/
│       │   ├── components/
│       │   └── lib/
│       └── vite.config.ts
├── configs/                   # 配置模板
│   ├── collab-server.example.toml
│   ├── agent-server.example.toml
│   └── wen-client.example.toml
├── scripts/                   # 工具脚本
└── frozen-plan/               # VTA 子仓库冻结文件（如有独立仓库）
    └── interfaces/            #   冻结的 trait 接口定义
```

## Rust Workspace 约定

### Crate 命名

```
vt-collab-server       # 协作应用服务端主程序
vt-agent-server        # Agent 服务器主程序
vta-core               # VTA 核心 trait 定义
vta-message-store-*    # MessageStore 实现
vta-prompt-manager-*   # PromptManager 实现
vta-model-selector     # 模型选择器
vt-wen-client          # 工作环境节点客户端
vt-protocol            # 公共协议类型
vt-error               # 统一错误类型
vt-id                  # ID 前缀与生成
```

命名原则：`vt-` 前缀用于 Virtual Team 全平台公共组件，`vta-` 前缀用于 VTA Agent Runtime 专属组件。

### Cargo.toml 规范

- 每个 crate 使用独立的 `Cargo.toml`，workspace root 仅声明成员
- 版本号统一由 workspace root 的 `[workspace.package]` 管理
- 依赖版本统一在 workspace root 的 `[workspace.dependencies]` 声明
- 公共 API 的 crate 必须包含 `README.md` 和基本文档注释

```toml
# 根 Cargo.toml
[workspace]
members = [
    "crates/collab-server",
    "crates/agent-server",
    "crates/vta/core",
    # ...
]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2024"
license = "MIT"

[workspace.dependencies]
tokio = { version = "1", features = ["full"] }
axum = "0.8"
sqlx = { version = "0.8", features = ["runtime-tokio", "tls-rustls", "postgres"] }
# ...
```

### 公开 trait 与内部实现分离

- trait 定义放在 `vta-core`（或其他 `*-core` crate），不依赖具体实现
- 具体实现放在独立 crate（如 `vta-message-store-sqlite`），依赖 trait crate
- 调用方只依赖 trait crate，通过依赖注入或 feature flag 选择实现

## Flutter 项目布局

### 功能模块结构

每个功能模块（`features/<name>/`）内部按以下结构组织：

```
feature/
├── data/
│   ├── models/          # 数据模型（DTO）
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

### 平台适配

平台差异通过 `core/platform/` 下的适配层处理，不分散在各功能模块中：

- `core/platform/capabilities/` — 平台能力声明（通知、文件、深链、窗口）
- `core/platform/adapters/` — 平台接口的 Flutter 实现
- 功能模块通过 `PlatformCapabilities` 接口查询而非直接 `dart:io` 判断

## 管理端布局

管理端为独立 Vite + React 应用，不混入 Flutter 客户端代码：

```
apps/admin/
├── src/
│   ├── routes/            # React Router 路由定义
│   ├── features/          # 按功能模块
│   │   ├── tenants/       #   租户管理
│   │   ├── users/         #   用户管理
│   │   ├── ve/            #   VE 管理
│   │   ├── billing/       #   计费
│   │   ├── risk/          #   风控
│   │   └── operations/    #   运营工单
│   ├── components/        # 共享 UI 组件
│   └── lib/               # 基础设施（API client、Auth、状态管理）
├── public/
└── vite.config.ts
```

## 配置文件位置

| 路径 | 用途 |
|------|------|
| `.claude/` | Claude Code 配置（hooks、memories、settings） |
| `frozen-plan/` | VTA 的冻结接口定义（如 VTA 有独立仓库） |
| `configs/*.example.toml` | 服务端配置模板，不含密钥 |
| `.github/workflows/` | CI/CD 流水线定义 |
| `research/` | 调研文档，独立于 mdBook 正文 |

## `.gitignore` 关键模式

```gitignore
# Rust
/target/
**/*.rs.bk

# Flutter
apps/flutter/.dart_tool/
apps/flutter/build/

# Dependencies
node_modules/

# Secrets
.env
*.pem
*.key
configs/*.toml
!configs/*.example.toml

# Build output
book/

# IDE
.idea/
.vscode/
*.swp
```

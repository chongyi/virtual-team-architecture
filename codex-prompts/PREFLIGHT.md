# PREFLIGHT —— 阶段前置环境检查

> 每个 Phase 开始前，Codex 必须读取本文件并逐项验证环境，缺什么就明确报缺、暂停等待。
> 本文件引用 `.env-context` 中的变量，不硬编码本机路径。

---

## 全局工具链（所有阶段）

| 检查项 | 验证命令 | 未满足时 |
|--------|---------|---------|
| Rust 工具链 | `rustc --version && cargo --version` | 安装 rustup |
| Flutter SDK | `flutter --version` | 安装 Flutter |
| Node.js | `node --version` | 安装 Node 22+ |
| Docker | `docker ps` | 启动 Docker Desktop |
| sqlx CLI | `sqlx --version` | `cargo install sqlx-cli` |
| sea-orm CLI | `sea-orm-cli --version` | `cargo install sea-orm-cli@^2.0.0-rc` |

---

## Phase 4+ 新增依赖

| 库 | Cargo/Flutter 依赖 |
|----|-------------------|
| SeaORM | `sea-orm = "2.0.0-rc"` |
| Validator | `validator = "0.20"` |
| Reqwest-middleware | `reqwest-middleware`、`reqwest-retry` |
| CachedNetworkImage | `cached_network_image` |
| FlutterMarkdown | `flutter_markdown` |
| TokioCronScheduler | `tokio-cron-scheduler`（Phase 5） |

---

## 全局环境变量（所有阶段）

| 变量 | 来源 | 用途 |
|------|------|------|
| `DEEPSEEK_API_KEY` | `.env-context` | 测试模型 API 密钥 |
| `DEEPSEEK_BASE_URL` | `.env-context` | API 端点 |
| `CHEAP_MODEL` | `.env-context` | 低成本快速模型名 |
| `POWERFUL_MODEL` | `.env-context` | 强推理模型名 |
| `ANTHROPIC_API_KEY` | 同 DEEPSEEK_API_KEY（兼容 Anthropic 风格） | Anthropic SDK 兼容调用 |
| `ANTHROPIC_BASE_URL` | 同 DEEPSEEK_BASE_URL | Anthropic 风格端点 |

---

## 各阶段前置条件

### Phase 1（基础建设）

| 条件 | 检查方式 | 未满足时 |
|------|---------|---------|
| PostgreSQL 运行 | `docker ps \| grep postgres` | 启动 PG 容器 |
| Redis 可用 | `docker ps \| grep redis` | 启动 Redis 容器 |
| `DEEPSEEK_API_KEY` 已设置 | 读 `.env-context` | **阻塞**：A1.3 无法执行真实 LLM E2E |
| chrome-devtools MCP 可用 | `which npx`（MCP server 通过 npx 启动） | 安装 Node.js |

### Phase 2（结构收敛）

| 条件 | 检查方式 | 未满足时 |
|------|---------|---------|
| Phase 1 全部 commit 已存在 | `git log --oneline \| grep` | 不可跳过 |
| PostgreSQL 运行 | 同上 | 同上 |
| MinIO 可用 | `docker ps \| grep minio` 或启动 MinIO 容器 | P1 B1.5 已创建 attachment 后端，P2 B2.6 需要测试附件上传 |

### Phase 3（完整对话 + 组织管理）

| 条件 | 检查方式 | 未满足时 |
|------|---------|---------|
| Phase 2 全部 commit 已存在 | `git log` | 不可跳过 |
| `DEEPSEEK_API_KEY` 已设置 | 读 `.env-context` | **阻塞** |

### Phase 4（Agent 服务器 + VE 集成）

| 条件 | 检查方式 | 未满足时 |
|------|---------|---------|
| Phase 3 全部 commit 已存在 | `git log` | 不可跳过 |
| `DEEPSEEK_API_KEY` 已设置 | 读 `.env-context` | **阻塞** |
| Agent 服务器端口 8100 可用 | `lsof -i :8100` 无输出 | 端口冲突时改配置 |
| WEN 端口 8101 可用 | `lsof -i :8101` | 同上 |

### Phase 5（VE 封装层 + 协作工具集）

| 条件 | 检查方式 | 未满足时 |
|------|---------|---------|
| Phase 4 全部 commit | `git log` | 不可跳过 |
| `DEEPSEEK_API_KEY` | 读 `.env-context` | **阻塞** |

### Phase 6（高级特性 + 全平台）

| 条件 | 检查方式 | 未满足时 |
|------|---------|---------|
| Phase 5 全部 commit | `git log` | 不可跳过 |
| iOS 构建环境 | `flutter build ios --no-codesign --dry-run` | 跳过 iOS 构建，仅做 analyze |
| Android 构建环境 | `flutter build apk --dry-run` | 同上 |
| Docker Compose | `docker compose version` | 安装 Docker Compose |

---

## LLM 调用策略（所有涉及模型调用的 unit）

1. **优先读取 `.env-context`** 获取模型配置和 API 密钥
2. **密钥可用 → 使用真实模型**（deepseek-v4-pro / deepseek-v4-flash）
3. **密钥不可用 → 使用 Mock LLM Backend**：
   - Mock 返回确定性的、符合预期的响应（如固定的 ToolCall 或 Text）
   - commit message 末尾加 `[MOCK-LLM]` 标记，便于后续追踪哪些单元是 mock 通过的
   - Mock 通过的单元视为"功能流体验证通过"，后续注入真实 key 后需重新验证 E2E

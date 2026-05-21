---

## U-1: 环境配置体系化

### 目标
建立统一的环境变量体系，消除硬编码配置，让新开发者复制一份 .env 文件即可启动。

### 工作范围

**1.1 根目录 .env.example**
创建 `{PROJECT_MONO_REPO}/.env.example`，包含所有可配置变量，按类别分组并附中文注释：

---- 模型配置 ----
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
CHEAP_MODEL=deepseek-v4-flash
POWERFUL_MODEL=deepseek-v4-pro
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic

---- 数据库 ----
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=virtual_team_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

---- 缓存 ----
REDIS_HOST=localhost
REDIS_PORT=6379

---- 对象存储 ----
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=virtual-team-dev

---- 服务端口 ----
COLLAB_SERVER_PORT=8080
AGENT_SERVER_PORT=8100
WEN_CLIENT_PORT=8101

---- 安全 ----
JWT_SECRET=dev-secret-change-in-production
AGENT_SERVER_API_KEY=vt-dev-api-key

---- 特性开关 ----
COLLAB_AGENT_ENABLED=true
WEN_SANDBOX_ENABLED=true
AUDIT_ENABLED=true

---- 日志 ----
RUST_LOG=info,vt_collab_server=debug,vt_agent_server=debug,vt_wen_client=debug



**1.2 各服务 config 模板**
确保以下文件存在且读取 `.env` 中对应变量：
- `configs/collab-server.example.toml`
- `configs/agent-server.example.toml`
- `configs/wen-client.example.toml`
- `configs/vta-host.example.toml`

**1.3 配置加载逻辑**
在 collab-server、agent-server、wen-client 的 `config.rs` 中：
- 启动时自动搜索 `.env` 文件（先找当前目录，再找项目根目录）
- 环境变量优先级 > 配置文件 > 默认值
- 启动时打印已加载的配置来源（文件路径或 "使用默认值"）
- 关键配置缺失时（如生产环境缺少 JWT_SECRET）给出明确 warning

### 验证方式
- `.env.example` 文件包含全部变量且注释清晰
- `cp .env.example .env` 后修改 API Key 即可启动
- 各服务启动日志打印配置来源
- `cargo test` 全部通过

### 提交
`feat(config): add unified .env.example and config loading with auto-discovery`

---

## U-2: Docker Compose 场景拆分

### 目标
将单一 docker-compose.yml 拆分为两个场景：本地开发（仅基础设施）和全栈部署，允许开发者用 `cargo run` 运行服务的同时用 Docker 提供数据库。

### 工作范围

**2.1 docker-compose.infra.yml（本地开发场景）**
仅包含基础设施服务：

- `postgres` — PostgreSQL 15，端口 5432
- `redis` — Redis 7，端口 6379
- `minio` — MinIO，端口 9000（API）+ 9001（Console）
- `minio-init` — 自动创建 bucket

不包含任何 Rust 服务。开发者用 `cargo run` 启动各服务。

```yaml
# 关键配置
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-virtual_team_dev}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    ports: ["5432:5432"]
    volumes: ["postgres-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
2.2 docker-compose.yml（全栈部署场景）
在 infra 基础上增加：

collab-server — 构建自 docker/collab-server.Dockerfile
agent-server — 构建自 docker/agent-server.Dockerfile
wen-client — 构建自 docker/wen-client.Dockerfile
db-migrate — 一次性迁移容器（启动完成后退出）
所有 Rust 服务通过 depends_on + condition: service_healthy 确保启动顺序。

2.3 .env.infra.example 和 .env.full.example
两份环境文件样本，分别对应两个场景，含清晰注释。

2.4 启动脚本
scripts/dev-up.sh：


#!/bin/bash
# 本地开发一键启动
cp -n .env.example .env 2>/dev/null || true
docker compose -f docker-compose.infra.yml up -d
echo "基础设施已启动。现在可以 cargo run 各服务。"
scripts/dev-down.sh：停止并清理基础设施容器。

验证方式
docker compose -f docker-compose.infra.yml up -d → PG/Redis/MinIO 健康
cargo run -p vt-collab-server 连接 PG/Redis 成功
docker compose up -d → 全部 7 个服务健康
docker compose ps 显示所有服务 running + healthy
提交
feat(ops): split docker-compose into infra-only and full-stack scenarios

U-3: 启动时自动迁移
目标
消除手动执行迁移的步骤。每个 Rust 服务启动时自动检查并执行待处理的数据库迁移，确保 cargo run 或容器启动后即可用。

工作范围
3.1 collab-server 自动迁移
在 main.rs 的启动流程中，PG 连接池建立后、路由注册前：


// 自动执行迁移
if let Some(pool) = &pg_pool {
    sea_orm_migration::Migrator::up(
        &sea_orm::SqlxPostgresConnector::from_sqlx_postgres_pool(pool.clone()),
        None,
    ).await?;
}
或等效的 sqlx migrate!() 宏。

3.2 agent-server 自动迁移
同样在服务启动时自动执行。移除 agent-server 中内联的 CREATE TABLE IF NOT EXISTS，统一走 migration crate。

3.3 迁移幂等性

已执行的迁移不重复执行（sea-orm-migration 的 seaql_migrations 表已保证）
如果数据库不存在，自动创建（PG 连接 URL 中指定 database）
迁移失败 → 服务启动失败并打印清晰错误信息（哪个迁移、什么错误）
3.4 环境变量控制

AUTO_MIGRATE=true（默认）— 启动时自动迁移
AUTO_MIGRATE=skip — 跳过自动迁移（CI 环境或只读副本）
AUTO_MIGRATE=verify — 只检查迁移状态不执行（生产前预检）
验证方式
空数据库 → cargo run -p vt-collab-server → 所有表自动创建 → 服务正常启动
已有数据库 → 再次启动 → 迁移被跳过 → 日志显示 "迁移已是最新"
AUTO_MIGRATE=skip 启动 → 不执行迁移 → 日志显示 "迁移跳过（AUTO_MIGRATE=skip）"
手动删除一个表 → 启动 → 迁移尝试修复（幂等 CREATE IF NOT EXISTS）
提交
feat(core): add auto-migration on startup with env control

U-4: 文档体系完善
目标
让新加入者 5 分钟内能启动开发环境，遇到问题有处可查。

工作范围
4.1 README.md 重写
内容结构：

项目简介（一段话）
技术栈速览（小表格）
5 分钟快速启动（最核心）
前置要求：Rust、Flutter、Docker、Node.js
cp .env.example .env → 填入 API Key
./scripts/dev-up.sh → 启动基础设施
cargo run -p vt-collab-server → 启动协作服务端
cargo run -p vt-agent-server → 启动 Agent 服务器
cargo run -p vt-wen-client → 启动工作环境客户端
cd apps/flutter && flutter run → 启动客户端
项目结构速览
常用命令
文档索引（指向架构仓库的 CONTEXT.md 等）
4.2 docs/QA.md
常见问题：

Q: 启动报 "connection refused" → A: 确认 docker-compose infra 已启动
Q: Flutter 报 "No route" → A: 确认 collab-server 已启动且端口正确
Q: VE 不回复消息 → A: 检查 DEEPSEEK_API_KEY 和 AGENT_SERVER_API_KEY
Q: 文件上传失败 → A: 确认 MinIO 已启动且 bucket 已创建
Q: WEN 注册失败 → A: 确认 agent-server 已启动且端口 8100 可达
Q: 迁移报错 → A: 检查 PG 连接，尝试 docker compose down -v 重建
4.3 docs/troubleshooting.md
按症状分类：

启动类：端口占用、PG 连接超时、Redis 不可达
运行时类：WebSocket 断连、消息不推送、文件上传超时
构建类：cargo build 失败、flutter pub get 超时
迁移类：迁移冲突、版本不匹配
每个症状含：现象描述 → 排查步骤 → 解决方案

4.4 docs/development.md
新开发者指南：

推荐的 IDE 配置（VS Code + rust-analyzer + Flutter 插件）
代码规范速查
Git 工作流（分支/commit/PR）
本地调试技巧（RUST_LOG、tracing、断点）
测试运行指南
验证方式
按 README 快速启动步骤操作一遍，能成功启动
QA 覆盖的 6 个问题有明确答案
troubleshooting 覆盖的 3 类场景有排查路径
提交
docs: add comprehensive README, QA, troubleshooting, and development guide

U-5: k3s 部署清单（可选）
目标
提供基础的 k3s 部署清单，作为容器化部署的进阶选项。

工作范围
5.1 命名空间与基础资源
deploy/k3s/namespace.yaml：


apiVersion: v1
kind: Namespace
metadata:
  name: virtual-team
5.2 ConfigMap 和 Secret
deploy/k3s/configmap.yaml：从 .env.example 中提取非敏感配置。
deploy/k3s/secret.yaml：模板，实际值通过 kubectl create secret 注入。

5.3 基础设施 Deployment + Service

deploy/k3s/postgres.yaml — Deployment（单副本）+ Service（ClusterIP）
deploy/k3s/redis.yaml — 同上
deploy/k3s/minio.yaml — 同上
5.4 应用 Deployment + Service

deploy/k3s/collab-server.yaml
deploy/k3s/agent-server.yaml
deploy/k3s/wen-client.yaml
5.5 Ingress
deploy/k3s/ingress.yaml：将 collab-server 的 HTTP/WS 端点暴露到集群外。

5.6 部署脚本
scripts/k3s-deploy.sh：


#!/bin/bash
kubectl apply -f deploy/k3s/namespace.yaml
kubectl create secret generic vt-secrets \
  --from-literal=jwt-secret=... \
  --from-literal=deepseek-api-key=... \
  -n virtual-team --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f deploy/k3s/
约束
k3s 清单为开发/测试级，非生产级（单副本、无持久卷自动配置、无 HPA）
ConfigMap 中不包含任何密钥
所有镜像使用本地构建标签（virtual-team/*:latest）
验证方式
k3s kubectl apply -f deploy/k3s/ → 所有 Pod Running
k3s kubectl get pods -n virtual-team → 6 个 Pod 全部 Ready
curl http://<node-ip>:8080/health → collab-server 响应 ok
提交
feat(ops): add k3s deployment manifests and deploy script

总体约束
不破坏已有功能，cargo test + flutter analyze 必须始终通过
配置变更保持向后兼容：现有 .env-context 中的变量名不变
每个单元完成后立即创建 Conventional Commits 格式的 commit
Docker 镜像/容器仅在 k3s 单元实际构建，infra 和全栈场景使用已有 Dockerfile
README 中不写绝对路径，使用相对于 PROJECT_MONO_REPO 的路径


---
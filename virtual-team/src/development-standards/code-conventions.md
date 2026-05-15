# 代码规范

## Rust 规范

### 错误处理

- **库层**：使用 `thiserror` 定义结构化错误枚举，不抛裸 `Box<dyn Error>`
- **应用边界**（HTTP handler、gRPC service）：使用 `anyhow::Result` 简化错误传播，但必须在上层转换为结构化错误响应
- 所有错误必须实现 `Display` 和 `std::error::Error`
- 不要在库的公共 API 中返回 `anyhow::Error`

```rust
// 库层：thiserror
#[derive(Debug, thiserror::Error)]
pub enum CollabError {
    #[error("channel {channel_id} not found")]
    ChannelNotFound { channel_id: Uuid },
    #[error("access denied to channel {channel_id}")]
    ChannelAccessDenied { channel_id: Uuid },
}

// 应用边界：anyhow → 结构化错误响应
async fn route_message() -> Result<impl IntoResponse, AppError> {
    let inner = collab_service.send(msg).await?;
    Ok(Json(inner))
}
```

### 数据库访问

- 统一使用 `sqlx` 作为数据库驱动，不使用 ORM
- 查询绑定参数使用命名参数，不使用 `$1` 位置参数（可读性）
- 所有查询必须带 `tenant_id` 过滤（在 Store 层强制）
- 迁移使用 `sqlx migrate`，迁移文件按 `V{seq}__{description}.sql` 命名

```rust
let msg = sqlx::query_as!(
    Message,
    r#"SELECT * FROM messages
       WHERE tenant_id = $tenant_id
       AND channel_id = $channel_id
       AND sequence > $since
       ORDER BY sequence ASC
       LIMIT $limit"#,
    tenant_id = tenant_id.as_uuid(),
    channel_id = channel_id.as_uuid(),
    since = since,
    limit = limit,
)
.fetch_all(&pool)
.await?;
```

### 日志与追踪

- 使用 `tracing` crate（非 `log`）进行结构化日志
- 跨服务请求必须传递 `correlation_id`（从请求 header 提取或生成）
- span 层级：`request` → `operation` → `db_query` / `external_call`

```rust
#[tracing::instrument(skip(pool), fields(tenant_id = %tenant_id, channel_id = %channel_id))]
async fn get_messages(pool: &PgPool, tenant_id: Uuid, channel_id: Uuid) -> Result<Vec<Message>> {
    // ...
}
```

### 序列化

- 使用 `serde` + `serde_json`，JSON 字段 Rust 侧 `snake_case` 映射到 JSON 侧 `camelCase`
- API 请求/响应结构体使用 `#[serde(rename_all = "camelCase")]`
- 数据库存储的 JSONB 字段使用同一序列化策略

### API 文档

- 所有公共 trait 和函数必须有 `///` 文档注释
- `pub` 模块必须有 `//!` 模块级文档
- 文档使用中文（项目语言），技术术语保留英文

## Flutter 规范

### 状态管理

- 使用 Riverpod 作为统一状态管理方案
- Provider 命名：`{功能}Provider`（如 `channelListProvider`、`messageProvider`）
- Repository 层不持有状态，Provider 持有并通过 Repository 获取数据

### Repository 模式

- 每个数据源（Remote / Local）实现同一 Repository 接口
- Provider 通过 Repository 接口获取数据，不直接依赖数据源
- 离线场景：优先返回本地缓存，后台更新远程数据

### 平台隔离

- 平台差异通过 `PlatformCapabilities` 抽象层处理
- 禁止在功能模块中直接使用 `Platform.isIOS` 或 `Platform.isAndroid`
- 平台特有功能（通知、文件选择器、深链）通过依赖注入注册

### 路由

- 使用 `go_router`，路由定义集中在 `lib/app/routes.dart`
- 路由路径采用 `/{feature}/{subfeature}` 格式（如 `/im/channel/:id`）

## Commit 规范

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]
```

| type | 含义 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构（无功能变化） |
| `docs` | 文档变更 |
| `test` | 测试变更 |
| `chore` | 构建、CI、依赖等杂项 |

**Scope** 示例：`collab`、`vta`、`agent-server`、`wen`、`protocol`、`flutter`、`admin`

### 示例

```
feat(collab): add message marker update API for Agent Server

implements PUT /api/v1/messages/{id}/markers with version-based conflict detection.
Agent Server can now write back intent and work_context_id.
```

## 代码审查

### 审查要求

- 所有合入 main 的 PR 必须至少 1 人审批（vibecoding 阶段可由 AI Agent 交叉审查）
- PR 必须通过 CI（lint + test + build）后才能合并
- 涉及协议变更的 PR 必须同时更新对应的协议文档

### 审查关注点

- `tenant_id` 是否在所有查询中正确过滤
- 错误处理是否向用户泄露内部信息
- 公共 API 变更是否有文档同步更新
- 权限检查是否被绕过

### 不纳入的规范

以下内容不在此规范中定义，由各团队/轨道自行维护：
- 分支策略（Git Flow / Trunk-based 等）
- CI/CD 的具体流水线配置
- 代码所有者的分配
- 发布流程和版本号管理

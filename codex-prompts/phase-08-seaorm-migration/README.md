# Phase 8：SeaORM 迁移全面完成

> **开始前请先读取**：`CONTEXT.md`、`PREFLIGHT.md`（全局项目上下文与约束）和 `.env-context`（路径变量）。

## 阶段概览

Phase 8 完成 Phase 4 生态迁移中未竟的 SeaORM 全面切换：补全缺失的 Entity 定义、将所有 runtime 查询从 sqlx 动态 SQL 迁移到 SeaORM 类型安全查询、消除三种 schema 来源并存的问题。

| 单元 ID | 说明 |
|---------|------|
| U-8.1 | 补全 7 个 Entity → 重写 11 个 collab-server store → 重写 3 个 agent-server store → 清理 raw SQL 和死代码 |

## 单元清单

| 序号 | 单元 ID | Prompt 文件 | 依赖 |
|------|---------|------------|------|
| 1 | U-8.1 | [U-8.1-seaorm-migration-completion.md](units/U-8.1-seaorm-migration-completion.md) | Phase 6 全部 |

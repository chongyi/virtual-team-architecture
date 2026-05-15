# U-X2.1 Workspace 与 CI 基线

## 目标 (Goal)

在 monorepo 中建立 CI 基线和 workspace 质量门禁：GitHub Actions（或 GitLab CI）workflow 配置、Rust workspace 全量构建/测试/lint、Flutter analyze/test、SQL 迁移自动化，确保从 Phase 2 开始所有轨道都有可执行的 CI 检查。

## 上下文 (Context)

- 前置：Phase 2 全部功能单元完成
- 本单元属于：Phase 2 → U-X2 基础质量 gate

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| .github/workflows/ci.yml | create | Rust + Flutter CI pipeline |
| .github/workflows/migration-check.yml | create | SQL 迁移检查 |
| scripts/ci-check.sh | create | 本地 CI 模拟脚本 |

## 约束 (Constraints)

- CI 必须包含：`cargo build`、`cargo test`、`cargo fmt --check`、`cargo clippy -- -D warnings`
- Flutter CI：`flutter analyze`、`flutter test`
- 迁移检查：`sqlx migrate run --dry-run`

## 完成条件 (Done When)

- [ ] CI workflow 在所有 PR/commit 上触发
- [ ] Rust workspace 全量编译通过
- [ ] `cargo test` 全量通过
- [ ] `cargo fmt --check` 全量通过
- [ ] `cargo clippy` 零 warning
- [ ] Flutter analyze 通过
- [ ] `flutter test` 通过
- [ ] SQL 迁移可 dry-run 执行

### 提交标准

- [ ] `chore(ci): add monorepo CI baseline for Rust and Flutter`

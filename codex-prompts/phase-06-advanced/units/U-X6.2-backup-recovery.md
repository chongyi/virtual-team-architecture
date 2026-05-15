# U-X6.2 数据备份恢复与部署基线

## 目标 (Goal)

建立数据备份恢复最小闭环（PostgreSQL pg_dump 自动备份 + 恢复演练）、Docker 部署基线（docker-compose 一键启动全系统）、基本健康检查。

## 上下文 (Context)

- 前置：U-X6.1（Prometheus 与压测完成）
- 设计文档：`16-technical-specs/deployment-architecture.md`

## 约束 (Constraints)

备份脚本 + docker-compose 为开发/测试环境基线，生产环境另议。

## 完成条件 (Done When)

- [ ] PostgreSQL 自动备份脚本（pg_dump，cron 每日）
- [ ] 恢复演练：从备份文件恢复到新 PG 实例 → 数据一致性验证
- [ ] docker-compose.yml 可一键启动全系统：collab-server + agent-server + WEN + PG + Redis + MinIO
- [ ] 所有服务健康检查集成到 docker-compose（depends_on + healthcheck）
- [ ] Docker 镜像构建脚本（Dockerfile × 3）

### 提交标准

- [ ] `feat(ops): add backup/recovery and Docker deployment baseline`

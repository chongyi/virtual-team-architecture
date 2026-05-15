# U-C4.2 云端托管

## 目标 (Goal)

实现 WEN 云端托管版本：支持在云服务器（如 AWS EC2 / 阿里云 ECS）上部署 WEN、远程注册到 Agent 服务器、云端沙盒环境（Docker 容器隔离）、自动扩缩容，使得用户不需要本地机器即可拥有工作环境。

## 上下文 (Context)

- 前置：U-C4.1（第三方 Agent）
- 设计文档：`09-work-environment-node.md`（云端托管部分）

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/cloud/mod.rs | create | 云端部署模式 |
| docker/wen-client.Dockerfile | create | WEN Docker 镜像 |
| docker/docker-compose.cloud.yml | create | 云端部署编排 |

## 约束 (Constraints)

详见 CONTEXT.md。隔离级别提升为 container（Docker），使用 Docker API 管理容器。

## 完成条件 (Done When)

- [ ] Dockerfile 可构建 WEN 镜像
- [ ] 云端 WEN 启动后自动注册到远程 Agent 服务器
- [ ] 每个 VE 分配独立 Docker 容器（或共享容器 + 文件隔离）
- [ ] Docker 容器有资源限制（CPU、内存、磁盘）
- [ ] `docker-compose -f docker-compose.cloud.yml up` 可启动完整云端环境

### 提交标准

- [ ] `feat(wen): add cloud-hosted deployment with Docker container isolation`

# U-M2.1 M2 里程碑基础就绪验收

## 目标 (Goal)

对 M2 里程碑（VTA 稳定 API + IM 服务端可部署 + WEN 可连接）进行端到端集成验收：验证 VTA 核心接口可用于其他轨道、协作应用服务端可独立部署运行、WEN 可注册并维持心跳。

## 上下文 (Context)

- 前置：Phase 3 全部功能单元完成（A3.3 + B3.4 + G-X2）
- M2 = A3（VTA 完整对话）+ B1（IM 服务端，Phase 1）+ C1（WEN 骨架，Phase 1）

## 约束 (Constraints)

- 验收测试不修改功能代码，只编写测试并报告
- 发现的阻塞性问题必须先修复再通过验收

## 完成条件 (Done When)

- [ ] VTA API：`vta-core` 所有 trait 方法签名的文档测试通过
- [ ] VTA 对话：Agent 可执行 3 轮以上对话，SQLite 持久化可恢复
- [ ] IM 服务端：`docker-compose up` → 服务启动 → WebSocket + REST 全端点正常
- [ ] WEN 连接：启动 WEN → 注册成功 → 心跳持续 → 停止后 Agent 服务器感知离线
- [ ] 跨组件：VTA host + collab-server + Agent 服务器 mock 三个进程同时运行无端口冲突
- [ ] 所有集成测试通过

### 提交标准

- [ ] `test: add M2 milestone acceptance end-to-end tests`

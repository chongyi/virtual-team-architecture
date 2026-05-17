# U-X6.3 i18n 基础与移动端最小构建验收

## 目标 (Goal)

公测版最终加固：i18n 基础（中/英双语）、移动端构建验收、Phase 4-5 运维债务修复（Agent Server WebSocket 并发、热池后台协程、认证中间件、优雅关闭）。

## 上下文 (Context)

- 前置：U-X6.2（备份恢复完成）
- 设计文档：`16-technical-specs/non-functional-requirements.md`、`12-security-and-isolation.md`

## 约束 (Constraints)

i18n 覆盖服务端错误消息 + Flutter UI 字符串。不要求完整翻译，只要求 key 体系和示例覆盖。
运维修复不破坏已有测试。

## 完成条件 (Done When)

### i18n 与移动端

- [ ] 服务端错误消息统一使用 i18n key（中文默认）
- [ ] Flutter UI 字符串提取到 ARB 文件
- [ ] 中/英双语切换可在设置中切换
- [ ] `flutter build ios --no-codesign` 成功
- [ ] `flutter build apk` 成功
- [ ] 数据保留策略文档（明确各环境数据保留期限）

### Phase 4-5 运维债务修复

- [ ] **Agent Server WebSocket 并发**：`/ws` handler 改为每个消息 spawn 独立 task，不再串行阻塞
- [ ] **热池后台维护协程**：Agent Server 启动时 spawn 周期性降级检查 task（默认每 60s 执行一次 `demote_idle_hot_instances`）
- [ ] **Agent Server 认证中间件**：`/rpc` 和 `/ws` 端点验证 `Authorization: Bearer <api_key>`，无有效 key 返回 401
- [ ] **vta-host 优雅关闭**：`HostProcessManager.stop()` 先发 SIGTERM，等待 5s，再 SIGKILL
- [ ] **节点注册表持久化**：WEN 节点注册信息写入 PostgreSQL（新建 `wen_nodes` 表），Agent Server 重启后自动恢复已知节点

### 提交标准

- [ ] `feat(core): add i18n foundation, mobile build verification, and operational hardening`

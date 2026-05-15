# U-C4.1 第三方 Agent 集成

## 目标 (Goal)

在 WEN 中集成第三方 Agent（Claude Code、Codex 等），使 VE 可以将子任务委派给第三方 Agent 在 WEN 本地执行，第三方 Agent 以子进程方式运行。

## 上下文 (Context)

- 前置：U-C3.3（多 VE 共享）
- 设计文档：`09-work-environment-node.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/agent/mod.rs | create | 第三方 Agent 管理 |
| crates/wen-client/src/agent/codex.rs | create | Codex Agent 适配器 |
| crates/wen-client/src/agent/claude_code.rs | create | Claude Code Agent 适配器 |

## 约束 (Constraints)

详见 CONTEXT.md。Agent 以子进程方式运行，通过 Agent 协议与 WEN 通信。

## 完成条件 (Done When)

- [ ] 第三方 Agent 注册（声明支持的能力）
- [ ] Codex Agent 适配器（启动 `codex exec` 并捕获结果）
- [ ] Claude Code Agent 适配器（启动 `claude` CLI 并捕获结果）
- [ ] Agent 运行在 WEN 沙盒内（继承文件系统隔离）
- [ ] `cargo test -p vt-wen-client` 全部通过

### 提交标准

- [ ] `feat(wen): add third-party agent integration with Codex and Claude Code adapters`

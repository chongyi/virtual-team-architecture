# U-C2.2 内置工具实现

## 目标 (Goal)

在 WEN 中实现一套内置工具：文件读写（沙盒约束内）、Shell 命令执行（白名单 + 沙盒）、HTTP 网络请求（可选域名白名单），使得 WEN 可以在不必连接外部 MCP Server 的情况下提供基础工具能力。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-C2.1（MCP Server 集成）
- 本单元属于：Phase 2 → G-C2 → 轨道 C → 服务/逻辑层

### 相关设计文档

- `virtual-team/src/09-work-environment-node.md`
- `virtual-team/src/08-vte-agent-internals/tool-system.md`

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/tools/mod.rs | create | 工具模块入口 |
| crates/wen-client/src/tools/builtin/fs.rs | create | 文件操作工具（read、write、list、delete） |
| crates/wen-client/src/tools/builtin/shell.rs | create | Shell 执行工具 |
| crates/wen-client/src/tools/builtin/http.rs | create | HTTP 请求工具 |
| crates/wen-client/src/tools/registry.rs | create | 内置工具注册表 |
| crates/wen-client/src/tools/dispatch.rs | create | 工具分发器（内置/MCP 统一路由） |

### 协议边界

无新增协议边界。

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元特殊约束：
- 所有内置工具必须在 U-C1.2 建立的沙盒约束内运行
- Shell 命令白名单，不接受任意命令字符串
- HTTP 工具默认只允许 localhost 和配置的域名白名单

## 完成条件 (Done When)

### 必须满足

- [ ] 文件操作工具：read、write、list_dir、delete（均受沙盒路径约束）
- [ ] Shell 工具：执行白名单命令（ls、cat、grep、find、echo、wc 等），返回 stdout/stderr/exit_code
- [ ] HTTP 工具：GET/POST 请求（域名白名单限制、超时 30s、最大响应体 1MB）
- [ ] 工具分发器可按工具来源（builtin/MCP）正确路由
- [ ] `cargo test -p vt-wen-client` 全部通过

### 质量门禁

- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 所有内置工具有单元测试

### 提交标准

- [ ] `feat(wen): add built-in tools (filesystem, shell, http) with sandbox enforcement`

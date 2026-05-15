# U-C1.2 沙盒环境基础

## 目标 (Goal)

在 `vt-wen-client` 中实现工作环境节点的沙盒环境基础：文件系统隔离（每个 VE 独立工作目录 + 路径白名单）、进程隔离（子进程管理、超时控制、资源限制）、安全命令执行，使得 WEN 可以在受限沙盒中安全执行文件和 Shell 操作。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-C1.1（WEN 客户端骨架与注册心跳）
- 本单元属于：Phase 1 → G-C1（工作环境客户端骨架） → 轨道 C → 服务/逻辑层

### 相关设计文档

- `virtual-team/src/09-work-environment-node.md`：WEN 沙盒架构（三层隔离级别：none / process / container）、文件系统隔离策略、进程管理模式
- `virtual-team/src/12-security-and-isolation.md`：沙盒安全约束、命令注入防护、路径穿越防护
- `virtual-team/src/virtual-employee-system/technical-design/reliability-and-observability.md`：工具执行超时、资源监控

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/sandbox/mod.rs | create | 沙盒模块入口 |
| crates/wen-client/src/sandbox/fs.rs | create | 文件系统隔离（VE 工作目录创建、路径白名单验证、读写操作封装） |
| crates/wen-client/src/sandbox/process.rs | create | 进程隔离（子进程启动、stdout/stderr 捕获、超时终止、资源限制） |
| crates/wen-client/src/sandbox/policy.rs | create | 沙盒策略（允许/禁止的操作类型、路径模式、命令白名单） |
| crates/wen-client/src/sandbox/error.rs | create | 沙盒错误类型（PathTraversal、CommandDenied、Timeout、ExecutionFailed） |
| crates/wen-client/src/sandbox/work_dir.rs | create | VE 工作目录管理（创建、清理、多 VE 隔离） |

### 协议边界

无新增协议边界。本单元为 WEN 内部实现，不涉及跨轨道通信。

## 约束 (Constraints)

### 全局规范

详见 `CONTEXT.md`。

### 本单元特殊约束

1. **文件系统隔离**：
   - 每个 VE 有独立工作目录：`{sandbox_root}/{ve_id}/work/`
   - 所有文件操作路径必须规范化（canonicalize）后验证在工作目录范围内
   - 路径穿越攻击（`../../../etc/passwd`）必须在规范化后被拒绝
   - 允许的操作：读文件、写文件、创建目录、列目录、删除文件
   - 禁止：符号链接跟踪到工作目录外、修改文件权限、读取 `.env` 等敏感文件
2. **进程隔离**：
   - 子进程在 VE 工作目录中启动
   - 默认超时 30 秒（可配置），超时后先 SIGTERM，5 秒后 SIGKILL
   - 捕获 stdout 和 stderr（限制最多 1MB 输出），stderr 不为空则作为 warning 记录
   - 资源限制：最大内存 512MB（Linux cgroups / macOS RLIMIT）、最大 CPU 时间 60 秒
3. **命令安全**：
   - 不允许 shell 注入：不接受 shell 字符串，使用命令 + 参数列表模式（`Command::new("ls").arg("-la")`）
   - 命令白名单：允许的文件操作命令（ls、cat、head、tail、wc、grep、find、echo）和脚本执行
   - 禁止：rm -rf /、curl/wget（网络访问）、sudo、chmod、chown
4. **隔离级别**：本单元仅实现 `process` 级别（macOS 用 sandbox-exec / Linux 用 bubblewrap 准备但不要求完整，可先以进程级隔离为主）
5. **不在本单元实现**：MCP 工具集成（Phase 2）、多 VE 共享同一节点的高级隔离（Phase 5）

## 完成条件 (Done When)

### 必须满足

- [ ] VE 工作目录自动创建：`mkdir -p {sandbox_root}/{ve_id}/work/`
- [ ] 文件读取操作被限制在工作目录内，路径穿越被拒绝（返回 PathTraversal 错误）
- [ ] 子进程可正常启动并捕获 stdout/stderr
- [ ] 子进程超时自动终止（SIGTERM → 等 5s → SIGKILL）
- [ ] stdout/stderr 输出超过 1MB 时截断并记录 warning
- [ ] 危险命令（sudo、rm -rf /、curl 等）被命令白名单拒绝
- [ ] 沙盒策略支持选择性开启/关闭特定操作类型
- [ ] 所有沙盒操作有 tracing span（含 ve_id、operation、duration）

### 质量门禁

- [ ] `cargo build -p vt-wen-client` 编译通过
- [ ] `cargo test -p vt-wen-client` 全部通过
- [ ] 测试覆盖：
  - 路径穿越攻击被拒绝（`../`、绝对路径、符号链接）
  - 子进程正常执行并捕获输出
  - 子进程超时被终止
  - 危险命令被拒绝
  - 多 VE 工作目录隔离（VE-A 无法访问 VE-B 的文件）
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 所有沙盒错误类型实现 Display + std::error::Error

### 提交标准

- [ ] 一个逻辑完整的 commit：`feat(wen): add sandbox environment with filesystem and process isolation`

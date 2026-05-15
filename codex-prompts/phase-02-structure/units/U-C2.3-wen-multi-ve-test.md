# U-C2.3 多 VE 隔离与本地工具测试

## 目标 (Goal)

在 WEN 中实现文件系统级别的多 VE 隔离（不同 VE 的工作目录完全独立，无法互相访问），编写本地工具测试（使用模拟 VE 调用验证所有工具链），确保 WEN 可以安全地同时为多个 VE 提供服务。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-C2.2（内置工具实现）
- 本单元属于：Phase 2 → G-C2 → 轨道 C → 接口/集成层

### 相关设计文档

- `virtual-team/src/09-work-environment-node.md`
- `virtual-team/src/12-security-and-isolation.md`

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/sandbox/ve_isolation.rs | create | VE 隔离管理（VE ID → 工作目录映射、跨 VE 访问校验） |
| crates/wen-client/tests/ | create | 集成测试目录 |
| crates/wen-client/tests/tool_integration.rs | create | 工具集成测试（模拟 VE 调用） |
| crates/wen-client/tests/multi_ve_isolation.rs | create | 多 VE 隔离测试 |

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元特殊约束：
- 多 VE 文件隔离是安全硬要求，测试必须严格覆盖
- 模拟 VE 调用通过构造 ToolCallRequest + sandbox 上下文，不需要实际 Agent

## 完成条件 (Done When)

### 必须满足

- [ ] VE-A 无法读取 VE-B 的工作目录文件
- [ ] VE-A 无法写入 VE-B 的工作目录
- [ ] VE 清理：工作目录可被正确清理（不影响其他 VE）
- [ ] 集成测试：模拟 VE 调用文件读写工具 → 正确执行
- [ ] 集成测试：模拟 VE 调用 Shell 工具 → 正确执行
- [ ] 集成测试：模拟 VE 调用 MCP 工具 → 正确执行
- [ ] `cargo test -p vt-wen-client` 全部通过

### 质量门禁

- [ ] 多 VE 隔离测试有专门测试文件
- [ ] `cargo fmt` + `cargo clippy` 无新增 warning

### 提交标准

- [ ] `feat(wen): add multi-VE isolation and local tool integration tests`

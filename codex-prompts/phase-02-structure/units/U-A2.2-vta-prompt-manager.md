# U-A2.2 PromptManager 与配置包基础加载

## 目标 (Goal)

实现 `PromptManager` trait 和基于配置包的基础加载——从文件系统目录中读取 Agent 配置（agent.toml + system_prompt.hbs），使用 handlebars 渲染 system prompt，使得 Agent 的行为可通过配置包定义而非硬编码。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-A2.1（Message/Part 类型完善）
- 本单元属于：Phase 2 → G-A2（VTA 结构收敛） → 轨道 A → 服务/逻辑层

### 相关设计文档

- `virtual-team/src/08-vte-agent-internals/config-package.md`：配置包完整文件结构、字段定义、验证规则
- `virtual-team/src/08-vte-agent-internals/runtime-config-and-data.md`：静态 Config vs 动态 Data 的分离
- `virtual-team/src/08-vte-agent-internals/agent-architecture.md`：AgentProfile 与 PromptManager 的关系

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/prompt/Cargo.toml | create | 新建 prompt crate |
| crates/vta/prompt/src/lib.rs | create | PromptManager trait + HbsPromptManager |
| crates/vta/prompt/src/loader.rs | create | 配置包文件系统加载器 |
| crates/vta/prompt/src/template.rs | create | handlebars 模板渲染 |
| crates/vta/core/src/types.rs | modify | 完善 AgentProfile 中 prompt_policy 字段的类型 |
| configs/agent-package-example/ | create | 示例配置包（agent.toml + system_prompt.hbs） |

### 协议边界

无新增协议边界。

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元特殊约束：
- 配置包由配置文件夹承载，不嵌入代码。文件夹结构：`agent.toml` + `system_prompt.hbs` + `tools.toml`
- handlebars 模板变量由 AgentProfile + Session 上下文注入

## 完成条件 (Done When)

### 必须满足

- [ ] PromptManager trait 含 `build_system_prompt(profile, session) -> Result<String>` 方法
- [ ] HbsPromptManager 从目录加载 agent.toml + system_prompt.hbs
- [ ] handlebars 渲染支持注入变量：agent_name、user_name、current_time
- [ ] 配置包加载失败有明确的错误信息（文件不存在、TOML 解析失败、模板语法错误）
- [ ] 示例配置包放在 `configs/agent-package-example/`
- [ ] `cargo build -p vta-prompt` 通过
- [ ] `cargo test -p vta-prompt` 全部通过

### 质量门禁

- [ ] `cargo fmt` + `cargo clippy` 无新增 warning
- [ ] 所有公共类型有文档注释
- [ ] 配置包加载有 tracing span

### 提交标准

- [ ] `feat(vta): add PromptManager with config-package file loading and handlebars rendering`

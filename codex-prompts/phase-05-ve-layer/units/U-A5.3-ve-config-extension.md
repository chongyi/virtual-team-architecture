# U-A5.3 配置包高阶扩展

## 目标 (Goal)

完善 VE 配置包系统：tools.toml（工具声明与权限）、skills.toml（技能编排）、runtime.toml（运行时行为参数），实现配置包完整验证（schema 校验），使管理员可以通过修改配置文件来定制 VE 行为。

## 上下文 (Context)

- 前置：U-A5.2（工作上下文完成）
- 设计文档：`08-vte-agent-internals/config-package.md`、`08-vte-agent-internals/runtime-config-and-data.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/prompt/src/package.rs | modify | 配置包解析扩展（tools.toml、skills.toml、runtime.toml） |
| crates/vta/prompt/src/validator.rs | create | 配置包 schema 校验 |
| configs/agent-package-example/ | modify | 补充 tools.toml、skills.toml、runtime.toml 示例 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 配置包完整结构：agent.toml + system_prompt.hbs + tools.toml + skills.toml + runtime.toml
- 校验失败返回具体错误位置（文件名 + 行号 + 字段名 + 错误原因）

## 完成条件 (Done When)

- [ ] 配置包解析支持全部 5 个文件
- [ ] tools.toml：声明可用工具名、权限级别（full/restricted/approval_required）
- [ ] skills.toml：技能编排（多技能 pipeline）
- [ ] runtime.toml：max_turns、timeout_seconds、max_tool_calls_per_turn
- [ ] schema 校验：所有必填字段验证、类型验证
- [ ] `cargo test -p vta-prompt` 全部通过

### 提交标准

- [ ] `feat(vta): add config package extension with tools, skills, runtime and schema validation`

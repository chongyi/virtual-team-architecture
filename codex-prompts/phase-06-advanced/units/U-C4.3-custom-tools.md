# U-C4.3 专属工具定制

## 目标 (Goal)

实现专属工具定制能力：管理员可在 WEN 上注册自定义工具（通过配置文件声明 + 脚本/二进制路径）、自定义工具自动出现在 VE 的 visible_tools 中、工具权限细粒度控制，使企业可以定制 WEN 专属的能力。

## 上下文 (Context)

- 前置：U-C4.2（云端托管）
- 设计文档：`09-work-environment-node.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/wen-client/src/tools/custom.rs | create | 自定义工具管理 |
| crates/wen-client/src/tools/custom_registry.rs | create | 自定义工具注册表 |
| configs/wen-custom-tools.example.toml | create | 自定义工具配置示例 |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] 自定义工具通过 TOML 文件声明（名称、命令路径、参数 schema、权限级别）
- [ ] 自定义工具加载后自动注册到能力声明
- [ ] VE 配置包 tools.toml 可引用自定义工具
- [ ] 自定义工具执行受沙盒约束
- [ ] 工具输入/输出的 JSON Schema 校验

### 提交标准

- [ ] `feat(wen): add custom tool registration with declarative configuration`

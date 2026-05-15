# U-A2.3 VTA API 接口冻结与测试覆盖

## 目标 (Goal)

冻结 VTA 核心 API：补充 vta-core 中所有 trait 和类型的完整文档和单元测试，确保 API 稳定性和测试覆盖率达到可被其他轨道安全依赖的水平，输出一份冻结接口清单。

## 上下文 (Context)

### 前置条件

- 已完成单元：U-A2.2（PromptManager 与配置包基础加载）
- 本单元属于：Phase 2 → G-A2（VTA 结构收敛） → 轨道 A → 接口/集成层

### 相关设计文档

- `virtual-team/src/virtual-employee-system/technical-design/api-and-protocol.md`
- `virtual-team/src/08-vte-agent-internals/agent-architecture.md`

### 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/vta/core/src/*.rs | modify | 补充所有公共 API 的完整文档和单元测试 |
| crates/vta/core/tests/ | create | 集成测试 |
| vta-api-freeze.md | create | 冻结接口清单文档 |
| crates/vta/store/src/*.rs | modify | Store trait 文档完善与测试 |

### 协议边界

- 协议名称：VTA 核心 trait 接口
- 本次为冻结确认：整理所有已冻结接口的最终签名和文档

## 约束 (Constraints)

详见 `CONTEXT.md`。本单元特殊约束：
- 冻结意味着后续单元的接口签名不能随意修改，如需修改必须同步更新冻结文档

## 完成条件 (Done When)

### 必须满足

- [ ] 所有 vta-core trait 方法有完整 `///` 文档（含参数说明、返回值说明、错误类型）
- [ ] 所有 vta-store trait 方法有完整 `///` 文档
- [ ] vta-core 单元测试覆盖率 ≥ 80%（类型构造、序列化、状态转换）
- [ ] vta-store-memory 测试覆盖率 ≥ 80%
- [ ] 冻结接口清单文档列出所有 trait、方法签名、类型定义
- [ ] `cargo test` workspace 全部通过
- [ ] 无 `todo!()` 或 `unimplemented!()` 宏残留

### 质量门禁

- [ ] `cargo clippy` 无 warning
- [ ] 冻结清单文档与代码一致

### 提交标准

- [ ] `feat(vta): freeze VTA core API with full documentation and test coverage`

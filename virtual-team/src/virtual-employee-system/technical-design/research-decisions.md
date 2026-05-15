# 虚拟员工系统调研结论与设计决策

## 调研范围

VE 系统的设计决策覆盖以下方向：

- VTA Agent Runtime 的抽象边界
- Session 与 WorkContext 的映射关系
- Compaction / 上下文压缩策略
- 模型选择与降级链
- 沙箱隔离选择
- 内部协议选择（JSON-RPC vs gRPC）
- 子 Agent 的调度模型

调研文档位于 `research/` 目录，本文是调研结论的冻结摘要。

## 核心设计决策

### 1. Pure Agent 原则

**决策**：VTA Runtime 零预设 prompt、零内置工具、零默认技能。所有能力通过配置包注入。

**理由**：
- 避免"万能 Agent"幻觉——一个没有明确边界的 Agent 倾向于处理一切请求，导致误操作或低质量输出
- 配置包是文件资产，可版本控制、代码审查、CI/CD 部署
- 与"现实拟合"一致——新员工入职时不会自带公司知识，需要培训和配置

**不做**：不为特定场景（如"编码助手"）提供硬编码的能力预设。

### 2. Trait 分派 vs Enum 分派

**决策**：VTA 的核心抽象（AgentLoop、PromptManager、MessageStore、ModelSelector、ToolExecutor）使用 Rust trait 定义，通过 `Arc<dyn Trait>` 或泛型注入。不使用 enum 穷举所有变体。

**理由**：
- trait 支持第三方实现（远期配置包市场开放后，第三方可提供定制 PromptManager 或 ModelSelector）
- 调用方只依赖 trait 接口，不依赖具体类型——天然满足依赖倒置
- enum 分派需要修改核心 crate，破坏 OCP（开闭原则）

**constraint**：VTA 核心 trait 接口必须保持最小化——每个 trait 3-5 个方法。新增方法必须评估是否可归入已有 trait。

### 3. Session 与 WorkContext 映射

**决策**：一个 WorkContext 可以包含多个 VTA Session（1:N）。WorkContext 是 VE 层的概念，VTA Session 是 Runtime 层的概念。

**理由**：
- WorkContext 的生命周期与"用户任务"绑定（可能跨多个 Session —— 如 Compaction 触发 Session 重建）
- VTA Session 的生命周期与 LLM 对话历史绑定（受上下文窗口限制）
- 分离两者的关注点：WorkContext 管"在做什么任务"，VTA Session 管"怎么和 LLM 交互"
- Resume 时创建新 VTA Session 但复用同一 WorkContext

**不做**：不在 VTA Session 层引入 WorkContext 概念。VTA 不感知 WorkContext。

### 4. Compaction 策略

**决策**：基础版使用"结构化摘要 + 产物引用"的 Compaction 策略，触发条件为 Token 超过模型上下文窗口的 80%。完整形态方向探索基于 LLM 的渐进式摘要和基于意图的压缩裁剪。

**理由**：
- 结构化摘要（JSON）比纯文本摘要更适合 Agent 恢复工作——Agent 可以精确获取"已完成什么、当前在哪步、剩余什么"
- 上下文窗口 80% 触发在多数 LLM provider 中有明确的 API 返回值，不需要手动估算
- 完整形态的"渐进式摘要"复杂度较高，基础版先验证核心链路

**不做**：基础版不实现基于 LLM 的增量摘要（每次 Turn 都重新摘要）；基础版不引入外部向量数据库用于"长记忆"——远期通过 Runtime Data 的 memories 字段满足。

### 5. JSON-RPC vs gRPC for Internal Protocol

**决策**：VE 系统内部（Agent 服务器 ↔ VE Runner）使用 JSON-RPC 2.0 over WebSocket，不使用 gRPC。

**理由**：
- 与对接协议（协作应用 ↔ Agent 服务器）协议栈一致，减少协议转换层
- VE Runner 可能在本地运行（不需要 gRPC 的二进制效率优势），且消息体较小（几 KB 的 JSON）
- WebSocket 全双工，适合"管理服务 → VE Runner"的主动推送（如 `suspend`、`destroy`）
- 调试友好——JSON 明文比 protobuf 更容易排查问题

**不做**：不引入 protobuf 或 gRPC toolchain，不引入 schema registry。

### 6. 沙箱隔离分级

**决策**：三级别隔离（None / Process / Container），基础版只实现 Process 级别。

**理由**：
- Process 级别（独立 UID/GID + 文件系统权限）满足本地工作环境的生产安全需求
- Container 级别增加 Docker/Podman 依赖和运维复杂度，远期根据企业版需求引入
- None 级别留给开发/测试场景，降低本地调试门槛

**不做**：不实现 VM 级隔离；不在基础版引入 Docker SDK 依赖。

### 7. 子 Agent 调度

**决策**：基础版不实现子 Agent 动态创建。主 Agent 自行执行所有工作。子 Agent 属于完整形态方向。

**理由**：
- 子 Agent 的正确调度需要资源管理、任务队列、结果合并等基础设施
- 基础版验证"单 VE 单线程工作"的核心链路已足够复杂
- 子 Agent 的架构设计（配置覆盖、结果回传、隔离策略）已在设计文档中预留，不影响基础版架构

**不做**：基础版不引入子 Agent 的概念到代码中，但数据模型中预留 `parent_work_context_id` 和 `total_sub_agents` 字段。

### 8. 状态持久化双轨模型

**决策**（ADR-003）：EventStore + MessageStore 双轨。

**理由**：
- EventStore（已有）：不可变事件流，仅追加，用于审计、重放、调试。为审计而优化。已有成熟实现。
- MessageStore（新增）：高效消息查询，支持压缩替换（`replace_messages`），专为 AgentLoop 每轮构建上下文优化。
- 双轨间的最终一致性通过 Turn 生命周期事件保证——kernel.complete_turn() / fail_turn() 触发事件，消费方据此同步。
- 避免单一数据模型在两个不同需求间折衷。

**不做**：不在 EventStore 之上构建 AgentLoop（查询效率不足）；不在 MessageStore 中保留不可变审计（应当用 EventStore）。

### 9. Prompt 管理独立归属

**决策**（ADR-007）：在 `runtime-agent` 中创建独立的 `PromptManager`，位于现有 `PromptComposer`/`PromptRenderer` 管线的上游。

**理由**：
- 现有的 `PromptComposer` 在 `runtime-inference` 中，不应依赖文件系统
- PromptManager 负责从配置包目录加载模板、渲染 Handlebars 变量、支持 scene-provider 回退链
- 配置包机制外部化 Agent 角色定制：`manifest.toml` → `prompts/system.md` → `prompts/scenes/{scene_id}.md`
- 支持多租户、A/B 测试和快速迭代而不修改代码

**当前状态**：最小化实现已存在（Phase 1），完整配置包规范 Phase 2。

### 10. 内部传输协议

**决策**（ADR-002）：双传输策略——WebSocket + stdio，都承载 JSON-RPC 2.0。

**理由**：
- WebSocket 服务网络客户端（IDE 插件、Web UI），全双工天然支持审批请求等双向通信
- stdio 服务本地 daemon 进程，aligned with MCP 的 stdio transport
- 传输层抽象（`Transport` trait）使上层协议处理逻辑传输无关
- 使用 JSON-RPC 2.0 而非 gRPC：与对接协议栈一致，减少转换层，调试友好（明文 JSON vs protobuf）

**当前状态**：传输层推迟到 Phase 4 实现。`runtime-protocol` 只定义协议模型，不包含 server。

## 不做事项汇总

| 决策 | 原因 |
|------|------|
| 硬编码内置 prompt 或工具 | 破坏 Pure Agent 原则 |
| VTA 感知 WorkContext | 职责分离——VTA 只管 Session/Turn |
| 增量 Compaction | 基础版优先验证结构化摘要链路 |
| gRPC / Protobuf | 与 JSON-RPC 2.0 协议栈不一致，增加复杂度 |
| Container 级沙箱（基础版） | 运维复杂度，Process 级已满足安全需求 |
| 子 Agent（基础版） | 基础设施复杂度，先验证单 VE 核心链路 |
| 多模型 provider 自动 failover（基础版） | 降级链手动选择已满足基础可用性 |
| 外部向量数据库 | Runtime Data memories 字段已满足基础版记忆需求 |
| EventStore 作为 AgentLoop 主数据源 | 查询效率不适合每轮上下文构建，应由 MessageStore 承担 |

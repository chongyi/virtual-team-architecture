# Virtual Teams Agent Phase 1-2 冻结版主实施计划

> 状态：冻结候选版  
> 范围：只覆盖 `Phase 1-2` 的实现级方案；`Phase 3-4` 仅保留接口与里程碑边界

## 0. 文档角色

本文件是 `frozen-plan/` 的主计划文档，只负责三件事：

- 定义 `Phase 1-2` 的总体目标
- 固定阶段边界与依赖顺序
- 给后续阶段执行提供统一的验收口径

本文件不替代子计划文档。进入具体阶段后，应继续阅读：

- `Phase 0`： [baseline-alignment-checklist.md](baseline-alignment-checklist.md)
- `Phase 1`： [phase-1/README.md](phase-1/README.md)
- `Phase 2`： [phase-2/README.md](phase-2/README.md)
- 跨阶段接口： `interfaces/` 下两份冻结说明

## 1. 目标

本轮计划的目标不是重写架构总览，而是把当前代码基线收敛为可直接实现的增量方案。当前基线已经具备：

- `runtime-core / runtime-store / runtime-kernel / runtime-host` 的稳定底座
- `runtime-inference / runtime-inference-rig / runtime-protocol` 的抽象与协议模型
- MCP、plugin、tool、skill 的基础集成能力

当前缺口集中在：

- `runtime-agent` 尚未落地
- `MessageStore` 与消息工作轨尚未落地
- Prompt 配置包管理尚未落地
- Protocol Handler 尚未落地
- transport 仍停留在后续阶段

## 2. 实施原则

- 以现有 crate 为基线增量扩展，不回退到底层重构
- `runtime-kernel` 保持生命周期内核职责，不重新吸收推理循环
- `MessageStore` 从 `Phase 1` 起进入主线，不使用 `EventStore` 临时重建对话历史
- `runtime.turn.run` 保持“立即确认，最终结果通过事件与查询获取”的协议方向
- `Phase 2` 冻结 Protocol Handler 边界，但不进入 WebSocket/stdio transport 实现
- 本目录只负责冻结方案文档；所有真实项目仓库改动都通过阶段实施计划输入文档供后续执行阶段使用

## 3. Phase 0：基线校正门

### 3.1 目标

在进入实现前，先校正文档与职责漂移，避免工程实现阶段仍沿用过期表述。

### 3.2 必做事项

- 统一 `runtime-kernel / runtime-agent / runtime-host / protocol handler / transport` 的职责定义
- 校正所有正式文档中“kernel 驱动推理循环”“host 已具备 transport”的旧表述
- 明确以下边界：
  - `runtime-kernel`：session/turn 生命周期、状态校验、事件追加、审批状态
  - `runtime-agent`：完整推理循环、PromptManager、tool loop、消息工作轨
  - `runtime-host`：唯一 composition root，且在 `Phase 1-2` 内承载 Protocol Handler
  - `protocol handler`：host 内部请求分发与事件桥接，不等于 transport

### 3.3 验收标准

- 正式文档中不再出现“kernel 驱动推理循环”的表述
- 主方案、接口说明、校正清单三者的职责边界一致

## 4. Phase 1：最小可用 Loop

### 4.1 目标

完成单 session、单 turn、无复杂 transport 的最小 agent loop 闭环。

### 4.2 实施项

- 新增 `runtime-agent` crate
  - 定义 `AgentLoop`
  - 定义 `AgentEventSink`
  - 提供最小 loop 实现
- 扩展 `runtime-core`
  - 新增 `Message`
  - 新增 `Part`
  - 新增 `MessageRole`
  - 新增 `PartKind`
  - 新增 `SceneId`
- 扩展 `runtime-store`
  - 新增 `MessageStore`
  - 将 `messages` 门面纳入 `RuntimeStores` 与事务接口
- 扩展 `runtime-store-memory`
  - 实现 `MessageStore`
- 新增最小 `PromptManager`
  - 单配置包
  - 固定目录结构
  - 基础模板解析
  - 基础 scene 路由
  - 不做热更新
  - 不做 provider override
- 扩展 `runtime-host`
  - 组装 `runtime-agent`
  - 暴露最小 turn 执行入口，返回立即确认

### 4.2.1 进入 Phase 1 时应继续阅读

- [phase-1/runtime-agent-minimal-loop.md](phase-1/runtime-agent-minimal-loop.md) — 最小 `runtime-agent` loop、事件下沉与 kernel 收尾路径
- [phase-1/message-store-work-track.md](phase-1/message-store-work-track.md) — `MessageStore`、消息工作轨、memory 路径与事务边界
- [phase-1/prompt-manager-minimal-package.md](phase-1/prompt-manager-minimal-package.md) — 最小配置包、模板解析与 scene 路由

### 4.3 冻结执行路径

`kernel.start_turn -> PromptManager -> PromptComposer -> PromptRenderer -> PromptProjector -> InferenceBackend.execute -> MessageStore 写入 -> kernel.complete_turn/fail_turn`

### 4.4 验收标准

- memory backend 下完成单 session、单 turn 的对话闭环
- `MessageStore` 中可以读到 `user` 与 `assistant` 工作消息
- 失败路径能正确 `fail_turn`
- 事件写入与消息写入保持一致的事务语义

## 5. Phase 2：完整对话能力

### 5.1 目标

在不进入 transport 实现的前提下，冻结完整对话 loop 与内部协议处理边界。

### 5.2 实施项

- 扩展 `runtime-agent`
  - tool call 解析
  - tool execution
  - tool result 回灌消息历史
  - 多轮对话
  - doom loop 基础保护
- 接入审批流程
  - `runtime-agent` 负责识别需要审批的执行点并挂起
  - `runtime-kernel`/store 负责审批状态持久化
  - 恢复执行通过 continuation 机制完成
- 扩展消息双轨到生产路径
  - `runtime-store-sqlite` 增加 `messages` / `parts`
  - migration 同步落地
  - loop 上下文读取全部走 `MessageStore`
- 扩展模型接口
  - `ModelPolicy.fast_selector`
  - `ModelPolicy.scene_selectors`
  - `SceneId` 作为 scene model 路由键
- 预留 sub-agent 数据模型
  - `Session.parent_session_id`
  - `Session.parent_turn_id`
- 冻结 Protocol Handler
  - 放在 `runtime-host` 内
  - 负责 `runtime.turn.run / runtime.turn.get / runtime.turn.cancel / runtime.approval.respond / runtime.event.subscribe`
  - 事件投影继续复用 `runtime-protocol`

### 5.2.1 进入 Phase 2 时应继续阅读

- [phase-2/tool-loop-and-approval-continuation.md](phase-2/tool-loop-and-approval-continuation.md) — tool loop、审批挂起与 continuation 机制
- [phase-2/sqlite-message-store-and-migration.md](phase-2/sqlite-message-store-and-migration.md) — sqlite 消息双轨、`messages/parts` 与 migration
- [phase-2/host-protocol-handler.md](phase-2/host-protocol-handler.md) — host 内部 Protocol Handler、立即确认语义与事件订阅边界

### 5.3 明确后置项

以下能力不纳入本轮实现级冻结：

- WebSocket transport
- stdio transport
- compaction 实现
- sub-agent 执行逻辑
- PromptManager 热更新
- provider override

### 5.4 验收标准

- tool call 可执行并继续 loop
- 审批可挂起、恢复、拒绝
- 多轮上下文完全基于 `MessageStore`
- SQLite migration 后可稳定读写 `messages/parts`
- scene model / fast model 回退链有契约测试

## 6. 测试要求

- `runtime-agent` 单元测试覆盖：
  - loop 状态机
  - tool call 分支
  - 审批挂起与恢复
  - 失败与取消分支
- host 集成测试覆盖：
  - memory 路径
  - sqlite 路径
  - protocol handler 的立即确认语义
- 外部 provider 网络型测试不作为本轮冻结验收门，只作为非阻塞集成验证

## 7. 文档使用约束

- 当前目录只负责冻结方案文档
- 真实项目中的代码、配置、README、测试、migration 等改动，不在当前目录直接执行
- 这类改动统一通过 [implementation-impact-map.md](implementation-impact-map.md) 和阶段子计划文档表达
- 后续阶段执行应以本文件和对应子计划的组合为准，不应跳过 `Phase 0` 校正门

## 8. 默认假设

- 本轮冻结只覆盖 `Phase 1-2`
- `protocol handler` 先落在 `runtime-host`，不新增独立 server crate
- `PromptManager` 采用最小可用配置包方案
- `MessageStore` 从 `Phase 1` 起进入主线
- `virtual-teams-agent/frozen-plan/` 是后续实施冻结文档的唯一正式目录
- 真实项目中的代码、配置、README、测试、migration 等改动不在当前目录直接执行，统一通过 [implementation-impact-map.md](implementation-impact-map.md) 作为后续阶段实施输入

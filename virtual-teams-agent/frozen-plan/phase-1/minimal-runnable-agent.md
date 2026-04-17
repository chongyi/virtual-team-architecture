# Phase 1：最小可运行 Agent

> 用途：冻结新的 `Phase 1` 最小可运行 agent MVP，确保后续执行先交付“能工作”的 agent，而不是先交付结构完备性。

## 1. 目标

交付一个本地/in-process 可运行的最小 agent，使其具备：

- 用户 prompt 输入
- LLM API 调用
- 最小 loop
- tool call 与 tool execution
- 通过 MCP 使用工具
- 输出最终分析结果

## 2. 本阶段必须具备的能力

- 最小 agent 执行入口
- 单 session、本地执行路径
- 进程内临时 history
- 轻量 prompt 组装
- 从模型输出中识别 tool call
- 调用 MCP 工具并把结果回灌到同一条执行链

## 3. 固定控制流

`用户 prompt -> LLM API -> 识别 tool call -> 调用 MCP tool -> 追加 tool result -> 再次请求 LLM -> final answer`

本阶段不要求引入更复杂的状态持久化、审批或协议分发。

## 4. 本阶段固定边界

- history 仅限进程内临时消息历史
- 本阶段允许使用轻量 prompt 组装，不要求 PromptManager 配置包
- tool 使用通过 MCP 完成
- 执行入口是本地/in-process，不要求协议入口或 transport

## 4.1 技术选型与现有 crate 复用

- LLM provider 路径：默认复用现有 `runtime-inference + runtime-inference-rig`，不在新 `Phase 1` 引入额外 provider 抽象
- prompt 组装路径：默认优先复用现有 `PromptComposer / PromptRenderer / PromptProjector`，这里的“轻量 prompt 组装”指不引入 Prompt 配置包，不是重写整条 prompt pipeline
- MCP 接入路径：默认复用现有 `runtime-mcp` 能力，由最小 agent 执行入口接入 MCP facade 或等价 runtime 层封装
- 模块布局：`runtime-agent` 至少拆分为 `entry`、`loop`、`tool-bridge`、`history` 四个职责区域，避免把 MVP 代码写成单文件流程
- 错误处理最低策略：LLM API 失败、工具执行失败、MCP 调用失败都必须形成显式错误路径；本阶段允许直接结束当前执行并返回失败结果，不要求重试编排

## 4.2 kernel 协作约定

- turn 必须先由 `runtime-kernel` 创建
- `runtime-agent` 只消费已构造的执行上下文，不自行创建 turn
- loop 完成后必须回调 kernel 收尾

## 5. 明确不做的内容

- `MessageStore`
- sqlite / migration
- Protocol Handler
- WebSocket / stdio transport
- approval continuation
- Prompt 配置包
- compaction
- sub-agent

## 6. 验收标准

- 至少一条真实的 MCP 工具链闭环成立
- agent 能通过提示词触发 tool 调用
- tool result 能参与同一条执行链的后续推理
- 最终结果不是仅返回工具原始输出，而是完成分析与总结

## 6.1 检查清单

- 检查项：给定一条要求使用工具的提示词，agent 确实产生了 tool call
- 检查项：tool call 经由 MCP 执行，而不是伪造本地结果
- 检查项：tool result 被再次送入同一条推理链，而不是作为终态直接返回
- 检查项：最终输出包含归纳/分析，而不是仅转抄工具原始输出
- 检查项：当 LLM API 或工具失败时，当前执行有明确失败结束路径

## 7. 最小完成产物

- 一份可供实现的最小 agent MVP 控制流说明
- 一组不会把结构性能力前置到本阶段的验收条件
- 一条标准 MCP example 入口，供后续执行阶段验证

## 8. 本文不负责的内容

- 不负责定义 `MessageStore` 的抽象边界
- 不负责定义 Prompt 配置包机制
- 不负责定义 Protocol Handler 或 transport

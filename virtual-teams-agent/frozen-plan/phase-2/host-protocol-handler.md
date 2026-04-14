# Phase 2：Host 内部 Protocol Handler

> 用途：冻结 `Phase 2` 内部 Protocol Handler 的承接范围与语义，确保在不引入 transport 实现的前提下先完成协议处理边界。

## 0. 与接口冻结文档的关系

本文定义 `Phase 2` 的最小落地范围与验收标准。`Protocol Handler` 的长期边界、与 transport 的固定关系，仍以 [../interfaces/protocol-handler-boundary.md](../interfaces/protocol-handler-boundary.md) 为准。

## 1. 目标

在 `runtime-host` 内落地最小 Protocol Handler，使 `runtime-protocol` 的关键方法能被 host/runtime 稳定承接。

## 2. 本阶段必须承接的方法

- `runtime.turn.run`
- `runtime.turn.get`
- `runtime.turn.cancel`
- `runtime.approval.respond`
- `runtime.event.subscribe`
- `runtime.event.unsubscribe`

## 3. 语义冻结

### `runtime.turn.run`

- 立即返回确认结果
- 不同步阻塞等待 LLM 完成
- 最终结果通过事件通知与查询获得

### `runtime.turn.get`

- 返回当前 turn 快照
- 在终态时可读取最终结果

### `runtime.approval.respond`

- 把审批决策送回 runtime
- 不在 handler 内实现审批状态机

### `runtime.event.subscribe`

- 建立事件订阅关系
- 继续复用 `runtime-protocol` 的事件投影模型

## 4. 本阶段边界

- Protocol Handler 放在 `runtime-host` 内
- 本阶段不新增独立 server crate
- 本阶段不实现 WebSocket/stdio transport
- Protocol Handler 负责方法解析、参数校验、调用分发、结果封装

## 5. 明确不做的内容

以下内容统一后置到 `Phase 3`：

- WebSocket 连接管理
- stdio 读写循环
- 心跳、背压、慢客户端处理
- 断线重连

## 6. 验收标准

- `runtime.turn.run` 具备稳定的立即确认语义
- `runtime.turn.get` 能查询状态与终态结果
- 审批响应与事件订阅边界清晰
- 文档与实现都不把 `runtime-protocol` 等同于可运行 transport/server

## 7. 本文不负责的内容

- 不负责定义 handler 与 transport 的长期关系
- 不负责定义 tool loop 或审批 continuation 本身
- 不负责定义 WebSocket/stdio 的具体实现

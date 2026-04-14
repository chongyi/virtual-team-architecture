# Protocol Handler 边界冻结说明

> 本文冻结 `Phase 2` 内部 Protocol Handler 的职责边界。它是 host 内的请求分发层，不等于 WebSocket/stdio transport。

## 1. 冻结目标

在不进入 transport 实现的前提下，先锁定：

- 请求如何从 `runtime-protocol` 方法模型进入 host/runtime
- 哪些方法必须由 Protocol Handler 承接
- “立即确认 + 事件回推/查询收尾”的协议语义

## 2. 所在位置

- `Protocol Handler` 先落在 `runtime-host` 内
- 不新增独立 server crate
- `runtime-protocol` 继续只承载协议模型与事件投影

## 3. 承接的方法范围

`Phase 2` 内必须明确承接以下方法：

- `runtime.turn.run`
- `runtime.turn.get`
- `runtime.turn.cancel`
- `runtime.approval.respond`
- `runtime.event.subscribe`
- `runtime.event.unsubscribe`

可继续复用现有协议模型的其他只读方法，但不要求在本轮围绕它们展开新的复杂交付。

## 4. 语义冻结

### `runtime.turn.run`

- 返回立即确认结果
- 不同步等待完整 LLM 结果
- 最终输出通过事件通知与后续查询获得

### `runtime.turn.get`

- 返回 turn 快照
- 在终态时可带最终结果
- 用于补偿事件消费方的查询需求

### `runtime.approval.respond`

- 只负责把审批决策送回 runtime
- 不在 handler 内实现审批状态机

### `runtime.event.subscribe`

- 负责建立事件订阅关系
- 事件投影继续复用 `runtime-protocol`

## 5. Protocol Handler 不负责的内容

- WebSocket 会话管理
- stdio 读写循环
- 连接保活
- 背压与慢客户端处理
- 断线重连

这些内容统一后置到 `Phase 3` 的 transport 层。

## 6. 与 transport 的关系

固定关系如下：

`Client -> Transport -> Protocol Handler -> RuntimeHost -> RuntimeAgent/RuntimeKernel`

其中：

- `Transport` 负责字节搬运与连接生命周期
- `Protocol Handler` 负责方法解析、参数校验、调用分发、结果封装

正式文档中不得再把这两层混写。

## 7. Phase 2 完成定义

- `runtime.turn.run` 具备稳定的立即确认语义
- `runtime.turn.get` 能查询执行状态与终态结果
- 审批响应与事件订阅的 handler 边界明确
- 文档中不再把 `runtime-protocol` 等同于可运行 server

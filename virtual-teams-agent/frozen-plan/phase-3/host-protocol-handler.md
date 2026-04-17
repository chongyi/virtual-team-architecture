# Phase 3：Host 内部 Protocol Handler

> 用途：冻结新的 `Phase 3` 内部 Protocol Handler 的承接范围与语义，确保在不引入 transport 实现的前提下完成协议处理边界。

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

- `runtime.turn.run`：立即确认，最终结果通过事件与查询获得
- `runtime.turn.get`：返回 turn 快照与终态结果
- `runtime.approval.respond`：只送回审批决策，不实现审批状态机
- `runtime.event.subscribe`：建立事件订阅关系

## 4. 本阶段边界

- Protocol Handler 放在 `runtime-host` 内
- 本阶段不新增独立 server crate
- 本阶段不实现 WebSocket/stdio transport

## 5. 验收标准

- `runtime.turn.run` 具备稳定的立即确认语义
- `runtime.turn.get` 能查询状态与终态结果
- 文档与实现都不把 `runtime-protocol` 等同于可运行 transport/server

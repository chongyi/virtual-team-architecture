# Phase 0 基线校正清单

> 用途：在进入 `Phase 1` 实现前，先修正文档职责、术语与代码语义漂移。  
> 原则：先校正职责，再做实现，避免实现阶段反复返工。

## 0. 文档角色

本文件不是总计划，也不是接口说明。它只回答三件事：

- 当前哪些表述已经漂移
- 应该把这些表述校正到什么状态
- 什么情况下可以认为 `Phase 0` 已完成

如果需要看阶段目标或接口边界，应分别回到：

- [implementation-plan.md](implementation-plan.md)
- [interfaces/agent-loop-and-message-store.md](interfaces/agent-loop-and-message-store.md)
- [interfaces/protocol-handler-boundary.md](interfaces/protocol-handler-boundary.md)

## 1. 当前已确认的漂移点

### 1.1 `runtime-kernel` 职责表述过旧

当前代码基线中，`runtime-kernel` 实际承担的是：

- session/turn 生命周期管理
- 状态校验
- 事件追加
- turn 完成/失败/取消收尾

但现有部分文档仍把它描述为：

- 组装 prompt
- 驱动 inference loop
- 处理 tool call 循环

这类表述必须从正式文档中移除，避免与 ADR-001 冲突。

### 1.2 `runtime-host` 与 transport 的边界不清

当前 `runtime-host` 已经是唯一 composition root，但尚未具备：

- Protocol Handler 的正式实现
- WebSocket transport
- stdio transport

因此正式文档必须改为：

- 新 `Phase 3`：`runtime-host` 承载 Protocol Handler 边界
- 新 `Phase 4`：再进入 transport 实现

### 1.3 `runtime-protocol` 目前是协议模型，不是运行中的 handler

正式文档需要避免把 `runtime-protocol` 描述成“已经可服务外部客户端”的模块。当前它冻结的是：

- JSON-RPC 方法名
- params/result 结构
- 事件投影模型

它还不是 request dispatch 实现。

### 1.4 目标数据模型尚未写入当前基线

以下目标能力在架构文档中已提出，但当前基线尚未落地：

- `Message` / `Part`
- `MessageStore`
- `SceneId`
- `Session.parent_session_id`
- `Session.parent_turn_id`
- `ModelPolicy.fast_selector`
- `ModelPolicy.scene_selectors`

正式方案需要把它们明确标记为“待实现冻结项”，而不是“现状已具备能力”。

## 2. 校正后的统一口径

本节只给出校正后的短口径，不重复展开接口细节。

### `runtime-kernel`

- 只负责 session/turn 生命周期、状态校验、事件追加、审批状态
- 不负责 PromptManager
- 不负责 inference loop
- 不负责 tool loop

### `runtime-agent`

- 负责完整推理循环
- 负责 tool loop
- 新 `Phase 1` 可先使用轻量 prompt 组装与临时 history
- 从新 `Phase 2` 起负责消息工作轨与 PromptManager 接线

### `runtime-host`

- 继续作为唯一 composition root
- 在新 `Phase 3` 内承载 Protocol Handler
- 不在本轮承担 WebSocket/stdio transport 实现

### `protocol handler`

- 属于 host 内部请求分发与事件桥接层
- 负责连接 `runtime-protocol` 与 host/runtime 能力
- 不等于 transport

### `transport`

- 明确后置到 `Phase 4`
- 负责连接生命周期、字节搬运、背压与断连问题

## 3. 实施前必须完成的文档动作

### 3.1 入口与分层

- `virtual-teams-agent/README.md` 需要能进入 `frozen-plan/`
- `frozen-plan/README.md` 需要能把主计划、阶段子计划、接口文档区分开

### 3.2 现状与目标增量

- 主计划文档需要显式区分“当前基线”与“目标增量”
- 尚未落地的目标能力必须写成待实现项，不能写成现状

### 3.3 协作边界

- 当前目录只做方案文档
- 真实项目仓库改动不在当前目录直接执行
- 真实项目改动需求先记录到 [implementation-impact-map.md](implementation-impact-map.md)

## 4. 完成定义

以下条件同时满足，才视为 Phase 0 完成：

- 正式方案文档中不再出现“kernel 驱动推理循环”的表述
- `host / protocol handler / transport` 边界在各文档中一致
- `MessageStore` 被明确标记为新 `Phase 2` 的新增实现项
- `SceneId`、session parent 字段被明确标记为新 `Phase 3` 的新增实现项
- 真实项目改动已被明确标记为“后续阶段按计划执行”，而不是由当前目录直接修改
- 读者不再需要通过对比代码仓库来猜测当前职责分工

## 5. 本文不负责的内容

- 不负责定义新的 `Phase 1-5` 的完整任务树
- 不负责展开 `AgentLoop` 或 `Protocol Handler` 的接口细节
- 不负责列举真实项目中会修改哪些具体文件类型

这些内容分别由主计划、接口冻结文档和 [implementation-impact-map.md](implementation-impact-map.md) 承担。

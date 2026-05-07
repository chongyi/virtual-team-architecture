# 内部协议

虚拟员工系统内部的通信协议。包括 Agent 服务器与虚拟员工实例之间、以及 Agent 服务器与工作环境节点之间的通信。

## VTA JSON-RPC 2.0

虚拟员工系统内部使用 JSON-RPC 2.0 作为标准 RPC 协议。VTA Runtime 暴露以下 RPC 方法。

### 协议约定

- 传输层：WebSocket（服务端内进程间通信）或 Unix Domain Socket（同机进程间）
- 编码：JSON
- 版本：JSON-RPC 2.0 标准
- 通知（Notification）：不含 `id` 字段的请求，不需要响应

### 方法列表

#### runtime.turn.run

启动 Agent 推理循环（一个 Turn）。

```json
// 请求
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "runtime.turn.run",
  "params": {
    "session_id": "sess_xxx",
    "model_config": {
      "provider": "anthropic",
      "model_id": "claude-sonnet-4-6",
      "max_tokens": 16384,
      "temperature": 0.3
    },
    "tools": [
      { "name": "file_read", "description": "...", "parameters": {...} }
    ],
    "stream": true
  }
}

// 流式响应（逐事件推送）
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "turn_id": "turn_xxx",
    "status": "running",
    "stream": true
  }
}

// 后续通过通知推送事件
{
  "jsonrpc": "2.0",
  "method": "runtime.event.turn_update",
  "params": {
    "turn_id": "turn_xxx",
    "event": {
      "type": "content_block_delta | tool_use | tool_result | turn_complete",
      "data": {...}
    }
  }
}
```

#### runtime.turn.cancel

取消正在运行的 Turn。

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "runtime.turn.cancel",
  "params": {
    "turn_id": "turn_xxx"
  }
}
```

#### runtime.approval.respond

处理审批请求（用户在前端点击同意/拒绝后触发）。

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "runtime.approval.respond",
  "params": {
    "approval_id": "appr_xxx",
    "decision": "approved | rejected",
    "comment": "同意执行，注意不要修改配置文件",
    "remember_in_session": true
  }
}
```

#### runtime.session.create

创建 VTA Session。

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "runtime.session.create",
  "params": {
    "session_type": "main | sub | intent",
    "parent_session_id": null,
    "work_context_id": "wc_xxx",
    "tenant_id": "tn_xxx",
    "system_prompt": "...",
    "model_config": {...}
  }
}
```

#### runtime.session.delete

删除 Session 并回收资源。

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "runtime.session.delete",
  "params": {
    "session_id": "sess_xxx"
  }
}
```

#### runtime.event.subscribe

订阅 Session 的事件流。

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "runtime.event.subscribe",
  "params": {
    "session_id": "sess_xxx",
    "event_types": ["turn_update", "approval_required", "session_status"]
  }
}
```

事件通过通知推送：

```json
{
  "jsonrpc": "2.0",
  "method": "runtime.event.notification",
  "params": {
    "session_id": "sess_xxx",
    "event_type": "turn_update",
    "event": {...}
  }
}
```

## 工作环境节点协议

Agent 服务器与工作环境节点之间的通信协议。

### 传输方式

- **控制通道**：WebSocket 长连接，承载注册、心跳、工具调用
- **数据通道**：HTTPS，承载文件上传/下载（大文件分块传输）

### 节点注册

工作环境节点上线时向 Agent 服务器注册：

```json
{
  "type": "register",
  "node_id": "wen_user01_laptop",
  "tenant_id": "tn_xxx",
  "auth_token": "wen_auth_xxx",
  "node_type": "local",
  "host_info": {
    "os": "darwin",
    "arch": "arm64",
    "hostname": "Chongyi-MacBook",
    "client_version": "0.1.0"
  },
  "capabilities": {
    "mcp_servers": [
      {
        "name": "filesystem",
        "version": "1.0.0",
        "tools": [
          {
            "name": "read_file",
            "description": "读取文件内容",
            "parameters": {
              "type": "object",
              "properties": {
                "path": { "type": "string", "description": "文件路径" }
              },
              "required": ["path"]
            }
          }
        ]
      }
    ],
    "builtin_tools": ["file_read", "file_write", "shell_exec", "http_request"],
    "third_party_agents": [
      {
        "name": "claude_code",
        "version": "2.0.0",
        "capabilities": "full_development"
      }
    ],
    "sandbox": {
      "type": "process",
      "supported_isolation": ["filesystem"]
    }
  }
}
```

注册成功响应：

```json
{
  "type": "register_ack",
  "node_id": "wen_user01_laptop",
  "status": "accepted",
  "heartbeat_interval_seconds": 30,
  "assigned_ve_ids": ["ve_sales_01"]
}
```

### 心跳

```json
// 心跳请求
{
  "type": "heartbeat",
  "node_id": "wen_user01_laptop",
  "timestamp": "2026-05-07T10:30:00Z",
  "status": {
    "cpu_percent": 45.2,
    "memory_mb": 2048,
    "disk_free_gb": 120.5,
    "active_ve_count": 2,
    "active_tool_calls": 1
  }
}

// 心跳响应
{
  "type": "heartbeat_ack",
  "node_id": "wen_user01_laptop",
  "server_timestamp": "2026-05-07T10:30:01Z"
}
```

节点若连续 3 个心跳间隔未发送心跳（90s），Agent 服务器标记节点为离线。

### 工具调用

Agent 服务器转发虚拟员工的远程工具调用：

```json
{
  "type": "tool_call",
  "call_id": "tc_xxx",
  "ve_id": "ve_sales_01",
  "work_context_id": "wc_new_001",
  "tool": {
    "name": "file_read",
    "params": {
      "path": "/workspace/sales_data_q2.csv"
    }
  },
  "timeout_ms": 30000,
  "require_approval": false
}
```

工具执行结果回传：

```json
{
  "type": "tool_result",
  "call_id": "tc_xxx",
  "node_id": "wen_user01_laptop",
  "status": "success | error | timeout",
  "result": {
    "output": "...工具执行输出...",
    "exit_code": 0,
    "duration_ms": 1250,
    "artifacts": [
      {
        "type": "file",
        "path": "/workspace/sales_data_q2.csv",
        "size_bytes": 1024000,
        "mime_type": "text/csv"
      }
    ]
  },
  "error": null
}
```

### 文件传输

小文件（< 10MB）直接通过 WebSocket 控制通道以 base64 编码传输。大文件通过 HTTPS 数据通道分块传输：

```
POST /api/v1/files/upload
Content-Type: multipart/form-data

fields:
  ve_id: ve_sales_01
  work_context_id: wc_new_001
  target_path: /workspace/sales_data_q2.csv
  file: <binary>
```

### 沙盒操作

```json
// 创建沙盒工作空间
{
  "type": "sandbox.create",
  "ve_id": "ve_sales_01",
  "work_context_id": "wc_new_001",
  "config": {
    "base_path": "/workspaces/ve_sales_01",
    "isolation": "directory",
    "shared_dirs": ["/shared/sales_reports"],
    "network_access": "restricted",
    "max_disk_mb": 10240
  }
}

// 清理沙盒工作空间
{
  "type": "sandbox.cleanup",
  "ve_id": "ve_sales_01",
  "work_context_id": "wc_new_001",
  "mode": "archive | delete"
}
```

### 离线与重连

工作环境节点断开后：

1. Agent 服务器标记节点为离线，通知关联的虚拟员工
2. 正在执行的工具调用超时并返回错误给虚拟员工
3. 虚拟员工可回复用户"工作环境已断开，请检查连接"
4. 节点重连后，重新注册并上报当前能力（能力可能已变更）
5. Agent 服务器更新路由表，通知虚拟员工节点恢复

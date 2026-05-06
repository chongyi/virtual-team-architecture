# 协作工具与扩展

## 协作工具集

协作工具是工作产出和详细内容的载体。虚拟员工的详细工作过程和大型交付内容不是事无巨细地输出到聊天框，而是通过协作工具展示——正如现实中工作沟通在聊天框，产物在文档/表格中。

### 工具类型

| 工具 | 说明 | 参考 |
|------|------|------|
| **文档/知识库** | 富文本协同编辑，支持 Markdown、富文本、内嵌 Block | Notion / 飞书文档 |
| **多维表格（Bitable）** | 电子表格 + 数据库，支持多视图（表格/看板/日历/甘特图） | 飞书多维表格 |
| **任务看板** | 卡片 + 列表 + 拖拽，支持工作流状态流转 | Trello / Linear |
| **审批流** | 表单 + 流程引擎，支持条件分支和会签 | 飞书审批 |
| **自定义协作组件** | 用户可扩展的轻量级协作视图 | — |

### 设计原则

**飞书的"文档中心化"优于 Slack 的"消息中心化"**，更符合 Virtual Team 的使用场景：

- 虚拟员工的工作产物应当可持久化（不会被聊天流淹没）
- 产物应可协同编辑（用户 + 多个虚拟员工异步编辑）
- 产物应可独立引用（通过链接而非复制粘贴）

### 与 IM 的关系

| 交互模式 | 实现方式 |
|---------|---------|
| **内联预览** | 协作文档链接在聊天框中展示为内容预览卡片（标题、摘要、缩略图） |
| **消息引用** | 聊天消息可引用协作文档的特定段落或表格行（双向链接） |
| **统一搜索** | 协作工具数据与 IM 消息共享统一搜索索引 |
| **通知集成** | 文档被虚拟员工修改后，IM 中推送通知 |

### 协作工具数据模型

以**多维表格**为例：

```json
{
  "id": "bitable_xxx",
  "name": "Q2 销售分析",
  "organization_id": "org_xxx",
  "tables": [
    {
      "id": "tbl_xxx",
      "name": "月度数据",
      "fields": [
        { "name": "月份", "type": "text" },
        { "name": "销售额", "type": "number", "format": "currency" },
        { "name": "增长率", "type": "formula", "expression": "..." }
      ],
      "views": [
        { "type": "grid", "name": "表格视图" },
        { "type": "kanban", "name": "看板视图", "group_by": "月份" }
      ]
    }
  ],
  "created_by": "ve_sales_01",
  "created_at": "...",
  "last_edited_at": "..."
}
```

## 扩展与插件机制

### 第一阶段（当前规划）

不实现完整插件系统，但做以下基础设施以降低未来引入成本：

**1. 协作工具注册接口**

协作工具集设计为可注册的接口而非硬编码列表。每种协作工具实现统一 trait：

```rust
/// 协作工具的统一接口
trait CollaborationTool: Send + Sync {
    /// 工具类型标识，对应 content.type
    fn tool_type(&self) -> &'static str;

    /// 工具名称（用户可见）
    fn display_name(&self) -> &'static str;

    /// 前端渲染配置：组件路径、默认尺寸、支持的交互类型
    fn render_config(&self) -> RenderConfig;

    /// 处理来自前端或 Agent 的操作请求
    async fn handle_action(&self, action: ToolAction) -> Result<ToolResult, ToolError>;

    /// 权限检查：当前操作者是否可执行此操作
    async fn check_permission(&self, actor: &Actor, action: &ToolAction) -> Result<bool, ToolError>;

    /// 搜索索引回调：提取此工具的全文搜索内容
    fn extract_search_content(&self, data: &Self::Data) -> Vec<SearchDocument>;
}

struct RenderConfig {
    component: String,          // 前端组件名称
    default_width: Option<u32>,
    default_height: Option<u32>,
    supported_interactions: Vec<InteractionType>,
}

enum InteractionType {
    View,
    Edit,
    Comment,
    Approve,
}

struct ToolAction {
    action_type: String,        // "create", "update", "delete", "query"
    target_id: Option<String>,
    payload: serde_json::Value,
    context: ActionContext,     // 操作上下文（操作者、频道、组织）
}

struct ActionContext {
    actor: Actor,
    channel_id: Option<String>,
    organization_id: Option<String>,
    work_context_id: Option<String>,
}

enum Actor {
    User { id: String },
    VirtualEmployee { id: String, ve_id: String },
}
```

**2. 消息渲染扩展**

消息 `content.type` 支持自定义类型。客户端渲染时，未知类型降级为纯文本展示（graceful degradation）。

Block 类型同样支持扩展——自定义 block type 需在 `manifest` 中声明前端渲染组件路径。

**3. 虚拟员工可调用的协作应用 API**

协作应用提供的 API 通过明确的接口定义暴露给虚拟员工，而非直接暴露内部实现：

| API | 说明 | 调用者 |
|-----|------|--------|
| `collab.message.send` | 发送消息 | 意图 Agent / 主 Agent |
| `collab.document.create` | 创建文档 | 主 Agent |
| `collab.document.update` | 更新文档 | 主 Agent |
| `collab.bitable.create` | 创建多维表格 | 主 Agent |
| `collab.bitable.insert_rows` | 写入表格数据 | 主 Agent |
| `collab.board.create_card` | 创建看板卡片 | 主 Agent |
| `collab.board.move_card` | 移动看板卡片 | 主 Agent |
| `collab.approval.create` | 发起审批 | 主 Agent |
| `collab.org.query` | 查询组织结构 | 意图 Agent / 主 Agent |

### 远期插件系统

参考 Mattermost 的插件架构（Go hooks + UI 注入）和 Slack App 的权限声明模型：

**服务端插件**：

- 通过 trait 注册生命周期钩子（消息发送前、协作工具操作后、虚拟员工创建前等）
- Rust 编译期或动态加载（FFI-safe trait object）
- 插件在独立沙盒中运行，限制系统调用

```rust
/// 插件生命周期钩子
trait Plugin: Send + Sync {
    fn manifest(&self) -> PluginManifest;
    fn on_message_send(&self, msg: &mut OutgoingMessage) -> HookResult;
    fn on_collaboration_tool_action(&self, action: &ToolAction) -> HookResult;
    fn on_ve_created(&self, ve: &VirtualEmployee) -> HookResult;
}
```

**客户端插件**：

- Flutter 端的 UI 组件注入（协作工具面板扩展、消息渲染扩展、侧边栏扩展）
- 通过 `flutter_plugin` 机制动态加载

**权限声明**：

每个插件在 manifest 中声明所需权限，安装时需用户确认：

```toml
[plugin.permissions]
read_messages = true
send_messages = false
read_organizations = true
access_collaboration_tools = ["document", "bitable"]
network_access = ["api.example.com"]
```

第一阶段的 `CollaborationTool` trait 和消息类型扩展机制，为远期插件系统提供了自然的接入点——插件开发者只需实现已有 trait，无需重构核心架构。

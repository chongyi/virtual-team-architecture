# 成熟协作应用案例调研

## 调研问题

Virtual Team 的协作应用形态需要符合大众认知。调研重点不是复制某个产品，而是识别成熟协作应用中用户已经理解的入口、消息形态、工具承载和管理后台边界。

## 资料来源

- Slack：
  - [Slack huddles help](https://slack.com/help/articles/216771908)
  - [Slack App Home](https://docs.slack.dev/surfaces/app-home/)
  - [Slack Block Kit blocks](https://docs.slack.dev/reference/block-kit/blocks)
  - [Slack choosing the right surface](https://docs.slack.dev/concepts/choosing-the-right-surface)
- Microsoft Teams：
  - [Teams administrator roles](https://learn.microsoft.com/en-us/microsoftteams/using-admin-roles)
- 飞书/Lark：
  - [Lark Docs](https://larksuite.my/docs)
  - [飞书多维表格介绍](https://www.feishu.cn/content/base)
  - [飞书开放平台多维表格 API 概述](https://feishu.apifox.cn/doc-436424)

## 关键结论

### 消息不是所有工作的承载面

Slack 的 Block Kit、App Home、Modal 和 Huddle thread/canvas 说明成熟协作应用会把不同交互放在不同 surface 中，而不是把所有信息塞进聊天流。飞书/Lark 则进一步强化文档、表格、审批和工作流作为工作产物载体。

决策：

- Virtual Team 保持“聊天用于沟通，协作工具用于产物和治理”的方向。
- 工作摘要、审批卡片、对象预览使用结构化卡片，不把长过程刷进 IM。
- Tool Surface 是用户端和 VE 之间共享协作语义的关键机制。

### App / Bot / 虚拟员工应像联系人一样接入，但要有独立治理面

Slack App Home 把应用与用户的一对一空间、消息和 Home tab 区分开来。Virtual Team 的虚拟员工也应在 IM 中像联系人，但其配置、权限、工具、工作上下文和运行状态需要独立管理界面。

决策：

- VE 在用户侧表现为联系人和频道成员。
- VE 管理不塞进普通聊天框，而进入设置、组织、管理面板和工作上下文视图。

### 管理后台是平台能力，不是普通用户界面

Teams 的管理员角色体系表明，成熟协作产品会把内部管理、组织设置、通信策略、设备、报表和故障排查放在独立治理面。Virtual Team 还需要套餐、计费、资源、风控、客服和 AI/VE 相关治理。

决策：

- 管理端作为独立 Web 应用。
- 管理端角色、审计、审批和高风险操作与用户端隔离。

### 用户认知优先于底层实现

用户看到的是频道、联系人、文档、表格、看板、审批、日程；扩展、Tool Action、对象壳和 Agent Adapter 是内部架构概念。

决策：

- `src` 文档应持续区分用户概念和工程概念。
- 协作工具以第一方内置扩展实现，但对普通用户仍表现为默认工具。

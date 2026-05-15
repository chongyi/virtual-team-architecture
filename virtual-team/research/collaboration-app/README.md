# 协作应用调研索引

本目录保存协作应用技术方案的决策级调研材料。`src` 下的体系化文档只保留设计结论和冻结口径；本目录保留调研依据、风险和取舍。

## 调研主题

| 文档 | 内容 |
|------|------|
| [客户端多端技术调研](./client-platform-research.md) | Flutter 多端、移动端弱网/后台限制、推送、本地缓存和发布差异 |
| [管理端 Web 技术调研](./admin-console-research.md) | 独立管理端技术栈、权限域、后台能力和前端状态边界 |
| [后端扩容与拆分调研](./backend-scalability-research.md) | Rust 服务端、模块化单体、事件、队列、outbox 和拆分路径 |
| [基础设施选型调研](./infrastructure-selection-research.md) | PostgreSQL、Redis、对象存储、搜索、队列、观测和云中立设施 |
| [Rust 后端技术栈调研](./backend-rust-stack-research.md) | tokio、axum、tower、sqlx、redis-rs、object_store、tracing 等 Rust 库 |
| [前端技术栈调研](./frontend-stack-research.md) | Flutter 客户端与 React 管理端的框架、状态、缓存、测试和构建库 |
| [成熟协作应用案例调研](./collaboration-product-research.md) | Slack、Teams、飞书/Lark 等产品形态对 Virtual Team 的启发 |

## 使用方式

- 调研文档可以记录链接、依据、风险和备选项。
- `virtual-team/src` 中只写结论，不堆叠原始资料。
- 当技术方案发生关键变化时，应同步更新对应调研结论。

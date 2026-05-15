# U-B1.5 文件上传、附件与对象存储

## 目标 (Goal)

在协作应用中实现文件上传/下载/预览、消息附件（图片/文件）、S3 兼容对象存储集成、上传进度与缩略图生成，使得用户可以在消息中发送附件和图片。

## 上下文 (Context)

- 前置：U-B1.3（WebSocket 认证与实时推送）
- 设计文档：`04-collaboration-app/technical-design/api-and-protocol.md`、`16-technical-specs/deployment-architecture.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| crates/collab-server/src/models/attachment.rs | create | Attachment 结构体（file_id、mime_type、size、url、thumbnail_url） |
| crates/collab-server/src/store/attachment.rs | create | AttachmentStore trait + PgAttachmentStore |
| crates/collab-server/src/service/upload.rs | create | 上传服务（presigned URL 或直传 + S3 put） |
| crates/collab-server/src/routes/upload.rs | create | POST /upload、GET /files/{id} |
| crates/collab-server/src/models/message.rs | modify | Message.content blocks 支持 image/file block 类型 |
| apps/flutter/lib/features/im/presentation/widgets/attachment_picker.dart | create | 附件选择器（图片/文件） |
| apps/flutter/lib/features/im/presentation/widgets/image_preview.dart | create | 图片预览组件 |
| migrations/ | create | attachments 表 |

## 约束 (Constraints)

详见 CONTEXT.md。本单元特殊约束：
- 对象存储使用 S3 兼容 API（MinIO 开发环境，AWS S3 生产）
- 上传大小限制：图片 max 10MB，文件 max 50MB
- 图片自动生成缩略图（256px 宽度）
- 附件消息通过 WebSocket 广播时只含 file_id + 缩略 URL，不含原始文件内容

## 完成条件 (Done When)

- [ ] POST /api/v1/upload 上传文件/图片 → 存储到 S3 → 返回 file_id + URL
- [ ] 消息支持 image 和 file 类型的 content block
- [ ] GET /api/v1/files/{id} 下载/预览文件
- [ ] 图片上传后自动生成缩略图
- [ ] Flutter 附件选择器（相册 + 文件选择器）
- [ ] Flutter 图片消息气泡（缩略图 + 点击预览大图）
- [ ] MinIO 为默认开发环境，通过 docker-compose 提供
- [ ] `cargo test -p vt-collab-server` 全部通过
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(collab): add file upload, attachment and S3 object storage integration`

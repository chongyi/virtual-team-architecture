# U-B2.6 文件附件与图片预览（Flutter UI）

## 目标 (Goal)

在 Flutter 客户端中实现附件选择器（相册/文件）、图片消息气泡（缩略图 + 点击预览大图），对接 B1.5 后端 API。

## 上下文 (Context)

- 前置：U-B2.2（IM 聊天界面）+ U-B1.5（file/S3 后端）
- 设计文档：`04-collaboration-app/im-system.md`

## 工作范围

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| apps/flutter/lib/features/im/presentation/widgets/attachment_picker.dart | create | 附件选择器（图片/文件） |
| apps/flutter/lib/features/im/presentation/widgets/image_preview.dart | create | 图片预览组件 |

## 约束 (Constraints)

详见 CONTEXT.md。

## 完成条件 (Done When)

- [ ] 附件选择器可拍照/选相册/选文件
- [ ] 图片消息气泡渲染缩略图
- [ ] 点击缩略图 → 全屏预览大图
- [ ] file 类型附件显示文件名、大小、下载入口
- [ ] `flutter analyze` 无 error
- [ ] `flutter test` 全部通过

### 提交标准

- [ ] `feat(flutter): add attachment picker and image preview in chat`

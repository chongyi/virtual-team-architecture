# G-X6.3 i18n 基础与移动端最小构建验收

## 目标 (Goal)

建立 i18n 基础（提取硬编码字符串到 l10n key，中/英双语）、移动端最小构建验收（iOS 无签名构建通过 + Android APK 构建通过）、基本错误消息中文化。

## 上下文 (Context)

- 前置：G-X6.2（备份恢复完成）
- 设计文档：`16-technical-specs/non-functional-requirements.md`

## 约束 (Constraints)

i18n 覆盖服务端错误消息 + Flutter UI 字符串。不要求完整翻译，只要求 key 体系和示例覆盖。

## 完成条件 (Done When)

- [ ] 服务端错误消息统一使用 i18n key（中文默认）
- [ ] Flutter UI 字符串提取到 ARB 文件
- [ ] 中/英双语切换可在设置中切换
- [ ] `flutter build ios --no-codesign` 成功
- [ ] `flutter build apk` 成功
- [ ] 数据保留策略文档（明确各环境数据保留期限）

### 提交标准

- [ ] `feat(core): add i18n foundation and mobile build verification`

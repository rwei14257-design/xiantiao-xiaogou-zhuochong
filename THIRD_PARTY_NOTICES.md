# 第三方组件与参考说明

## Electron

- 项目：https://github.com/electron/electron
- 固定版本：`42.4.1`，通过 npm 获取，详见 `package-lock.json`。
- Electron 自身许可：MIT。许可原文：https://github.com/electron/electron/blob/v42.4.1/LICENSE
- Electron 同时包含 Chromium、Node.js 及其他组件，不能把整个运行时概括为「全部只需 MIT」。其发行包内的许可与第三方声明需按实际发行内容保留。

Git 源码不附带 Electron 二进制文件；v1.1.0 起由 GitHub Actions 使用官方依赖构建安装包。分发包应保留运行时随附的 `LICENSE`、`LICENSES.chromium.html` 及其他适用许可通知，不从参考应用复制运行文件。

## electron-builder

- 项目：https://github.com/electron-userland/electron-builder
- 构建工具版本：26.15.3，许可 MIT；其传递依赖和构建工具遵循各自许可。
- 只用于构建，不向本项目授予任何第三方角色素材权利。

## npm 传递依赖

安装产生的依赖遵循各自随包提供的许可，不由本项目 LICENSE 统一替代。锁文件记录实际版本；`node_modules/` 不提交。

## 参考项目

- `remake1026/desktop-pets`：用于理解桌宠交互，开发时阅读过其程序。其 README 明确说明相关图片和 GIF 未获权利人授权。本仓库不分发提取出的素材、原应用包、原图标或原生助手。核查时未发现公开文件树中的许可证文件，不把参考项目代码视作已获 MIT 授权。
- `Imzl-zl/desktop-pet`、`coglabss/deskcat`：仅参考「代码许可与素材权利分开说明」的文档结构；这些项目的声明不构成本项目获得任何角色素材授权的证据。

来源链接及核查范围见 `docs/rights-review.md`。

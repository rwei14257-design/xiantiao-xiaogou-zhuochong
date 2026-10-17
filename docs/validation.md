# v1.1.3 验证范围

更新日期：2026-10-18。发布代码提交：`dac8f03d7a8f4059a50236ab4679147142a8d795`。

- 12 项自动测试通过，覆盖设置恢复、屏幕边界、缺图回退、素材路径、导入别名与格式替换、伪装文件拒绝、发布过滤、作息时间边界、跨午夜睡眠、冲突优先级、下一状态、周末和手动互动恢复。
- Windows Electron 42.4.1 实际启动验证通过：12 个状态卡片、尺寸切换、置顶、隐藏与唤回、重置位置、作息编辑和恢复。渲染控制台没有错误。
- 使用本机已有线条小狗素材验证：12 个状态图像全部加载，卡片分别显示真实形态、动作名称、陪伴文案和触发时间。新版截图已人工检查，无缺图或页面水平溢出；页面允许纵向滚动。
- 源码文件检查允许两张明确登记的文档截图 `docs/images/preview-home.png` 和 `docs/images/preview-states.png`，另允许单独登记的应用图标及平台格式变体，继续拒绝原始角色 GIF、其他未登记媒体、用户素材目录及本机运行文件。这项技术检查不等于第三方权利审核。
- Windows x64、macOS Apple Silicon 和 macOS Intel 三个平台均使用官方依赖构建成功；各平台 app.asar 内容检查通过，安装包只允许登记的两个运行时应用图标，不含文档截图或用户动画素材。
- v1.1.3 Release 已上传三个安装包与 `SHA256SUMS.txt`。

[三平台构建、包内容检查与发布记录](https://github.com/rwei14257-design/xiantiao-xiaogou-zhuochong/actions/runs/39051985460) · [发布提交的源码检查](https://github.com/rwei14257-design/xiantiao-xiaogou-zhuochong/actions/runs/39051985489) · [v1.1.3 下载](https://github.com/rwei14257-design/xiantiao-xiaogou-zhuochong/releases/tag/v1.1.3)

本地界面验证使用已有的同版本 Electron 运行时；该运行时未用于公开打包。构建通过不等于全部目标设备的安装和交互验证：尚未覆盖 macOS 真机完整交互、干净系统安装和多显示器组合。Windows 安装包没有商业签名；macOS 仅有 ad-hoc 签名，没有 Apple Developer ID 签名或公证。

此记录说明测试范围，不是法律审核或不侵权证明。截图中的第三方角色公开展示授权仍未确认，见 [截图说明](screenshots.md) 和 [版权核查](rights-review.md)。

图标专项验证：ICO 包含 16/24/32/48/64/128/256 像素图层，ICNS 包含最高 1024 像素图层；文件边界、PNG 图层尺寸和运行时图标尺寸检查通过。本机 EXE 更新后已重新提取图标核对，启动快捷方式、窗口、托盘和小屋品牌区均已接入合照图标。

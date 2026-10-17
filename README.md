# 线条小狗桌宠

**非官方 · 仅代码与几何占位图 · 不附带线条小狗图片或动画**

一个 Windows 桌面陪伴程序：透明悬浮、拖动、点击互动、动作选择、三档大小、托盘菜单，以及一个暖色的小屋面板。

项目名称用于说明最初的学习参考主题，不表示与相关角色权利人存在官方、合作、赞助或授权关系。**本项目未取得线条小狗角色素材的再分发授权，因此仓库、预览和发布内容均不提供这些素材。**

本项目的目标萌宠是线条小狗，不替换成其他角色。由于仓库不分发角色素材，首次启动显示「待添加本地素材」图标。没有添加自己有权使用的素材时，10 个动作槽位都会显示同一个缺图提示；它们不是 10 套随附的角色动画。

![待添加本地素材](src/assets/placeholder.svg)

## 运行

需要 Windows 10 / 11，以及 Node.js 22.12 或更高版本（含 npm）。

```sh
git clone https://github.com/rwei14257-design/xiantiao-xiaogou-zhuochong.git
cd xiantiao-xiaogou-zhuochong
npm ci
npm start
```

首次安装会从官方 npm / Electron 分发源获取依赖；启动后的应用不主动联网。其他操作系统尚未验证。

## 操作

| 操作 | 效果 |
| --- | --- |
| 拖动角色 | 移动位置，松开后保存 |
| 点击角色 | 切换爱心 / 夸夸槽位 |
| 右键角色 | 打开菜单、换动作、调整大小、隐藏或退出 |
| 角色下方的房子按钮 | 打开小屋面板 |
| 单击托盘图标 | 叫回角色 |
| 双击托盘图标 | 打开小屋 |
| 菜单 → 回到屏幕右下角 | 重置位置 |

「自动换动作」每 45 秒切换一个槽位；23:00—07:00 优先睡觉 / 阅读槽位，取系统本地时间。关闭自动切换即可固定某个动作。大小、位置和设置在退出后保留。

## 使用自己的素材

在项目根目录新建 `assets-local/`，放入你自行创作、已获许可或有其他合法使用依据的素材，然后重启。

| 文件名（示例使用 GIF） | 动作 |
| --- | --- |
| `hello.gif` | 见面 |
| `heart.gif` | 爱心 |
| `jump.gif` | 跳跃 |
| `good.gif` | 夸夸 |
| `dance.gif` | 跳舞 |
| `eat.gif` | 吃饭 |
| `read.gif` | 阅读 |
| `sleep.gif` | 睡觉 |
| `drink.gif` | 喝水 |
| `offwork.gif` | 下班 |

也支持同名 `.png` 和 `.webp`，优先级为 GIF → PNG → WebP。建议透明背景、正方形画布。缺少的槽位自动显示「待添加本地素材」图标。

`assets-local/` 被 Git 忽略。项目不提供第三方角色素材的下载、抓取或解包工具。自行获得一个图片文件并不自动获得公开传播权，具体使用应符合该文件及角色的授权范围。详见 [素材政策](ASSET_POLICY.md)。

## 检查与源码

```sh
npm test
npm run check:release
npm run test:smoke
```

`check:release` 检查 Git 已跟踪的文件，拒绝本地素材、二进制程序和未登记图片混入代码仓库。它是文件检查工具，不是法律鉴定。

`test:smoke` 会临时打开测试窗口，检查默认占位图、动作槽位、缩放、置顶、隐藏和面板联动。截图及结果写到被忽略的 `artifacts/`。

核心文件：`src/main.js`（窗口和托盘）、`src/model.js`（设置和动作）、`src/artwork.js`（素材回退）、`src/pet.*`（桌宠）、`src/panel.*`（小屋）。Windows 设置目录为 `%APPDATA%\PuppyCompanion-Code`。

仓库提供源码；不发布从其他应用复制出的 EXE、DLL 或安装包。

## 许可、来源和致谢

- 本仓库新增代码、文档和几何占位 SVG 按 [MIT License](LICENSE) 提供，适用范围限于维护者有权许可的内容。
- 第三方角色、商标、用户自行提供的素材不因本仓库采用 MIT 而获得许可。
- 桌宠交互参考了 [remake1026/desktop-pets](https://github.com/remake1026/desktop-pets)。感谢其演示带来的启发。开发过程中阅读过参考程序，当前仓库不附带其提取素材、原应用包或原生辅助程序，也不宣称取得其代码许可。
- 版权说明采用代码与素材分别说明的结构，参考了 [DesktopPet](https://github.com/Imzl-zl/desktop-pet#license) 和 [DeskCat](https://github.com/coglabss/deskcat#-credits) 的文档组织方式；未复制它们的代码或素材。
- Electron 及传递依赖遵循各自许可，详见 [第三方说明](THIRD_PARTY_NOTICES.md)。

完整说明：[版权与非官方声明](NOTICE.md) · [素材政策](ASSET_POLICY.md) · [发布前核查记录](docs/rights-review.md)。

若你认为本仓库具体内容涉及你的权利，请通过 [Issues](https://github.com/rwei14257-design/xiantiao-xiaogou-zhuochong/issues) 提供文件路径、权利依据和诉求。维护者会核查并作适当处理；此渠道不代替事先获得授权。

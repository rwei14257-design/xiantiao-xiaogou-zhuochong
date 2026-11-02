# v1.2.0 实测记录

2026-11-02，在 Windows 上使用独立的测试配置启动程序，没有改动日常使用的作息。

| 操作 | 实测结果 |
| --- | --- |
| Windows 本机测试播放器播放一段无声 WAV，再暂停 | 播放前为「见面摇摇」，播放期间桌面窗口加载「快乐起舞」，暂停后加载「见面摇摇」。全程通过系统媒体会话获取状态。 |
| 固定睡觉动作后点击爱心 | 互动约 5 秒，桌宠窗口恢复固定睡觉动作。 |
| 从小屋开始专注、抽取惊喜并提前结束 | 专注状态、桌面粒子动效、取消计时均通过实际窗口验证。 |
| 自动测试 | 26 项通过；含音乐优先级、播放暂停、休息时段、连续点击、专注完成与休眠后不补播过期庆祝。专注满 25 分钟的边界使用模拟时钟验证。 |

Windows 使用[系统媒体会话接口](https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager)，只能识别播放器报告的状态。没有读取音频波形，也不推断曲速。macOS 通过本机 Music / Spotify 的播放状态工作；本轮未在 Mac 真机上运行交互测试。

交互设计参考了 [desktop-pets](https://github.com/remake1026/desktop-pets) 的桌面动作展示和 [VPet](https://github.com/LorisYounger/VPet) 的陪伴玩法。公开安装包不包含用户提供的线条小狗 GIF；四款装饰效果在没有额外惊喜 GIF 时也可使用。

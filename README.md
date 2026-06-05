# MessageInputBot

在网页输入框中自动重复发送消息的浏览器扩展。

## 功能

- **白名单控制** — 仅在您信任的网站启用扩展
- **触发按钮** — 聚焦可编辑字段（`input`、`textarea` 或 `contenteditable`）时显示
- **重复输入** — 可配置内容、次数、间隔，以及可选的随机抖动（±10%）
- **跨浏览器** — 基于 [WXT](https://wxt.dev) 构建，支持 Chrome、Edge 和 Firefox

## 使用场景

- ~~聊天室在线battle~~
- ~~直播间疯狂抠666~~

## 安装

```bash
bun install
bun run build
```

在浏览器中加载未打包的扩展：

| 浏览器  | 产物目录              |
| ------- | --------------------- |
| Chrome  | `.output/chrome-mv3`  |
| Edge    | `.output/edge-mv3`    |
| Firefox | `.output/firefox-mv2` |

## 使用

1. 点击扩展图标，将当前网站（或手动输入域名）加入白名单
2. 刷新页面
3. 聚焦页面上的文本输入框
4. 点击输入框旁出现的触发按钮
5. 配置重复参数后点击「开始」

## 开发

```bash
bun run dev          # Chrome 开发模式，支持热更新
bun run dev:edge     # Edge
bun run dev:firefox  # Firefox
bun run build        # 生产构建
bun run zip          # 打包发布
bun run dev:test     # 本地测试页 http://localhost:8787
bun run compile      # TypeScript 类型检查
```

## 反馈

发现 Bug 或有功能建议？[在 GitHub 提交 Issue](https://github.com/ChiuMungZitAlexander/message-input-bot/issues)。

# 快速开始指南

本指南带你 5 分钟内用上 FKbuilder。

## 安装

```bash
# 需要 Node.js >= 16 和 FFmpeg
git clone <repository-url>
cd FKbuilder
npm install
```

### 系统要求

- **Node.js** >= 16
- **FFmpeg**（用于视频编码）
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt-get install ffmpeg`
  - Windows: [ffmpeg.org](https://ffmpeg.org/download.html) 下载并加 PATH

## 第一个视频

```javascript
import { VideoBuilder } from 'fkbuilder';

const builder = new VideoBuilder({
  width: 1280,
  height: 720,
  fps: 30,
});

builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 3 })
    .addBackground({ color: '#0f172a' })
    .addText({
      text: 'Hello, FKbuilder!',
      x: '50%',
      y: '50%',
      fontSize: 80,
      color: 'white',
      textAlign: 'center',
      duration: 3,
      animations: ['fadeIn'],
    });

await builder.render('./output/hello.mp4', { parallel: true });
builder.destroy();
```

跑：

```bash
node hello.js
```

输出在 `output/hello.mp4`。

## 核心架构

```
VideoBuilder         顶层容器（width/height/fps）
└── Track            层级轨道（zIndex 越大越在上）
    └── Scene        时间段（duration + startTime）
        ├── addBackground({ color })
        └── addText / addImage / addRect / ...
            └── addHtml({ html })   ← 任意 HTML/CSS（详见下方）
```

## 常用元素一栏

| 方法 | 用途 |
|---|---|
| `addBackground({ color, image })` | 背景 |
| `addText({ text, fontSize, ... })` | 文字（支持渐变/阴影/发光/描边/拆分动画） |
| `addImage({ src, fit, ... })` | 图片（fit: cover/contain/fill/none） |
| `addVideo({ src })` | 视频 |
| `addRect({ width, height, fillColor })` | 矩形 |
| `addCircle({ radius })` | 圆形 |
| `addPath({ pathData })` | 任意路径 |
| `addAudio({ src })` | 音频 |
| `addECharts({ option })` | ECharts 图表 |
| `addCode({ code, language })` | 代码块（语法高亮+打字机） |
| `addOscilloscope({ audioPath })` | 音频可视化 |
| `addHtml({ html })` | **任意 HTML/CSS** |

## 动画

```javascript
// 预设
animations: ['fadeIn', 'bounceIn', 'slideInLeft']

// 自定义
import { TransformAnimation } from 'fkbuilder';
element.addAnimation(new TransformAnimation({
  duration: 1.5,
  from: { x: 0, opacity: 0 },
  to:   { x: 100, opacity: 1 },
  easing: 'ease-out',
}));

// 每帧回调(支持并行)
import { withContext } from 'fkbuilder';
const onFrame = withContext((el, progress, time) => {
  el.rotation += 2;   // 持续旋转
}, {});
```

## 转场

```javascript
track.addTransition({
  name: 'CrossZoom',     // fade/CrossZoom/CircleCrop/Swirl/...
  duration: 1,
  startTime: scene2StartTime,
});
```

支持 20+ 种 [gl-transitions](https://gl-transitions.com/) 转场。

## HTML 元素：用 HTML/CSS 做视频帧

把任意 HTML 渲染成视频画面，自动驱动 CSS 动画、中文、Emoji。

```javascript
.addHtml({
  x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
  html: `
    <style>
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .title { animation: fadeInUp 1s ease-out forwards; }
    </style>
    <h1 class="title" style="color:white;font-size:96px;">HTML 视频</h1>
  `,
  duration: 5,
});
```

**开箱亮点**：
- **彩色 Emoji**：🚀、🎨、⚡ 自动变 Twemoji（无需额外配置）
- **中文自动用微软雅黑**：不用指定 font-family
- **零配置 Tailwind**：加 `tailwind: true` 直接用所有 utility class

```javascript
.addHtml({
  html: `<div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-6xl font-black p-8">
    Tailwind CSS
  </div>`,
  tailwind: true,    // ← 不需要任何 setup
  duration: 5,
});
```

详见 [docs/html-element.md](./html-element.md)。

## 并行渲染（推荐）

```javascript
await builder.render('./output/video.mp4', {
  parallel: true,    // 启用 Worker 多线程
  usePipe: true,     // 管道写入 ffmpeg,内存友好
  maxWorkers: 4,
});
```

## 下一步

- 📘 [HTMLElement 完全指南](./html-element.md) — HTML 元素所有细节
- 📘 [VideoBuilder API](./video-builder-api.md) — 构建器 API 详解
- 📁 [`examples/`](../examples) — 70+ 可运行示例
- 📁 [`examples/html-element-tailwind-zero.js`](../examples/html-element-tailwind-zero.js) — 推荐先看
- 📁 [`examples/html-element-tailwind-custom-theme.js`](../examples/html-element-tailwind-custom-theme.js) — 自定义 brand 主题
---
name: fkbuilder
description: fkbuilder 视频构建技能。当用户说"创建视频"、"构建视频"、"使用 fkbuilder"、"视频配置"时调用此技能。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
license: MIT
---

# fkbuilder Skill

**fkbuilder** - Node.js 程序化视频创作库，通过代码 API 创建视频。

---

## 1. 快速开始

### 安装
```bash
npm install fkbuilder
```

### 代码渲染
```javascript
import { VideoBuilder } from 'fkbuilder';

const builder = new VideoBuilder({
  width: 1280,
  height: 720,
  fps: 30,
});

const track = builder.createTrack({ zIndex: 1 });

const scene = track.createScene({ duration: 3, startTime: 0 });
scene.addBackground({ color: '#0f0f23' });
scene.addText({
  text: 'Hello World',
  x: '50%', y: '50%',
  fontSize: 72, fontFamily: 'Arial',
  color: '#ffffff', textAlign: 'center', textBaseline: 'middle',
  duration: 3,
});

const outputPath = './output/video.mp4';
await builder.render(outputPath);
```

---

## 2. VideoBuilder 主类

### 构造函数
```javascript
const builder = new VideoBuilder({
  width: 1920,      // 视频宽度，默认 1920
  height: 1080,     // 视频高度，默认 1080
  fps: 30,          // 帧率，默认 30
});
```

### 核心方法

| 方法 | 说明 |
|------|------|
| `createTrack(config)` | 创建轨道 |
| `render(outputPath, options)` | 渲染并导出视频 |
| `initialize()` | 预加载异步资源（SVG等） |
| `destroy()` | 销毁构建器 |

### render 选项
```javascript
await builder.render(outputPath, {
  parallel: false,    // 是否并行渲染，默认 true
  usePipe: true,      // 使用管道模式（不保存中间帧），默认 true
});
```

---

## 3. Track 轨道

### 创建轨道
```javascript
const track = builder.createTrack({
  zIndex: 1,          // 层级顺序，数字越大越上层
  name: 'main',       // 轨道名称（可选）
});
```

### 轨道方法

| 方法 | 说明 |
|------|------|
| `createScene(config)` | 创建场景 |
| `addTransition(config)` | 添加转场 |
| `getTotalDuration()` | 获取总时长 |

---

## 4. Scene 场景

### 创建场景
```javascript
const scene = track.createScene({
  duration: 3,           // 持续时间（秒）
  startTime: 0,          // 开始时间（秒），可选
});
```

### 场景方法

| 方法 | 说明 |
|------|------|
| `addBackground(config)` | 添加背景 |
| `addText(config)` | 添加文本 |
| `addRect(config)` | 添加矩形 |
| `addCircle(config)` | 添加圆形 |
| `addImage(config)` | 添加图片 |
| `addVideo(config)` | 添加视频 |
| `addSVG(config)` | 添加 SVG |
| `addAudio(config)` | 添加音频 |
| `addSubtitles(config)` | 添加字幕 |

### 背景配置
```javascript
scene.addBackground({ color: '#0f0f23' });
// 或
scene.addBackground({ image: './bg.png' });
```

---

## 5. 元素通用属性

所有元素都支持以下属性：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | number/string | 0 | X坐标，支持 "50%" 百分比 |
| `y` | number/string | 0 | Y坐标，支持 "50%" 百分比 |
| `width` | number | - | 宽度 |
| `height` | number | - | 高度 |
| `opacity` | number | 1 | 透明度 (0-1) |
| `rotation` | number | 0 | 旋转角度（度） |
| `scaleX` | number | 1 | X方向缩放 |
| `scaleY` | number | 1 | Y方向缩放 |
| `anchor` | array | [0.5, 0.5] | 锚点 [x, y]，0-1 |
| `duration` | number | - | 持续时间（秒） |
| `startTime` | number | 0 | 开始时间（秒），相对于场景 |
| `animations` | array | [] | 预设动画数组 |
| `onFrame` | function | - | 帧回调 |

### 坐标系统
- 原点在画布左上角 (0, 0)
- 使用 "50%" 可以相对于画布中心定位
- anchor 影响旋转和缩放的中心点

---

## 6. 文本元素 (Text)

```javascript
scene.addText({
  text: 'FOLIKO',
  x: '50%', y: '40%',
  fontSize: 120,
  fontFamily: 'Arial Black',
  fontWeight: 'bold',
  fontStyle: 'normal',
  color: '#ffffff',
  textAlign: 'center',      // left/center/right
  textBaseline: 'middle',   // top/middle/bottom
  lineHeight: 1.2,
  duration: 3,
  startTime: 0,
  animations: ['zoomIn'],

  // 文字阴影
  textShadow: true,
  textShadowColor: '#6366f1',
  textShadowBlur: 30,
  textShadowOffsetX: 2,
  textShadowOffsetY: 2,

  // 文字描边
  stroke: true,
  strokeColor: '#000000',
  strokeWidth: 2,

  // 渐变
  gradient: true,
  gradientColors: ['#FF6B6B', '#4ECDC4'],
  gradientDirection: 'horizontal',

  // 拆分动画
  split: 'letter',        // letter/word/line
  splitDelay: 0.1,
  splitDuration: 0.3,
});
```

---

## 7. 矩形元素 (Rect)

```javascript
scene.addRect({
  x: '50%', y: '50%',
  width: 600,
  height: 60,
  bgcolor: '#1e1b4b',
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#22c55e',
  shadowBlur: 25,
  shadowColor: '#6366f1',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  opacity: 0.9,
  rotation: 0,
  anchor: [0.5, 0.5],
  duration: 3,
  startTime: 0,
  animations: ['fadeIn'],
});
```

---

## 8. 圆形元素 (Circle)

```javascript
scene.addCircle({
  x: '50%', y: '50%',
  radius: 100,
  color: '#ffffff',
  fill: true,
  borderWidth: 2,
  borderColor: '#8b5cf6',
  opacity: 0.8,
  rotation: 0,
  anchor: [0.5, 0.5],
  duration: 3,
  startTime: 0,
  animations: ['zoomIn'],
});
```

---

## 9. 图片元素 (Image)

```javascript
scene.addImage({
  src: './assets/logo.png',
  x: '50%', y: '50%',
  width: 200,
  height: 200,
  fit: 'cover',         // cover/contain/fill/none
  borderRadius: 0,
  flipX: false,
  flipY: false,
  brightness: 1,        // 0-2
  contrast: 1,          // 0-2
  saturation: 1,        // 0-2
  duration: 3,
  startTime: 0,
  animations: ['fadeIn'],
});
```

---

## 10. 视频元素 (Video)

```javascript
scene.addVideo({
  src: './assets/clip.mp4',
  x: 0, y: 0,
  width: 1920,
  height: 1080,
  cutFrom: 0,           // 裁剪起始（秒）
  cutTo: undefined,     // 裁剪结束（秒）
  speedFactor: 1,       // 播放速度
  loop: false,
  mute: true,
  volume: 1,
  duration: 10,
  startTime: 0,
});
```

---

## 11. SVG 元素

```javascript
scene.addSVG({
  src: './assets/icon.svg',
  x: '50%', y: '50%',
  width: 100,
  height: 100,
  fit: 'contain',
  preserveAspectRatio: true,
  enableSVGAnimations: true,
  duration: 3,
  startTime: 0,
  animations: ['zoomIn'],
});
```

---

## 12. HTML 元素 (HTMLElement)

使用 [Takumi](https://takumi.kane.tw/) 渲染任意 HTML/CSS 为视频元素，特别适合使用 CSS `@keyframes` 动画。

### 安装依赖

```bash
npm install @takumi-rs/core @takumi-rs/helpers
```

### 基础用法

```javascript
scene.addHtml({
  x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
  html: `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1e1b4b;">
      <h1 style="color:white;font-size:64px;">Hello World</h1>
    </div>
  `,
  duration: 5,
});
```

### CSS @keyframes 动画

通过 `timeMs` 自动注入，CSS 动画与视频时间轴同步：

```javascript
scene.addHtml({
  x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
  html: `
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      .spinner {
        width: 120px; height: 120px;
        border: 8px solid rgba(255,255,255,0.1);
        border-top-color: #a78bfa;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      .title {
        font-family: system-ui;
        color: white;
        font-size: 64px;
        animation: pulse 2s ease-in-out infinite;
      }
    </style>
    <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div class="spinner"></div>
      <div class="title">Loading</div>
    </div>
  `,
  duration: 5,
});
```

### 中文字体支持（默认开启）

**HTMLElement 默认开启中文字体支持**，无需手动指定 `fonts`：

- **Windows**: 微软雅黑 (Microsoft YaHei)、黑体 (SimHei)、宋体 (SimSun)
- **macOS**: 苹方 (PingFang SC)、华文黑体 (STHeiti)、宋体 (Songti SC)
- **Linux**: 文泉驿微米黑、文泉驿正黑、Noto Sans CJK SC

```javascript
// ✅ 直接使用，默认就有中文支持
scene.addHtml({
  html: `<div style="font-size:48px;">你好世界</div>`,
  duration: 4,
  // 无需指定 fonts
});

// ✅ 自定义 fonts 覆盖默认
scene.addHtml({
  html: `<div style="font-family:'Microsoft YaHei';font-size:48px;">中文标题</div>`,
  duration: 4,
  fonts: [
    { path: 'C:/Windows/Fonts/msyh.ttc', family: 'Microsoft YaHei' },
    { path: 'C:/Windows/Fonts/simhei.ttf', family: 'SimHei' },
  ],
});
```

### 多场景示例

每个 Scene 必须在**不同的 track** 上：

```javascript
// Scene 1: 0-4 秒（loading 动画）
builder.createTrack()
  .createScene({ duration: 4 })
    .addBackground({ color: '#1e1b4b' })
    .addHtml({ x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: loadingHtml, duration: 4 });

// Scene 2: 4-8 秒（CSS @keyframes 动画）
builder.createTrack()         // ⚠️ 必须用新 track
  .createScene({ duration: 4, startTime: 4 })
    .addBackground({ color: '#0c0a09' })
    .addHtml({ x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: keyframeHtml, duration: 4,
      fonts: [{ path: 'C:/Windows/Fonts/msyh.ttc', family: 'Microsoft YaHei' }] });

await builder.render('output/html-keyframes.mp4', { parallel: true });
```

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `html` | `string` | - | HTML 字符串 |
| `node` | `object` | - | Takumi node tree |
| `x` | `number\|string` | `0` | X 坐标 |
| `y` | `number\|string` | `0` | Y 坐标 |
| `width` | `number\|string` | `800` | 元素宽度 |
| `height` | `number\|string` | `600` | 元素高度 |
| `anchor` | `[number, number]` | `[0.5, 0.5]` | 锚点（左上=0,0；中心=0.5,0.5） |
| `opacity` | `number` | `1` | 透明度 0-1 |
| `rotation` | `number` | `0` | 旋转角度（度） |
| `duration` | `number` | - | 元素显示时长（秒） |
| `startTime` | `number` | `0` | 元素起始时间（秒） |
| `timeOffset` | `number` | `0` | CSS 动画起始偏移（秒） |
| `fonts` | `Array` | - | 字体配置数组 |
| `stylesheets` | `Array<string>` | - | 外部样式表 URL |
| `keyframes` | `object` | - | 结构化 keyframe 定义 |
| `devicePixelRatio` | `number` | - | 设备像素比 |

### 字体配置

```javascript
// URL 方式
fonts: ['https://fonts.googleapis.com/css2?family=Roboto']

// 系统字体路径
fonts: [{ path: 'C:/Windows/Fonts/msyh.ttc', family: 'Microsoft YaHei' }]

// Buffer 方式
fonts: [{ data: fontBuffer }]
```

### 与 FKbuilder 动画结合

```javascript
scene.addHtml({
  html: '<div style="color:white;font-size:48px;">Welcome</div>',
  duration: 5,
  animations: [
    { type: 'transform', from: { opacity: 0, x: -100 }, to: { opacity: 1, x: 0 }, duration: 1, easing: 'easeOut' },
    'fadeIn',
  ],
});
```

### 单独渲染帧（导出函数）

```javascript
import { renderHtmlFrame } from 'fkbuilder';

const rgba = await renderHtmlFrame({
  html: '<div style="color:red;">Test</div>',
  width: 1280,
  height: 720,
  timeMs: 0,
});
// rgba: width * height * 4 的 Buffer（RGBA 格式）
```

### 集成 Tailwind CSS

```bash
# 1. 安装 Tailwind v4
npm install -D tailwindcss @tailwindcss/cli

# 2. 创建 tailwind-input.css
# @import "tailwindcss";
# @theme {
#   --color-brand: #FF6B6B;
# }

# 3. 编译
npx tailwindcss build -i tailwind-input.css -o output/tailwind/tailwind.css --minify
```

```javascript
import fs from 'fs-extra';

const tailwindCss = fs.readFileSync('output/tailwind/tailwind.css', 'utf8');

scene.addHtml({
  x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
  html: `
    <style>${tailwindCss}</style>
    <style>
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      .float { animation: float 3s ease-in-out infinite; }
    </style>
    <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
      <h1 class="text-7xl font-bold text-white float">FKbuilder + Tailwind</h1>
    </div>
  `,
  duration: 5,
});
```

✅ 完全离线，所有 utility 类生效，自定义 `@keyframes` 正常。

**CDN 方式**（更快但功能受限）：
```javascript
html: `<script src="https://cdn.tailwindcss.com"></script>
<div class="bg-gradient-to-br from-purple-600 to-blue-500 ...">`
```

⚠️ Takumi 不执行 `<script>`，hover 等 JS 事件不生效，但 CSS 样式和动画正常。

完整示例：`examples/html-element-with-tailwind.js`

### 注意事项

#### 1. 锚点 (anchor) 设置

`anchor` 控制元素"哪个角"对齐到 `(x, y)`：
- `anchor: [0, 0]` → 元素**左上角**对齐 `(x, y)`
- `anchor: [0.5, 0.5]` → 元素**中心点**对齐 `(x, y)`
- `anchor: [1, 1]` → 元素**右下角**对齐 `(x, y)`

**全屏 HTML 必须用 `anchor: [0, 0]` + `x: 0, y: 0`**：

```javascript
// ✅ 正确：全屏 HTML 左上角对齐画布左上角
.addHtml({
  x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
  html: '...',
})

// ❌ 错误：anchor 默认值 [0.5, 0.5] + x: 0, y: 0
// 会导致元素偏移 (-640, -360)，元素一半在画布外看不见！
.addHtml({
  x: 0, y: 0, width: 1280, height: 720,
  // anchor 默认为 [0.5, 0.5]，元素中心对齐到 (0, 0)
  // 元素最终位置: x = 0 - 1280*0.5 = -640 (超出画布)
  html: '...',
})
```

**居中显示元素的两种方式**：

```javascript
// 方式 1: anchor [0, 0] + x/y 指向画布中心
.addHtml({ x: 640, y: 360, width: 200, height: 100, anchor: [0, 0], html: '...' })

// 方式 2: anchor [0.5, 0.5] + x/y 指向元素中心（即画布中心 640, 360）
.addHtml({ x: 640, y: 360, width: 200, height: 100, anchor: [0.5, 0.5], html: '...' })
```

#### 2. 其它注意事项

1. **必须用不同 track**：多个 HTML 场景必须各自 `createTrack()`，否则会被合并到同一图层导致时间累加错误
2. **Worker 模式**：`parallel: true` 时正常工作，Takumi 在每个 Worker 中独立初始化
3. **中文字体默认支持**：HTMLElement 自动加载系统常见中文字体，无需手动指定 `fonts`
4. **字体名称匹配**：自定义 `fonts` 时，CSS 中 `font-family` 必须和 `fonts` 数组中的 `family` 名称一致
5. **不要多次调用 build()**：`builder.build()` 后又调用 `builder.render()` 会触发重复构建
6. **完整示例**：`examples/html-element-basic.js`、`examples/html-element-keyframes.js`、`examples/html-element-with-font.js`、`examples/html-element-with-tailwind.js`

---

## 13. 音频元素 (Audio)

```javascript
scene.addAudio({
  src: './assets/music.mp3',
  volume: 0.8,
  fadeIn: 2,            // 淡入时长（秒）
  fadeOut: 2,           // 淡出时长（秒）
  cutFrom: 0,
  cutTo: undefined,
  loop: false,
  startTime: 0,
  duration: 30,
});
```

---

## 14. 歌词字幕 (LRC)

从 LRC 文件加载歌词字幕，支持多时间标签格式 `[03:06.90][02:33.64]歌词内容`。

```javascript
// 方式1：从 LRC 文件加载（推荐）
scene.addLRC('./assets/lyrics.lrc', {
  x: '50%', y: '85%',
  fontSize: 48,
  fontFamily: 'Microsoft YaHei',
  textColor: '#ffffff',
  textAlign: 'center',
  split: 'line',
  splitDuration: 0.3,
});

// 方式2：使用 addSubtitles 加载 LRC
scene.addSubtitles({
  src: './assets/lyrics.lrc',
  x: '50%', y: '85%',
  fontSize: 48,
  fontFamily: 'Microsoft YaHei',
  textColor: '#ffffff',
  textAlign: 'center',
});
```

### LRC 字幕选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | number/string | '50%' | X坐标 |
| `y` | number/string | '85%' | Y坐标 |
| `fontSize` | number | 48 | 字体大小 |
| `fontFamily` | string | 'PatuaOne' | 字体名称 |
| `textColor` | string | '#ffffff' | 文字颜色 |
| `textAlign` | string | 'center' | 对齐方式 |
| `split` | string | 'line' | 拆分类型: letter/word/line |
| `splitDuration` | number | 0.3 | 拆分动画时长 |
| `maxLength` | number | 20 | 每行最大字符数 |

---

## 15. 示波器元素 (Oscilloscope)

音频可视化波形显示，支持多种样式。

```javascript
scene.addOscilloscope({
  audioPath: './assets/music.mp3',  // 音频文件路径
  x: '50%', y: '50%',
  width: 400,
  height: 200,
  waveColor: '#00ff00',           // 波形颜色
  backgroundColor: 'rgba(0, 0, 0, 0.3)', // 背景颜色
  lineWidth: 2,                   // 线条宽度
  smoothing: 0.3,                  // 平滑度 (0-1)
  mirror: true,                    // 是否镜像显示
  style: 'line',                  // 样式类型
  sensitivity: 1.0,                // 灵敏度
  cutFrom: 0,                      // 裁剪起始（秒）
  cutTo: undefined,                // 裁剪结束（秒）
  windowSize: 0.1,                 // 显示窗口大小（秒）
  scrollSpeed: 1.0,                // 滚动速度
  duration: 30,                    // 持续时间
  startTime: 0,
});
```

### 示波器样式

| 样式 | 说明 |
|------|------|
| `line` | 线条波形 |
| `bars` | 柱状图 |
| `circle` | 圆形波形 |
| `spectrum` | 频谱 |
| `particles` | 粒子效果 |
| `waterfall` | 瀑布图 |
| `spiral` | 螺旋形 |
| `ripple` | 涟漪效果 |
| `grid` | 网格 |
| `explosion` | 爆炸效果 |
| `blob` | 变形效果 |
| `rotating3d` | 3D旋转 |
| `trail` | 轨迹效果 |
| `weave` | 编织效果 |
| `lightwave` | 光波效果 |
| `particleflow` | 粒子流 |

---

## 16. 字幕元素 (Subtitles)

```javascript
scene.addSubtitles({
  text: 'Hello World',           // 直接文本内容
  x: '50%', y: '85%',
  fontSize: 72,
  fontFamily: 'PatuaOne',
  textColor: '#ffffff',
  position: 'center',
  textAlign: 'center',
  split: 'letter',
  splitDelay: 0.1,
  splitDuration: 0.3,
  maxLength: 20,
  duration: 5,
  startTime: 0,
});
```

---

## 17. 预设动画

使用字符串数组形式：

```javascript
animations: ['zoomIn']
animations: ['fadeInUp']
animations: ['bigIn', 'bigOut']  // 多个动画组合
```

### 淡入/淡出

| 名称 | 效果 |
|------|------|
| `fadeIn` | opacity 0→1 |
| `fadeOut` | opacity 1→0（在结束前1秒自动应用） |
| `fadeInUp` | opacity 0 + Y偏移50 → opacity 1 |
| `fadeInDown` | opacity 0 + Y偏移-50 → opacity 1 |
| `fadeOutUp` | opacity 1 → opacity 0 + Y偏移-50 |
| `fadeOutDown` | opacity 1 → opacity 0 + Y偏移50 |

### 缩放

| 名称 | 效果 |
|------|------|
| `zoomIn` | scale 0→1 |
| `zoomOut` | scale 1→0 |
| `bigIn` | scale 2+opacity 0 → scale 1+opacity 1 |
| `bigOut` | scale 1+opacity 1 → scale 2+opacity 0 |
| `zoomInLeft` | 左上角缩放进入 |
| `zoomInFade` | scale 0.5+opacity 0 → scale 1+opacity 1 |
| `zoomRotateIn` | 缩放+旋转组合 |

### 旋转

| 名称 | 效果 |
|------|------|
| `rotateIn` | rotation -180→0 |
| `rotateOut` | rotation 0→180 |
| `rotateInLeft` | 左旋+淡入 |
| `rotateInRight` | 右旋+淡入 |

### 滑动

| 名称 | 效果 |
|------|------|
| `slideInTop` | 从顶部滑入 |
| `slideInBottom` | 从底部滑入 |
| `slideInLeft` | 从左侧滑入 |
| `slideInRight` | 从右侧滑入 |

### 弹跳

| 名称 | 效果 |
|------|------|
| `bounceIn` | 弹跳进入 |
| `bounceOut` | 弹跳出 |
| `bounceInUp` | 向上弹跳 |
| `bounceInLeft` | 向左弹跳 |

### 其他

| 名称 | 效果 |
|------|------|
| `flipInX` | X轴翻转淡入 |
| `flipInY` | Y轴翻转淡入 |
| `pulse` | 脉动缩放 |
| `shake` | 水平抖动 |
| `flash` | 闪烁 |
| `swing` | 摇摆 |

---

## 18. 转场效果 (Transition)

### 基本用法
```javascript
// 不指定 startTime，系统自动推断转场位置
track.addTransition({ name: 'CrossZoom', duration: 0.5 });
track.addTransition({ name: 'Dreamy', duration: 0.5 });
track.addTransition({ name: 'fade', duration: 0.5 });

// 指定 startTime（可选）
track.addTransition({ name: 'CrossZoom', duration: 0.5, startTime: 2.5 });
```

### 转场行为要点

**重要**：转场在 GL 层面预渲染 fromFrame 和 toFrame，然后混合。

- `fromScene` 元素的 endTime 会被调整为 `transitionStartTime`（转场开始时间）
- `toScene` 的 startTime 会被覆盖为 `transitionEndTime`（转场结束时间）
- 转场期间（transitionStartTime ~ transitionEndTime），两个场景元素都不在主时间轴显示，由预渲染帧负责视觉混合

**预渲染帧时间点**：
- `fromFrame` 在 `transitionStartTime - 0.001s` 渲染（确保 fromScene 元素仍可见）
- `toFrame` 在 `transitionEndTime` 渲染（此时 toScene 元素已可见）

### 转场位置计算

当不指定 `startTime` 时：
- 转场居中在两个场景的交界处
- `transitionStartTime = sceneEndTime - duration/2`
- `transitionEndTime = sceneEndTime + duration/2`

例如：场景1 (0-3s) + 转场 (0.5s) + 场景2 (3-6s)
- 转场1: 2.75-3.25s
- 场景1 元素 endTime = 2.75
- 场景2 元素 startTime = 3.25

### 可用转场

| 转场 | 说明 |
|------|------|
| `CrossZoom` | 缩放交叉 |
| `Dreamy` | 梦幻效果 |
| `GridFlip` | 网格翻转 |
| `CircleOpen` | 圆形展开 |
| `fade` | 淡入淡出 |
| `wipeRight` | 向右扫出 |
| `wipeLeft` | 向左扫出 |
| `wipeUp` | 向上扫出 |
| `wipeDown` | 向下扫出 |
| `Swirl` | 漩涡效果 |
| `ZoomInCircles` | 圆形缩放 |
| `Mosaic` | 马赛克 |

---

## 19. onFrame 回调

```javascript
scene.addCircle({
  x: '50%', y: '50%',
  radius: 100,
  duration: 5,
  onFrame: (el, ev, item) => {
    // el: 元素实例
    // ev: 事件对象 { time, delta, count }
    // item: Paper.js 渲染项

    // 旋转
    item.rotation = ev.time * 30;

    // 脉冲缩放
    const scale = 1 + Math.sin(ev.time * 4) * 0.1;
    item.scaleX = scale;
    item.scaleY = scale;

    // 闪烁
    item.opacity = 0.3 + Math.sin(ev.time * 5) * 0.4;
  },
});
```

---

## 20. 重要细节

### 0. 多次调用 builder.build() 会导致时间累加错误

`builder.build()` 会修改原始元素的 `startTime` 和 `endTime` 属性。如果先调用 `build()` 查看结构，再调用 `builder.render()`（内部又会调用 `build()`），元素时间会重复累加。

**修复**：`Track.build` 内部使用 `_absoluteTimeSet` 标记防止重复处理，但**最佳实践**是：直接调用 `builder.render()`，不要额外手动调用 `builder.build()`。

```javascript
// ❌ 错误：先 build 再 render，会导致时间累加
const vm = builder.build();   // 第一次 build
await builder.render(path);    // 第二次 build（render 内部调用）

// ✅ 正确：直接 render
await builder.render(path);
```

### 1. 元素可见性判断

元素使用 `<` 而非 `<=` 判断结束：
```javascript
isActiveAtTime(time) {
  return this.visible && time >= this.startTime && time < this.endTime;
}
```
这意味着元素在 `endTime` 时刻不再可见。

### 2. 元素时间系统

- `scene.startTime`: 场景开始时间（绝对时间）
- `element.startTime`: 元素相对于场景的开始时间
- `element.duration`: 元素的持续时间
- `element.endTime`: 元素的结束时间 = sceneStartTime + elementStartTime + duration

### 3. 元素时间不能超过场景时间

**重要**：元素的 endTime 不能超过场景的结束时间。超过的部分会被自动截断，并输出警告。

```javascript
// 错误示例：元素的 endTime 超过了场景的结束时间
const scene = track.createScene({ duration: 3, startTime: 0 });
scene.addText({
  text: 'Hello',
  duration: 5,  // 错误！元素持续时间超过场景时间
});

// 正确示例：元素的 endTime 应在场景范围内
const scene = track.createScene({ duration: 3, startTime: 0 });
scene.addText({
  text: 'Hello',
  duration: 3,  // 正确：元素持续时间等于场景时间
});
```

转场时，系统以**转场调整后的场景结束时间**为准：
- 转场会缩短 fromScene 的 duration，使其在 transitionStartTime 结束
- 因此 fromScene 元素的 endTime 不能超过 transitionStartTime

### 4. 百分比坐标

坐标支持 "50%" 形式，表示画布中心：
```javascript
x: '50%', y: '50%'  // 画布中心
x: '0%', y: '0%'    // 左上角
x: '100%', y: '100%' // 右下角
```

### 5. Scene.startTime 的影响

- 如果不设置 `scene.startTime`，系统会基于前一个场景的结束时间自动推断
- 当添加转场时，`toScene.startTime` 会被强制覆盖为 `transitionEndTime`

### 6. 音频需要特殊处理

音频元素通常应该添加到独立的音频轨道，或者在场景外添加：
```javascript
// 方式1：全局音频
composition.addAudio({ src: './music.mp3', startTime: 0, volume: 0.5 });

// 方式2：通过 builder 的 audioTracks
builder.audioTracks = [{ src: './music.mp3', startTime: 0, volume: 0.5 }];
```

### 7. SVG 异步加载

SVG 元素需要异步加载，如果渲染时 SVG 还未加载完成，会导致问题。使用 `initialize()` 预加载：
```javascript
await builder.initialize();  // 预加载所有资源
await builder.render(outputPath);
```

### 8. 字体注册

如果使用自定义字体，需要先注册：
```javascript
import { registerFont } from 'fkbuilder';
registerFont('./fonts/CustomFont.ttf', 'CustomFont');
```

---

## 21. 完整示例

### 促销视频
```javascript
import { VideoBuilder } from 'fkbuilder';
import path from 'path';

async function createPromoVideo() {
  const builder = new VideoBuilder({
    width: 1280,
    height: 720,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 场景 1: 标题 (0s - 3s)
  const scene1 = track.createScene({ duration: 3, startTime: 0 });
  scene1.addBackground({ color: '#0f0f23' });
  scene1.addText({
    text: 'FOLIKO',
    x: '50%', y: '40%',
    fontSize: 120, fontFamily: 'Arial Black', fontWeight: 'bold',
    color: '#ffffff', textAlign: 'center', textBaseline: 'middle',
    duration: 3,
    animations: ['zoomIn'],
    textShadow: true, textShadowColor: '#6366f1', textShadowBlur: 30,
  });

  // 场景 2: 特性展示 (3s - 6s)
  const scene2 = track.createScene({ duration: 3, startTime: 3 });
  scene2.addBackground({ color: '#1a1a2e' });
  scene2.addText({
    text: '40+ 插件',
    x: '50%', y: '30%',
    fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold',
    color: '#8b5cf6', textAlign: 'center',
    duration: 3, animations: ['fadeInUp'],
  });

  // 转场（不指定 startTime，系统自动推断）
  track.addTransition({ name: 'CrossZoom', duration: 0.5 });
  track.addTransition({ name: 'Dreamy', duration: 0.5 });

  const outputPath = './output/promo.mp4';
  const result = await builder.render(outputPath, {
    parallel: false,
    usePipe: true,
  });

  console.log(`渲染完成: ${result}`);
}

createPromoVideo().catch(console.error);
```

---

## 22. 目录结构

```
project/
├── output/
│   └── video.mp4
├── examples/
│   └── render-video.mjs
└── assets/
    ├── music.mp3
    ├── image.png
    └── icon.svg
```

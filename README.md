# FKbuilder - 程序化视频生成库

基于 Node.js + Paper.js 的纯 JavaScript 视频制作库，提供简洁的 API 和强大的功能。

## ✨ 核心特性

- 🎬 **多轨道多场景** - 灵活的轨道和场景管理系统，支持复杂的视频结构
- 🎨 **丰富的元素类型** - 文本、图片、视频、形状、音频、字幕、示波器、SVG、JSON 等
- ✨ **强大的动画系统** - 预设动画、关键帧动画、变换动画、onFrame 持续动画
- 🎯 **精确的时间控制** - 灵活的时间线管理和元素时间控制
- 🚀 **高性能渲染** - 基于 Paper.js 的 2D 渲染引擎，支持实例化
- 🎭 **丰富的转场效果** - 支持 gl-transitions 转场库（20+ 种转场效果）
- 📝 **文本特效** - 渐变、阴影、发光、描边、文字拆分动画
- 📹 **视频导出** - 支持 MP4 格式导出，支持管道模式和文件模式
- ⚡ **持续动画支持** - 通过 onFrame 回调实现每帧更新的持续动画效果
- 🔧 **组件化设计** - 可复用的组件系统，支持相对坐标和时间控制
- ⚙️ **并行渲染** - 支持 Worker Threads 并行渲染，大幅提升渲染性能
- 🔗 **上下文关联** - 在并行渲染中自动传递上下文变量，支持闭包变量

## 📦 安装

### 通过 npm 安装

```bash
npm install fkbuilder
# 或
yarn add fkbuilder
# 或
pnpm add fkbuilder
```

### 本地开发安装

```bash
git clone <repository-url>
cd FKbuilder
npm install
```

## 🔧 系统要求

- Node.js >= 16.0.0
- FFmpeg（用于视频编码）

### 安装 FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
下载并安装 [FFmpeg](https://ffmpeg.org/download.html)，确保添加到系统 PATH。

## 🚀 快速开始

### 基础示例

**ESM 模块（推荐）：**

```javascript
import { VideoBuilder } from 'fkbuilder';
```

**CommonJS 模块：**

```javascript
const { VideoBuilder } = require('fkbuilder');
```

**完整示例：**

```javascript
import { VideoBuilder } from 'fkbuilder';

// 创建视频构建器
const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 30,
});

// 创建轨道
const track = builder.createTrack({ zIndex: 1 });

// 创建场景
const scene = track.createScene({ duration: 5 })
  .addBackground({ color: '#1a1a2e' })
  .addText({
    text: 'Hello, World!',
    x: '50%',
    y: '50%',
    fontSize: 80,
    color: '#ffffff',
    textAlign: 'center',
    duration: 5,
    startTime: 0,
    animations: ['fadeIn'],
  });

// 渲染视频（自动 build 和 export）
await builder.render('./output/video.mp4');
```

## 📚 核心概念

### VideoBuilder（视频构建器）

视频构建器是创建视频的入口，管理所有轨道和场景。

```javascript
const builder = new VideoBuilder({
  width: 1920,        // 视频宽度
  height: 1080,       // 视频高度
  fps: 30,            // 帧率
});
```

**主要方法：**
- `createTrack(config)` - 创建轨道
- `render(outputPath, options)` - 渲染视频（自动 build 和 export）
- `export(outputPath, options)` - 导出视频
- `build()` - 构建 VideoMaker 对象
- `initialize()` - 初始化（预加载资源）

### Track（轨道）

轨道用于组织场景，支持多个轨道叠加。

```javascript
// 创建轨道
const track = builder.createTrack({ 
  zIndex: 1,          // 层级（数字越大越在上层）
  name: '主轨道'      // 轨道名称（可选）
});

// 添加组件到轨道
track.addComponent(component);
```

### Scene（场景）

场景是视频的基本单元，包含多个元素。

```javascript
// 创建场景
const scene = track.createScene({ 
  duration: 5,        // 场景时长（秒）
  startTime: 0,       // 开始时间（可选，不指定则自动计算）
});

// 添加组件到场景
scene.addComponent(component);
```

### Component（组件）

组件是可复用的元素容器，有自己的宽高和时间控制。组件内的元素使用相对坐标（相对于组件）。

```javascript
import { Component } from 'fkbuilder';

// 创建组件
const cardComponent = new Component({
  name: 'Card',
  width: 400,         // 组件宽度
  height: 300,        // 组件高度
  x: '50%',           // 组件位置（相对于父容器）
  y: '50%',
  anchor: [0.5, 0.5], // 锚点
  startTime: 0,       // 开始时间（相对于父容器）
  duration: 5,        // 持续时间
  zIndex: 10,
});

// 在组件内添加元素（使用相对坐标）
cardComponent
  .addBackground({ color: '#2e3b3c' })
  .addRect({
    x: '50%',         // 相对于组件中心
    y: '50%',
    width: '80%',     // 相对于组件宽度
    height: '60%',    // 相对于组件高度
    fillColor: '#5acbed',
  })
  .addText({
    text: '卡片标题',
    x: '50%',
    y: '30%',
    fontSize: 36,
    color: '#ffffff',
  });

// 添加到场景或轨道
scene.addComponent(cardComponent);
// 或
track.addComponent(cardComponent);
```

## 🎨 元素类型

### 文本元素

```javascript
scene.addText({
  text: 'Hello',
  x: '50%',           // 支持百分比和像素值
  y: '50%',
  fontSize: 72,
  fontFamily: 'Arial',
  color: '#ffffff',
  textAlign: 'center',
  duration: 5,
  startTime: 0,
  // 文本效果
  textShadow: true,
  textShadowColor: '#000000',
  textShadowBlur: 20,
  gradient: true,
  gradientColors: ['#FF6B6B', '#4ECDC4'],
  gradientDirection: 'horizontal',
  textGlow: true,
  textGlowColor: '#FFFFFF',
  textGlowBlur: 30,
  stroke: true,
  strokeColor: '#000000',
  strokeWidth: 2,
  // 文字拆分动画
  split: 'letter',    // 'letter', 'word', 'line' 或 null
  splitDelay: 0.1,
  // 动画
  animations: ['fadeIn', 'bigIn'],
  // onFrame 持续动画
  onFrame: (element, progress, time) => {
    // 每帧更新
  },
});
```

### 图片元素

```javascript
scene.addImage({
  src: './path/to/image.jpg',
  x: '50%',
  y: '50%',
  width: 800,
  height: 600,
  anchor: [0.5, 0.5],
  fit: 'cover',       // 'cover', 'contain', 'fill', 'none'
  duration: 5,
  startTime: 0,
  animations: ['zoomIn'],
  borderRadius: 20,
  shadowBlur: 30,
  shadowColor: '#000000',
});
```

### 视频元素

```javascript
scene.addVideo({
  src: './path/to/video.mp4',
  x: '50%',
  y: '50%',
  width: 1920,
  height: 1080,
  anchor: [0.5, 0.5],
  fit: 'cover',
  duration: 10,
  startTime: 0,
  animations: ['fadeIn'],
});
```

### 形状元素

```javascript
// 矩形
scene.addRect({
  x: '50%',
  y: '50%',
  width: 400,
  height: 300,
  bgcolor: '#4a90e2',
  borderRadius: 20,
  anchor: [0.5, 0.5],
  duration: 5,
  startTime: 0,
  animations: ['fadeIn'],
});

// 圆形
scene.addCircle({
  x: '50%',
  y: '50%',
  radius: 100,
  fillColor: '#ff6b6b',
  strokeColor: '#ffffff',
  strokeWidth: 3,
  anchor: [0.5, 0.5],
  duration: 5,
  startTime: 0,
  animations: ['bounce'],
});

// 路径
scene.addPath({
  points: [[0, 0], [100, 50], [200, 0]],
  closed: true,
  fillColor: '#4ECDC4',
  strokeColor: '#ffffff',
  strokeWidth: 2,
  duration: 5,
  startTime: 0,
});
```

### 音频元素

```javascript
scene.addAudio({
  src: './path/to/audio.mp3',
  startTime: 0,
  duration: 10,
  volume: 1.0,
  fadeIn: 1,          // 淡入时长（秒）
  fadeOut: 1,         // 淡出时长（秒）
});
```

### 字幕元素

```javascript
scene.addSubtitle({
  text: '这是一段字幕文本，会根据时长自动分割',
  fontSize: 48,
  color: '#ffffff',
  position: 'center', // 'center', 'top', 'bottom'
  duration: 10,
  startTime: 0,
  maxLength: 20,      // 每段最大字符数
  // 支持所有文本效果
  textShadow: true,
  gradient: true,
  animations: ['fadeIn'],
});
```

### LRC 歌词字幕

```javascript
scene.addLRC({
  lrcPath: './path/to/lyrics.lrc',
  fontSize: 48,
  color: '#ffffff',
  position: 'bottom',
  // 支持所有文本效果
  textShadow: true,
  animations: ['fadeIn'],
});
```

### 示波器元素

```javascript
scene.addOscilloscope({
  audioPath: './path/to/audio.mp3',
  x: '50%',
  y: '50%',
  width: 1600,
  height: 200,
  waveColor: '#4ECDC4',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  style: 'line',      // 'line', 'bars', 'particles', 'blob', 'circle', 'spectrum' 等
  lineWidth: 3,
  mirror: true,       // 是否镜像显示
  duration: 10,
  startTime: 0,
  animations: ['fadeIn'],
});
```

### SVG 元素

```javascript
scene.addSVG({
  src: './path/to/image.svg',
  x: '50%',
  y: '50%',
  width: 800,
  height: 600,
  duration: 5,
  startTime: 0,
  animations: ['fadeIn'],
});
```

### JSON 元素（Paper.js 路径）

```javascript
scene.addJSON({
  json: {
    type: 'Path',
    pathData: 'M 0,0 L 100,100',
    fillColor: '#4ECDC4',
  },
  x: '50%',
  y: '50%',
  duration: 5,
  startTime: 0,
});
```

## 🎭 转场效果

```javascript
// 添加转场效果
// 注意：不需要指定 fromScene 和 toScene，系统会根据 startTime 自动找到对应的场景
track.addTransition({
  name: 'CrossZoom',  // 转场效果名称
  duration: 1,        // 转场时长（秒）
  startTime: scene2StartTime, // 转场结束时间（目标场景开始的时间）
});

// 使用示例：
let currentTime = 0;
const sceneDuration = 4;
const transitionDuration = 1;

// 场景1
const scene1 = track.createScene({
  duration: sceneDuration,
  startTime: currentTime,
});
currentTime += sceneDuration;

// 场景2（与场景1重叠，重叠部分用于转场）
const scene2StartTime = currentTime - transitionDuration;
const scene2 = track.createScene({
  duration: sceneDuration,
  startTime: scene2StartTime,
});

// 添加转场（从场景1转到场景2）
track.addTransition({
  name: 'CrossZoom',
  duration: transitionDuration,
  startTime: scene2StartTime, // 转场结束时间 = 场景2开始时间
});
```

**常用转场效果：**
- `fade` - 淡入淡出
- `CrossZoom` - 交叉缩放
- `CircleCrop` - 圆形裁剪
- `LinearBlur` - 线性模糊
- `Swirl` - 漩涡
- `Directional` - 方向擦除
- `Bounce` - 弹跳
- `Dreamy` - 梦幻
- `Radial` - 径向
- `GridFlip` - 网格翻转
- `Mosaic` - 马赛克
- `PolkaDotsCurtain` - 圆点窗帘
- `ZoomInCircles` - 圆形缩放
- `directional-left/right/up/down` - 方向性转场（别名）

支持所有 [gl-transitions](https://gl-transitions.com/) 转场效果。

## ✨ 动画系统

### 预设动画

```javascript
// 使用预设动画名称
animations: ['fadeIn', 'bigIn', 'bounceIn', 'slideInLeft', 'rotate', 'scale']
```

### 自定义动画

```javascript
import { TransformAnimation, KeyframeAnimation } from 'fkbuilder';

// 变换动画
const transform = new TransformAnimation({
  duration: 1.5,
  delay: 0,
  from: { scaleX: 0.5, scaleY: 0.5, rotation: 0, opacity: 0 },
  to: { scaleX: 1, scaleY: 1, rotation: 360, opacity: 1 },
  easing: 'ease-out',
});

// 关键帧动画
const keyframe = new KeyframeAnimation({
  duration: 2,
  keyframes: [
    { time: 0, value: { x: 0, y: 0 } },
    { time: 0.5, value: { x: 100, y: 50 } },
    { time: 1, value: { x: 200, y: 0 } },
  ],
  property: 'position',
  easing: 'ease-in-out',
});

// 添加到元素
element.addAnimation(transform);
element.addAnimation(keyframe);
```

### onFrame 持续动画

`onFrame` 回调函数可以在每一帧更新元素，实现持续动画效果（如旋转、脉冲、闪烁等）：

```javascript
import { withContext } from 'fkbuilder';

// 持续旋转的圆形
const rotationSpeed = 3;
const onFrame = withContext((element, progress, time) => {
  element.rotation += rotationSpeed;
  const pulse = 1 + Math.sin(time * 4) * 0.2;
  if (element.config) {
    element.config.scaleX = pulse;
    element.config.scaleY = pulse;
  }
}, { rotationSpeed });

scene.addCircle({
  x: '50%',
  y: '50%',
  radius: 100,
  fillColor: '#4ECDC4',
  duration: 10,
  startTime: 0,
  onFrame: onFrame,
});
```

**上下文关联（并行渲染支持）：**

在并行渲染中，闭包变量会丢失。使用 `withContext` 可以自动关联上下文变量：

```javascript
import { withContext } from 'fkbuilder';

const rotationSpeed = 3;
const phaseOffset = 0.5;

// 使用 withContext 自动关联上下文
const onFrame = withContext((element, progress, time) => {
  element.rotation += rotationSpeed;
  const pulse = 1 + Math.sin(time * 4 + phaseOffset) * 0.2;
  if (element.config) {
    element.config.scaleX = pulse;
    element.config.scaleY = pulse;
  }
}, { rotationSpeed, phaseOffset }); // ES6 简写语法

element.onFrame = onFrame;
```

## ⚡ 并行渲染

FKbuilder 支持 Worker Threads 并行渲染，大幅提升渲染性能。

```javascript
await builder.render(outputPath, {
  parallel: true,        // 启用并行渲染
  usePipe: true,         // 使用管道模式（推荐，内存占用低）
  maxWorkers: 4,         // Worker 数量（默认根据 CPU 核心数）
});
```

**渲染模式：**

- **串行渲染** (`parallel: false`) - 单线程渲染，支持所有功能
- **并行渲染** (`parallel: true`) - 多线程渲染，支持大部分功能
  - **管道模式** (`usePipe: true`) - 实时写入 FFmpeg，内存占用低（推荐）
  - **文件模式** (`usePipe: false`) - 先保存帧文件，再编码，适合调试

**并行渲染特性：**

- ✅ 支持所有元素类型
- ✅ 支持动画和转场效果
- ✅ 支持 `onFrame` 持续动画（需使用 `withContext`）
- ✅ 支持组件
- ✅ 支持字体注册
- ✅ 自动处理转场帧（主线程预处理）

## 🎯 预设动画列表

- `fadeIn` - 淡入
- `fadeOut` - 淡出
- `zoomIn` - 放大进入
- `zoomOut` - 放大退出
- `bigIn` - 放大进入
- `bigOut` - 放大退出
- `bounceIn` - 弹跳进入
- `bounceOut` - 弹跳退出
- `slideInLeft` - 从左滑入
- `slideInRight` - 从右滑入
- `slideInUp` - 从上滑入
- `slideInDown` - 从下滑入
- `slideInTop` - 从顶部滑入
- `slideInBottom` - 从底部滑入
- `slideOutLeft` - 向左滑出
- `slideOutRight` - 向右滑出
- `slideOutUp` - 向上滑出
- `slideOutDown` - 向下滑出
- `fadeInUp` - 淡入上移
- `fadeInDown` - 淡入下移
- `rotate` - 旋转
- `scale` - 缩放
- `bounce` - 弹跳

## 🎬 转场效果列表

支持所有 [gl-transitions](https://gl-transitions.com/) 转场效果，包括：

- `fade` - 淡入淡出
- `CrossZoom` - 交叉缩放
- `CircleCrop` - 圆形裁剪
- `LinearBlur` - 线性模糊
- `Swirl` - 漩涡
- `Directional` - 方向擦除
- `Bounce` - 弹跳
- `Dreamy` - 梦幻
- `Radial` - 径向
- `GridFlip` - 网格翻转
- `Mosaic` - 马赛克
- `PolkaDotsCurtain` - 圆点窗帘
- `ZoomInCircles` - 圆形缩放
- `directional-left/right/up/down` - 方向性转场（别名）

更多转场效果请参考 [gl-transitions](https://gl-transitions.com/)。

## 📖 完整示例

### 多轨道多场景示例

```javascript
import { VideoBuilder } from 'fkbuilder';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createVideo() {
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  // 轨道1：主内容
  const track1 = builder.createTrack({ zIndex: 1 });
  
  let currentTime = 0;
  const sceneDuration = 4;
  const transitionDuration = 1;

  // 场景1
  const scene1 = track1.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: '场景 1',
      x: '50%',
      y: '50%',
      fontSize: 100,
      color: '#ffffff',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration;

  // 场景2
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = track1.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: '#2d3436' })
    .addText({
      text: '场景 2',
      x: '50%',
      y: '50%',
      fontSize: 100,
      color: '#ffffff',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      animations: ['fadeIn'],
    });

  // 添加转场（从场景1转到场景2）
  track1.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: scene2StartTime, // 转场结束时间 = 场景2开始时间
  });

  // 轨道2：叠加层
  const track2 = builder.createTrack({ zIndex: 2 });
  const overlay = track2.createScene({ duration: 8, startTime: 0 })
    .addText({
      text: '顶部标题',
      x: '50%',
      y: '10%',
      fontSize: 48,
      color: '#f39c12',
      textAlign: 'center',
      duration: 8,
      startTime: 0,
    });

  // 渲染视频
  const outputPath = path.join(__dirname, 'output/video.mp4');
  await builder.render(outputPath, {
    parallel: true,
    usePipe: true,
    maxWorkers: 4,
  });
}

createVideo().catch(console.error);
```

### 组件使用示例

```javascript
import { VideoBuilder, Component } from 'fkbuilder';

const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 30,
});

const track = builder.createTrack({ zIndex: 1 });

// 创建一个可复用的卡片组件
const cardComponent = new Component({
  name: 'Card',
  width: 400,
  height: 300,
  x: '50%',
  y: '50%',
  anchor: [0.5, 0.5],
  startTime: 0,
  duration: 5,
});

// 在组件内添加元素（使用相对坐标）
cardComponent
  .addBackground({ color: '#2e3b3c' })
  .addRect({
    x: '50%',         // 相对于组件中心
    y: '50%',
    width: '90%',     // 相对于组件宽度
    height: '85%',    // 相对于组件高度
    fillColor: '#5acbed',
    borderRadius: 20,
  })
  .addText({
    text: '卡片标题',
    x: '50%',
    y: '30%',
    fontSize: 36,
    color: '#ffffff',
    textAlign: 'center',
  });

// 在场景中使用组件
const scene = track.createScene({ duration: 5, startTime: 0 });
scene.addBackground({ color: '#1a1a2e' });
scene.addComponent(cardComponent);

// 可以复用组件，改变位置和时间
const scene2 = track.createScene({ duration: 5, startTime: 5 });
scene2.addBackground({ color: '#1a1a2e' });
scene2.addComponent({
  ...cardComponent,
  x: '25%',  // 不同的位置
  y: '50%',
});

await builder.render('./output/video.mp4');
```

### onFrame 持续动画示例

```javascript
import { VideoBuilder, withContext } from 'fkbuilder';

const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 60,
});

const track = builder.createTrack({ zIndex: 1 });
const scene = track.createScene({ duration: 10, startTime: 0 });
scene.addBackground({ color: '#0a0a0a' });

// 持续旋转的圆形
const rotationSpeed = 3;
const onFrameRotate = withContext((element, progress, time) => {
  element.rotation += rotationSpeed;
}, { rotationSpeed });

scene.addCircle({
  x: '30%',
  y: '50%',
  radius: 100,
  fillColor: '#4ECDC4',
  duration: 10,
  startTime: 0,
  onFrame: onFrameRotate,
});

// 脉冲动画
const pulseSpeed = 4;
const pulseAmplitude = 0.2;
const onFramePulse = withContext((element, progress, time) => {
  const pulse = 1 + Math.sin(time * pulseSpeed) * pulseAmplitude;
  if (element.config) {
    element.config.scaleX = pulse;
    element.config.scaleY = pulse;
  }
}, { pulseSpeed, pulseAmplitude });

scene.addCircle({
  x: '70%',
  y: '50%',
  radius: 100,
  fillColor: '#FF6B6B',
  duration: 10,
  startTime: 0,
  onFrame: onFramePulse,
});

await builder.render('./output/video.mp4', {
  parallel: true,
  usePipe: true,
});
```

### 文字拆分动画示例

```javascript
scene.addText({
  text: 'FKbuilder',
  x: '50%',
  y: '50%',
  fontSize: 120,
  color: '#ffffff',
  textAlign: 'center',
  duration: 5,
  startTime: 0,
  split: 'letter',        // 逐字拆分
  splitDelay: 0.1,        // 每个字符延迟 0.1 秒
  animations: ['fadeIn'], // 每个字符的动画
  textShadow: true,
  stroke: true,
  strokeColor: '#000000',
  strokeWidth: 2,
});
```

### 文本效果示例

```javascript
scene.addText({
  text: '渐变文字',
  x: '50%',
  y: '50%',
  fontSize: 100,
  textAlign: 'center',
  duration: 5,
  startTime: 0,
  // 渐变效果
  gradient: true,
  gradientColors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
  gradientDirection: 'horizontal', // 'horizontal', 'vertical', 'diagonal'
  // 阴影效果
  textShadow: true,
  textShadowColor: '#000000',
  textShadowBlur: 20,
  textShadowOffsetX: 5,
  textShadowOffsetY: 5,
  // 发光效果
  textGlow: true,
  textGlowColor: '#FFFFFF',
  textGlowBlur: 30,
  textGlowIntensity: 1,
  // 描边效果
  stroke: true,
  strokeColor: '#000000',
  strokeWidth: 3,
  strokeStyle: 'solid', // 'solid', 'dashed', 'dotted'
});
```

## 🔧 单位系统

FKbuilder 支持多种单位，方便响应式设计：

- **百分比** (`%`) - 相对于父容器
- **视口单位** (`vw`, `vh`) - 相对于视频尺寸
- **响应式像素** (`rpx`) - 类似小程序 rpx，750rpx = 100% width
- **像素** (`px`) - 绝对像素值

```javascript
element.addText({
  x: '50%',        // 水平居中
  y: '30vh',       // 距离顶部 30% 视频高度
  width: '80vw',   // 宽度为 80% 视频宽度
  fontSize: '5rpx', // 响应式字体大小
});
```

## 📁 项目结构

```
FKbuilder/
├── src/
│   ├── core/              # 核心类（VideoMaker, Renderer, VideoExporter）
│   ├── elements/          # 元素类（Text, Image, Video, Shape 等）
│   ├── layers/            # 图层类
│   ├── animations/        # 动画类
│   ├── builder/           # 构建器类（VideoBuilder, Track, Scene, Component, Transition）
│   ├── utils/             # 工具函数
│   ├── workers/           # Worker 线程（并行渲染）
│   └── types/             # 类型定义
├── examples/              # 使用示例
├── assets/                # 资源文件
├── output/                # 输出目录
└── docs/                  # 文档
```

## 📝 示例文件

查看 `examples/` 目录获取更多示例：

- `cool-video.js` - 酷炫视频示例
- `cool-video-with-context.js` - 上下文关联示例
- `test-component.js` - 组件使用示例
- `demo-video.js` - 完整功能演示
- `project-intro-video.js` - 项目简介视频示例
- `test-worker-parallel-rendering.js` - 并行渲染性能测试

运行示例：

```bash
node examples/cool-video.js
node examples/test-component.js
node examples/demo-video.js
```

## 🚀 性能优化

### 并行渲染

对于长视频（>100 帧），建议使用并行渲染：

```javascript
await builder.render(outputPath, {
  parallel: true,
  usePipe: true,
  maxWorkers: 4,  // 根据 CPU 核心数调整
});
```

### 管道模式

管道模式可以大幅降低内存占用，推荐使用：

```javascript
await builder.render(outputPath, {
  usePipe: true,  // 使用管道模式（默认）
});
```

## 📄 API 参考

### VideoBuilder

```javascript
const builder = new VideoBuilder(config);
builder.createTrack(config);
builder.render(outputPath, options);
builder.export(outputPath, options);
builder.build();
builder.initialize();
```

### Track

```javascript
const track = builder.createTrack(config);
track.createScene(config);
track.addTransition(config);
track.addComponent(component);
```

### Scene

```javascript
const scene = track.createScene(config);
scene.addBackground(config);
scene.addText(config);
scene.addImage(config);
scene.addVideo(config);
scene.addRect(config);
scene.addCircle(config);
scene.addPath(config);
scene.addSVG(config);
scene.addJSON(config);
scene.addAudio(config);
scene.addSubtitle(config);
scene.addOscilloscope(config);
scene.addComponent(component);
```

### Component

```javascript
const component = new Component(config);
component.addBackground(config);
component.addText(config);
component.addImage(config);
// ... 支持所有元素类型
```

### 工具函数

```javascript
import { withContext, autoContext, smartContext } from 'fkbuilder';

// 上下文关联（用于并行渲染）
const onFrame = withContext((element, progress, time) => {
  // 使用上下文变量
}, { variable1, variable2 });
```

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 相关链接

- [GitHub Repository](https://github.com/your-repo/FKbuilder)
- [Paper.js Documentation](http://paperjs.org/)
- [gl-transitions](https://gl-transitions.com/)

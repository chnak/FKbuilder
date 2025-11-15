# FKbuilder - 程序化视频生成库

基于 Node.js + Paper.js 的纯 JavaScript 视频制作库，提供简洁的 API 和强大的功能。

## ✨ 特性

- 🎬 **多轨道多场景** - 灵活的轨道和场景管理系统
- 🎨 **丰富的元素类型** - 文本、图片、视频、形状、音频、字幕、示波器等
- ✨ **强大的动画系统** - 预设动画、关键帧动画、变换动画、onFrame 持续动画
- 🎯 **精确的时间控制** - 灵活的时间线管理和元素时间控制
- 🚀 **高性能渲染** - 基于 Paper.js 的 2D 渲染引擎
- 🎭 **丰富的转场效果** - 支持 gl-transitions 转场库
- 📝 **文本特效** - 渐变、阴影、发光、描边、文字拆分动画
- 📹 **视频导出** - 支持 MP4 格式导出
- ⚡ **持续动画支持** - 通过 onFrame 回调实现每帧更新的持续动画效果

## 📦 安装

```bash
npm install
# 或
yarn install
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

```javascript
import { VideoBuilder } from './src/index.js';

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

// 导出视频（导出完成后会自动销毁 builder）
await builder.export('./output/video.mp4');
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

### Track（轨道）

轨道用于组织场景，支持多个轨道叠加。

```javascript
// 创建轨道
const track = builder.createTrack({ 
  zIndex: 1,          // 层级（数字越大越在上层）
  name: '主轨道'      // 轨道名称（可选）
});
```

### Scene（场景）

场景是视频的基本单元，包含多个元素。

```javascript
// 创建场景
const scene = track.createScene({ 
  duration: 5,        // 场景时长（秒）
  startTime: 0,       // 开始时间（可选，不指定则自动计算）
});
```

### 元素类型

#### 文本元素

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
});
```

#### 图片元素

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

#### 视频元素

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

#### 形状元素

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
  bgcolor: '#ff6b6b',
  anchor: [0.5, 0.5],
  duration: 5,
  startTime: 0,
  animations: ['bounce'],
});
```

#### 音频元素

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

#### 字幕元素

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

#### LRC 歌词字幕

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

#### 示波器元素

```javascript
scene.addOscilloscope({
  audioPath: './path/to/audio.mp3',
  x: '50%',
  y: '50%',
  width: 1600,
  height: 200,
  waveColor: '#4ECDC4',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  style: 'line',      // 'line' 或 'bars'
  lineWidth: 3,
  mirror: true,       // 是否镜像显示
  duration: 10,
  startTime: 0,
  animations: ['fadeIn'],
});
```

### 转场效果

```javascript
// 添加转场效果
track.addTransition({
  name: 'fade',       // 转场效果名称
  duration: 1,        // 转场时长（秒）
  startTime: 5,       // 转场结束时间（目标场景开始时间）
});

// 常用转场效果：
// - fade: 淡入淡出
// - CrossZoom: 交叉缩放
// - CircleCrop: 圆形裁剪
// - LinearBlur: 线性模糊
// - Swirl: 漩涡
// - Directional: 方向擦除
// - Bounce: 弹跳
// - Dreamy: 梦幻
// - Radial: 径向
// - GridFlip: 网格翻转
// - Mosaic: 马赛克
// - PolkaDotsCurtain: 圆点窗帘
// - ZoomInCircles: 圆形缩放
// - directional-left/right/up/down: 方向性转场（别名）
```

### 动画

#### 预设动画

```javascript
// 使用预设动画名称
animations: ['fadeIn', 'bigIn', 'bounceIn', 'slideInLeft', 'rotate', 'scale']
```

#### 自定义动画

```javascript
import { FadeAnimation, MoveAnimation, TransformAnimation } from './src/index.js';

// 淡入淡出动画
const fadeIn = new FadeAnimation({
  duration: 1,
  delay: 0,
  fromOpacity: 0,
  toOpacity: 1,
  easing: 'ease-out',
});

// 移动动画
const move = new MoveAnimation({
  duration: 2,
  fromX: 0,
  fromY: 0,
  toX: 100,
  toY: 100,
  easing: 'ease-in-out',
});

// 变换动画
const transform = new TransformAnimation({
  duration: 1.5,
  from: { scaleX: 0.5, scaleY: 0.5, rotation: 0 },
  to: { scaleX: 1, scaleY: 1, rotation: 360 },
  easing: 'ease-out',
});

// 添加到元素
textElement.addAnimation(fadeIn);
```

## 📖 完整示例

### 多轨道多场景示例

```javascript
import { VideoBuilder } from './src/index.js';
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

  // 添加转场
  track1.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: scene2StartTime,
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

  // 导出视频（导出完成后会自动销毁 builder）
  const outputPath = path.join(__dirname, 'output/video.mp4');
  await builder.export(outputPath);
}

createVideo().catch(console.error);
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

### onFrame 持续动画示例

`onFrame` 回调函数可以在每一帧更新元素，实现持续动画效果（如旋转、脉冲、闪烁等）：

```javascript
// 持续旋转的圆形
scene.addCircle({
  x: '50%',
  y: '50%',
  radius: 100,
  fillColor: '#4ECDC4',
  duration: 10,
  startTime: 0,
  onFrame: (element, event, paperItem) => {
    if (!paperItem) return;
    // 持续旋转：每秒旋转180度
    const rotationSpeed = 180; // 度/秒
    const rotation = (event.time * rotationSpeed) % 360;
    const pivot = paperItem.position || paperItem.center;
    if (pivot) {
      const currentRotation = paperItem.rotation || 0;
      paperItem.rotate(rotation - currentRotation, pivot);
    }
  },
});

// 闪烁的星星
scene.addPath({
  points: starPoints, // 星形路径点
  closed: true,
  fillColor: '#5298c1',
  duration: 10,
  startTime: 0,
  onFrame: (element, event, paperItem) => {
    if (!paperItem) return;
    // 闪烁效果：透明度在0.2到1.0之间变化
    const twinkleSpeed = 2; // 闪烁速度（周期/秒）
    const twinklePhase = event.time * twinkleSpeed * 2 * Math.PI;
    const twinkleValue = (Math.sin(twinklePhase) + 1) / 2; // 0到1之间
    const opacity = 0.2 + twinkleValue * 0.8;
    paperItem.opacity = opacity;
  },
});

// 呼吸动画（脉冲缩放）
scene.addText({
  text: 'Breathing Text',
  x: '50%',
  y: '50%',
  fontSize: 72,
  color: '#ffffff',
  duration: 10,
  startTime: 0,
  onFrame: (element, event, paperItem) => {
    if (!paperItem) return;
    const pivot = paperItem.position || paperItem.center;
    if (pivot) {
      // 呼吸效果：在0.98到1.02之间轻微缩放
      const breathSpeed = 1.5; // 呼吸速度（周期/秒）
      const breathPhase = event.time * breathSpeed * 2 * Math.PI;
      const breathScale = 1 + Math.sin(breathPhase) * 0.02;
      const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
      paperItem.scale(breathScale / currentScale, pivot);
    }
  },
});
```

更多关于 `onFrame` 的详细信息，请查看 [onFrame 参数说明](./docs/onFrame-params.md) 和 [onFrame vs onRender](./docs/onFrame-vs-onRender.md)。

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

## 🎯 预设动画列表

- `fadeIn` - 淡入
- `fadeOut` - 淡出
- `bigIn` - 放大进入
- `bigOut` - 放大退出
- `bounceIn` - 弹跳进入
- `bounceOut` - 弹跳退出
- `slideInLeft` - 从左滑入
- `slideInRight` - 从右滑入
- `slideInUp` - 从上滑入
- `slideInDown` - 从下滑入
- `slideOutLeft` - 向左滑出
- `slideOutRight` - 向右滑出
- `slideOutUp` - 向上滑出
- `slideOutDown` - 向下滑出
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

## 📁 项目结构

```
FKbuilder/
├── src/
│   ├── core/              # 核心类（VideoMaker, Renderer, VideoExporter）
│   ├── elements/          # 元素类（Text, Image, Video, Shape 等）
│   ├── layers/            # 图层类
│   ├── animations/        # 动画类
│   ├── builder/           # 构建器类（VideoBuilder, Track, Scene, Transition）
│   ├── utils/             # 工具函数
│   └── types/             # 类型定义
├── examples/              # 使用示例
├── assets/                # 资源文件
├── output/                # 输出目录
└── docs/                  # 文档
```

## 📝 示例文件

查看 `examples/` 目录获取更多示例：

- `test-transition-debug.js` - 转场效果调试示例
- `test-transitions.js` - 各种转场效果示例
- `project-intro-video.js` - 项目简介视频示例
- `demo-awesome-video.js` - 完整功能演示
- `test-auto-duration.js` - 自动时长计算示例（包含 onFrame 持续动画演示）
- `test-gradient-glow.js` - 渐变和发光效果示例
- `test-stroke-shadow-styles.js` - 描边和阴影样式示例

运行示例：

```bash
node examples/test-transition-debug.js
node examples/project-intro-video.js
```

## 🔧 开发

```bash
# 运行示例
npm start

# 运行特定示例
node examples/test-transitions.js
```

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

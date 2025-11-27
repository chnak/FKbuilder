# SpriteElement 使用指南

`SpriteElement` 支持多种精灵动画模式，包括纹理图集、帧序列和矢量图形。

## 1. 纹理图集模式 (AtlasSpriteSheet)

用于从单个大纹理图（spritesheet）中自动裁剪帧，适配你提供的 JSON 坐标配置。

### 配置格式

JSON 配置定义每一帧在大纹理中的位置：

```json
[
  {
    "name": "image0.png",
    "minX": 0,
    "minY": 0,
    "maxX": 826.8333333333334,
    "maxY": 1353
  },
  {
    "name": "image1.png",
    "minX": 826.8333333333334,
    "minY": 0,
    "maxX": 1653.6666666666667,
    "maxY": 1353
  }
  // ... 更多帧
]
```

### 使用示例

```javascript
import { SpriteElement } from './src/elements/SpriteElement.js';

const sprite = new SpriteElement({
  spriteType: 'AtlasSpriteSheet',
  atlasSrc: './assets/spritesheet.png',     // 大纹理图路径
  atlasConfig: './assets/atlas.json',       // JSON 坐标配置（可以是路径或对象）
  // 或直接传对象：
  // atlasConfig: [ { name: 'image0.png', minX: 0, minY: 0, maxX: 826.8, maxY: 1353 }, ... ],
  
  // 显示参数
  width: '400px',                            // 显示宽度
  height: '400px',                           // 显示高度
  fit: 'contain',                            // 适配方式：contain/cover/fill/none
  
  // 播放参数
  frameRate: 12,                             // 帧率（帧/秒）
  loop: true,                                // 是否循环
  autoplay: true,                            // 是否自动播放
  playMode: 'forward',                       // 播放模式：forward/reverse/ping-pong
  
  // 时间控制
  startTime: 0,                              // 开始时间（秒）
  duration: 5,                               // 持续时长（秒）
  
  // 位置控制（优先级：x/y > startX/startY > startPosition）
  startX: '50%',                             // 起始 X 位置（支持 px / % 单位）
  startY: '50%',                             // 起始 Y 位置
  // 或使用数组：
  // startPosition: ['50%', '70%'],
  
  // 可选：动画覆盖位置
  x: '400px',                                // 明确位置（覆盖 startX/startY）
  y: '200px'
});

// 添加到场景
scene.addElement(sprite);
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `spriteType` | string | 'Sprite' | 设置为 `'AtlasSpriteSheet'` 启用图集模式 |
| `atlasSrc` | string | '' | 大纹理图文件路径 |
| `atlasConfig` | string \| object | null | JSON 配置（可以是文件路径或直接对象） |
| `width` | number \| string | 100 | 显示宽度（支持 px / % 单位） |
| `height` | number \| string | 100 | 显示高度（支持 px / % 单位） |
| `fit` | string | 'contain' | 图片适配方式 |
| `frameRate` | number | 12 | 播放帧率（帧/秒） |
| `loop` | boolean | true | 循环播放 |
| `autoplay` | boolean | true | 自动播放 |
| `playMode` | string | 'forward' | 播放模式：`'forward'` / `'reverse'` / `'ping-pong'` |
| `startTime` | number | 0 | 元素开始时间（秒） |
| `duration` | number | - | 元素持续时长（秒） |
| `startX` / `startY` | number \| string | undefined | 起始位置（回退用） |
| `startPosition` | [x, y] | undefined | 起始位置数组（回退用） |
| `x` / `y` | number \| string | undefined | 显式位置（优先级最高） |

### 位置优先级

1. **最高优先级**：动画覆盖的 `x`/`y`（如果添加了 Transform 动画）
2. **中等优先级**：配置的 `x`/`y`
3. **低优先级**：`startX`/`startY` 或 `startPosition`（仅在 state.x/y 未定义时使用）

### 代码示例：完整场景

```javascript
import { VideoBuilder } from './src/builder/VideoBuilder.js';
import { Scene } from './src/core/Scene.js';
import { SpriteElement } from './src/elements/SpriteElement.js';

// 读取 JSON 配置
import fs from 'fs';
const atlasConfig = JSON.parse(fs.readFileSync('./assets/atlas.json', 'utf-8'));

// 创建精灵
const sprite = new SpriteElement({
  spriteType: 'AtlasSpriteSheet',
  atlasSrc: './assets/spritesheet.png',
  atlasConfig: atlasConfig,
  width: 400,
  height: 400,
  fit: 'contain',
  frameRate: 10,
  loop: true,
  startPosition: ['50%', '50%'],  // 屏幕中心
  startTime: 0,
  duration: 10
});

// 创建场景并添加元素
const scene = new Scene({ duration: 10 });
scene.addElement(sprite);

// 构建视频
const builder = new VideoBuilder({ width: 1920, height: 1080, fps: 30 });
builder.addScene(scene);
const result = await builder.build({ output: './output/sprite-animation.mp4' });
console.log('视频已导出:', result);
```

## 2. 帧序列模式 (FrameSequence)

用于播放单独的图片文件序列。

```javascript
const sprite = new SpriteElement({
  spriteType: 'FrameSequence',
  frames: [
    './frames/frame0.png',
    './frames/frame1.png',
    './frames/frame2.png'
    // ... 更多帧
  ],
  frameRate: 12,
  loop: true,
  startPosition: ['50%', '50%']
});
```

## 3. 矢量图形模式

用于渲染简单的矢量图形（矩形、圆形等）。

```javascript
const sprite = new SpriteElement({
  spriteType: 'Rect',        // 或 'Circle'
  width: 100,
  height: 100,
  spriteConfig: { bgcolor: '#FF5733' }
});
```

## 常见问题

### Q: 如何确保精灵在特定位置出现？
A: 使用 `startPosition` 或 `startX`/`startY` 参数，或直接设置 `x`/`y`。位置优先级：x/y > startX/startY > startPosition。

### Q: 如何改变播放速度？
A: 调整 `frameRate` 参数（值越大速度越快）。

### Q: 如何让精灵反向播放？
A: 设置 `playMode: 'reverse'`。

### Q: 如何实现往返播放（像乒乓球）？
A: 设置 `playMode: 'ping-pong'`。

### Q: JSON 配置文件格式是什么？
A: 数组格式，每个元素包含 `name`/`minX`/`minY`/`maxX`/`maxY`：
```json
[
  { "name": "frame0", "minX": 0, "minY": 0, "maxX": 100, "maxY": 100 },
  { "name": "frame1", "minX": 100, "minY": 0, "maxX": 200, "maxY": 100 }
]
```

# HTMLElement

使用 [Takumi](https://takumi.kane.tw/) 渲染任意 HTML/CSS 为 FKbuilder 视频元素。

## 安装依赖

HTMLElement 依赖 Takumi 原生库：

```bash
npm install @takumi-rs/core @takumi-rs/helpers
```

## 基础用法

```javascript
import { VideoBuilder } from 'fkbuilder';

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 5 })
    .addBackground({ color: '#1e1b4b' })
    .addHtml({
      x: 0, y: 0,          // 位置（左上角对齐）
      width: 1280, height: 720,  // 尺寸
      anchor: [0, 0],        // 锚点设为左上角
      html: `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
          <h1 style="color:white;font-size:64px;">Hello World</h1>
        </div>
      `,
      duration: 5,
    });

await builder.render('output/video.mp4', { parallel: true });
builder.destroy();
process.exit(0);
```

## 核心概念

### timeMs 注入

HTMLElement 通过 `timeMs` 参数驱动 CSS @keyframes 动画。Takumi 在每帧渲染时接收当前视频时间（毫秒），使 CSS 动画与视频时间轴同步。

```javascript
.addHtml({
  html: `
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .spinner {
        animation: spin 1s linear infinite;
      }
    </style>
    <div class="spinner" style="width:100px;height:100px;border:4px solid red;"></div>
  `,
  duration: 5,
  // timeOffset: 0  // 可选，默认 0。动画起始偏移（秒）
})
```

### 多场景与时间轴

每个 `addHtml()` 的 `duration` 决定元素在场景内的显示时长，`startTime` 由 Scene 自动计算（默认 0）。

```javascript
// 场景 1: 0-4 秒
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 4 })
    .addHtml({
      html: `<div>Scene 1</div>`,
      duration: 4,
    });

// 场景 2: 4-8 秒（startTime 自动计算为 4）
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 4, startTime: 4 })
    .addHtml({
      html: `<div>Scene 2</div>`,
      duration: 4,
    });
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `html` | `string` | - | HTML 字符串（与 `node` 二选一） |
| `node` | `object` | - | Takumi node tree 对象 |
| `x` | `number\|string` | `0` | X 坐标 |
| `y` | `number\|string` | `0` | Y 坐标 |
| `width` | `number\|string` | `800` | 元素宽度 |
| `height` | `number\|string` | `600` | 元素高度 |
| `anchor` | `[number, number]` | `[0.5, 0.5]` | 锚点 `[0,0]`=左上角，`[0.5,0.5]`=中心 |
| `opacity` | `number` | `1` | 透明度 0-1 |
| `rotation` | `number` | `0` | 旋转角度（度） |
| `duration` | `number` | - | 元素显示时长 |
| `timeOffset` | `number` | `0` | CSS 动画起始偏移（秒） |
| `fonts` | `Array` | 自动中文字体 | 字体配置 |
| `stylesheets` | `Array<string>` | - | 外部样式表 URL |
| `keyframes` | `object` | - | 结构化 keyframe 定义 |
| `devicePixelRatio` | `number` | - | 设备像素比 |
| `autoDefaultFont` | `boolean` | `true` | 当 HTML 中未声明 `font-family` 时,自动在 body 上注入跨平台 CJK 字体栈 |

### 默认中文字体支持

**HTMLElement 默认开启中文字体支持**（无需手动指定 `fonts`）：

- **Windows**: 微软雅黑 (Microsoft YaHei)、黑体 (SimHei)、宋体 (SimSun)
- **macOS**: 苹方 (PingFang SC)、华文黑体 (STHeiti)、宋体 (Songti SC)
- **Linux**: 文泉驿微米黑、文泉驿正黑、Noto Sans CJK SC

```javascript
// ✅ 直接使用，默认就有中文支持
scene.addHtml({
  html: '<div style="font-size:48px;">你好世界</div>',
  // 无需指定 fonts
});

// ✅ 自定义 fonts 覆盖默认
scene.addHtml({
  html: '<div>使用自定义字体</div>',
  fonts: [{ path: '/custom-font.ttf' }],
});
```

### 自动注入默认 font-family

为了实现"开箱即用就能渲染中文"的效果,HTMLElement 在渲染前会扫描 HTML 字符串:

- **若 HTML 中已声明任何 `font-family`** → 保持原样,不注入(尊重用户选择)
- **若 HTML 中没有 `font-family` 声明** → 自动在 HTML 顶部插入:
  ```html
  <style>body { font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif; }</style>
  ```

注入位置在所有内容**之前**,且只命中 `body`(特异性 0,0,1),用户的元素/类选择器都能覆盖它。

**关闭自动注入**(需要完全自定义字体的场景):

```javascript
scene.addHtml({
  html: '<div>完全自定义字体</div>',
  autoDefaultFont: false,  // 关闭后,Takumi 会回退到自己的默认字体
});
```

**注意:此机制不会影响 Tailwind 等 CSS 框架**。Tailwind 编译产物里已经包含 `font-family` 声明,触发"已声明"分支,不会注入。如果你想让 Tailwind 也优先使用微软雅黑,有三种做法:

```javascript
// 做法 1:在 tailwind-input.css 用 @theme 覆盖
// @theme { --default-font-family: 'Microsoft YaHei', sans-serif; }

// 做法 2:在 HTML 内手写一条 body 规则覆盖
// <style>body { font-family: 'Microsoft YaHei', sans-serif; }</style>

// 做法 3:在元素上用 Tailwind 任意值
// <h1 class="font-['Microsoft_YaHei']">...</h1>
```

### 字体配置

```javascript
// 方式 1: URL
fonts: ['https://fonts.googleapis.com/css2?family=Roboto']

// 方式 2: 系统字体路径
fonts: [{ path: 'C:/Windows/Fonts/simhei.ttf', family: 'SimHei' }]

// 方式 3: Buffer
fonts: [{ data: fontBuffer }]
```

### 结构化 Keyframes

除了在 HTML 中使用 `@keyframes`，也可以通过 `keyframes` 选项传入：

```javascript
addHtml({
  html: `<div class="title">Hello</div>`,
  keyframes: {
    '.title': {
      '0%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-20px)' },
      '100%': { transform: 'translateY(0)' },
    },
  },
})
```

## 与 FKbuilder 动画结合

HTMLElement 支持 FKbuilder 的预设动画（如 `fadeIn`、`slideInLeft`）：

```javascript
addHtml({
  html: `<div style="color:white;font-size:48px;">Welcome</div>`,
  animations: [
    { type: 'transform', from: { opacity: 0, x: -100 }, to: { opacity: 1, x: 0 }, duration: 1, easing: 'easeOut' },
    'fadeIn',  // 预设动画
  ],
})
```

## 集成 Tailwind CSS

### 方式 1: CDN（最快）

```javascript
scene.addHtml({
  x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
  html: `
    <script src="https://cdn.tailwindcss.com"></script>
    <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
      <h1 class="text-6xl font-bold text-white animate-pulse">Hello Tailwind</h1>
    </div>
  `,
  duration: 5,
});
```

⚠️ Takumi 不执行 `<script>`，所以 hover 等 JS 事件不生效，但 CSS 样式和 CSS 动画正常。

### 方式 2: 预编译内联（推荐）

```bash
# 1. 安装 Tailwind
npm install -D tailwindcss

# 2. 创建 input.css
echo '@tailwind base; @tailwind components; @tailwind utilities;' > input.css

# 3. 配置 tailwind.config.js
cat > tailwind.config.js << 'EOF'
export default {
  content: ['./src/**/*.{html,js}'],
  theme: { extend: {} },
}
EOF

# 4. 编译
npx tailwindcss -i input.css -o tailwind.css --minify
```

```javascript
import fs from 'fs-extra';

const tailwindCss = fs.readFileSync('tailwind.css', 'utf8');

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

✅ 完全离线，所有 utility 类生效，自定义 CSS 动画正常。

### 实战示例

```javascript
import fs from 'fs-extra';

const tailwindCss = fs.readFileSync('tailwind.css', 'utf8');

const html = `
<style>${tailwindCss}</style>
<style>
  @keyframes glow {
    0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.5); }
    50% { text-shadow: 0 0 60px rgba(168,85,247,1); }
  }
  .glow { animation: glow 2s ease-in-out infinite; }
</style>

<div class="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
  <div class="text-center space-y-12">
    <h1 class="text-8xl font-black text-white glow">Tailwind Works!</h1>
    <div class="flex gap-6 justify-center">
      <div class="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-red-500 shadow-2xl animate-bounce"></div>
      <div class="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 shadow-2xl animate-pulse"></div>
      <div class="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-2xl animate-ping"></div>
    </div>
  </div>
</div>
`;

builder.createTrack()
  .createScene({ duration: 5 })
    .addHtml({ x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0], html, duration: 5 });
```

### 完整流程（Tailwind v4）

```bash
# 1. 安装
npm install -D tailwindcss @tailwindcss/cli

# 2. 创建 tailwind-input.css（项目已提供）
# @import "tailwindcss";

# 3. 编译
npx tailwindcss build -i tailwind-input.css -o output/tailwind/tailwind.css --minify

# 4. 运行示例
node examples/html-element-with-tailwind.js
```

`tailwind-input.css` 内容：

```css
@import "tailwindcss";

@theme {
  --color-brand: #FF6B6B;
}
```

`examples/html-element-with-tailwind.js` 是完整的多场景示例，演示了：
- Tailwind 工具类（渐变、动画、布局）
- 自定义 `@keyframes` 与 Tailwind 类混用
- 多场景动画（Scene 1: 文字淡入；Scene 2: 浮动圆球）

## 完整示例

参考：
- `examples/html-element-basic.js` - 基础 HTML 元素
- `examples/html-element-keyframes.js` - CSS @keyframes 动画
- `examples/html-element-with-font.js` - 中文字体支持
- `examples/html-element-with-tailwind.js` - Tailwind CSS 集成

## API

### 导出函数

```javascript
import {
  HTMLElement,           // 元素类
  getTakumiRenderer,     // 获取 Takumi 渲染器单例
  destroyTakumiRenderer,  // 销毁 Takumi 渲染器
  renderHtmlFrame,        // 直接渲染 HTML 帧
  registerFontsToTakumi,  // 注册字体到 Takumi
  parseHtml,             // 解析 HTML 为 node tree
} from 'fkbuilder';
```

### 单独渲染帧

```javascript
import { renderHtmlFrame } from 'fkbuilder';

const rgba = await renderHtmlFrame({
  html: '<div style="color:red;">Test</div>',
  width: 1280,
  height: 720,
  timeMs: 0,
});

// rgba 是 width * height * 4 的 Buffer（RGBA 格式）
```

## 注意事项

### 1. 锚点 (anchor) 设置

`anchor` 控制元素"哪个角"对齐到 `(x, y)`：
- `anchor: [0, 0]` → 元素**左上角**对齐 `(x, y)`
- `anchor: [0.5, 0.5]` → 元素**中心点**对齐 `(x, y)`
- `anchor: [1, 1]` → 元素**右下角**对齐 `(x, y)`

**全屏 HTML 必须用 `anchor: [0, 0]` + `x: 0, y: 0`**：

```javascript
// ✅ 正确
.addHtml({
  x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
  html: '...',
})

// ❌ 错误：anchor 默认值 [0.5, 0.5] + x: 0, y: 0
// 元素会偏移到 (-640, -360)，一半超出画布看不见
```

**居中显示元素的两种方式**：

```javascript
// 方式 1: anchor [0, 0] + x/y 指向画布中心
.addHtml({ x: 640, y: 360, width: 200, height: 100, anchor: [0, 0], html: '...' })

// 方式 2: anchor [0.5, 0.5] + x/y 指向元素中心（也是画布中心 640, 360）
.addHtml({ x: 640, y: 360, width: 200, height: 100, anchor: [0.5, 0.5], html: '...' })
```

### 2. 其它注意事项

1. **必须用不同 track**：多个 HTML 场景必须各自 `createTrack()`，否则会被合并到同一图层导致时间累加错误
2. **Worker 模式**：`parallel: true` 时正常工作，Takumi 在每个 Worker 中独立初始化
3. **字体注册**：系统字体必须通过 `fonts` 选项注册，Takumi 不自动读取系统字体
4. **字体名称匹配**：CSS 中 `font-family` 必须和 `fonts` 数组中的 `family` 名称一致
5. **性能**：CSS 动画通过 `timeMs` 驱动，每帧重新渲染；无动画时可利用缓存
6. **不要多次调用 build()**：`builder.build()` 后又调用 `builder.render()` 会触发重复构建
7. **process.exit**：渲染完成后建议调用 `process.exit(0)` 确保进程退出

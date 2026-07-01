# HTMLElement

使用 [Takumi](https://takumi.kane.tw/) 渲染任意 HTML/CSS 为 FKbuilder 视频元素。

## 安装依赖

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
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
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

### timeMs 注入（CSS 动画与时间轴同步）

HTMLElement 通过 `timeMs` 参数驱动 CSS @keyframes 动画。Takumi 每帧接收当前视频时间（毫秒），使 CSS 动画与视频时间轴同步。

```javascript
.addHtml({
  html: `
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      .spinner { animation: spin 1s linear infinite; }
    </style>
    <div class="spinner" style="width:100px;height:100px;border:4px solid red;"></div>
  `,
  duration: 5,
  // timeOffset: 0  // 可选,默认 0,动画起始偏移(秒)
})
```

### 多场景与时间轴

每个 `addHtml()` 的 `duration` 决定元素在场景内的显示时长，`startTime` 由 Scene 自动计算（默认 0）。

```javascript
// 场景 1: 0-4 秒
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 4 })
    .addHtml({ html: `<div>Scene 1</div>`, duration: 4 });

// 场景 2: 4-8 秒（startTime 自动计算为 4）
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 4, startTime: 4 })
    .addHtml({ html: `<div>Scene 2</div>`, duration: 4 });
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
| `autoDefaultFont` | `boolean` | `true` | 未声明 `font-family` 时自动注入跨平台 CJK 字体栈 |
| `tailwind` | `boolean\|object` | `false` | 自动 Tailwind 支持,见下方"Tailwind 集成" |
| `emoji` | `boolean\|string` | `'twemoji'` | 关闭设为 `false`;切换风格用 `'noto'\|'openmoji'\|...` |

---

## 🎯 三大亮点

### 1. 中文自动支持（autoDefaultFont）

为了"开箱即用就能渲染中文",HTMLElement 在渲染前会扫描 HTML 字符串:

- **HTML 中已声明任何 `font-family`** → 保持原样,不注入(尊重用户选择)
- **未声明 `font-family`** → 自动在 HTML 顶部插入:
  ```html
  <style>body { font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC',
                       'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif; }</style>
  ```

字体加载(`getDefaultFonts()`)在构造函数里完成,覆盖 Windows/macOS/Linux 三平台:
- **Windows**: 微软雅黑 / 黑体 / 宋体 / 楷体 / 仿宋
- **macOS**: 苹方 / 华文黑体 / 宋体 / Apple Color Emoji
- **Linux**: Noto Sans CJK / 文泉驿微米黑 / Noto Color Emoji

关闭自动注入:

```javascript
.addHtml({ html: '<div>完全自定义</div>', autoDefaultFont: false });
```

> ⚠️ `getDefaultFonts()` 返回的 `family` 字段当前是**死代码**(没传给 Takumi),见下方"已知限制"。

### 2. Emoji 彩色渲染

HTML 里直接写 emoji 字符,会被自动替换成 **Twemoji 彩色 SVG**：

```javascript
.addHtml({
  html: `
    <div style="font-size:120px;text-align:center;">
      🚀 🎨 ⚡
      <h1 style="font-size:64px;color:white;">FKbuilder 真棒 🎬</h1>
    </div>
  `,
  duration: 5,
});
```

**emoji 样式**：`'twemoji' | 'noto' | 'openmoji' | 'blobmoji' | 'fluent' | 'fluentFlat'`，默认 `'twemoji'`：

```javascript
.addHtml({ html: '🚀', emoji: 'noto' });   // 切到 Noto 风格
.addHtml({ html: '🚀', emoji: false });    // 关闭,用文字 emoji
```

> 💡 emoji SVG 首次会从 CDN 拉取(jsDelivr/twemoji),缓存在渲染器里。同 URL 第二次零成本。

### 3. Tailwind CSS（零依赖）

`tailwind: true` 直接用 FKbuilder 自带的 158KB 通用 Tailwind CSS,**不需要安装 `tailwindcss`、不调任何 CLI、不写缓存文件**。

```javascript
.addHtml({
  html: `
    <div class="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600
                flex items-center justify-center p-12">
      <h1 class="text-7xl font-black text-white drop-shadow-lg">零配置 Tailwind</h1>
    </div>
  `,
  tailwind: true,   // ← 就这一行
  duration: 5,
});
```

覆盖 1000+ utility：`colors/spacing/typography/flex/grid/responsive/hover/dark mode/blur/gradient/...`，详见 `src/assets/tailwind-defaults.css`。

#### 自定义主题：传预编译 CSS

需要自定义主题（`bg-brand` 等）时，自己写 `tailwind-input.css` 预编译，再传进来：

```bash
npm install -D tailwindcss   # 装一次,只是为了预编译
```

```css
/* tailwind-input.css */
@import "tailwindcss";
@theme {
  --color-brand: #FF6B6B;
  --color-accent: #06b6d4;
}
```

```bash
npx tailwindcss --input tailwind-input.css --output my-tailwind.css --minify
```

```javascript
// 方式 1: 读文件路径
.addHtml({ html: '...', tailwind: { input: './my-tailwind.css' } });

// 方式 2: 直接传字符串
.addHtml({ html: '...', tailwind: { css: fs.readFileSync('./my-tailwind.css', 'utf8') } });
```

**API 总结**：

| 用法 | 行为 |
|---|---|
| `tailwind: true` | 用打包的通用 CSS（158KB） |
| `tailwind: { css: '...' }` | 用传入的 CSS 字符串 |
| `tailwind: { input: '/path' }` | 读本地 CSS 文件 |

**已知限制**：
- 通用版 CSS 不含极少数冷门 utility → 自己编译一份即可
- Takumi 不支持的 CSS 特性（`bg-clip-text`、部分 backdrop-filter）即使 CSS 写对了也无效

完整示例：[`examples/html-element-tailwind-zero.js`](../examples/html-element-tailwind-zero.js)（零配置）、[`examples/html-element-tailwind-custom-theme.js`](../examples/html-element-tailwind-custom-theme.js)（自定义主题）

---

## 字体配置

```javascript
// 1. URL（自动 fetch）
fonts: ['https://fonts.googleapis.com/css2?family=Roboto']

// 2. 系统字体路径（自动读盘 + 注入到 Takumi）
fonts: [{ path: 'C:/Windows/Fonts/simhei.ttf', family: 'SimHei' }]

// 3. Buffer
fonts: [{ data: fontBuffer }]

// 4. 不指定 → 用默认中文栈（getDefaultFonts）
fonts: undefined  // 默认行为
```

### ⚠️ 字重不要用 800/900（fake-bold 会糊）

**约定**：

```css
/* ✅ 用这些 */
font-weight: 400;   /* Regular — 细 */
font-weight: 700;   /* Bold — 粗,真粗体字形,笔画清楚 */

/* ❌ 避开这些 */
font-weight: 800;   /* 触发 fake-bold,笔画粗但字形模糊 */
font-weight: 900;   /* fake-bold 合成最重,中文字几乎糊成一片 */
```

**为什么**：微软雅黑只内置 300/400/700 三个字重，没有 800/900。CSS 请求这些不存在的字重时，渲染器会用最接近的 Bold（700）字形额外"描粗"——对拉丁字符看起来还行，对**笔画密集的中文会糊成一团**（相邻横竖笔画相撞）。

实测对比（同一段"微软雅黑粗体"）：

| font-weight | 视觉效果 |
|---|---|
| 400 | 笔画细、清晰 |
| 700 | 笔画粗、清晰 ← 推荐 |
| 900 | 笔画合并、字形糊掉 ← 千万别用 |

**想要"特别粗"怎么办**：

```css
/* 方案 1: 换 SimHei,本身就重 */
font-family: 'SimHei';
font-weight: 400;   /* SimHei 只有一个字重,天然就是粗的 */

/* 方案 2: 用粗描边模拟 */
h1 {
  font-family: 'Microsoft YaHei';
  font-weight: 700;            /* 真 Bold */
  -webkit-text-stroke: 2px white;  /* 加描边视觉上加粗 */
}
```

### 已知限制 ⚠️

`getDefaultFonts()` 返回 `{ path, family, weight }` 形态的字体对象,但**`family` 字段没传给 Takumi**。当前实现下：

- 如果 CSS 写 `font-family: 'Microsoft YaHei'` → 仍然能匹配,因为 Takumi 会从字体文件内部 name 表里读名字
- 如果用户想用 `family` 字段自定义 CSS 引用名 → 暂不支持
- TTC 集合（`msyh.ttc`）通常只注册第一个成员；粗体变体（`msyhbd.ttc`）和 Light（`msyhl.ttc`）作为独立文件注册

## 结构化 Keyframes

通过 `keyframes` 选项声明 CSS 动画。**FKbuilder 自动生成 `@keyframes` 定义 + `animation` 属性**，不用手动写两遍。

### 推荐写法（Rich 格式，自动应用 animation）

```javascript
addHtml({
  html: `
    <div class="w-full h-full flex items-center justify-center">
      <div class="badge bg-blue-500 text-white text-5xl px-12 py-6 rounded-2xl shadow-lg">
        弹跳 Badge
      </div>
    </div>
  `,
  tailwind: true,                          // ← Tailwind 工具类
  keyframes: {
    '.badge': {                           // ← CSS 选择器
      duration: '1s',                     // 动画时长(默认 1s)
      easing: 'ease-in-out',              // 缓动函数(默认 ease-in-out)
      iteration: 'infinite',              // 播放次数(默认 infinite)
      delay: '0s',                        // 延迟(默认 0s)
      direction: 'normal',                // 方向(默认 normal)
      fill: 'none',                       // 填充模式(默认 none)
      keyframes: {                        // ← 关键帧定义
        '0%':   { transform: 'translateY(0)' },
        '50%':  { transform: 'translateY(-30px)' },
        '100%': { transform: 'translateY(0)' },
      },
    },
  },
})
```

**效果**：自动注入 `<style>.badge { animation: fk-anim-badge-0 1s ease-in-out infinite 0s normal none; }</style>` 到 HTML 顶部，并生成对应的 `@keyframes`。开箱即用。

### 简化写法（裸格式）

如果用默认值（1s ease-in-out infinite），可以直接写 keyframes 规则：

```javascript
keyframes: {
  '.badge': {
    '0%':   { transform: 'translateY(0)' },
    '50%':  { transform: 'translateY(-30px)' },
    '100%': { transform: 'translateY(0)' },
  },
}
```

同样会自动应用 `animation`。

### 高级写法（多 selector / 自定义 timing）

```javascript
keyframes: {
  '.title':   { duration: '2s',  easing: 'ease-out',   iteration: '1',
                keyframes: { '0%': {opacity: 0, transform: 'translateY(-20px)'}, '100%': {...} } },
  '.card':    { duration: '.5s', easing: 'ease-in-out', iteration: 'infinite',
                keyframes: { '0%, 100%': {transform: 'scale(1)'}, '50%': {transform: 'scale(1.05)'} } },
  '#hero':    { duration: '3s',  iteration: 'infinite', easing: 'linear',
                keyframes: { '0%': {transform: 'rotate(0deg)'}, '100%': {transform: 'rotate(360deg)'} } },
}
```

### 底层数组格式（向后兼容）

如果想完全控制，可直接传 Takumi 原生数组格式：

```javascript
keyframes: [
  { name: 'spin', keyframes: [
    { offsets: [0],   declarations: { transform: 'rotate(0deg)' } },
    { offsets: [1],   declarations: { transform: 'rotate(360deg)' } },
  ]},
],
```

但要自己写 `<style>.elem { animation: spin ... }</style>`。

### 完全自控（HTML 内写全部）

如果想完全手动控制，写在 HTML `<style>` 里就行：

```javascript
addHtml({
  html: `
    <style>
      @keyframes myBounce { ... }
      .badge { animation: myBounce 1s infinite; }
    </style>
    <div class="badge">手动</div>
  `,
  // 不传 keyframes 选项
})
```

### 注意事项

- **Rich 格式下默认值**：duration=1s, easing=ease-in-out, iteration=infinite
- **selector 可用 `.class`、`#id`、`tag`**（只要是合法 CSS 选择器）
- **HTML 里写的 `animation:` 会覆盖自动注入的**（CSS 级联，优先级生效）
- **不会与 `tailwind: true` 冲突**：keyframes 的 CSS 在 Tailwind CSS 之后注入

## 与 FKbuilder 动画结合

HTMLElement 同时支持 FKbuilder 预设动画：

```javascript
addHtml({
  html: `<div style="color:white;font-size:48px;">Welcome</div>`,
  animations: [
    { type: 'transform', from: { opacity: 0, x: -100 }, to: { opacity: 1, x: 0 }, duration: 1, easing: 'easeOut' },
    'fadeIn',  // 也可混用预设
  ],
})
```

---

## 完整示例

参见 `examples/`：
- `html-element-basic.js` - 基础 HTML 元素
- `html-element-chinese-default.js` - 默认中文支持（`font-weight:700`）
- `html-element-emoji.js` - 多场景彩色 Emoji
- `html-element-keyframes.js` - CSS @keyframes 动画
- `html-element-with-font.js` - 自定义字体
- `html-element-tailwind-zero.js` - **零配置** Tailwind（推荐先看）
- `html-element-tailwind-auto.js` - Tailwind CLI + 自定义主题
- `html-element-with-tailwind.js` - Tailwind v4 手动编译（旧示例，参考用）

## API

### 导出

```javascript
import {
  HTMLElement,           // 元素类
  getTakumiRenderer,     // 获取 Takumi 渲染器单例
  destroyTakumiRenderer, // 销毁渲染器
  renderHtmlFrame,       // 直接渲染 HTML 帧
  registerFontsToTakumi, // 注册字体到 Takumi
  parseHtml,             // 解析 HTML 为 node tree
} from 'fkbuilder';
```

### 直接渲染帧（脱离 VideoBuilder）

```javascript
import { renderHtmlFrame } from 'fkbuilder';

const rgba = await renderHtmlFrame({
  html: '<div style="color:red;font-size:48px;">Test</div>',
  width: 1280, height: 720,
  timeMs: 0,
});
// rgba: Buffer(width * height * 4, RGBA)
```

---

## 已知限制

| 限制 | 影响 | 临时绕过 |
|---|---|---|
| Takumi 不支持 `bg-clip-text` | 渐变文字看不到 | 改用 `linear-gradient` + `background-clip:text` 别名或纯色 |
| Takumi 不支持部分 backdrop-filter | backdrop-blur 等失效 | 用半透明背景替代 |
| `getDefaultFonts()` 的 `family` 字段未传给 Takumi | 自定义 CSS 引用名失效 | CSS 直接用 "Microsoft YaHei" 等标准名 |
| 通用 Tailwind CSS 不含极冷门 utility | 个别 class 无样式 | 切到 CLI 模式 (`tailwind-input.css`) |
| `font-weight: 800 / 900` 走 fake-bold 合成 | 中文笔画合并、字形糊掉 | 用 700 (Bold) / 400 (Regular),或换 SimHei |

## 注意事项

1. **anchor 必须用 `[0, 0]`** 做全屏 HTML：默认 `[0.5, 0.5]` 会让 1280×720 元素偏移 (-640, -360)
2. **每个场景必须独立 `createTrack()`**：多个场景合到同一 track 会导致时间累加错误
3. **Worker 模式**：`parallel: true` 时正常,每个 Worker 独立初始化 Takumi
4. **字体文件必须在 `fonts` 中注册**：Takumi 不自动读取系统字体(虽然默认自动注入了 Windows/macOS/Linux 字体)
5. **CSS 动画每帧重渲染**：无动画时可考虑关闭 `autoDefaultFont` 之外的二次处理
6. **不要多次调用 `build()`**
7. **render 完成后调 `process.exit(0)`**：确保进程退出
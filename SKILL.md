# fkbuilder Skill

**fkbuilder** - Node.js 程序化视频创作库，支持通过代码或 JSON 配置创建视频。

---

## 1. 快速开始

### 安装
```bash
npm install -g fkbuilder
```

### CLI 渲染
```bash
fkbuilder render video.json
fkbuilder render config.json -o output.mp4
fkbuilder info config.json
fkbuilder help
```

---

## 2. JSON 配置格式

```json
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "output": "output/video.mp4",
  "background": "#0a0a0f",
  "tracks": [...],
  "audioTracks": [...]
}
```

---

## 3. 全局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | number | 1920 | 视频宽度(px) |
| `height` | number | 1080 | 视频高度(px) |
| `fps` | number | 30 | 帧率 |
| `output` | string | output.mp4 | 输出路径 |
| `background` | string | #000000 | 全局背景色 |
| `tracks` | array | [] | 轨道数组 |
| `audioTracks` | array | [] | 音频轨道数组 |

---

## 4. 轨道 (tracks)

```json
{
  "tracks": [
    {
      "zIndex": 1,
      "scenes": [...],
      "transitions": [...],
      "tracks": []
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `zIndex` | number | 层叠顺序 |
| `scenes` | array | 场景数组 |
| `transitions` | array | 转场数组 |
| `tracks` | array | 嵌套子轨道 |

---

## 5. 场景 (scenes)

```json
{
  "scenes": [
    {
      "startTime": 0,
      "duration": 5,
      "background": "#1a1a2e",
      "elements": [...]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `startTime` | number | 开始时间(秒) |
| `duration` | number | 持续时间(秒) |
| `background` | string | 背景色 |
| `elements` | array | 元素数组 |

---

## 6. 元素通用属性

所有元素都继承以下基础属性：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | number/string | 0 | X坐标(支持 "50%" 百分比) |
| `y` | number/string | 0 | Y坐标(支持 "50%" 百分比) |
| `width` | number | 100 | 宽度 |
| `height` | number | 100 | 高度 |
| `opacity` | number | 1 | 透明度(0-1) |
| `rotation` | number | 0 | 旋转角度(度) |
| `scaleX` | number | 1 | X方向缩放 |
| `scaleY` | number | 1 | Y方向缩放 |
| `anchor` | array | [0.5, 0.5] | 锚点 [x, y] (0-1) |
| `duration` | number | 5 | 持续时间(秒) |
| `startTime` | number | 0 | 开始时间(秒) |
| `animations` | array | [] | 预设动画数组 |
| `onFrame` | object | - | 动态回调 |

---

## 7. 元素类型详解

### 7.1 文本 (text)

```json
{
  "type": "text",
  "text": "Hello World",
  "x": "50%",
  "y": "50%",
  "fontSize": 72,
  "fontFamily": "微软雅黑",
  "fontWeight": "bold",
  "fontStyle": "normal",
  "color": "#ffffff",
  "textAlign": "center",
  "textBaseline": "middle",
  "lineHeight": 1.2,
  "split": "letter",
  "splitDelay": 0.1,
  "splitDuration": 0.3,
  "opacity": 1,
  "rotation": 0,
  "anchor": [0.5, 0.5],
  "duration": 5,
  "startTime": 0,
  "animations": ["fadeInUp"],
  "textShadow": true,
  "textShadowColor": "#6366f1",
  "textShadowOffsetX": 2,
  "textShadowOffsetY": 2,
  "textShadowBlur": 20,
  "textShadowOpacity": 0.5,
  "textShadowStyle": "outer",
  "textShadowSpread": 0,
  "stroke": true,
  "strokeColor": "#000000",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "strokeDashArray": [5, 5],
  "strokeDashOffset": 0,
  "strokeCap": "butt",
  "strokeJoin": "miter",
  "strokeMiterLimit": 4,
  "gradient": true,
  "gradientColors": ["#FF6B6B", "#4ECDC4"],
  "gradientDirection": "horizontal",
  "textGlow": true,
  "textGlowColor": "#FFFFFF",
  "textGlowBlur": 20,
  "textGlowIntensity": 1
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | string | - | 文本内容 |
| `fontSize` | number | 24 | 字体大小 |
| `fontFamily` | string | PatuaOne | 字体名称 |
| `fontWeight` | string | normal | 字体粗细 |
| `fontStyle` | string | normal | 字体样式 |
| `color` | string | #ffffff | 文字颜色 |
| `textAlign` | string | center | 对齐方式 |
| `textBaseline` | string | middle | 基线位置 |
| `lineHeight` | number | 1.2 | 行高 |
| `split` | string | null | 拆分类型: letter/word/line |
| `splitDelay` | number | 0.1 | 拆分动画延迟(秒) |
| `splitDuration` | number | 0.3 | 拆分动画时长(秒) |
| `textShadow` | boolean | false | 是否启用阴影 |
| `textShadowColor` | string | #000000 | 阴影颜色 |
| `textShadowOffsetX` | number | 2 | 阴影X偏移 |
| `textShadowOffsetY` | number | 2 | 阴影Y偏移 |
| `textShadowBlur` | number | 0 | 阴影模糊半径 |
| `textShadowOpacity` | number | 0.5 | 阴影透明度 |
| `textShadowStyle` | string | outer | 阴影样式: outer/inner |
| `textShadowSpread` | number | 0 | 阴影扩散 |
| `stroke` | boolean | false | 是否启用描边 |
| `strokeColor` | string | #000000 | 描边颜色 |
| `strokeWidth` | number | 2 | 描边宽度 |
| `strokeStyle` | string | solid | 描边样式: solid/dashed/dotted |
| `strokeDashArray` | array | [5, 5] | 虚线模式 |
| `strokeDashOffset` | number | 0 | 虚线偏移 |
| `strokeCap` | string | butt | 线帽: butt/round/square |
| `strokeJoin` | string | miter | 连接: miter/round/bevel |
| `strokeMiterLimit` | number | 4 | 尖角限制 |
| `gradient` | boolean | false | 是否启用渐变 |
| `gradientColors` | array | - | 渐变色数组 |
| `gradientDirection` | string | horizontal | 渐变方向 |
| `textGlow` | boolean | false | 是否启用发光 |
| `textGlowColor` | string | #FFFFFF | 发光颜色 |
| `textGlowBlur` | number | 20 | 发光模糊半径 |
| `textGlowIntensity` | number | 1 | 发光强度 |

---

### 7.2 矩形 (rect)

```json
{
  "type": "rect",
  "x": "50%",
  "y": "50%",
  "width": 300,
  "height": 200,
  "bgcolor": "#1a1a2e",
  "borderRadius": 20,
  "borderWidth": 2,
  "borderColor": "#6366f1",
  "shadowBlur": 25,
  "shadowColor": "#6366f1",
  "shadowOffsetX": 0,
  "shadowOffsetY": 0,
  "opacity": 0.9,
  "rotation": 0,
  "anchor": [0.5, 0.5],
  "duration": 5,
  "startTime": 0,
  "animations": ["zoomIn"]
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bgcolor` | string | #ffffff | 背景颜色 |
| `borderRadius` | number | 0 | 圆角半径 |
| `borderWidth` | number | 0 | 边框宽度 |
| `borderColor` | string | #000000 | 边框颜色 |
| `shadowBlur` | number | 0 | 阴影模糊 |
| `shadowColor` | string | #000000 | 阴影颜色 |
| `shadowOffsetX` | number | 0 | 阴影X偏移 |
| `shadowOffsetY` | number | 0 | 阴影Y偏移 |

---

### 7.3 圆形 (circle)

```json
{
  "type": "circle",
  "x": "50%",
  "y": "50%",
  "radius": 100,
  "bgcolor": "#6366f1",
  "borderWidth": 2,
  "borderColor": "#8b5cf6",
  "opacity": 0.8,
  "rotation": 0,
  "anchor": [0.5, 0.5],
  "duration": 5,
  "startTime": 0,
  "animations": ["zoomIn"],
  "onFrame": {
    "fn": (el, ev, item) => { item.rotation = ev.time * 30; },
    "context": {}
  }
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | 0 | 圆半径 |
| `bgcolor` | string | #ffffff | 背景颜色 |
| `borderWidth` | number | 0 | 边框宽度 |
| `borderColor` | string | #000000 | 边框颜色 |

---

### 7.4 图片 (image)

```json
{
  "type": "image",
  "src": "./assets/logo.png",
  "x": "50%",
  "y": "50%",
  "width": 200,
  "height": 200,
  "fit": "cover",
  "opacity": 1,
  "rotation": 0,
  "anchor": [0.5, 0.5],
  "duration": 5,
  "startTime": 0,
  "animations": ["fadeIn"],
  "borderRadius": 0,
  "borderWidth": 0,
  "borderColor": "#000000",
  "shadowBlur": 0,
  "shadowColor": "#000000",
  "shadowOffsetX": 0,
  "shadowOffsetY": 0,
  "flipX": false,
  "flipY": false,
  "brightness": 1,
  "contrast": 1,
  "saturation": 1,
  "hue": 0,
  "grayscale": 0,
  "glassEffect": false,
  "glassBlur": 10,
  "glassOpacity": 0.7,
  "glassTint": "#ffffff",
  "glassBorder": true,
  "glassBorderColor": "#ffffff",
  "glassBorderWidth": 1
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | 图片路径 |
| `fit` | string | cover | 适配方式: cover/contain/fill/none |
| `borderRadius` | number | 0 | 圆角半径 |
| `borderWidth` | number | 0 | 边框宽度 |
| `borderColor` | string | #000000 | 边框颜色 |
| `shadowBlur` | number | 0 | 阴影模糊 |
| `shadowColor` | string | #000000 | 阴影颜色 |
| `shadowOffsetX` | number | 0 | 阴影X偏移 |
| `shadowOffsetY` | number | 0 | 阴影Y偏移 |
| `flipX` | boolean | false | 水平翻转 |
| `flipY` | boolean | false | 垂直翻转 |
| `brightness` | number | 1 | 亮度(0-2) |
| `contrast` | number | 1 | 对比度(0-2) |
| `saturation` | number | 1 | 饱和度(0-2) |
| `hue` | number | 0 | 色相(0-360) |
| `grayscale` | number | 0 | 灰度(0-1) |
| `glassEffect` | boolean | false | 毛玻璃效果 |
| `glassBlur` | number | 10 | 毛玻璃模糊 |
| `glassOpacity` | number | 0.7 | 毛玻璃透明度 |
| `glassTint` | string | #ffffff | 毛玻璃色调 |
| `glassBorder` | boolean | true | 毛玻璃边框 |
| `glassBorderColor` | string | #ffffff | 毛玻璃边框色 |
| `glassBorderWidth` | number | 1 | 毛玻璃边框宽 |

---

### 7.5 视频 (video)

```json
{
  "type": "video",
  "src": "./assets/clip.mp4",
  "x": "50%",
  "y": "50%",
  "width": 1920,
  "height": 1080,
  "cutFrom": 0,
  "cutTo": undefined,
  "speedFactor": 1,
  "loop": false,
  "mute": true,
  "volume": 1,
  "opacity": 1,
  "duration": 10,
  "startTime": 0
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | 视频路径 |
| `cutFrom` | number | 0 | 裁剪起始(秒) |
| `cutTo` | number | - | 裁剪结束(秒) |
| `speedFactor` | number | 1 | 播放速度 |
| `loop` | boolean | false | 循环播放 |
| `mute` | boolean | true | 静音 |
| `volume` | number | 1 | 音量(0-1) |

---

### 7.6 SVG

```json
{
  "type": "svg",
  "src": "./assets/icon.svg",
  "x": "50%",
  "y": "50%",
  "width": 100,
  "height": 100,
  "fit": "contain",
  "preserveAspectRatio": true,
  "enableSVGAnimations": true,
  "opacity": 1,
  "duration": 5,
  "startTime": 0,
  "animations": ["zoomIn"]
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | SVG路径 |
| `svgString` | string | - | SVG字符串 |
| `fit` | string | contain | 适配方式 |
| `preserveAspectRatio` | boolean | true | 保持宽高比 |
| `enableSVGAnimations` | boolean | true | 启用SVG动画 |

---

### 7.7 骨骼动画 (spine)

```json
{
  "type": "spine",
  "src": "./assets/character.json",
  "x": "50%",
  "y": "50%",
  "scale": 1,
  "timeScale": 1,
  "loop": true,
  "bgcolor": null,
  "valign": "middle",
  "opacity": 1,
  "duration": 5,
  "startTime": 0
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | Spine文件路径 |
| `skeleton` | string | - | 骨架文件 |
| `atlas` | string | - | Atlas文件 |
| `role` | string | - | 角色名 |
| `prefer` | string | alien | 首选渲染器 |
| `timeline` | string | - | 时间线名称 |
| `animationPlayMode` | string | sequence | 播放模式 |
| `sequenceLoop` | boolean | false | 序列循环 |
| `animSchedule` | string | - | 动画调度 |
| `loop` | boolean | true | 循环播放 |
| `scale` | number | 1 | 缩放 |
| `timeScale` | number | 1 | 时间缩放 |
| `fitFrom` | string | natural | 适配来源 |
| `clampToContainer` | boolean | false | 限制容器 |
| `bgcolor` | string | null | 背景颜色 |
| `valign` | string | middle | 垂直对齐 |

---

### 7.8 精灵图 (sprite)

```json
{
  "type": "sprite",
  "src": "./assets/sprite.png",
  "x": "50%",
  "y": "50%",
  "width": 100,
  "height": 100,
  "cols": 4,
  "rows": 4,
  "frameRate": 12,
  "opacity": 1,
  "duration": 2,
  "startTime": 0
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | 精灵图路径 |
| `spriteType` | string | Sprite | 精灵类型 |
| `spriteConfig` | object | - | 精灵配置 |
| `startX` | number | - | 起始X坐标 |
| `startY` | number | - | 起始Y坐标 |
| `startPosition` | array | - | 起始位置 [x, y] |
| `cols` | number | - | 列数 |
| `rows` | number | - | 行数 |
| `frameRate` | number | - | 帧率 |

---

### 7.9 音频 (audio)

```json
{
  "type": "audio",
  "src": "./assets/music.mp3",
  "volume": 0.8,
  "fadeIn": 2,
  "fadeOut": 2,
  "cutFrom": 0,
  "cutTo": undefined,
  "loop": false,
  "startTime": 0,
  "duration": 30
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | 音频路径 |
| `volume` | number | 1 | 音量(0-1) |
| `fadeIn` | number | 0 | 淡入时长(秒) |
| `fadeOut` | number | 0 | 淡出时长(秒) |
| `cutFrom` | number | 0 | 裁剪起始(秒) |
| `cutTo` | number | - | 裁剪结束(秒) |
| `loop` | boolean | false | 循环播放 |

---

### 7.10 示波器 (oscilloscope)

```json
{
  "type": "oscilloscope",
  "src": "./assets/audio.wav",
  "x": "50%",
  "y": "50%",
  "width": 400,
  "height": 200,
  "waveColor": "#00ff00",
  "backgroundColor": "rgba(0, 0, 0, 0.3)",
  "lineWidth": 2,
  "smoothing": 0.3,
  "mirror": true,
  "style": "line",
  "sensitivity": 1,
  "cutFrom": 0,
  "cutTo": undefined,
  "windowSize": 0.1,
  "scrollSpeed": 1,
  "opacity": 1,
  "duration": 5,
  "startTime": 0
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | 音频路径 |
| `waveColor` | string | #00ff00 | 波形颜色 |
| `backgroundColor` | string | rgba(0,0,0,0.3) | 背景颜色 |
| `lineWidth` | number | 2 | 线宽 |
| `smoothing` | number | 0.3 | 平滑度 |
| `mirror` | boolean | true | 镜像显示 |
| `style` | string | line | 样式: line/bar |
| `sensitivity` | number | 1 | 灵敏度 |
| `cutFrom` | number | 0 | 裁剪起始 |
| `cutTo` | number | - | 裁剪结束 |
| `windowSize` | number | 0.1 | 窗口大小 |
| `scrollSpeed` | number | 1 | 滚动速度 |

---

### 7.11 代码 (code)

```json
{
  "type": "code",
  "code": "console.log('Hello');",
  "language": "javascript",
  "theme": "dark",
  "x": "50%",
  "y": "50%",
  "width": 600,
  "height": 400,
  "fontSize": 20,
  "lineHeight": 1.6,
  "padding": 20,
  "showLineNumbers": true,
  "showBorder": true,
  "borderRadius": 8,
  "borderWidth": 2,
  "borderColor": "#00ff88",
  "bgcolor": "#1e1e1e",
  "split": "letter",
  "splitDelay": 0.05,
  "splitDuration": 0.3,
  "cursor": true,
  "cursorWidth": 2,
  "cursorColor": "#ffffff",
  "cursorBlinkPeriod": 0.7,
  "autoScroll": true,
  "opacity": 1,
  "duration": 5,
  "startTime": 0,
  "animations": ["fadeInUp"]
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `code` | string | - | 代码内容 |
| `language` | string | javascript | 语言 |
| `theme` | string | dark | 主题: dark/light |
| `fontSize` | number | 20 | 字体大小 |
| `lineHeight` | number | 1.6 | 行高 |
| `padding` | number | 20 | 内边距 |
| `showLineNumbers` | boolean | true | 显示行号 |
| `showBorder` | boolean | true | 显示边框 |
| `borderRadius` | number | 8 | 圆角 |
| `borderWidth` | number | 2 | 边框宽 |
| `borderColor` | string | #00ff88 | 边框色 |
| `bgcolor` | string | #1e1e1e | 背景色 |
| `split` | string | null | 拆分: letter/word/line |
| `splitDelay` | number | 0.1 | 拆分延迟 |
| `splitDuration` | number | 0.3 | 拆分时长 |
| `cursor` | boolean | true | 显示光标 |
| `cursorWidth` | number | 2 | 光标宽度 |
| `cursorColor` | string | #ffffff | 光标颜色 |
| `cursorBlinkPeriod` | number | 0.7 | 光标闪烁周期 |
| `autoScroll` | boolean | true | 自动滚动 |

---

### 7.12 ECharts (echarts)

```json
{
  "type": "echarts",
  "option": { "xAxis": {}, "yAxis": {}, "series": [] },
  "x": "50%",
  "y": "50%",
  "width": 600,
  "height": 400,
  "opacity": 1,
  "duration": 5,
  "startTime": 0,
  "animations": ["fadeIn"]
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `option` | object | - | ECharts配置 |
| `theme` | string | - | 主题配置 |
| `width` | number | 600 | 宽度 |
| `height` | number | 400 | 高度 |

---

### 7.13 路径 (path)

```json
{
  "type": "path",
  "points": [[0, 0], [100, 100], [200, 50]],
  "closed": false,
  "smooth": false,
  "bezier": false,
  "fillColor": "#6366f1",
  "strokeColor": "#8b5cf6",
  "strokeWidth": 2,
  "strokeCap": "round",
  "strokeJoin": "round",
  "dashArray": null,
  "dashOffset": 0,
  "x": "50%",
  "y": "50%",
  "opacity": 1,
  "duration": 5,
  "startTime": 0,
  "animations": ["fadeIn"]
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | array | [] | 点坐标数组 |
| `closed` | boolean | false | 闭合路径 |
| `smooth` | boolean | false | 平滑曲线 |
| `bezier` | boolean | false | 贝塞尔曲线 |
| `fillColor` | string | null | 填充色 |
| `strokeColor` | string | #000000 | 描边色 |
| `strokeWidth` | number | 1 | 描边宽 |
| `strokeCap` | string | round | 线帽 |
| `strokeJoin` | string | round | 连接 |
| `dashArray` | array | null | 虚线模式 |
| `dashOffset` | number | 0 | 虚线偏移 |

---

### 7.14 字幕 (subtitles/subtitle)

```json
{
  "type": "subtitles",
  "src": "./assets/lyrics.lrc",
  "x": "50%",
  "y": "85%",
  "fontSize": 72,
  "fontFamily": "PatuaOne",
  "textColor": "#ffffff",
  "position": "center",
  "textAlign": "center",
  "split": "letter",
  "splitDelay": 0.1,
  "splitDuration": 0.3,
  "maxLength": 20,
  "opacity": 1,
  "duration": 5,
  "startTime": 0
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | 歌词文件路径 |
| `text` | string | - | 直接文本内容 |
| `fontSize` | number | 72 | 字体大小 |
| `fontFamily` | string | PatuaOne | 字体 |
| `textColor` | string | #ffffff | 文字颜色 |
| `position` | string | center | 位置 |
| `textAlign` | string | center | 对齐 |
| `split` | string | null | 拆分类型 |
| `splitDelay` | number | 0.1 | 拆分延迟 |
| `splitDuration` | number | 0.3 | 拆分时长 |
| `maxLength` | number | 20 | 每行最大长度 |

---

### 7.15 JSON (json)

```json
{
  "type": "json",
  "src": "./assets/data.json",
  "jsonData": { "key": "value" },
  "jsonString": "{ \"key\": \"value\" }",
  "x": "50%",
  "y": "50%",
  "width": 400,
  "height": 300,
  "fit": "contain",
  "preserveAspectRatio": true,
  "opacity": 1,
  "duration": 5,
  "startTime": 0
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | JSON文件路径 |
| `jsonData` | object | - | JSON对象 |
| `jsonString` | string | - | JSON字符串 |
| `fit` | string | contain | 适配方式 |
| `preserveAspectRatio` | boolean | true | 保持宽高比 |

---

## 8. 预设动画

**使用字符串数组形式!**

```json
"animations": ["zoomIn"]
"animations": ["fadeInUp"]
"animations": ["bigIn", "bigOut"]
```

### 淡入/淡出

| 名称 | 效果 |
|------|------|
| `fadeIn` | opacity 0→1 |
| `fadeOut` | opacity 1→0 (自动在结束前1秒) |
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

## 9. 转场效果

```json
"transitions": [
  { "name": "CrossZoom", "duration": 1 }
]
```

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

## 10. onFrame 回调

```json
{
  "type": "circle",
  "onFrame": {
    "fn": (el, ev, item) => {
      if (!item) return;
      item.rotation = ev.time * 30;
    },
    "context": {}
  }
}
```

| 参数 | 说明 |
|------|------|
| `el` | 元素实例 |
| `ev` | 事件 { time, delta, count } |
| `item` | Paper.js 渲染项 |

**常见效果**:

```javascript
// 旋转
(item) => { item.rotation = ev.time * 30; }

// 脉冲缩放
(item) => {
  const scale = 1 + Math.sin(ev.time * 4) * 0.1;
  item.scaleX = scale;
  item.scaleY = scale;
}

// 闪烁
(item) => {
  item.opacity = 0.3 + Math.sin(ev.time * 5) * 0.4;
}
```

---

## 11. 完整示例

```json
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "output": "output/intro.mp4",
  "background": "#0a0a0f",
  "tracks": [
    {
      "zIndex": 1,
      "scenes": [
        {
          "startTime": 0,
          "duration": 5,
          "background": "#0a0a0f",
          "elements": [
            {
              "type": "circle",
              "x": "50%",
              "y": "50%",
              "radius": 200,
              "bgcolor": "#6366f1",
              "opacity": 0.15,
              "animations": ["zoomIn"]
            },
            {
              "type": "text",
              "text": "FOLIKO",
              "x": "50%",
              "y": "45%",
              "fontSize": 180,
              "color": "#ffffff",
              "fontFamily": "Arial",
              "fontWeight": "bold",
              "animations": ["bigIn"],
              "textShadow": true,
              "textShadowColor": "#6366f1",
              "textShadowBlur": 60
            },
            {
              "type": "rect",
              "x": "20%",
              "y": "50%",
              "width": 300,
              "height": 220,
              "bgcolor": "#1a1a2e",
              "borderRadius": 20,
              "borderWidth": 2,
              "borderColor": "#6366f1",
              "shadowBlur": 25,
              "shadowColor": "#6366f1",
              "animations": ["fadeInUp"]
            }
          ]
        }
      ],
      "transitions": [
        { "name": "CrossZoom", "duration": 1 }
      ]
    }
  ],
  "audioTracks": [
    { "src": "../assets/cotton-clouds.mp3", "startTime": 0, "volume": 0.5 }
  ]
}
```

---

## 12. 输出文件

```
project/
├── output/
│   └── intro.mp4
├── examples/
│   └── video.json
└── assets/
    └── music.mp3
```

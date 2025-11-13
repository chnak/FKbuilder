# 示波器渲染器扩展系统

示波器元素支持通过插件化的渲染器系统来扩展不同的可视化样式。

## 目录结构

```
oscilloscope/
├── renderer-loader.js    # 渲染器加载器
├── renderers/            # 渲染器目录
│   ├── line.js          # 线条波形
│   ├── bars.js          # 柱状波形
│   ├── circle.js        # 圆形波形
│   ├── spectrum.js      # 频谱波形
│   ├── particles.js     # 粒子波形
│   ├── waterfall.js     # 瀑布图
│   ├── spiral.js        # 螺旋波形
│   ├── ripple.js        # 涟漪波形
│   ├── grid.js          # 网格波形
│   └── explosion.js     # 爆炸波形
└── README.md
```

## 如何创建自定义渲染器

1. 在 `renderers/` 目录下创建一个新的 JavaScript 文件，例如 `my-custom-renderer.js`

2. 导出一个默认函数，函数签名如下：

```javascript
import paper from 'paper-jsdom-canvas';

/**
 * 自定义渲染器
 * @param {OscilloscopeElement} element - 示波器元素实例
 * @param {Array<number>} data - 波形数据数组（归一化到 -1 到 1）
 * @param {number} x - 左上角 X 坐标
 * @param {number} y - 左上角 Y 坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} [time] - 当前时间（可选，某些渲染器需要）
 */
export default function myCustomRenderer(element, data, x, y, width, height, time) {
  // 访问元素属性
  const waveColor = element.waveColor;
  const sensitivity = element.sensitivity;
  const mirror = element.mirror;
  
  // 使用 Paper.js 绘制
  const path = new paper.Path();
  path.strokeColor = waveColor;
  // ... 绘制逻辑
}

// 设置样式名称（必须）
myCustomRenderer.style = 'my-custom';
```

3. 渲染器会自动被加载，无需手动注册

## 可用的元素属性

在渲染器中，可以通过 `element` 参数访问以下属性：

- `element.waveColor` - 波形颜色
- `element.backgroundColor` - 背景颜色
- `element.sensitivity` - 灵敏度
- `element.mirror` - 是否镜像显示
- `element.lineWidth` - 线条宽度
- `element.smoothing` - 平滑度
- `element.style` - 当前样式名称

对于特定样式的配置：
- `element.barWidth`, `element.barGap` - 柱状图配置
- `element.particleCount`, `element.particleColors` - 粒子配置
- `element.waterfallBands` - 瀑布图配置
- `element.spiralTurns` - 螺旋配置
- `element.rippleCount`, `element.rippleSpeed` - 涟漪配置
- `element.gridRows`, `element.gridCols` - 网格配置
- `element.explosionParticles` - 爆炸配置

## 使用自定义渲染器

```javascript
await scene.addOscilloscope({
  audioPath: audioFile,
  style: 'my-custom',  // 使用自定义渲染器
  // ... 其他配置
});
```

## 注意事项

1. 渲染器函数必须是同步的（不能使用 async/await）
2. 使用 Paper.js 进行绘制，确保已导入 `paper-jsdom-canvas`
3. 渲染器会在首次使用时自动加载
4. 如果渲染器加载失败，会自动回退到默认的 `line` 渲染器


# onFrame 持续动画指南

## 概述

`onFrame` 回调函数允许你在每一帧更新元素，实现持续动画效果。与传统的动画配置不同，`onFrame` 动画会在整个元素生命周期内持续运行，非常适合实现旋转、脉冲、闪烁等需要持续更新的效果。

## 为什么使用 onFrame？

### 传统动画的局限性

传统动画配置（如 `animations` 数组）有固定的开始时间、持续时间和结束时间：

```javascript
animations: [
  { type: 'transform', fromRotation: 0, toRotation: 360, duration: 5 }
]
```

这种动画在 5 秒后就会停止，无法实现持续旋转。

### onFrame 的优势

- ✅ **持续运行**：在整个元素生命周期内持续执行
- ✅ **每帧更新**：精确控制每一帧的状态
- ✅ **性能优化**：直接操作 Paper.js 项目，无需重新渲染
- ✅ **灵活控制**：可以基于时间、帧数或自定义逻辑

## 基本用法

### 函数签名

```javascript
onFrame: function(element, event, paperItem) {
  // element: 元素实例
  // event: { count, time, delta } - 帧事件对象
  // paperItem: Paper.js 项目引用
}
```

### 参数说明

- **`element`**: 元素实例，可以访问配置和状态
- **`event.time`**: 当前时间（秒），从视频开始计算
- **`event.count`**: 帧计数（从 0 开始）
- **`event.delta`**: 帧间隔（秒）
- **`paperItem`**: Paper.js 项目，可以直接修改属性

## 常见动画模式

### 1. 持续旋转

```javascript
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
```

**要点**：
- 使用 `event.time` 计算旋转角度
- 使用 `% 360` 确保角度在 0-360 范围内
- 使用相对旋转 `rotate(rotation - currentRotation, pivot)` 避免累积误差

### 2. 脉冲/呼吸动画

```javascript
scene.addCircle({
  x: '50%',
  y: '50%',
  radius: 100,
  fillColor: '#ff6b6b',
  duration: 10,
  startTime: 0,
  onFrame: (element, event, paperItem) => {
    if (!paperItem) return;
    const pivot = paperItem.position || paperItem.center;
    if (pivot) {
      // 脉冲效果：在0.9到1.1之间缩放
      const pulseSpeed = 2; // 脉冲速度（周期/秒）
      const pulsePhase = event.time * pulseSpeed * 2 * Math.PI;
      const pulseScale = 1 + Math.sin(pulsePhase) * 0.1;
      const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
      paperItem.scale(pulseScale / currentScale, pivot);
    }
  },
});
```

**要点**：
- 使用 `Math.sin()` 实现平滑的周期性变化
- 缩放范围：`1 + Math.sin(phase) * amplitude`
- 使用相对缩放避免累积误差

### 3. 闪烁动画

```javascript
scene.addPath({
  points: starPoints,
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
```

**要点**：
- 使用 `(Math.sin(phase) + 1) / 2` 将正弦波映射到 0-1 范围
- 然后映射到目标透明度范围：`minOpacity + value * (maxOpacity - minOpacity)`

### 4. 摆动动画

```javascript
scene.addRect({
  x: '50%',
  y: '50%',
  width: 200,
  height: 100,
  fillColor: '#4a90e2',
  duration: 10,
  startTime: 0,
  onFrame: (element, event, paperItem) => {
    if (!paperItem) return;
    const pivot = paperItem.position || paperItem.center;
    if (pivot) {
      // 摆动：在-5度到5度之间摆动
      const swingSpeed = 1; // 摆动速度（周期/秒）
      const swingPhase = event.time * swingSpeed * 2 * Math.PI;
      const swingRotation = Math.sin(swingPhase) * 5; // -5到5度
      const currentRotation = paperItem.rotation || 0;
      paperItem.rotate(swingRotation - currentRotation, pivot);
    }
  },
});
```

### 5. 颜色循环

```javascript
scene.addCircle({
  x: '50%',
  y: '50%',
  radius: 100,
  fillColor: '#ff0000',
  duration: 10,
  startTime: 0,
  onFrame: (element, event, paperItem) => {
    if (!paperItem) return;
    // 颜色循环：色相在0-360度之间循环
    const hue = (event.time * 60) % 360; // 每秒60度
    paperItem.fillColor.hue = hue;
  },
});
```

## 高级技巧

### 1. 组合多个动画

可以在同一个 `onFrame` 中组合多个动画效果：

```javascript
onFrame: (element, event, paperItem) => {
  if (!paperItem) return;
  const pivot = paperItem.position || paperItem.center;
  if (pivot) {
    // 同时旋转和脉冲
    const rotation = (event.time * 180) % 360;
    const currentRotation = paperItem.rotation || 0;
    paperItem.rotate(rotation - currentRotation, pivot);
    
    const pulseScale = 1 + Math.sin(event.time * 2 * Math.PI * 2) * 0.1;
    const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
    paperItem.scale(pulseScale / currentScale, pivot);
  }
}
```

### 2. 基于元素时间的动画

如果需要相对于元素开始时间的动画：

```javascript
onFrame: (element, event, paperItem) => {
  if (!paperItem) return;
  // 相对于元素开始的时间
  const relativeTime = event.time - element.startTime;
  const rotation = (relativeTime * 180) % 360;
  // ...
}
```

### 3. 不同频率的动画

为不同元素设置不同的动画频率，创造更自然的效果：

```javascript
// 星星1：快速闪烁
const twinkleSpeed1 = 2.5;

// 星星2：慢速闪烁
const twinkleSpeed2 = 1.2;

// 星星3：中等速度闪烁
const twinkleSpeed3 = 1.8;
```

### 4. 初始相位偏移

为多个相同元素设置不同的初始相位，避免同步：

```javascript
starPositions.forEach((star, index) => {
  const initialPhase = (index * 0.5) % (Math.PI * 2);
  scene.addPath({
    // ...
    onFrame: (element, event, paperItem) => {
      const twinklePhase = event.time * twinkleSpeed * 2 * Math.PI + initialPhase;
      // ...
    },
  });
});
```

## 性能优化建议

1. **检查 paperItem 是否存在**
   ```javascript
   if (!paperItem) return;
   ```

2. **缓存 pivot 点**
   ```javascript
   const pivot = paperItem.position || paperItem.center;
   if (pivot) {
     // 使用 pivot
   }
   ```

3. **使用相对变换**
   - 使用 `rotate(angle - currentAngle, pivot)` 而不是直接设置 `rotation`
   - 使用 `scale(newScale / currentScale, pivot)` 而不是直接设置 `scaling`

4. **避免不必要的计算**
   - 只在需要时计算复杂值
   - 缓存重复使用的值

## 完整示例

查看 `examples/test-auto-duration.js` 获取完整的持续动画示例，包括：
- 持续旋转的圆形
- 闪烁的星星
- 呼吸动画的文本
- 摆动的边框
- 脉冲的星形

## 相关文档

- [onFrame 参数说明](./onFrame-params.md) - 详细的参数说明
- [onFrame vs onRender](./onFrame-vs-onRender.md) - 两种回调的区别和使用场景


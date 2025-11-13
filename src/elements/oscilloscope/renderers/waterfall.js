import paper from 'paper-jsdom-canvas';

/**
 * 瀑布图波形渲染器（频谱瀑布图效果）
 */
export default function renderWaterfall(element, data, x, y, width, height, time) {
  const centerY = y + height / 2;
  const barCount = element.waterfallBands;
  const step = Math.max(1, Math.floor(data.length / barCount));
  const barWidth = width / barCount;
  const amplitude = (height / 2) * element.sensitivity;
  
  // 存储历史数据用于瀑布效果
  if (!element.waterfallHistory) {
    element.waterfallHistory = [];
  }
  
  // 计算当前帧的频谱数据
  const currentSpectrum = [];
  for (let i = 0; i < barCount; i++) {
    const dataIndex = i * step;
    if (dataIndex >= data.length) break;
    
    let sumSquares = 0;
    let count = 0;
    for (let j = dataIndex; j < Math.min(dataIndex + step, data.length); j++) {
      sumSquares += data[j] * data[j];
      count++;
    }
    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    currentSpectrum.push(rms);
  }
  
  // 添加到历史记录
  element.waterfallHistory.unshift(currentSpectrum);
  if (element.waterfallHistory.length > Math.floor(height / 2)) {
    element.waterfallHistory.pop();
  }
  
  // 绘制瀑布图（从下往上，从新到旧）
  for (let row = 0; row < element.waterfallHistory.length; row++) {
    const spectrum = element.waterfallHistory[row];
    const rowY = centerY - row;
    const alpha = 1 - (row / element.waterfallHistory.length) * 0.8;
    
    for (let i = 0; i < spectrum.length; i++) {
      const barHeight = spectrum[i] * amplitude;
      const barX = x + i * barWidth;
      
      // 根据强度选择颜色（从蓝到红）
      const intensity = spectrum[i];
      let color;
      if (intensity < 0.33) {
        color = new paper.Color(0, intensity * 3, 1);
      } else if (intensity < 0.66) {
        color = new paper.Color((intensity - 0.33) * 3, 1, 1 - (intensity - 0.33) * 3);
      } else {
        color = new paper.Color(1, 1 - (intensity - 0.66) * 3, 0);
      }
      
      const bar = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(barX, rowY, barWidth - 1, barHeight),
        fillColor: color,
      });
      bar.fillColor.alpha = alpha;
    }
  }
}

renderWaterfall.style = 'waterfall';


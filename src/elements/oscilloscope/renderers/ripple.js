import paper from 'paper-jsdom-canvas';

/**
 * 涟漪波形渲染器（水波纹效果）
 */
export default function renderRipple(element, data, x, y, width, height, time) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2;
  
  // 计算平均振幅
  let avgAmplitude = 0;
  for (let i = 0; i < data.length; i++) {
    avgAmplitude += Math.abs(data[i]);
  }
  avgAmplitude = (avgAmplitude / data.length) * element.sensitivity;
  
  // 绘制多个涟漪圈
  for (let i = 0; i < element.rippleCount; i++) {
    const rippleProgress = (time * element.rippleSpeed + i / element.rippleCount) % 1;
    const radius = maxRadius * rippleProgress;
    const alpha = 1 - rippleProgress;
    
    if (alpha > 0) {
      const circle = new paper.Path.Circle({
        center: new paper.Point(centerX, centerY),
        radius: radius + avgAmplitude * maxRadius * 0.3,
      });
      
      circle.strokeColor = element.waveColor;
      circle.strokeWidth = 3;
      circle.strokeColor.alpha = alpha * 0.8;
      circle.fillColor = 'transparent';
    }
  }
  
  // 中心点
  const centerCircle = new paper.Path.Circle({
    center: new paper.Point(centerX, centerY),
    radius: 5 + avgAmplitude * 20,
  });
  centerCircle.fillColor = element.waveColor;
  centerCircle.fillColor.alpha = 0.8;
}

renderRipple.style = 'ripple';


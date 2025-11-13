import paper from 'paper-jsdom-canvas';

/**
 * 螺旋波形渲染器
 */
export default function renderSpiral(element, data, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 20;
  const pointCount = Math.min(data.length, 500);
  
  const path = new paper.Path();
  path.strokeColor = element.waveColor;
  path.strokeWidth = element.lineWidth;
  
  for (let i = 0; i < pointCount; i++) {
    const progress = i / pointCount;
    const angle = progress * Math.PI * 2 * element.spiralTurns;
    const radius = maxRadius * progress * 0.8;
    
    const dataIndex = Math.floor(progress * data.length);
    const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
    const r = radius + amplitude * maxRadius * 0.2;
    
    const px = centerX + Math.cos(angle) * r;
    const py = centerY + Math.sin(angle) * r;
    
    if (i === 0) {
      path.moveTo(new paper.Point(px, py));
    } else {
      path.lineTo(new paper.Point(px, py));
    }
  }
  
  // 使用颜色数组的第一个颜色作为线条颜色
  if (element.particleColors && element.particleColors.length > 0) {
    path.strokeColor = element.particleColors[0];
  }
}

renderSpiral.style = 'spiral';


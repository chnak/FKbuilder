import paper from 'paper-jsdom-canvas';

/**
 * 光波扩散渲染器（光波从中心扩散）
 */
export default function renderLightwave(element, data, x, y, width, height, time) {
  if (!data || data.length === 0) return;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2;
  
  // 计算平均振幅
  let avgAmplitude = 0;
  for (let i = 0; i < data.length; i++) {
    avgAmplitude += Math.abs(data[i]);
  }
  avgAmplitude = (avgAmplitude / data.length) * element.sensitivity;
  
  // 光波数量
  const waveCount = element.lightwaveCount || 8;
  const waveSpeed = element.lightwaveSpeed || 2.0;
  
  // 绘制多个光波
  for (let i = 0; i < waveCount; i++) {
    const waveProgress = ((time * waveSpeed + i / waveCount) % 1);
    const radius = maxRadius * waveProgress;
    
    if (radius > 0) {
      // 根据音频数据调整光波形状
      const segments = element.lightwaveSegments || 64;
      const path = new paper.Path();
      path.strokeColor = element.waveColor;
      path.strokeWidth = 3;
      path.strokeColor.alpha = (1 - waveProgress) * 0.9;
      path.closed = true;
      
      // 选择颜色
      if (element.particleColors && element.particleColors.length > 0) {
        const colorIndex = Math.floor((waveProgress * waveCount + i) % element.particleColors.length);
        path.strokeColor = element.particleColors[colorIndex];
      }
      
      for (let j = 0; j < segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        
        // 根据音频数据调整半径
        const dataIndex = Math.floor((j / segments) * data.length);
        const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
        const waveRadius = radius * (1 + amplitude * 0.5);
        
        const px = centerX + Math.cos(angle) * waveRadius;
        const py = centerY + Math.sin(angle) * waveRadius;
        
        if (j === 0) {
          path.moveTo(new paper.Point(px, py));
        } else {
          path.lineTo(new paper.Point(px, py));
        }
      }
      
      // 填充光波（渐变透明度）
      path.fillColor = path.strokeColor;
      path.fillColor.alpha = (1 - waveProgress) * 0.2;
      path.blendMode = 'screen';
      
      // 添加内层光晕
      if (waveProgress > 0.1 && waveProgress < 0.9) {
        const innerRadius = radius * 0.8;
        const innerPath = new paper.Path();
        innerPath.strokeColor = path.strokeColor;
        innerPath.strokeWidth = 1;
        innerPath.strokeColor.alpha = (1 - waveProgress) * 0.5;
        innerPath.closed = true;
        
        for (let j = 0; j < segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          const dataIndex = Math.floor((j / segments) * data.length);
          const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
          const waveRadius = innerRadius * (1 + amplitude * 0.3);
          
          const px = centerX + Math.cos(angle) * waveRadius;
          const py = centerY + Math.sin(angle) * waveRadius;
          
          if (j === 0) {
            innerPath.moveTo(new paper.Point(px, py));
          } else {
            innerPath.lineTo(new paper.Point(px, py));
          }
        }
      }
    }
  }
  
  // 中心亮点
  const centerSize = 5 + avgAmplitude * 15;
  const centerCircle = new paper.Path.Circle({
    center: new paper.Point(centerX, centerY),
    radius: centerSize
  });
  
  if (element.particleColors && element.particleColors.length > 0) {
    centerCircle.fillColor = element.particleColors[0];
  } else {
    centerCircle.fillColor = element.waveColor;
  }
  centerCircle.fillColor.alpha = 0.9;
  centerCircle.blendMode = 'screen';
  
  // 中心光晕
  const glowCircle = new paper.Path.Circle({
    center: new paper.Point(centerX, centerY),
    radius: centerSize * 2
  });
  glowCircle.fillColor = centerCircle.fillColor;
  glowCircle.fillColor.alpha = 0.3;
  glowCircle.blendMode = 'screen';
}

renderLightwave.style = 'lightwave';


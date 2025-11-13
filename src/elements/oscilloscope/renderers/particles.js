import paper from 'paper-jsdom-canvas';

/**
 * 粒子/圆点波形渲染器（多彩圆点随音律跳动）
 */
export default function renderParticles(element, data, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 10;
  
  // 计算每个圆点对应的数据索引
  const step = Math.max(1, Math.floor(data.length / element.particleCount));
  const colorStep = element.particleColors.length / element.particleCount;
  
  // 存储上一帧的位置（用于拖尾效果）
  if (!element.lastParticlePositions) {
    element.lastParticlePositions = [];
  }
  
  for (let i = 0; i < element.particleCount; i++) {
    const dataIndex = Math.min(i * step, data.length - 1);
    const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
    
    // 计算圆点大小（根据振幅）
    const sizeRange = element.particleMaxSize - element.particleMinSize;
    const particleSize = element.particleMinSize + amplitude * sizeRange;
    
    // 计算圆点位置（圆形分布）
    const angle = (i / element.particleCount) * Math.PI * 2;
    const baseRadius = maxRadius * 0.6; // 基础半径
    const radiusOffset = amplitude * maxRadius * 0.4; // 根据振幅偏移
    const radius = baseRadius + radiusOffset;
    
    const px = centerX + Math.cos(angle) * radius;
    const py = centerY + Math.sin(angle) * radius;
    
    // 选择颜色（根据索引从渐变色数组中选取）
    const colorIndex = Math.floor(i * colorStep) % element.particleColors.length;
    const color = element.particleColors[colorIndex];
    
    // 绘制拖尾效果
    if (element.particleTrail && element.lastParticlePositions[i]) {
      const lastPos = element.lastParticlePositions[i];
      const trailPath = new paper.Path();
      trailPath.strokeColor = color;
      trailPath.strokeWidth = particleSize * 0.3;
      trailPath.strokeColor.alpha = 0.3;
      
      // 绘制从上一帧到当前帧的线条
      trailPath.moveTo(new paper.Point(lastPos.x, lastPos.y));
      trailPath.lineTo(new paper.Point(px, py));
    }
    
    // 绘制圆点
    const circle = new paper.Path.Circle({
      center: new paper.Point(px, py),
      radius: particleSize / 2,
    });
    
    // 使用渐变色填充
    circle.fillColor = color;
    
    // 添加发光效果（外圈）
    if (amplitude > 0.3) {
      const glowCircle = new paper.Path.Circle({
        center: new paper.Point(px, py),
        radius: particleSize / 2 + 2,
      });
      glowCircle.fillColor = color;
      glowCircle.fillColor.alpha = 0.2;
      glowCircle.sendToBack();
    }
    
    // 保存当前位置用于下一帧
    element.lastParticlePositions[i] = { x: px, y: py };
  }
  
  // 如果启用镜像，在中心绘制对称的圆点
  if (element.mirror) {
    for (let i = 0; i < element.particleCount; i++) {
      const dataIndex = Math.min(i * step, data.length - 1);
      const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
      
      const sizeRange = element.particleMaxSize - element.particleMinSize;
      const particleSize = element.particleMinSize + amplitude * sizeRange;
      
      const angle = (i / element.particleCount) * Math.PI * 2;
      const baseRadius = maxRadius * 0.3; // 内圈基础半径
      const radiusOffset = amplitude * maxRadius * 0.2;
      const radius = baseRadius + radiusOffset;
      
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      
      const colorIndex = Math.floor(i * colorStep) % element.particleColors.length;
      const color = element.particleColors[colorIndex];
      
      const circle = new paper.Path.Circle({
        center: new paper.Point(px, py),
        radius: particleSize / 3, // 内圈圆点稍小
      });
      circle.fillColor = color;
      circle.fillColor.alpha = 0.6;
    }
  }
}

renderParticles.style = 'particles';


import paper from 'paper';

/**
 * 粒子/圆点样式默认配置
 */
export const defaultConfig = {
  particleCount: 50, // 圆点数量
  particleMinSize: 3, // 圆点最小尺寸
  particleMaxSize: 15, // 圆点最大尺寸
  particleColors: [ // 圆点颜色数组（渐变色）
    '#ff0080', '#ff0080', '#ff4080', '#ff4080',
    '#ff8000', '#ff8000', '#ffc000', '#ffc000',
    '#ffff00', '#ffff00', '#80ff00', '#80ff00',
    '#00ff80', '#00ff80', '#00ffff', '#00ffff',
    '#0080ff', '#0080ff', '#8000ff', '#8000ff',
  ],
  particleTrail: true, // 是否显示拖尾效果
  particleTrailLength: 5, // 拖尾长度
};

/**
 * 粒子/圆点波形渲染器（多彩圆点随音律跳动）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderParticles(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 10;
  
  // 计算每个圆点对应的数据索引
  const step = Math.max(1, Math.floor(data.length / cfg.particleCount));
  const colorStep = cfg.particleColors.length / cfg.particleCount;
  
  // 存储上一帧的位置（用于拖尾效果）
  if (!element.lastParticlePositions) {
    element.lastParticlePositions = [];
  }
  
  for (let i = 0; i < cfg.particleCount; i++) {
    const dataIndex = Math.min(i * step, data.length - 1);
    const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
    
    // 计算圆点大小（根据振幅）
    const sizeRange = cfg.particleMaxSize - cfg.particleMinSize;
    const particleSize = cfg.particleMinSize + amplitude * sizeRange;
    
    // 计算圆点位置（圆形分布）
    const angle = (i / cfg.particleCount) * Math.PI * 2;
    const baseRadius = maxRadius * 0.6; // 基础半径
    const radiusOffset = amplitude * maxRadius * 0.4; // 根据振幅偏移
    const radius = baseRadius + radiusOffset;
    
    const px = centerX + Math.cos(angle) * radius;
    const py = centerY + Math.sin(angle) * radius;
    
    // 选择颜色（根据索引从渐变色数组中选取）
    const colorIndex = Math.floor(i * colorStep) % cfg.particleColors.length;
    const color = cfg.particleColors[colorIndex];
    
    // 绘制拖尾效果
    if (cfg.particleTrail && element.lastParticlePositions[i]) {
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
    for (let i = 0; i < cfg.particleCount; i++) {
      const dataIndex = Math.min(i * step, data.length - 1);
      const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
      
      const sizeRange = cfg.particleMaxSize - cfg.particleMinSize;
      const particleSize = cfg.particleMinSize + amplitude * sizeRange;
      
      const angle = (i / cfg.particleCount) * Math.PI * 2;
      const baseRadius = maxRadius * 0.3; // 内圈基础半径
      const radiusOffset = amplitude * maxRadius * 0.2;
      const radius = baseRadius + radiusOffset;
      
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      
      const colorIndex = Math.floor(i * colorStep) % cfg.particleColors.length;
      const color = cfg.particleColors[colorIndex];
      
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


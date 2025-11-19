import paper from 'paper';

/**
 * 轨迹追踪样式默认配置
 */
export const defaultConfig = {
  trailParticleCount: 20, // 轨迹粒子数量
  trailLength: 50, // 轨迹长度
  trailSpeed: 1.0, // 轨迹移动速度
  particleColors: [ // 颜色数组
    '#ff0080', '#ff4080', '#ff8000', '#ffc000',
    '#ffff00', '#80ff00', '#00ff80', '#00ffff',
    '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
  ],
};

/**
 * 粒子轨迹追踪渲染器（粒子沿波形移动留下轨迹）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderTrail(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  if (!data || data.length === 0) return;
  
  const centerY = y + height / 2;
  const stepX = width / data.length;
  const amplitude = (height / 2) * element.sensitivity;
  
  // 初始化轨迹状态
  if (!element.trailParticles) {
    element.trailParticles = [];
    const particleCount = cfg.trailParticleCount;
    const dataLength = data.length || 1000; // 默认值，避免初始化时出错
    
    for (let i = 0; i < particleCount; i++) {
      element.trailParticles.push({
        position: Math.random() * dataLength, // 在波形上的位置（索引）
        speed: 0.5 + Math.random() * 1.5, // 移动速度
        trail: [], // 轨迹点数组
        colorIndex: i
      });
    }
  }
  
  // 更新粒子位置和轨迹
  for (let particle of element.trailParticles) {
    // 更新位置
    particle.position += particle.speed * cfg.trailSpeed;
    if (particle.position >= data.length) {
      particle.position = 0;
      particle.trail = []; // 重置轨迹
    }
    
    // 获取当前位置的波形数据
    const dataIndex = Math.floor(particle.position);
    if (dataIndex >= 0 && dataIndex < data.length) {
      const px = x + dataIndex * stepX;
      const py = centerY - data[dataIndex] * amplitude;
      
      // 添加到轨迹
      particle.trail.push({
        point: new paper.Point(px, py),
        time: time
      });
      
      // 限制轨迹长度
      const maxTrailLength = cfg.trailLength;
      if (particle.trail.length > maxTrailLength) {
        particle.trail.shift();
      }
    }
  }
  
  // 绘制轨迹
  for (let particle of element.trailParticles) {
    if (particle.trail.length < 2) continue;
    
    // 选择颜色
    let trailColor;
    if (cfg.particleColors && cfg.particleColors.length > 0) {
      const colorIndex = particle.colorIndex % cfg.particleColors.length;
      trailColor = cfg.particleColors[colorIndex];
    } else {
      trailColor = element.waveColor;
    }
    
    // 绘制轨迹路径（渐变透明度）
    const path = new paper.Path();
    path.strokeColor = trailColor;
    path.strokeWidth = element.lineWidth * 1.5;
    
    for (let i = 0; i < particle.trail.length; i++) {
      const trailPoint = particle.trail[i];
      const progress = i / particle.trail.length;
      const alpha = progress * 0.8; // 从透明到不透明
      
      if (i === 0) {
        path.moveTo(trailPoint.point);
      } else {
        path.lineTo(trailPoint.point);
      }
      
      // 设置每段的透明度
      if (i > 0) {
        const segment = path.segments[i];
        if (segment) {
          // 使用渐变效果
          path.strokeColor.alpha = alpha;
        }
      }
    }
    
    // 绘制粒子头部（高亮）
    if (particle.trail.length > 0) {
      const headPoint = particle.trail[particle.trail.length - 1];
      const headSize = 4 + Math.abs(data[Math.floor(particle.position)] || 0) * element.sensitivity * 8;
      
      const headCircle = new paper.Path.Circle({
        center: headPoint.point,
        radius: headSize
      });
      headCircle.fillColor = trailColor;
      headCircle.fillColor.alpha = 1.0;
      
      // 添加光晕效果
      const glowCircle = new paper.Path.Circle({
        center: headPoint.point,
        radius: headSize * 2
      });
      glowCircle.fillColor = trailColor;
      glowCircle.fillColor.alpha = 0.2;
      glowCircle.blendMode = 'screen';
    }
  }
}

renderTrail.style = 'trail';


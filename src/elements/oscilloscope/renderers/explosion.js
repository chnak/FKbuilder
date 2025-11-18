import paper from '../../../vendor/paper-node.js';

/**
 * 爆炸样式默认配置
 */
export const defaultConfig = {
  explosionParticles: 100, // 爆炸粒子数
  particleColors: [ // 粒子颜色数组
    '#ff0080', '#ff4080', '#ff8000', '#ffc000',
    '#ffff00', '#80ff00', '#00ff80', '#00ffff',
    '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
  ],
};

/**
 * 爆炸波形渲染器（粒子从中心爆炸）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderExplosion(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2;
  const particleCount = cfg.explosionParticles;
  const step = Math.max(1, Math.floor(data.length / particleCount));
  const colorStep = cfg.particleColors.length / particleCount;
  
  for (let i = 0; i < particleCount; i++) {
    const dataIndex = Math.min(i * step, data.length - 1);
    const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
    
    // 计算粒子位置（从中心向外）
    const angle = (i / particleCount) * Math.PI * 2;
    const baseRadius = maxRadius * 0.3;
    const radiusOffset = amplitude * maxRadius * 0.7;
    const radius = baseRadius + radiusOffset;
    
    const px = centerX + Math.cos(angle) * radius;
    const py = centerY + Math.sin(angle) * radius;
    
    // 粒子大小
    const particleSize = 3 + amplitude * 12;
    
    // 选择颜色
    const colorIndex = Math.floor(i * colorStep) % cfg.particleColors.length;
    const color = cfg.particleColors[colorIndex];
    
    // 绘制粒子
    const circle = new paper.Path.Circle({
      center: new paper.Point(px, py),
      radius: particleSize / 2,
    });
    circle.fillColor = color;
    
    // 添加拖尾（从中心到粒子）
    if (amplitude > 0.2) {
      const trail = new paper.Path();
      trail.strokeColor = color;
      trail.strokeWidth = particleSize * 0.2;
      trail.strokeColor.alpha = 0.4;
      trail.moveTo(new paper.Point(centerX, centerY));
      trail.lineTo(new paper.Point(px, py));
    }
  }
}

renderExplosion.style = 'explosion';


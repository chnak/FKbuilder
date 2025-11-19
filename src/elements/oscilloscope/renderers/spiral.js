import paper from 'paper';

/**
 * 螺旋样式默认配置
 */
export const defaultConfig = {
  spiralTurns: 3, // 螺旋圈数
  spiralRadius: 200, // 螺旋半径
  particleColors: [ // 颜色数组（用于渐变）
    '#ff0080', '#ff4080', '#ff8000', '#ffc000',
    '#ffff00', '#80ff00', '#00ff80', '#00ffff',
  ],
};

/**
 * 螺旋波形渲染器
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderSpiral(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 20;
  const pointCount = Math.min(data.length, 500);
  
  const path = new paper.Path();
  path.strokeColor = element.waveColor;
  path.strokeWidth = element.lineWidth;
  
  for (let i = 0; i < pointCount; i++) {
    const progress = i / pointCount;
    const angle = progress * Math.PI * 2 * cfg.spiralTurns;
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
  if (cfg.particleColors && cfg.particleColors.length > 0) {
    path.strokeColor = cfg.particleColors[0];
  }
}

renderSpiral.style = 'spiral';


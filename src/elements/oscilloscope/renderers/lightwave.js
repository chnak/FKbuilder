import paper from '../../../vendor/paper-node.js';

/**
 * 光波扩散样式默认配置
 */
export const defaultConfig = {
  lightwaveCount: 8, // 光波数量
  lightwaveSpeed: 2.0, // 光波速度
  lightwaveSegments: 64, // 光波分段数
  particleColors: [ // 颜色数组
    '#ff0080', '#ff4080', '#ff8000', '#ffc000',
    '#ffff00', '#80ff00', '#00ff80', '#00ffff',
    '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
  ],
};

/**
 * 光波扩散渲染器（光波从中心扩散）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderLightwave(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
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
  const waveCount = cfg.lightwaveCount;
  const waveSpeed = cfg.lightwaveSpeed;
  
  // 绘制多个光波
  for (let i = 0; i < waveCount; i++) {
    const waveProgress = ((time * waveSpeed + i / waveCount) % 1);
    const radius = maxRadius * waveProgress;
    
    if (radius > 0) {
      // 根据音频数据调整光波形状
      const segments = cfg.lightwaveSegments;
      const path = new paper.Path();
      path.strokeColor = element.waveColor;
      path.strokeWidth = 3;
      path.strokeColor.alpha = (1 - waveProgress) * 0.9;
      path.closed = true;
      
      // 选择颜色
      if (cfg.particleColors && cfg.particleColors.length > 0) {
        const colorIndex = Math.floor((waveProgress * waveCount + i) % cfg.particleColors.length);
        path.strokeColor = cfg.particleColors[colorIndex];
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
  
  if (cfg.particleColors && cfg.particleColors.length > 0) {
    centerCircle.fillColor = cfg.particleColors[0];
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


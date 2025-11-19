import paper from 'paper';

/**
 * 涟漪样式默认配置
 */
export const defaultConfig = {
  rippleCount: 5, // 涟漪数量
  rippleSpeed: 1.0, // 涟漪速度
};

/**
 * 涟漪波形渲染器（水波纹效果）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderRipple(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
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
  for (let i = 0; i < cfg.rippleCount; i++) {
    const rippleProgress = (time * cfg.rippleSpeed + i / cfg.rippleCount) % 1;
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


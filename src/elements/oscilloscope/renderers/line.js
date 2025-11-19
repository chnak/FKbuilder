import paper from 'paper';

/**
 * 线条样式默认配置
 */
export const defaultConfig = {};

/**
 * 线条波形渲染器
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderLine(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  const centerY = y + height / 2;
  const stepX = width / data.length;
  const amplitude = (height / 2) * element.sensitivity;

  // 创建波形路径
  const path = new paper.Path();
  path.strokeColor = element.waveColor;
  path.strokeWidth = element.lineWidth;

  // 绘制上半部分
  for (let i = 0; i < data.length; i++) {
    const px = x + i * stepX;
    const py = centerY - data[i] * amplitude;
    if (i === 0) {
      path.moveTo(new paper.Point(px, py));
    } else {
      path.lineTo(new paper.Point(px, py));
    }
  }

  // 如果启用镜像，绘制下半部分
  if (element.mirror) {
    for (let i = data.length - 1; i >= 0; i--) {
      const px = x + i * stepX;
      const py = centerY + data[i] * amplitude;
      path.lineTo(new paper.Point(px, py));
    }
    path.closePath();
    path.fillColor = element.waveColor;
    path.fillColor.alpha = 0.3;
  }
}

// 设置样式名称
renderLine.style = 'line';


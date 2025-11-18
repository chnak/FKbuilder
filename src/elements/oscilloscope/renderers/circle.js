import paper from '../../../vendor/paper-node.js';

/**
 * 圆形样式默认配置
 */
export const defaultConfig = {};

/**
 * 圆形波形渲染器
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderCircle(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const pointCount = Math.min(data.length, 360);

  const path = new paper.Path();
  path.strokeColor = element.waveColor;
  path.strokeWidth = element.lineWidth;
  path.closed = true;

  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const dataIndex = Math.floor((i / pointCount) * data.length);
    const amplitude = data[dataIndex] * radius * element.sensitivity;
    const r = radius + amplitude;

    const px = centerX + Math.cos(angle) * r;
    const py = centerY + Math.sin(angle) * r;

    if (i === 0) {
      path.moveTo(new paper.Point(px, py));
    } else {
      path.lineTo(new paper.Point(px, py));
    }
  }

  path.fillColor = element.waveColor;
  path.fillColor.alpha = 0.2;
}

renderCircle.style = 'circle';


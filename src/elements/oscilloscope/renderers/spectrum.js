import paper from '../../../vendor/paper-node.js';

/**
 * 频谱样式默认配置
 */
export const defaultConfig = {};

/**
 * 频谱波形渲染器（类似频谱分析仪）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderSpectrum(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  const centerY = y + height / 2;
  const barCount = 64; // 频谱条数
  const step = Math.max(1, Math.floor(data.length / barCount));
  const barWidth = (width / barCount) * 0.8;
  const barGap = (width / barCount) * 0.2;
  const amplitude = (height / 2) * element.sensitivity;

  for (let i = 0; i < barCount; i++) {
    const dataIndex = i * step;
    if (dataIndex >= data.length) break;

    // 计算该段的 RMS（均方根）
    let sumSquares = 0;
    let count = 0;
    for (let j = dataIndex; j < Math.min(dataIndex + step, data.length); j++) {
      sumSquares += data[j] * data[j];
      count++;
    }
    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;

    const barX = x + i * (barWidth + barGap);
    const barHeight = rms * amplitude * 2;

    // 绘制频谱条（从中心向上）
    const bar = new paper.Path.Rectangle({
      rectangle: new paper.Rectangle(
        barX,
        centerY - barHeight,
        barWidth,
        barHeight
      ),
      fillColor: element.waveColor,
    });

    // 如果启用镜像，绘制下半部分
    if (element.mirror) {
      const barBottom = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(
          barX,
          centerY,
          barWidth,
          barHeight
        ),
        fillColor: element.waveColor,
      });
    }
  }
}

renderSpectrum.style = 'spectrum';


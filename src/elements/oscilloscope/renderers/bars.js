import paper from 'paper';

/**
 * 柱状样式默认配置
 */
export const defaultConfig = {
  barWidth: 2, // 柱状图宽度
  barGap: 1, // 柱状图间距
};

/**
 * 柱状波形渲染器
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderBars(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  const centerY = y + height / 2;
  const barCount = Math.floor(width / (cfg.barWidth + cfg.barGap));
  const step = Math.max(1, Math.floor(data.length / barCount));
  const amplitude = (height / 2) * element.sensitivity;

  for (let i = 0; i < barCount; i++) {
    const dataIndex = i * step;
    if (dataIndex >= data.length) break;

    // 计算该段的平均值
    let sum = 0;
    let count = 0;
    for (let j = dataIndex; j < Math.min(dataIndex + step, data.length); j++) {
      sum += Math.abs(data[j]);
      count++;
    }
    const avg = count > 0 ? sum / count : 0;

    const barX = x + i * (cfg.barWidth + cfg.barGap);
    const barHeight = avg * amplitude * 2;

    // 绘制柱状图
    const bar = new paper.Path.Rectangle({
      rectangle: new paper.Rectangle(
        barX,
        centerY - barHeight / 2,
        cfg.barWidth,
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
          cfg.barWidth,
          barHeight / 2
        ),
        fillColor: element.waveColor,
      });
    }
  }
}

renderBars.style = 'bars';


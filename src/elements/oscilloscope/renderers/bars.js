import paper from 'paper-jsdom-canvas';

/**
 * 柱状波形渲染器
 */
export default function renderBars(element, data, x, y, width, height) {
  const centerY = y + height / 2;
  const barCount = Math.floor(width / (element.barWidth + element.barGap));
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

    const barX = x + i * (element.barWidth + element.barGap);
    const barHeight = avg * amplitude * 2;

    // 绘制柱状图
    const bar = new paper.Path.Rectangle({
      rectangle: new paper.Rectangle(
        barX,
        centerY - barHeight / 2,
        element.barWidth,
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
          element.barWidth,
          barHeight / 2
        ),
        fillColor: element.waveColor,
      });
    }
  }
}

renderBars.style = 'bars';


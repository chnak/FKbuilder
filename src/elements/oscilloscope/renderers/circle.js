import paper from 'paper-jsdom-canvas';

/**
 * 圆形波形渲染器
 */
export default function renderCircle(element, data, x, y, width, height) {
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


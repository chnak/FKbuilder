import paper from 'paper-jsdom-canvas';

/**
 * 3D旋转波形渲染器（透视旋转效果）
 */
export default function renderRotating3D(element, data, x, y, width, height, time) {
  if (!data || data.length === 0) return;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 20;
  
  // 3D旋转角度（随时间旋转）
  const rotationY = (time * (element.rotationSpeed || 1.0)) % (Math.PI * 2);
  const rotationX = Math.sin(time * 0.5) * 0.3; // 轻微的X轴摆动
  
  // 计算平均振幅
  let avgAmplitude = 0;
  for (let i = 0; i < data.length; i++) {
    avgAmplitude += Math.abs(data[i]);
  }
  avgAmplitude = (avgAmplitude / data.length) * element.sensitivity;
  
  // 创建3D波形点
  const points3D = [];
  const pointCount = Math.min(data.length, 200);
  const step = data.length / pointCount;
  
  for (let i = 0; i < pointCount; i++) {
    const dataIndex = Math.floor(i * step);
    const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
    
    // 3D坐标（在XZ平面上）
    const angle = (i / pointCount) * Math.PI * 2;
    const radius = maxRadius * 0.6 + amplitude * maxRadius * 0.4;
    const x3d = Math.cos(angle) * radius;
    const z3d = Math.sin(angle) * radius;
    const y3d = (data[dataIndex] * element.sensitivity) * maxRadius * 0.3;
    
    // 应用Y轴旋转
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const xRotated = x3d * cosY - z3d * sinY;
    const zRotated = x3d * sinY + z3d * cosY;
    
    // 应用X轴旋转
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);
    const yRotated = y3d * cosX - zRotated * sinX;
    const zFinal = y3d * sinX + zRotated * cosX;
    
    // 透视投影
    const perspective = 500;
    const scale = perspective / (perspective + zFinal);
    const px = centerX + xRotated * scale;
    const py = centerY + yRotated * scale;
    
    points3D.push({
      point: new paper.Point(px, py),
      z: zFinal,
      amplitude: amplitude,
      originalIndex: i
    });
  }
  
  // 按Z深度排序（从远到近）
  points3D.sort((a, b) => b.z - a.z);
  
  // 绘制波形路径
  const path = new paper.Path();
  path.strokeColor = element.waveColor;
  path.strokeWidth = element.lineWidth;
  
  for (let i = 0; i < points3D.length; i++) {
    const p = points3D[i];
    const alpha = 0.3 + (p.z + maxRadius) / (maxRadius * 2) * 0.7; // 根据深度调整透明度
    
    if (i === 0) {
      path.moveTo(p.point);
    } else {
      path.lineTo(p.point);
    }
  }
  
  // 根据深度调整颜色
  if (element.particleColors && element.particleColors.length > 0) {
    const colorIndex = Math.floor((rotationY / (Math.PI * 2)) * element.particleColors.length) % element.particleColors.length;
    path.strokeColor = element.particleColors[colorIndex];
  }
  
  // 绘制高亮点（前面的点更亮）
  for (let i = 0; i < Math.min(20, points3D.length); i++) {
    const p = points3D[i];
    const alpha = 0.5 + (p.z + maxRadius) / (maxRadius * 2) * 0.5;
    const size = 2 + p.amplitude * 5;
    
    const circle = new paper.Path.Circle({
      center: p.point,
      radius: size
    });
    
    if (element.particleColors && element.particleColors.length > 0) {
      const colorIndex = Math.floor((p.originalIndex / pointCount) * element.particleColors.length) % element.particleColors.length;
      circle.fillColor = element.particleColors[colorIndex];
    } else {
      circle.fillColor = element.waveColor;
    }
    circle.fillColor.alpha = alpha;
  }
}

renderRotating3D.style = 'rotating3d';


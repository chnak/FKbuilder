import paper from 'paper-jsdom-canvas';

/**
 * Blob 球体碰撞变形示波器渲染器
 * 基于 kynd.info 2014 的球体碰撞效果，结合音频数据
 */
export default function renderBlob(element, data, x, y, width, height, time) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 20;
  
  // 初始化球体数组（如果还没有）
  if (!element.blobBalls) {
    element.blobBalls = [];
    element.blobInitialized = false;
  }
  
  // 计算平均振幅和频段数据
  let avgAmplitude = 0;
  for (let i = 0; i < data.length; i++) {
    avgAmplitude += Math.abs(data[i]);
  }
  avgAmplitude = (avgAmplitude / data.length) * element.sensitivity;
  
  // 将音频数据分成多个频段
  const numBalls = element.blobBallCount || 6;
  const bands = [];
  const bandSize = Math.floor(data.length / numBalls);
  for (let i = 0; i < numBalls; i++) {
    let sum = 0;
    let count = 0;
    const start = i * bandSize;
    const end = Math.min(start + bandSize, data.length);
    for (let j = start; j < end; j++) {
      sum += Math.abs(data[j]);
      count++;
    }
    bands.push(count > 0 ? sum / count : 0);
  }
  
  // 初始化球体
  if (!element.blobInitialized) {
    element.blobBalls = [];
    const baseRadius = maxRadius * 0.3;
    
    for (let i = 0; i < numBalls; i++) {
      const angle = (i / numBalls) * Math.PI * 2;
      const distance = maxRadius * 0.4;
      const position = new paper.Point(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance
      );
      
      const vector = new paper.Point({
        angle: angle * 180 / Math.PI + 90,
        length: 0.5
      });
      
      const radius = baseRadius + (baseRadius * 0.3);
      const ball = createBlobBall(radius, position, vector, element, i);
      element.blobBalls.push(ball);
    }
    element.blobInitialized = true;
  }
  
  // 更新球体半径和速度（根据音频数据）
  for (let i = 0; i < element.blobBalls.length && i < bands.length; i++) {
    const ball = element.blobBalls[i];
    const amplitude = bands[i] * element.sensitivity;
    
    // 根据音频振幅调整目标半径
    const baseRadius = maxRadius * 0.3;
    const targetRadius = baseRadius + amplitude * baseRadius * 0.8;
    
    // 平滑过渡到目标半径
    ball.targetRadius = targetRadius;
    ball.radius += (targetRadius - ball.radius) * 0.1;
    
    // 更新边界偏移
    for (let j = 0; j < ball.numSegment; j++) {
      ball.boundOffset[j] = ball.radius;
      ball.boundOffsetBuff[j] = ball.radius;
    }
    
    // 根据音频调整速度
    const speed = 0.3 + amplitude * 0.5;
    if (ball.vector.length > 0) {
      ball.vector.length = speed;
    }
  }
  
  // 处理球体碰撞
  for (let i = 0; i < element.blobBalls.length - 1; i++) {
    for (let j = i + 1; j < element.blobBalls.length; j++) {
      reactBlobBalls(element.blobBalls[i], element.blobBalls[j]);
    }
  }
  
  // 更新所有球体
  const size = new paper.Size(width, height);
  const bounds = new paper.Rectangle(x, y, width, height);
  
  for (let i = 0; i < element.blobBalls.length; i++) {
    const ball = element.blobBalls[i];
    checkBlobBorders(ball, bounds);
    
    if (ball.vector.length > ball.maxVec) {
      ball.vector.length = ball.maxVec;
    }
    
    ball.point = ball.point.add(ball.vector);
    updateBlobShape(ball);
  }
}

/**
 * 创建 Blob 球体
 */
function createBlobBall(radius, point, vector, element, index) {
  const numSegment = Math.floor(radius / 3 + 2);
  const boundOffset = [];
  const boundOffsetBuff = [];
  const sidePoints = [];
  
  // 选择颜色（从粒子颜色数组或使用随机色相）
  let fillColor;
  if (element.particleColors && element.particleColors.length > 0) {
    const colorIndex = index % element.particleColors.length;
    fillColor = element.particleColors[colorIndex];
  } else {
    fillColor = {
      hue: (index * 60) % 360,
      saturation: 0.8,
      brightness: 1
    };
  }
  
  const path = new paper.Path({
    fillColor: fillColor,
    blendMode: 'lighter',
    closed: true
  });
  
  for (let i = 0; i < numSegment; i++) {
    boundOffset.push(radius);
    boundOffsetBuff.push(radius);
    path.add(new paper.Point(point.x, point.y)); // 初始位置设置为球心
    sidePoints.push(new paper.Point({
      angle: 360 / numSegment * i,
      length: 1
    }));
  }
  
  return {
    radius: radius,
    targetRadius: radius,
    point: point,
    vector: vector,
    maxVec: 8,
    numSegment: numSegment,
    boundOffset: boundOffset,
    boundOffsetBuff: boundOffsetBuff,
    sidePoints: sidePoints,
    path: path
  };
}

/**
 * 检查边界
 */
function checkBlobBorders(ball, bounds) {
  if (ball.point.x < bounds.x - ball.radius) {
    ball.point.x = bounds.x + bounds.width + ball.radius;
  }
  if (ball.point.x > bounds.x + bounds.width + ball.radius) {
    ball.point.x = bounds.x - ball.radius;
  }
  if (ball.point.y < bounds.y - ball.radius) {
    ball.point.y = bounds.y + bounds.height + ball.radius;
  }
  if (ball.point.y > bounds.y + bounds.height + ball.radius) {
    ball.point.y = bounds.y - ball.radius;
  }
}

/**
 * 更新球体形状
 */
function updateBlobShape(ball) {
  const segments = ball.path.segments;
  for (let i = 0; i < ball.numSegment; i++) {
    segments[i].point = getBlobSidePoint(ball, i);
  }
  
  ball.path.smooth();
  
  for (let i = 0; i < ball.numSegment; i++) {
    if (ball.boundOffset[i] < ball.radius / 4) {
      ball.boundOffset[i] = ball.radius / 4;
    }
    const next = (i + 1) % ball.numSegment;
    const prev = (i > 0) ? i - 1 : ball.numSegment - 1;
    let offset = ball.boundOffset[i];
    offset += (ball.radius - offset) / 15;
    offset += ((ball.boundOffset[next] + ball.boundOffset[prev]) / 2 - offset) / 3;
    ball.boundOffsetBuff[i] = ball.boundOffset[i] = offset;
  }
}

/**
 * 球体碰撞反应
 */
function reactBlobBalls(a, b) {
  const dist = a.point.getDistance(b.point);
  if (dist < a.radius + b.radius && dist !== 0) {
    const overlap = a.radius + b.radius - dist;
    const direc = a.point.subtract(b.point).normalize(overlap * 0.015);
    a.vector = a.vector.add(direc);
    b.vector = b.vector.subtract(direc);
    
    calcBlobBounds(a, b);
    calcBlobBounds(b, a);
    updateBlobBounds(a);
    updateBlobBounds(b);
  }
}

/**
 * 计算边界偏移
 */
function getBlobBoundOffset(ball, point) {
  const diff = ball.point.subtract(point);
  const angle = (diff.angle + 180) % 360;
  return ball.boundOffset[Math.floor(angle / 360 * ball.boundOffset.length)];
}

/**
 * 计算碰撞边界
 */
function calcBlobBounds(ball, other) {
  for (let i = 0; i < ball.numSegment; i++) {
    const tp = getBlobSidePoint(ball, i);
    const bLen = getBlobBoundOffset(other, tp);
    const td = tp.getDistance(other.point);
    if (td < bLen) {
      ball.boundOffsetBuff[i] -= (bLen - td) / 2;
    }
  }
}

/**
 * 获取侧面点
 */
function getBlobSidePoint(ball, index) {
  return ball.point.add(ball.sidePoints[index].multiply(ball.boundOffset[index]));
}

/**
 * 更新边界
 */
function updateBlobBounds(ball) {
  for (let i = 0; i < ball.numSegment; i++) {
    ball.boundOffset[i] = ball.boundOffsetBuff[i];
  }
}

renderBlob.style = 'blob';


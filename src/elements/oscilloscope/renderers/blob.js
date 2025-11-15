import paper from 'paper-jsdom-canvas';

/**
 * Blob 样式默认配置
 */
export const defaultConfig = {
  blobBallCount: 12, // Blob 球体数量
  particleColors: [ // 颜色数组
    '#ff0080', '#ff4080', '#ff8000', '#ffc000',
    '#ffff00', '#80ff00', '#00ff80', '#00ffff',
    '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
  ],
  minRadiusRatio: 0.4, // 最小半径比例（相对于基础半径）
  maxRadiusRatio: 2.0, // 最大半径比例（相对于基础半径）
  directionChangeIntensity: 0.3, // 方向变化强度（0-1，0为不变化，1为完全随节奏变化）
};

/**
 * Blob 球体碰撞变形示波器渲染器
 * 基于 kynd.info 2014 的球体碰撞效果，结合音频数据
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderBlob(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 20;
  
  // 将音频数据分成多个频段
  const numBalls = cfg.blobBallCount;
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
  
  // 初始化球体状态（如果还没有）
  if (!element.blobBalls || element.blobBalls.length === 0) {
    element.blobBalls = [];
    const baseRadius = maxRadius * 0.15; // 减小基础半径
    
    // 获取半径范围配置
    const minRadiusRatio = cfg.minRadiusRatio || 0.4;
    const maxRadiusRatio = cfg.maxRadiusRatio || 2.0;
    
    for (let i = 0; i < numBalls; i++) {
      // 随机位置（在显示区域内）
      const randomX = x + Math.random() * width;
      const randomY = y + Math.random() * height;
      const position = new paper.Point(randomX, randomY);
      
      // 随机方向
      const randomAngle = Math.random() * 360;
      const vector = new paper.Point({
        angle: randomAngle,
        length: 1.5 + Math.random() * 2.5 // 进一步增加初始速度：1.5 到 4.0
      });
      
      // 随机半径（在配置的范围内，生成大小不一的球体）
      // 使用指数分布让大小分布更自然（更多小球，少量大球）
      const randomValue = Math.random();
      const radiusRatio = minRadiusRatio + (maxRadiusRatio - minRadiusRatio) * Math.pow(randomValue, 0.7);
      const radius = baseRadius * radiusRatio;
      
      // 只保存状态，不创建路径（路径每一帧都会重新创建）
      element.blobBalls.push({
        radius: radius,
        targetRadius: radius,
        point: position,
        vector: vector,
        maxVec: 20, // 进一步增加最大速度限制：从 12 增加到 20
        numSegment: Math.floor(radius / 3 + 2),
        boundOffset: [],
        boundOffsetBuff: [],
        sidePoints: [],
        colorIndex: i
      });
      
      // 初始化边界偏移和侧面点
      const ball = element.blobBalls[i];
      for (let j = 0; j < ball.numSegment; j++) {
        ball.boundOffset.push(radius);
        ball.boundOffsetBuff.push(radius);
        ball.sidePoints.push(new paper.Point({
          angle: 360 / ball.numSegment * j,
          length: 1
        }));
      }
    }
  }
  
  // 更新球体半径和速度（根据音频数据）
  for (let i = 0; i < element.blobBalls.length && i < bands.length; i++) {
    const ball = element.blobBalls[i];
    const amplitude = bands[i];
    
    // 根据音频振幅调整目标半径，变化幅度与 sensitivity 挂钩
    const baseRadius = maxRadius * 0.15; // 与初始化时保持一致
    // 获取初始半径比例（相对于基础半径）
    const initialRadiusRatio = ball.initialRadiusRatio || (ball.radius / baseRadius);
    if (!ball.initialRadiusRatio) {
      ball.initialRadiusRatio = initialRadiusRatio; // 保存初始比例
    }
    
    // sensitivity 控制大小变化幅度：sensitivity 越大，变化幅度越大
    // 变化幅度基于初始半径，保持大小比例关系
    const sizeVariation = baseRadius * initialRadiusRatio * element.sensitivity;
    const targetRadius = baseRadius * initialRadiusRatio + amplitude * sizeVariation;
    
    // 平滑过渡到目标半径（增加平滑度）
    ball.targetRadius = targetRadius;
    ball.radius += (targetRadius - ball.radius) * 0.05; // 减小变化速度，从 0.1 到 0.05
    
    // 保持最小半径，避免球体过小或消失（基于初始半径比例）
    const minRadius = baseRadius * initialRadiusRatio * 0.5;
    const maxRadiusLimit = baseRadius * (cfg.maxRadiusRatio || 2.0) * 1.5; // 允许在音频影响下稍微超过初始最大值
    ball.radius = Math.max(minRadius, Math.min(maxRadiusLimit, ball.radius));
    
    // 更新边界偏移
    for (let j = 0; j < ball.numSegment; j++) {
      ball.boundOffset[j] = ball.radius;
      ball.boundOffsetBuff[j] = ball.radius;
    }
    
    // 根据音频调整速度（速度也受 sensitivity 影响）
    // 进一步增加基础速度和变化幅度，让球体移动更快
    const baseSpeed = 1.5; // 进一步增加基础速度：从 0.8 到 1.5
    const speedVariation = 2.5; // 进一步增加速度变化幅度：从 1.5 到 2.5
    const speed = baseSpeed + amplitude * speedVariation * element.sensitivity;
    if (ball.vector.length > 0) {
      ball.vector.length = speed;
    }
    
    // 根据音频节奏调整移动方向
    // 使用 directionChangeIntensity 控制方向变化的强度
    const directionIntensity = cfg.directionChangeIntensity !== undefined 
      ? cfg.directionChangeIntensity 
      : 0.3;
    
    if (directionIntensity > 0 && ball.vector.length > 0) {
      // 使用振幅来影响方向变化，让球体随节奏改变方向
      // 不同球体使用不同的频段，产生不同的方向变化模式
      const directionChange = amplitude * directionIntensity * element.sensitivity * 40; // 最大40度变化
      
      // 根据球体索引创建不同的相位，让每个球体有不同的响应模式
      const phase = (i / numBalls) * Math.PI * 2; // 每个球体有不同的相位
      
      // 使用时间相位让方向变化更平滑，同时结合振幅让节奏感更强
      const timePhase = time * 1.5; // 时间相位（可以调整速度）
      const rhythmFactor = amplitude * 2; // 节奏因子，振幅越大变化越快
      const angleOffset = Math.sin(phase + timePhase + rhythmFactor) * directionChange;
      
      // 应用方向变化（平滑过渡）
      const currentAngle = ball.vector.angle;
      const targetAngle = currentAngle + angleOffset;
      
      // 平滑过渡到目标角度（使用更大的过渡系数让响应更快）
      const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180; // 处理角度环绕
      const transitionSpeed = 0.15 + amplitude * 0.1; // 根据振幅调整过渡速度，节奏强时变化更快
      ball.vector.angle = currentAngle + angleDiff * transitionSpeed;
    }
  }
  
  // 处理球体碰撞
  for (let i = 0; i < element.blobBalls.length - 1; i++) {
    for (let j = i + 1; j < element.blobBalls.length; j++) {
      reactBlobBalls(element.blobBalls[i], element.blobBalls[j]);
    }
  }
  
  // 更新所有球体位置和形状
  const bounds = new paper.Rectangle(x, y, width, height);
  
  for (let i = 0; i < element.blobBalls.length; i++) {
    const ball = element.blobBalls[i];
    checkBlobBorders(ball, bounds);
    
    if (ball.vector.length > ball.maxVec) {
      ball.vector.length = ball.maxVec;
    }
    
    ball.point = ball.point.add(ball.vector);
  }
  
  // 创建并绘制所有球体路径（每一帧都重新创建）
  for (let i = 0; i < element.blobBalls.length; i++) {
    const ball = element.blobBalls[i];
    updateBlobShape(ball);
    drawBlobBall(ball, element, cfg);
  }
}

/**
 * 绘制 Blob 球体路径
 */
function drawBlobBall(ball, element, cfg) {
  // 确保球体有效
  if (!ball || !ball.point || !ball.radius || ball.radius <= 0) {
    return; // 如果球体无效，跳过绘制
  }
  
  // 选择颜色（从粒子颜色数组或使用随机色相）
  let fillColor;
    if (cfg && cfg.particleColors && cfg.particleColors.length > 0) {
      const colorIndex = ball.colorIndex % cfg.particleColors.length;
      fillColor = cfg.particleColors[colorIndex];
    } else {
    fillColor = {
      hue: (ball.colorIndex * 60) % 360,
      saturation: 0.8,
      brightness: 1
    };
  }
  
  // 创建路径（每一帧都重新创建）
  // 注意：路径会自动添加到当前激活的 layer，不需要手动添加
  const path = new paper.Path({
    fillColor: fillColor,
    blendMode: 'normal', // 改为 normal，避免 lighter 模式导致的闪烁
    closed: true
  });
  
  // 设置透明度，让叠加效果更自然
  if (typeof fillColor === 'string') {
    path.fillColor.alpha = 0.7;
  } else if (fillColor && fillColor.alpha === undefined) {
    path.fillColor.alpha = 0.7;
  }
  
  // 添加所有点
  for (let i = 0; i < ball.numSegment; i++) {
    const sidePoint = getBlobSidePoint(ball, i);
    if (sidePoint && sidePoint.x !== undefined && sidePoint.y !== undefined) {
      path.add(new paper.Point(sidePoint.x, sidePoint.y));
    }
  }
  
  // 确保路径有足够的点
  if (path.segments.length >= 3) {
    // 平滑路径
    path.smooth();
  }
}

/**
 * 检查边界（使用反弹而不是循环，避免突然消失）
 */
function checkBlobBorders(ball, bounds) {
  // 使用反弹逻辑，而不是循环边界，避免球体突然消失
  let bounced = false;
  
  if (ball.point.x < bounds.x + ball.radius) {
    ball.point.x = bounds.x + ball.radius;
    // 反转 X 方向
    const angle = ball.vector.angle;
    ball.vector.angle = 180 - angle;
    bounced = true;
  }
  if (ball.point.x > bounds.x + bounds.width - ball.radius) {
    ball.point.x = bounds.x + bounds.width - ball.radius;
    // 反转 X 方向
    const angle = ball.vector.angle;
    ball.vector.angle = 180 - angle;
    bounced = true;
  }
  if (ball.point.y < bounds.y + ball.radius) {
    ball.point.y = bounds.y + ball.radius;
    // 反转 Y 方向
    const angle = ball.vector.angle;
    ball.vector.angle = -angle;
    bounced = true;
  }
  if (ball.point.y > bounds.y + bounds.height - ball.radius) {
    ball.point.y = bounds.y + bounds.height - ball.radius;
    // 反转 Y 方向
    const angle = ball.vector.angle;
    ball.vector.angle = -angle;
    bounced = true;
  }
}

/**
 * 更新球体形状（更新边界偏移）
 */
function updateBlobShape(ball) {
  // 确保半径有效
  if (!ball.radius || ball.radius <= 0) {
    ball.radius = 10; // 设置一个最小默认值
  }
  
  for (let i = 0; i < ball.numSegment; i++) {
    // 确保边界偏移不会太小
    const minOffset = ball.radius * 0.5; // 从 0.25 改为 0.5，确保球体不会消失
    if (ball.boundOffset[i] < minOffset) {
      ball.boundOffset[i] = minOffset;
    }
    const next = (i + 1) % ball.numSegment;
    const prev = (i > 0) ? i - 1 : ball.numSegment - 1;
    let offset = ball.boundOffset[i];
    offset += (ball.radius - offset) / 15;
    offset += ((ball.boundOffset[next] + ball.boundOffset[prev]) / 2 - offset) / 3;
    // 确保偏移不会太小
    offset = Math.max(minOffset, offset);
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


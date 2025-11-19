import paper from 'paper';

/**
 * 粒子流样式默认配置
 */
export const defaultConfig = {
  flowParticleCount: 100, // 粒子流粒子数量
  flowSpeed: 1.0, // 粒子流速度
  showWaveform: true, // 是否显示基础波形
  particleColors: [ // 粒子颜色数组
    '#ff0080', '#ff4080', '#ff8000', '#ffc000',
    '#ffff00', '#80ff00', '#00ff80', '#00ffff',
    '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
  ],
};

/**
 * 波形粒子流渲染器（粒子沿波形流动）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderParticleFlow(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  if (!data || data.length === 0) return;
  
  const centerY = y + height / 2;
  const stepX = width / data.length;
  const amplitude = (height / 2) * element.sensitivity;
  
  // 初始化粒子
  if (!element.flowParticles) {
    element.flowParticles = [];
    const particleCount = cfg.flowParticleCount;
    const dataLength = data.length || 1000; // 默认值，避免初始化时出错
    
    for (let i = 0; i < particleCount; i++) {
      element.flowParticles.push({
        position: Math.random() * dataLength, // 在波形上的位置
        speed: 0.3 + Math.random() * 0.7, // 流动速度
        size: 2 + Math.random() * 4, // 粒子大小
        colorIndex: Math.floor(Math.random() * (cfg.particleColors?.length || 10)),
        life: Math.random() // 生命周期（0-1）
      });
    }
  }
  
  // 更新粒子
  for (let particle of element.flowParticles) {
    // 更新位置
    particle.position += particle.speed * cfg.flowSpeed;
    if (particle.position >= data.length) {
      particle.position = 0;
      particle.life = 0; // 重置生命周期
    }
    
    // 更新生命周期
    particle.life += 0.01;
    if (particle.life > 1) {
      particle.life = 0;
    }
    
    // 获取当前位置的波形数据
    const dataIndex = Math.floor(particle.position);
    if (dataIndex >= 0 && dataIndex < data.length) {
      const waveValue = data[dataIndex];
      const px = x + dataIndex * stepX;
      const py = centerY - waveValue * amplitude;
      
      // 根据波形值调整粒子大小
      const dynamicSize = particle.size * (1 + Math.abs(waveValue) * element.sensitivity * 0.5);
      
      // 选择颜色
      let particleColor;
      if (cfg.particleColors && cfg.particleColors.length > 0) {
        const colorIndex = (particle.colorIndex + Math.floor(particle.position / 10)) % cfg.particleColors.length;
        particleColor = cfg.particleColors[colorIndex];
      } else {
        const hue = (particle.position / data.length) * 360;
        particleColor = {
          hue: hue,
          saturation: 0.8,
          brightness: 1
        };
      }
      
      // 绘制粒子
      const circle = new paper.Path.Circle({
        center: new paper.Point(px, py),
        radius: dynamicSize
      });
      
      circle.fillColor = particleColor;
      circle.fillColor.alpha = 0.6 + Math.abs(waveValue) * 0.4;
      
      // 添加拖尾效果
      if (element.particleTrail && Math.abs(waveValue) > 0.1) {
        const trailLength = element.particleTrailLength || 3;
        const prevDataIndex = Math.max(0, dataIndex - trailLength);
        const prevWaveValue = data[prevDataIndex];
        const prevPx = x + prevDataIndex * stepX;
        const prevPy = centerY - prevWaveValue * amplitude;
        
        const trail = new paper.Path();
        trail.strokeColor = particleColor;
        trail.strokeWidth = dynamicSize * 0.5;
        trail.strokeColor.alpha = 0.3;
        trail.moveTo(new paper.Point(prevPx, prevPy));
        trail.lineTo(new paper.Point(px, py));
      }
      
      // 高亮粒子（根据波形值）
      if (Math.abs(waveValue) > 0.5) {
        const glow = new paper.Path.Circle({
          center: new paper.Point(px, py),
          radius: dynamicSize * 2
        });
        glow.fillColor = particleColor;
        glow.fillColor.alpha = 0.2;
        glow.blendMode = 'screen';
      }
    }
  }
  
  // 绘制基础波形路径（可选，作为背景）
  if (cfg.showWaveform !== false) {
    const path = new paper.Path();
    path.strokeColor = element.waveColor;
    path.strokeWidth = element.lineWidth * 0.5;
    path.strokeColor.alpha = 0.2;
    
    for (let i = 0; i < data.length; i += 2) { // 降低采样率以提高性能
      const px = x + i * stepX;
      const py = centerY - data[i] * amplitude;
      
      if (i === 0) {
        path.moveTo(new paper.Point(px, py));
      } else {
        path.lineTo(new paper.Point(px, py));
      }
    }
  }
}

renderParticleFlow.style = 'particleflow';


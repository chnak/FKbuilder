import paper from '../../../vendor/paper-node.js';

/**
 * 波形编织样式默认配置
 */
export const defaultConfig = {
  weaveLayers: 5, // 编织层数
  weaveLayerSpacing: 30, // 层间距
  weaveSpeed: 0.5, // 编织动画速度
  particleColors: [ // 颜色数组
    '#ff0080', '#ff4080', '#ff8000', '#ffc000',
    '#ffff00', '#80ff00', '#00ff80', '#00ffff',
    '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
  ],
};

/**
 * 波形编织渲染器（多条波形交织在一起）
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderWeave(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  if (!data || data.length === 0) return;
  
  const centerY = y + height / 2;
  const stepX = width / data.length;
  const amplitude = (height / 2) * element.sensitivity;
  
  const layerCount = cfg.weaveLayers; // 层数
  const layerSpacing = cfg.weaveLayerSpacing; // 层间距
  
  // 计算平均振幅
  let avgAmplitude = 0;
  for (let i = 0; i < data.length; i++) {
    avgAmplitude += Math.abs(data[i]);
  }
  avgAmplitude = (avgAmplitude / data.length) * element.sensitivity;
  
  // 绘制多层波形
  for (let layer = 0; layer < layerCount; layer++) {
    const layerOffset = (layer - layerCount / 2) * layerSpacing;
    const layerY = centerY + layerOffset;
    
    // 每层有轻微的相位偏移
    const phaseOffset = (layer / layerCount) * Math.PI * 2;
    const timeOffset = time * cfg.weaveSpeed + phaseOffset;
    
    // 选择颜色
    let layerColor;
    if (cfg.particleColors && cfg.particleColors.length > 0) {
      const colorIndex = layer % cfg.particleColors.length;
      layerColor = cfg.particleColors[colorIndex];
    } else {
      // 根据层数生成渐变色
      const hue = (layer * 60) % 360;
      layerColor = {
        hue: hue,
        saturation: 0.8,
        brightness: 1
      };
    }
    
    // 绘制波形路径
    const path = new paper.Path();
    path.strokeColor = layerColor;
    path.strokeWidth = element.lineWidth;
    path.strokeColor.alpha = 0.6 + (layer / layerCount) * 0.4; // 前面的层更不透明
    
    for (let i = 0; i < data.length; i++) {
      // 添加波形调制
      const modulation = Math.sin((i / data.length) * Math.PI * 4 + timeOffset) * 0.3;
      const waveAmplitude = data[i] * (1 + modulation);
      
      const px = x + i * stepX;
      const py = layerY - waveAmplitude * amplitude;
      
      if (i === 0) {
        path.moveTo(new paper.Point(px, py));
      } else {
        path.lineTo(new paper.Point(px, py));
      }
    }
    
    // 添加镜像效果
    if (element.mirror) {
      const mirrorPath = new paper.Path();
      mirrorPath.strokeColor = layerColor;
      mirrorPath.strokeWidth = element.lineWidth;
      mirrorPath.strokeColor.alpha = path.strokeColor.alpha * 0.5;
      
      for (let i = 0; i < data.length; i++) {
        const modulation = Math.sin((i / data.length) * Math.PI * 4 + timeOffset) * 0.3;
        const waveAmplitude = data[i] * (1 + modulation);
        
        const px = x + i * stepX;
        const py = layerY + waveAmplitude * amplitude;
        
        if (i === 0) {
          mirrorPath.moveTo(new paper.Point(px, py));
        } else {
          mirrorPath.lineTo(new paper.Point(px, py));
        }
      }
    }
    
    // 在交叉点添加高亮点
    if (layer > 0 && avgAmplitude > 0.1) {
      const highlightCount = Math.floor(data.length / 20);
      for (let i = 0; i < highlightCount; i++) {
        const dataIndex = Math.floor((i / highlightCount) * data.length);
        const modulation = Math.sin((dataIndex / data.length) * Math.PI * 4 + timeOffset) * 0.3;
        const waveAmplitude = data[dataIndex] * (1 + modulation);
        
        const px = x + dataIndex * stepX;
        const py = layerY - waveAmplitude * amplitude;
        
        const highlight = new paper.Path.Circle({
          center: new paper.Point(px, py),
          radius: 2 + avgAmplitude * 3
        });
        highlight.fillColor = layerColor;
        highlight.fillColor.alpha = 0.8;
      }
    }
  }
}

renderWeave.style = 'weave';


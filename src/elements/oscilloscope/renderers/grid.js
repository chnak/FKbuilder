import paper from '../../../vendor/paper-node.js';

/**
 * 网格样式默认配置
 */
export const defaultConfig = {
  gridRows: 8, // 网格行数
  gridCols: 16, // 网格列数
};

/**
 * 网格波形渲染器
 * @param {Object} element - 元素实例
 * @param {Array} data - 波形数据
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} time - 当前时间
 * @param {Object} config - 配置对象（合并了默认配置和用户配置）
 */
export default function renderGrid(element, data, x, y, width, height, time, config = {}) {
  // 合并默认配置
  const cfg = { ...defaultConfig, ...config };
  
  const cellWidth = width / cfg.gridCols;
  const cellHeight = height / cfg.gridRows;
  const step = Math.max(1, Math.floor(data.length / (cfg.gridRows * cfg.gridCols)));
  
  let dataIndex = 0;
  for (let row = 0; row < cfg.gridRows; row++) {
    for (let col = 0; col < cfg.gridCols; col++) {
      if (dataIndex >= data.length) break;
      
      const amplitude = Math.abs(data[dataIndex]) * element.sensitivity;
      const cellX = x + col * cellWidth;
      const cellY = y + row * cellHeight;
      
      // 根据振幅调整单元格大小和颜色
      const scale = 0.5 + amplitude * 0.5;
      const cellRect = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(
          cellX + cellWidth * (1 - scale) / 2,
          cellY + cellHeight * (1 - scale) / 2,
          cellWidth * scale,
          cellHeight * scale
        ),
        fillColor: element.waveColor,
      });
      cellRect.fillColor.alpha = 0.3 + amplitude * 0.7;
      
      dataIndex += step;
    }
  }
}

renderGrid.style = 'grid';


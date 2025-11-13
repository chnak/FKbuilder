import paper from 'paper-jsdom-canvas';

/**
 * 网格波形渲染器
 */
export default function renderGrid(element, data, x, y, width, height) {
  const cellWidth = width / element.gridCols;
  const cellHeight = height / element.gridRows;
  const step = Math.max(1, Math.floor(data.length / (element.gridRows * element.gridCols)));
  
  let dataIndex = 0;
  for (let row = 0; row < element.gridRows; row++) {
    for (let col = 0; col < element.gridCols; col++) {
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


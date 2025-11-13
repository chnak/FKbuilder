// 测试 Paper.js 在 Node.js 中的渲染
import paper from 'paper-jsdom-canvas';
import { createCanvas } from 'canvas';
import fs from 'fs-extra';

async function test() {
  // 创建 canvas
  const canvas = paper.createCanvas(1920, 1080);
  paper.setup(canvas);
  
  // 创建一些内容
  const rect = new paper.Path.Rectangle({
    rectangle: new paper.Rectangle(100, 100, 200, 200),
    fillColor: 'red',
  });
  
  const text = new paper.PointText(new paper.Point(200, 200));
  text.content = 'Hello World';
  text.fontSize = 40;
  text.fillColor = 'white';
  
  // 更新视图
  paper.project.view.update();
  
  // 尝试绘制
  try {
    paper.project.view.draw();
    console.log('view.draw() 成功');
  } catch (e) {
    console.log('view.draw() 失败:', e.message);
  }
  
  // 检查 project 中的项目
  console.log('Project 中的项目数量:', paper.project.activeLayer.children.length);
  for (const item of paper.project.activeLayer.children) {
    console.log('  项目类型:', item.className, '位置:', item.position);
  }
  
  // 尝试手动绘制到 canvas
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 尝试使用 exportSVG 或其他方法
  try {
    const svg = paper.project.exportSVG({ asString: true });
    console.log('SVG 导出成功，长度:', svg.length);
  } catch (e) {
    console.log('SVG 导出失败:', e.message);
  }
  
  // 再次尝试 view.draw()
  paper.project.view.update();
  paper.project.view.draw();
  
  // 保存图片
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-paper-render.png', buffer);
  console.log('图片已保存');
  
  // 检查 canvas 内容
  const imageData = ctx.getImageData(0, 0, 100, 100);
  let hasContent = false;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] > 0) {
      hasContent = true;
      break;
    }
  }
  console.log('Canvas 有内容:', hasContent);
}

test().catch(console.error);


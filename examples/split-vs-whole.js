/**
 * 可视化测试：分割渲染 vs 整体渲染
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';

initDefaultFont();

const canvas = createCanvas(1920, 600);
paper.setup(canvas);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 1920, 600);

// 中心线
ctx.strokeStyle = '#ff0000';
ctx.setLineDash([5, 5]);
ctx.beginPath();
ctx.moveTo(960, 0);
ctx.lineTo(960, 600);
ctx.stroke();
ctx.setLineDash([]);

// Paper.js 整体渲染
const textItem = new paper.PointText(new paper.Point(960, 100));
textItem.content = 'Fubuilder';
textItem.fontSize = 120;
textItem.fontFamily = 'PatuaOne';
textItem.fillColor = '#000000';
textItem.justification = 'center';

ctx.strokeStyle = '#0066ff';
ctx.strokeRect(textItem.bounds.x, textItem.bounds.y, textItem.bounds.width, textItem.bounds.height);

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText('Paper.js 整体渲染 (center at 960)', 50, 30);
ctx.fillText(`bounds.x=${textItem.bounds.x.toFixed(2)}, bounds.width=${textItem.bounds.width.toFixed(2)}`, 50, 55);

// 分割渲染
const config = {
  text: 'Fubuilder',
  x: '50%',
  y: '50%',
  fontSize: 120,
  fontFamily: 'PatuaOne',
  color: '#000000',
  textAlign: 'center',
  anchor: [0.5, 0.5],
  duration: 3,
  startTime: 0,
  split: 'letter',
};

const element = new TextElement(config);
const layer = new paper.Layer();
element.render(layer, 1.5, { paper });

ctx.fillStyle = '#333333';
ctx.fillText('分割渲染 (render at y=300)', 50, 180);

// 画每个字符
element.splitter.getCharacters().forEach((c, i) => {
  const item = layer.children[i];

  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(item.bounds.x, 300 - 120, item.bounds.width, item.bounds.height);

  ctx.fillStyle = '#ff0000';
  ctx.font = '16px Arial';
  ctx.fillText(c.text, item.bounds.x + item.bounds.width / 2, 300 + 25);
});

// 中心线位置
ctx.strokeStyle = '#ff0000';
ctx.setLineDash([5, 5]);
ctx.beginPath();
ctx.moveTo(960, 280);
ctx.lineTo(960, 400);
ctx.stroke();
ctx.setLineDash([]);

// 对比：期望的位置 vs 实际的位置
const chars = element.splitter.getCharacters();
const totalWidth = element.splitter.getTotalWidth();
const startX = 960 - totalWidth / 2;

ctx.fillStyle = '#333333';
ctx.font = '18px Arial';
ctx.fillText('期望 F 的 bounds.center = ' + (startX + chars[0].x + chars[0].width / 2).toFixed(2), 50, 440);
ctx.fillText('实际 F 的 bounds.center = ' + (layer.children[0].bounds.x + layer.children[0].bounds.width / 2).toFixed(2), 50, 465);

paper.view.draw();
fs.writeFileSync('./output/split-vs-whole.png', canvas.toBuffer('image/png'));
console.log('图片已保存到: output/split-vs-whole.png');

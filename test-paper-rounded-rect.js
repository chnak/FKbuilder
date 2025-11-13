// 测试 Paper.js 圆角矩形
import paper from 'paper-jsdom-canvas';
import { createCanvas } from 'canvas';
import fs from 'fs-extra';

const canvas = createCanvas(400, 300);
paper.setup(canvas);

// 测试圆角矩形
const r = 20;
const rectX = 50;
const rectY = 50;
const width = 300;
const height = 200;

// 方法1: 使用 Path 手动创建
const path = new paper.Path();
path.moveTo(new paper.Point(rectX + r, rectY));
path.lineTo(new paper.Point(rectX + width - r, rectY));
// 右上角
path.arcTo(new paper.Point(rectX + width, rectY + r));
path.lineTo(new paper.Point(rectX + width, rectY + height - r));
// 右下角
path.arcTo(new paper.Point(rectX + width - r, rectY + height));
path.lineTo(new paper.Point(rectX + r, rectY + height));
// 左下角
path.arcTo(new paper.Point(rectX, rectY + height - r));
path.lineTo(new paper.Point(rectX, rectY + r));
// 左上角
path.arcTo(new paper.Point(rectX + r, rectY));
path.closePath();

path.fillColor = '#ff6b6b';
paper.view.update();

await fs.ensureDir('output');
const buffer = canvas.toBuffer('image/png');
await fs.writeFile('output/test-rounded-rect.png', buffer);
console.log('圆角矩形测试完成');


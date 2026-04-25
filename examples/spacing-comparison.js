/**
 * 间距对比测试
 */
import { createCanvas } from 'canvas';
import paper from '@chnak/paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';

initDefaultFont();

console.log('=== 间距对比测试 ===\n');

// 创建画布
const canvas = createCanvas(1920, 500);
paper.setup(canvas);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 1920, 500);

// 中心线
ctx.strokeStyle = '#ff0000';
ctx.setLineDash([5, 5]);
ctx.beginPath();
ctx.moveTo(960, 0);
ctx.lineTo(960, 500);
ctx.stroke();
ctx.setLineDash([]);

const fontSize = 100;
const fontFamily = 'Arial';

ctx.font = `${fontSize}px "${fontFamily}"`;
const charWidth = ctx.measureText('A').width;
console.log(`"A" 宽度: ${charWidth.toFixed(2)}`);
console.log(`默认 charSpacing (10%): ${(fontSize * 0.1).toFixed(2)}`);
console.log(`间距/字符宽度比: ${(10 / charWidth * 100).toFixed(1)}%`);

// 测试不同的 charSpacing
const spacings = [0, 2, 5, 10, 15, 20];
const yStart = 80;
const rowHeight = 60;

spacings.forEach((spacing, row) => {
  const y = yStart + row * rowHeight;
  const text = 'AAAAA';

  // 计算总宽度
  let xPos = 960 - (text.length * charWidth + (text.length - 1) * spacing) / 2;

  // 画标签
  ctx.fillStyle = '#333333';
  ctx.font = '24px Arial';
  ctx.fillText(`charSpacing = ${spacing}`, 50, y + 8);

  // 画字符
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = '#000000';

  for (const char of text) {
    ctx.fillText(char, xPos, y);
    // 画字符边缘
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(xPos - 1, y - fontSize, 1, fontSize);
    ctx.fillStyle = '#000000';
    xPos += charWidth + spacing;
  }

  // 画最后一个字符的结束边缘
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(xPos - 1, y - fontSize, 1, fontSize);

  // 计算并显示总宽度
  const totalWidth = text.length * charWidth + (text.length - 1) * spacing;
  ctx.fillStyle = '#0066ff';
  ctx.font = '20px Arial';
  ctx.fillText(`总宽度: ${totalWidth.toFixed(1)}`, 1600, y + 8);
});

paper.view.draw();
fs.writeFileSync('./output/spacing-comparison.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/spacing-comparison.png');

console.log('\n=== 字符间距百分比分析 ===');
[0, 5, 10, 15, 20, 30].forEach(spacing => {
  const ratio = spacing / charWidth * 100;
  console.log(`charSpacing=${spacing}: 是字符宽度的 ${ratio.toFixed(1)}%`);
});

console.log('\n建议: 英文文字的 charSpacing 建议在 2-5 之间（字符宽度的 3-7%%）');
console.log('当前默认值是 fontSize * 0.1 = 10%%，可能偏大');

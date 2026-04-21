/**
 * 调试渲染位置 - 检查 TextSplitter 和实际渲染的差异
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

console.log('=== 渲染位置调试 ===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false,
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log(`字符数据 (TextSplitter):`);
chars.forEach((c, i) => {
  const nextChar = chars[i + 1];
  const gap = nextChar ? nextChar.x - (c.x + c.width) : 0;
  console.log(`  [${i}] "${c.text}": x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}, gap_after=${gap.toFixed(2)}`);
});

// Canvas 测量
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

// 方法1: Paper.js 渲染整个文本
const textItem = new paper.PointText(new paper.Point(960, 100));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

ctx.strokeStyle = '#0066ff';
ctx.strokeRect(textItem.bounds.x, textItem.bounds.y, textItem.bounds.width, textItem.bounds.height);

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText(`Paper.js 整体渲染: bounds.x=${textItem.bounds.x.toFixed(2)}, width=${textItem.bounds.width.toFixed(2)}`, 50, 30);

// 方法2: 手动渲染每个字符（使用 TextSplitter 的位置）
const startX = 960 - totalWidth / 2;
ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText(`TextSplitter: startX=${startX.toFixed(2)}, totalWidth=${totalWidth.toFixed(2)}`, 50, 130);

let xPos = startX;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 250));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 0 ? '#ff0000' : '#000000';
  charItem.justification = 'center';

  // 画字符框
  ctx.strokeStyle = '#ff8800';
  ctx.strokeRect(xPos, 250 - fontSize, c.width, fontSize + 10);

  // 画字符起始边缘
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(xPos, 250 - fontSize, 2, fontSize);

  // 画字符结束边缘
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(xPos + c.width, 250 - fontSize, 2, fontSize);

  console.log(`  渲染 [${i}] "${c.text}": xPos=${xPos.toFixed(2)}, width=${c.width.toFixed(2)}`);

  xPos += c.width; // 不加 charSpacing
});

// 画总宽度
ctx.strokeStyle = '#00ff00';
ctx.strokeRect(startX, 270, totalWidth, 40);
ctx.fillStyle = '#00aa00';
ctx.fillText(`totalWidth=${totalWidth.toFixed(2)}`, startX, 330);

// 方法3: 使用 charSpacing 渲染
const charSpacing = fontSize * 0.1;
ctx.fillStyle = '#333333';
ctx.fillText(`使用 charSpacing=${charSpacing} 渲染:`, 50, 400);

xPos = startX;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 500));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 0 ? '#ff0000' : '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(xPos, 500 - fontSize, c.width, fontSize + 10);

  console.log(`  渲染+spacing [${i}] "${c.text}": xPos=${xPos.toFixed(2)}`);

  xPos += c.width + charSpacing;
});

paper.view.draw();
fs.writeFileSync('./output/render-debug.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/render-debug.png');

// 验证
console.log('\n=== 验证 ===');
console.log(`TextSplitter totalWidth: ${totalWidth.toFixed(2)}`);
console.log(`Paper.js bounds.width: ${textItem.bounds.width.toFixed(2)}`);
console.log(`差异: ${Math.abs(totalWidth - textItem.bounds.width).toFixed(2)}`);

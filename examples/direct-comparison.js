/**
 * 直接测试 TextSplitter 渲染位置 vs Paper.js 整体渲染
 */
import { createCanvas } from 'canvas';
import paper from '@chnak/paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

console.log('=== 直接渲染对比测试 ===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);
const charSpacing = fontSize * 0.1; // 12

console.log(`charSpacing = ${charSpacing}`);

// 创建两个相同的 TextSplitter
const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false,
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log('\nTextSplitter 数据:');
console.log(`totalWidth = ${totalWidth.toFixed(2)}`);
chars.forEach((c, i) => {
  const nextChar = chars[i + 1];
  const gap = nextChar ? nextChar.x - (c.x + c.width) : 0;
  console.log(`  [${i}] "${c.text}": x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}, gap=${gap.toFixed(2)}`);
});

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

// ===== 测试1: Paper.js 整体渲染 (y=100) =====
const textItem1 = new paper.PointText(new paper.Point(960, 100));
textItem1.content = text;
textItem1.fontSize = fontSize;
textItem1.fontFamily = fontFamily;
textItem1.fillColor = '#000000';
textItem1.justification = 'center';

ctx.strokeStyle = '#0066ff';
ctx.strokeRect(textItem1.bounds.x, textItem1.bounds.y, textItem1.bounds.width, textItem1.bounds.height);

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText('Paper.js 整体渲染 (y=100)', 50, 30);
ctx.fillText(`bounds.x=${textItem1.bounds.x.toFixed(2)}, bounds.width=${textItem1.bounds.width.toFixed(2)}`, 50, 55);

// ===== 测试2: 手动渲染每个字符，不加 charSpacing (y=250) =====
const startX = 960 - totalWidth / 2;
ctx.fillStyle = '#333333';
ctx.fillText(`手动渲染，不加 charSpacing (y=250)`, 50, 180);
ctx.fillText(`startX=${startX.toFixed(2)}, totalWidth=${totalWidth.toFixed(2)}`, 50, 205);

let xPos = startX;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 250));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#ff8800';
  ctx.strokeRect(xPos, 250 - fontSize, c.width, fontSize);

  xPos += c.width; // 不加 charSpacing
});

// ===== 测试3: 手动渲染每个字符，加 charSpacing (y=400) =====
ctx.fillStyle = '#333333';
ctx.fillText(`手动渲染，加 charSpacing=${charSpacing} (y=400)`, 50, 330);
ctx.fillText(`startX=${startX.toFixed(2)}`, 50, 355);

xPos = startX;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 400));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(xPos, 400 - fontSize, c.width, fontSize);

  xPos += c.width + charSpacing; // 加 charSpacing
});

// ===== 对齐检查 =====
ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText('对齐检查:', 50, 460);

// Paper.js 的起始位置
const paperJsStart = textItem1.bounds.x;
ctx.fillText(`Paper.js bounds.x: ${paperJsStart.toFixed(2)}`, 200, 460);

// 不加 spacing 的最后一个字符结束位置
const lastCharNoSpacing = startX + chars.reduce((sum, c) => sum + c.width, 0);
ctx.fillText(`不加 spacing 最后一个字符结束: ${lastCharNoSpacing.toFixed(2)}`, 500, 460);

// 加 spacing 的最后一个字符结束位置
const lastCharWithSpacing = startX + chars.reduce((sum, c) => sum + c.width, 0) + charSpacing * (chars.length - 1);
ctx.fillText(`加 spacing 最后一个字符结束: ${lastCharWithSpacing.toFixed(2)}`, 900, 460);

paper.view.draw();
fs.writeFileSync('./output/direct-comparison.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/direct-comparison.png');

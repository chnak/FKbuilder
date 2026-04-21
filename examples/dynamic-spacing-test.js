/**
 * 测试 dynamicSpacing 的效果
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

console.log('=== DynamicSpacing 测试 ===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

// 测试 dynamicSpacing: true
const splitterDynamic = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: true,
});

const charsDynamic = splitterDynamic.getCharacters();

console.log('DynamicSpacing = true:');
console.log('字符位置:');
charsDynamic.forEach((c, i) => {
  const nextChar = charsDynamic[i + 1];
  const gap = nextChar ? (nextChar.x - (c.x + c.width)) : 0;
  console.log(`  [${i}] "${c.text}": x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}, gap=${gap.toFixed(2)}`);
});

// 创建画布
const canvas = createCanvas(1920, 400);
paper.setup(canvas);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 1920, 400);

// 中心线
ctx.strokeStyle = '#ff0000';
ctx.setLineDash([5, 5]);
ctx.beginPath();
ctx.moveTo(960, 0);
ctx.lineTo(960, 400);
ctx.stroke();
ctx.setLineDash([]);

// 使用 Paper.js 渲染整个文本作为参考
const textItem = new paper.PointText(new paper.Point(960, 80));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText(`Paper.js 整体渲染: bounds.width=${textItem.bounds.width.toFixed(2)}`, 50, 30);
ctx.fillText(`totalWidth (Canvas measureText): ${textItem.bounds.width.toFixed(2)}`, 50, 55);

// 渲染 dynamicSpacing 分割的字符
const centerX = 960;
const startX = centerX - textItem.bounds.width / 2;

ctx.fillStyle = '#333333';
ctx.fillText('DynamicSpacing 分割渲染 (y=200):', 50, 130);

let xPos = startX;
charsDynamic.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 200));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 4 || i === 5 ? '#ff0000' : '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(xPos, 200 - fontSize, c.width, fontSize);

  xPos += c.width + (i < charsDynamic.length - 1 ? charsDynamic[i + 1].x - c.x - c.width : 0);
});

// 标注
ctx.fillStyle = '#ff0000';
ctx.font = '16px Arial';
ctx.fillText('红色: i, l (窄字符)', 50, 280);

// 计算总宽度
const lastCharDynamic = charsDynamic[charsDynamic.length - 1];
const totalWidthDynamic = lastCharDynamic.x + lastCharDynamic.width;

ctx.fillStyle = '#00aa00';
ctx.font = '16px Arial';
ctx.fillText(`动态总宽度: ${totalWidthDynamic.toFixed(2)}`, 50, 320);

// 对比 charSpacing=0
const splitterNoSpacing = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false,
});
const charsNoSpacing = splitterNoSpacing.getCharacters();

ctx.fillStyle = '#333333';
ctx.fillText('No spacing (y=350):', 50, 340);

xPos = startX;
charsNoSpacing.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 350));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#888888';
  ctx.strokeRect(xPos, 350 - fontSize, c.width, fontSize);

  xPos += c.width;
});

paper.view.draw();
fs.writeFileSync('./output/dynamic-spacing-test.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/dynamic-spacing-test.png');

/**
 * 视觉化测试 - 直接渲染文本检查间距
 */
import { createCanvas } from 'canvas';
import paper from '@chnak/paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';

initDefaultFont();

console.log('=== 视觉化间距测试 ===\n');

// 创建大画布
const canvas = createCanvas(1920, 800);
paper.setup(canvas);
const ctx = canvas.getContext('2d');

// 填充白色背景
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 1920, 800);

// 中心线
ctx.strokeStyle = '#ff0000';
ctx.setLineDash([5, 5]);
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(960, 0);
ctx.lineTo(960, 800);
ctx.stroke();
ctx.setLineDash([]);

// 测试函数
function renderTextRow(text, fontFamily, fontSize, y, label) {
  const fallbackChain = getFontFallbackChain(fontFamily);
  console.log(`\n渲染: "${text}" | ${fontFamily} | ${fontSize}px`);

  // 画标签
  ctx.fillStyle = '#333333';
  ctx.font = '20px Arial';
  ctx.fillText(label, 50, y - 5);

  // 方法1: Paper.js PointText 渲染整个文本
  const textItem = new paper.PointText(new paper.Point(100, y));
  textItem.content = text;
  textItem.fontSize = fontSize;
  textItem.fontFamily = fontFamily;
  textItem.fillColor = '#000000';

  const bounds1 = textItem.bounds;
  console.log(`  Paper.js bounds: width=${bounds1.width.toFixed(2)}, x=${bounds1.x.toFixed(2)}`);

  // 画边界框
  ctx.strokeStyle = '#0066ff';
  ctx.strokeRect(bounds1.x, bounds1.y, bounds1.width, bounds1.height);

  // 方法2: 手动计算宽度
  ctx.font = `${fontSize}px "${fontFamily}"`;
  const measuredWidth = ctx.measureText(text).width;
  console.log(`  Canvas measureText: ${measuredWidth.toFixed(2)}`);

  // 方法3: 手动渲染每个字符
  let xPos = 400;
  const charSpacing = fontSize * 0.1; // 默认 charSpacing
  ctx.font = `${fontSize}px "${fontFamily}"`;

  for (const char of text) {
    const charWidth = ctx.measureText(char).width;
    ctx.fillStyle = '#000000';
    ctx.fillText(char, xPos, y);

    // 画字符位置标记
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(xPos, y - 5, 2, 10); // 起始位置
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(xPos + charWidth, y + 5, 2, 10); // 结束位置

    console.log(`    "${char}": x=${xPos.toFixed(2)}, width=${charWidth.toFixed(2)}, next=${(xPos + charWidth + charSpacing).toFixed(2)}`);
    xPos += charWidth + charSpacing;
  }

  // 画最后一个字符的结束位置
  const lastCharWidth = ctx.measureText(text[text.length - 1]).width;
  ctx.strokeStyle = '#ff0000';
  ctx.strokeRect(400, y - fontSize, xPos - 400, fontSize + 10);
  console.log(`  手动渲染总宽度: ${(xPos - 400).toFixed(2)}`);
  console.log(`  charSpacing: ${charSpacing}`);

  return y + 100;
}

// 测试用例
let y = 80;

y = renderTextRow('AAAAA', 'Arial', 100, y, 'AAAAA Arial 100 - charSpacing=10');
y = renderTextRow('AAAAA', 'Arial', 100, y, 'AAAAA Arial 100 - charSpacing=0');
y = renderTextRow('PATUA', 'PatuaOne', 100, y, 'PATUA PatuaOne 100');
y = renderTextRow('HELLO', 'Arial', 80, y, 'HELLO Arial 80');

// 保存图片
paper.view.draw();
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./output/visual-spacing-test.png', buffer);
console.log('\n图片已保存到: output/visual-spacing-test.png');

// 现在测试居中
console.log('\n=== 居中测试 ===');
const testText = 'AAAAA';
const fontSize = 100;
const fontFamily = 'Arial';
const centerX = 960;

ctx.font = `${fontSize}px "${fontFamily}"`;
const measuredWidth = ctx.measureText(testText).width;
const charSpacing = fontSize * 0.1;
const totalWidth = measuredWidth + (testText.length - 1) * charSpacing;

console.log(`文本: "${testText}"`);
console.log(`Canvas measureText: ${measuredWidth.toFixed(2)}`);
console.log(`charSpacing: ${charSpacing}`);
console.log(`加上间距后的总宽度: ${totalWidth.toFixed(2)}`);
console.log(`中心 X: ${centerX}`);
console.log(`文本起点 X (居中): ${(centerX - totalWidth / 2).toFixed(2)}`);

// 渲染居中的文本
const textItem = new paper.PointText(new paper.Point(centerX, 650));
textItem.content = testText;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

console.log(`\nPaper.js 居中渲染 (justification='center'):`);
console.log(`  PointText position.x: ${centerX}`);
console.log(`  bounds.x: ${textItem.bounds.x.toFixed(2)}`);
console.log(`  bounds.width: ${textItem.bounds.width.toFixed(2)}`);
console.log(`  文本应该从: ${(centerX - textItem.bounds.width / 2).toFixed(2)} 开始`);

// 画标记
ctx.strokeStyle = '#00ff00';
ctx.strokeRect(centerX - totalWidth / 2, 600, totalWidth, 50);

fs.writeFileSync('./output/visual-centering-test.png', canvas.toBuffer('image/png'));
console.log('\n居中测试图片已保存到: output/visual-centering-test.png');

console.log('\n=== 测试完成 ===');

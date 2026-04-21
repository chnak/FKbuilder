/**
 * 改进 dynamicSpacing 测试
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

console.log('=== 改进 dynamicSpacing 测试 ===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

// 创建一个模拟当前 TextElement 行为的测试
const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: true, // 与 TextElement 中的配置相同
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log('字符数据:');
chars.forEach((c, i) => {
  const avgWidth = 56.44; // 从之前测试得知
  const ratio = c.width / avgWidth;
  const nextChar = chars[i + 1];
  const gap = nextChar ? (nextChar.x - (c.x + c.width)) : 0;
  console.log(`  [${i}] "${c.text}": width=${c.width.toFixed(2)} (${(ratio * 100).toFixed(1)}%% avg)`);
  if (i < chars.length - 1) {
    console.log(`      gap=${gap.toFixed(2)}, next "${nextChar.text}" is ${((nextChar.width / avgWidth) * 100).toFixed(1)}%% avg`);
  }
});

// 关键字符对分析
console.log('\n关键字符对分析:');
const pairs = [
  [3, 4, 'ui'],
  [4, 5, 'il'],
  [5, 6, 'ld'],
];
const avgWidth = 56.44;

pairs.forEach(([i, j, name]) => {
  const c1 = chars[i];
  const c2 = chars[j];
  const r1 = c1.width / avgWidth;
  const r2 = c2.width / avgWidth;
  const gap = c2.x - (c1.x + c1.width);
  console.log(`  "${name}": ${(r1 * 100).toFixed(0)}%% + ${(r2 * 100).toFixed(0)}%% → gap=${gap.toFixed(2)}`);
});

// 创建可视化
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

// Paper.js 整体渲染
const textItem = new paper.PointText(new paper.Point(960, 70));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

ctx.strokeStyle = '#0066ff';
ctx.strokeRect(textItem.bounds.x, textItem.bounds.y, textItem.bounds.width, textItem.bounds.height);

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText(`Paper.js 整体渲染: bounds.width=${textItem.bounds.width.toFixed(2)}`, 50, 30);

// 分割渲染
const centerX = 960;
const startX = centerX - totalWidth / 2;

ctx.fillStyle = '#333333';
ctx.fillText(`分割渲染 (dynamicSpacing=true): startX=${startX.toFixed(2)}`, 50, 130);

let xPos = startX;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 200));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(xPos, 200 - fontSize, c.width, fontSize);

  xPos += c.width;
  if (i < chars.length - 1) {
    const gap = chars[i + 1].x - (chars[i].x + chars[i].width);
    // 画 gap 区域
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(xPos, 200 - fontSize, gap, fontSize);
    xPos += gap;
  }
});

// 标注问题区域
ctx.fillStyle = '#ff0000';
ctx.font = '16px Arial';
ctx.fillText('红色区域: 字符间距 (ui=9.6, il=6, ld=12)', 50, 280);

// 画边界
const lastChar = chars[chars.length - 1];
const endX = lastChar.x + lastChar.width;
ctx.strokeStyle = '#00ff00';
ctx.strokeRect(startX, 200 - fontSize, endX - startX, fontSize);

// 对比 charSpacing=0 的渲染
ctx.fillStyle = '#333333';
ctx.fillText('对比: charSpacing=0 渲染:', 50, 350);

const splitterNoSpacing = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false,
});
const charsNoSpacing = splitterNoSpacing.getCharacters();
const totalWidthNoSpacing = splitterNoSpacing.getTotalWidth();
const startXNoSpacing = centerX - totalWidthNoSpacing / 2;

xPos = startXNoSpacing;
charsNoSpacing.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 420));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#888888';
  ctx.strokeRect(xPos, 420 - fontSize, c.width, fontSize);

  xPos += c.width;
});

paper.view.draw();
fs.writeFileSync('./output/improved-dynamic-test.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/improved-dynamic-test.png');

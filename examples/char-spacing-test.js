/**
 * 缩小 charSpacing 的测试
 */
import { createCanvas } from 'canvas';
import paper from '@chnak/paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

console.log('=== charSpacing 缩小测试 ===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

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

const centerX = 960;

// 测试不同的 charSpacing
const spacings = [0, 4, 8, 12];
const yStart = 80;
const rowHeight = 150;

spacings.forEach((spacing, row) => {
  const splitter = new TextSplitter(text, {
    fontSize,
    fontFamily: fallbackChain,
    fontWeight: 'normal',
    fontStyle: 'normal',
    dynamicSpacing: false,
  });

  // 覆盖 charSpacing
  splitter.options.charSpacing = spacing;

  const chars = splitter.getCharacters();
  const totalWidth = splitter.getTotalWidth();
  const startX = centerX - totalWidth / 2;

  const y = yStart + row * rowHeight;

  ctx.fillStyle = '#333333';
  ctx.font = '20px Arial';
  ctx.fillText(`charSpacing=${spacing} (fontSize*${(spacing/fontSize).toFixed(3)})`, 50, y - 10);

  // 渲染字符
  let xPos = startX;
  chars.forEach((c, i) => {
    const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, y + 50));
    charItem.content = c.text;
    charItem.fontSize = fontSize;
    charItem.fontFamily = fontFamily;
    charItem.fillColor = '#000000';
    charItem.justification = 'center';

    // 画字符框
    ctx.strokeStyle = '#8800ff';
    ctx.strokeRect(xPos, y, c.width, fontSize);

    xPos += c.width + spacing;
  });

  // 画总宽度
  ctx.strokeStyle = '#00ff00';
  ctx.strokeRect(startX, y + fontSize + 5, totalWidth, 10);

  ctx.fillStyle = '#00aa00';
  ctx.font = '16px Arial';
  ctx.fillText(`totalWidth=${totalWidth.toFixed(2)}`, startX, y + fontSize + 25);
});

// Paper.js 整体渲染
const paperText = new paper.PointText(new paper.Point(centerX, 550));
paperText.content = text;
paperText.fontSize = fontSize;
paperText.fontFamily = fontFamily;
paperText.fillColor = '#000000';
paperText.justification = 'center';

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText('Paper.js 整体渲染:', 50, 530);
ctx.strokeStyle = '#0066ff';
ctx.strokeRect(paperText.bounds.x, paperText.bounds.y, paperText.bounds.width, paperText.bounds.height);
ctx.font = '16px Arial';
ctx.fillText(`bounds.width=${paperText.bounds.width.toFixed(2)}`, 50, 580);

paper.view.draw();
fs.writeFileSync('./output/char-spacing-test.png', canvas.toBuffer('image/png'));
console.log('图片已保存到: output/char-spacing-test.png');

// 建议
console.log('\n=== 建议 ===');
console.log('英文 charSpacing 建议使用 2-5 (fontSize 的 2-4%%)');
console.log('当前默认值 fontSize * 0.1 = 12，可能偏大');

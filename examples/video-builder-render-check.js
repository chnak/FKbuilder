/**
 * 检查 VideoBuilder 实际渲染的帧
 */
import { createCanvas } from 'canvas';
import paper from '@chnak/paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

// 模拟 TextElement 的分割逻辑
const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: true,
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log('分割数据 (dynamicSpacing=true):');
chars.forEach((c, i) => {
  const gap = i < chars.length - 1 ? chars[i + 1].x - (c.x + c.width) : 0;
  console.log(`  [${i}] "${c.text}": char.x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}, gap=${gap.toFixed(2)}`);
});

// 渲染到 Canvas 模拟 VideoBuilder 的分割渲染
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

// 模拟 TextElement 的居中计算
// TextElement.calculateSegmentPosition:
// baseX = parentXPixels - totalTextWidth / 2 (当 anchor=[0.5,0.5], textAlign='center')
const centerX = 960;
const baseX = centerX - totalWidth / 2;

console.log(`\n居中计算: centerX=${centerX}, totalWidth=${totalWidth.toFixed(2)}, baseX=${baseX.toFixed(2)}`);

// 模拟 TextElement 渲染每个字符
// 每个字符使用 PointText，justification='center'
ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText('模拟 TextElement 渲染 (baseX + char.x + width/2, justification=center)', 50, 30);
ctx.fillText(`baseX=${baseX.toFixed(2)}, totalWidth=${totalWidth.toFixed(2)}`, 50, 55);

// 使用与 TextElement 相同的定位方式
chars.forEach((c, i) => {
  // 这是 TextElement 渲染单个字符时使用的定位
  const xPos = baseX + c.x + c.width / 2;

  const charItem = new paper.PointText(new paper.Point(xPos, 200));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 4 ? '#ff0000' : (i === 6 ? '#0000ff' : '#000000');
  charItem.justification = 'center';

  // 画字符框
  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(baseX + c.x, 200 - fontSize, c.width, fontSize);

  // 画字符中心点
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(xPos, 200, 5, 0, Math.PI * 2);
  ctx.fill();

  // 标注
  ctx.fillStyle = '#333333';
  ctx.font = '14px Arial';
  ctx.fillText(`x=${xPos.toFixed(1)}`, baseX + c.x + c.width / 2, 200 + 25);
});

// 标注问题：l 和 d 之间的间距
const l_char = chars[5];
const d_char = chars[6];
const l_centerX = baseX + l_char.x + l_char.width / 2;
const d_centerX = baseX + d_char.x + d_char.width / 2;
const l_to_d_distance = d_centerX - l_centerX;

ctx.fillStyle = '#ff0000';
ctx.font = '18px Arial';
ctx.fillText(`l 中心到 d 中心距离: ${l_to_d_distance.toFixed(2)}px (l宽${l_char.width}+gap${12}+d宽${d_char.width})`, 50, 280);

// 对比：连续渲染 vs 分割渲染
ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText('对比: 连续渲染 (ctx.fillText) vs 分割渲染', 50, 350);

// 连续渲染
ctx.font = `${fontSize}px "${fontFamily}"`;
ctx.fillStyle = '#000000';
ctx.fillText(text, 960, 400);

// Paper.js 连续渲染
const textItem = new paper.PointText(new paper.Point(960, 500));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

ctx.strokeStyle = '#0066ff';
ctx.strokeRect(textItem.bounds.x, textItem.bounds.y, textItem.bounds.width, textItem.bounds.height);

ctx.fillStyle = '#333333';
ctx.font = '16px Arial';
ctx.fillText(`Paper.js bounds: x=${textItem.bounds.x.toFixed(2)}, width=${textItem.bounds.width.toFixed(2)}`, 50, 530);

paper.view.draw();
fs.writeFileSync('./output/video-builder-render-check.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/video-builder-render-check.png');

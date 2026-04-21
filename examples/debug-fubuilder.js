/**
 * 调试 "Fubuilder" 分割问题
 */
import { TextSplitter } from '../src/utils/text-splitter.js';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';

initDefaultFont();

console.log('=== 调试 "Fubuilder" 分割 ===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';

console.log(`文本: "${text}"`);
console.log(`字体: ${fontFamily}`);
console.log(`字号: ${fontSize}`);

const fallbackChain = getFontFallbackChain(fontFamily);
console.log(`字体回退链: ${fallbackChain}`);

const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false, // 先禁用动态间距
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log(`\ncharSpacing: ${splitter.options.charSpacing}`);
console.log(`totalWidth: ${totalWidth.toFixed(2)}`);

console.log('\n字符详情:');
chars.forEach((c, i) => {
  console.log(`  [${i}] "${c.text}" width=${c.width.toFixed(2)} x=${c.x.toFixed(2)}`);
});

console.log('\n间距分析:');
for (let i = 0; i < chars.length - 1; i++) {
  const gap = chars[i + 1].x - chars[i].x - chars[i].width;
  console.log(`  [${i}]"${chars[i].text}" -> [${i+1}]"${chars[i+1].text}": 间距=${gap.toFixed(2)}`);
}

// Canvas 测量对比
const canvas = createCanvas(1, 1);
const ctx = canvas.getContext('2d');
ctx.font = `${fontSize}px "${fontFamily}"`;

console.log('\nCanvas measureText 测量:');
const wholeWidth = ctx.measureText(text).width;
console.log(`  "${text}" 整体宽度: ${wholeWidth.toFixed(2)}`);

// 测量每个字符
let sumWidths = 0;
chars.forEach(c => {
  const w = ctx.measureText(c.text).width;
  console.log(`  "${c.text}" 宽度: ${w.toFixed(2)}`);
  sumWidths += w;
});
console.log(`  字符宽度和: ${sumWidths.toFixed(2)}`);
console.log(`  差异: ${(sumWidths - wholeWidth).toFixed(2)} (kerning 影响)`);

// 可视化
console.log('\n=== 可视化 ===');
const visCanvas = createCanvas(1920, 300);
paper.setup(visCanvas);
const visCtx = visCanvas.getContext('2d');

visCtx.fillStyle = '#ffffff';
visCtx.fillRect(0, 0, 1920, 300);

// 中心线
visCtx.strokeStyle = '#ff0000';
visCtx.setLineDash([5, 5]);
visCtx.beginPath();
visCtx.moveTo(960, 0);
visCtx.lineTo(960, 300);
visCtx.stroke();
visCtx.setLineDash([]);

// 用 Paper.js 渲染整个文本
const textItem = new paper.PointText(new paper.Point(960, 150));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

const bounds = textItem.bounds;
console.log(`Paper.js bounds: x=${bounds.x.toFixed(2)}, width=${bounds.width.toFixed(2)}`);

// 画 Paper.js 渲染的边界
visCtx.strokeStyle = '#0066ff';
visCtx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

// 画起点和终点标记
visCtx.fillStyle = '#ff0000';
visCtx.fillRect(bounds.x - 2, bounds.y, 4, bounds.height);
visCtx.fillStyle = '#00ff00';
visCtx.fillRect(bounds.x + bounds.width - 2, bounds.y, 4, bounds.height);

// 标题
visCtx.fillStyle = '#333333';
visCtx.font = '24px Arial';
visCtx.fillText(`"${text}" - Paper.js 居中渲染 (justification='center')`, 960, 30);
visCtx.fillText(`bounds.x=${bounds.x.toFixed(2)}, bounds.width=${bounds.width.toFixed(2)}`, 960, 60);

// 手动渲染每个字符（使用 TextSplitter 的位置）
const startX = 960 - totalWidth / 2;
console.log(`\nTextSplitter 计算: startX=${startX.toFixed(2)}, totalWidth=${totalWidth.toFixed(2)}`);

let manualX = startX;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(manualX + c.width / 2, 150));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 0 ? '#ff0000' : '#000000'; // 第一个字符标红
  charItem.justification = 'center';

  // 画字符边缘线
  visCtx.strokeStyle = '#ff8800';
  visCtx.setLineDash([2, 2]);
  visCtx.beginPath();
  visCtx.moveTo(manualX + c.width, 100);
  visCtx.lineTo(manualX + c.width, 200);
  visCtx.stroke();
  visCtx.setLineDash([]);

  manualX += c.width + splitter.options.charSpacing;
});

// 画第一个字符的起始位置
visCtx.fillStyle = '#ff00ff';
visCtx.fillRect(startX - 2, 100, 4, 100);

visCtx.fillStyle = '#333333';
visCtx.font = '20px Arial';
visCtx.fillText(`手动渲染起始位置: ${startX.toFixed(2)}`, 960, 250);
visCtx.fillText(`TextSplitter totalWidth: ${totalWidth.toFixed(2)}`, 960, 275);

paper.view.draw();
fs.writeFileSync('./output/fubuilder-debug.png', visCanvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/fubuilder-debug.png');

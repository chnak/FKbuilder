/**
 * 测试分割后的间距（窄字符 vs 宽字符）
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

console.log('=== 窄字符间距分析 ===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);
const charSpacing = fontSize * 0.1; // 12

console.log(`fontSize: ${fontSize}`);
console.log(`charSpacing (10%): ${charSpacing}`);
console.log(`charSpacing/fontSize: ${(charSpacing/fontSize*100).toFixed(1)}%`);

const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false,
});

const chars = splitter.getCharacters();

console.log('\n字符宽度分析:');
const widths = chars.map(c => c.width);
const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
const minWidth = Math.min(...widths);
const maxWidth = Math.max(...widths);

chars.forEach((c, i) => {
  const ratio = c.width / avgWidth;
  console.log(`  [${i}] "${c.text}": width=${c.width.toFixed(2)} (平均的 ${(ratio * 100).toFixed(1)}%)`);
});

console.log(`\n平均宽度: ${avgWidth.toFixed(2)}`);
console.log(`最窄/最宽比例: ${(minWidth / maxWidth * 100).toFixed(1)}%`);

console.log('\n间距分析 (charSpacing=12):');
for (let i = 0; i < chars.length - 1; i++) {
  const c1 = chars[i];
  const c2 = chars[i + 1];
  const spacing = charSpacing;
  const c1Ratio = c1.width / avgWidth;
  const c2Ratio = c2.width / avgWidth;

  console.log(`  [${i}]"${c1.text}"(${c1.width.toFixed(0)}) + spacing(${spacing}) + [${i+1}]"${c2.text}"(${c2.width.toFixed(0)})`);
  console.log(`    => ${c1.width.toFixed(0)} + ${spacing} = ${(c1.width + spacing).toFixed(0)}, 但 "i" 前面是 ${(c1.width + spacing).toFixed(0)} 而 "i" 只有 ${c2.width.toFixed(0)}`);
}

// 可视化
const canvas = createCanvas(1920, 300);
paper.setup(canvas);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 1920, 300);

// 中心线
ctx.strokeStyle = '#ff0000';
ctx.setLineDash([5, 5]);
ctx.beginPath();
ctx.moveTo(960, 0);
ctx.lineTo(960, 300);
ctx.stroke();
ctx.setLineDash([]);

const centerX = 960;
const totalWidth = splitter.getTotalWidth();
const startX = centerX - totalWidth / 2;

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText(`charSpacing=${charSpacing}, 总宽度=${totalWidth.toFixed(2)}`, 50, 30);

// 逐字符渲染
let xPos = startX;
chars.forEach((c, i) => {
  // 字符
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 150));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 4 ? '#ff0000' : (i === 5 ? '#ff8800' : (i === 6 ? '#ff00ff' : '#000000'));
  charItem.justification = 'center';

  // 字符框
  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(xPos, 150 - fontSize, c.width, fontSize);

  // charSpacing 区域（红色标记）
  if (i < chars.length - 1) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(xPos + c.width, 150 - fontSize, charSpacing, fontSize);
  }

  // 字符宽度标注
  ctx.fillStyle = '#333333';
  ctx.font = '14px Arial';
  ctx.fillText(`${c.width.toFixed(0)}`, xPos + c.width / 2, 150 + 25);

  xPos += c.width + charSpacing;
});

// 标注窄字符
ctx.fillStyle = '#ff0000';
ctx.font = '16px Arial';
ctx.fillText('红色标记: i, l, d', 50, 250);

paper.view.draw();
fs.writeFileSync('./output/narrow-chars-analysis.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/narrow-chars-analysis.png');

// 建议
console.log('\n=== 问题诊断 ===');
console.log('问题: charSpacing 是固定的 12px，不考虑字符宽度');
console.log('窄字符 "i"(35px) 和 "l"(33px) 之间的 12px 间距占它们宽度的 ~35%');
console.log('宽字符 "u"(71px) 和 "d"(67px) 之间的 12px 间距只占它们宽度的 ~17%');
console.log('\n可能的解决方案:');
console.log('1. 使用 proportional charSpacing (如 fontSize 的 2-4%%)');
console.log('2. 使用 dynamicSpacing 根据字符宽度调整');
console.log('3. 调整特定字符对的间距');

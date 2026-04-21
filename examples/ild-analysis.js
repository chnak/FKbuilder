/**
 * 检查 i 和 d 之间的间距
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: true,
});

const chars = splitter.getCharacters();

console.log('=== i 和 d 之间的问题分析 ===\n');

// 找到 i, l, d 的位置
const i_idx = 4;
const l_idx = 5;
const d_idx = 6;

console.log('字符数据:');
for (let i = i_idx; i <= d_idx; i++) {
  const c = chars[i];
  const gapAfter = i < chars.length - 1 ? chars[i + 1].x - (c.x + c.width) : 0;
  console.log(`  [${i}] "${c.text}": x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}, gap_after=${gapAfter.toFixed(2)}`);
}

// 计算 i 到 d 的总距离
const i_char = chars[i_idx];
const d_char = chars[d_idx];
const i_to_d = d_char.x - i_char.x;
const i_width = i_char.width;
const l_width = chars[l_idx].width;
const i_to_l_gap = chars[l_idx].x - (i_char.x + i_char.width);
const l_to_d_gap = d_char.x - (chars[l_idx].x + chars[l_idx].width);

console.log(`\n"ild" 分析:`);
console.log(`  "i" 宽度: ${i_width.toFixed(2)}`);
console.log(`  "l" 宽度: ${l_width.toFixed(2)}`);
console.log(`  "d" 宽度: ${d_char.width.toFixed(2)}`);
console.log(`  i 到 l: ${i_width.toFixed(2)} + ${i_to_l_gap.toFixed(2)} (gap) = ${(i_width + i_to_l_gap).toFixed(2)}`);
console.log(`  l 到 d: ${l_width.toFixed(2)} + ${l_to_d_gap.toFixed(2)} (gap) = ${(l_width + l_to_d_gap).toFixed(2)}`);
console.log(`  i 到 d 总距离: ${i_to_d.toFixed(2)}`);

// 如果把 i 和 l 看成一体 (i 的右边 + l 的宽度)
const i_l_combined = i_width + i_to_l_gap + l_width;
console.log(`\n  "i"+"l"+gap = ${i_l_combined.toFixed(2)}`);
console.log(`  "d" 宽度: ${d_char.width.toFixed(2)}`);
console.log(`  比例: d 是 i+l 的 ${(d_char.width / i_l_combined * 100).toFixed(1)}%`);

// 可视化
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

// 居中渲染
const centerX = 960;
const totalWidth = splitter.getTotalWidth();
const startX = centerX - totalWidth / 2;

// 画字符
ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText(`"ild" 间距分析: gap(i->l)=${i_to_l_gap.toFixed(2)}, gap(l->d)=${l_to_d_gap.toFixed(2)}`, 50, 30);

// 放大显示 i l d
const y = 200;
const scale = 2;
let xPos = 300;

chars.forEach((c, i) => {
  if (i < i_idx || i > d_idx) return;

  const charItem = new paper.PointText(new paper.Point(xPos + c.width * scale / 2, y));
  charItem.content = c.text;
  charItem.fontSize = fontSize * scale;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === i_idx ? '#ff0000' : (i === d_idx ? '#0000ff' : '#00aa00');
  charItem.justification = 'center';

  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(xPos, y - fontSize * scale, c.width * scale, fontSize * scale);

  // 标注
  ctx.fillStyle = '#333333';
  ctx.font = '16px Arial';
  ctx.fillText(`${c.width.toFixed(0)}`, xPos + c.width * scale / 2, y + 30);

  if (i < chars.length - 1) {
    const gap = chars[i + 1].x - (c.x + c.width);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(xPos + c.width * scale, y - fontSize * scale, gap * scale, fontSize * scale);
    ctx.fillStyle = '#ff0000';
    ctx.font = '14px Arial';
    ctx.fillText(`g=${gap.toFixed(1)}`, xPos + c.width * scale + gap * scale / 2, y - fontSize * scale / 2);
  }

  xPos += c.width * scale;
  if (i < chars.length - 1) {
    const gap = chars[i + 1].x - (c.x + c.width);
    xPos += gap * scale;
  }
});

// 问题说明
ctx.fillStyle = '#333333';
ctx.font = '18px Arial';
ctx.fillText('问题: "i"(35) + "l"(33) 很窄，但它们和 "d"(67) 之间的间距却一样(6-12)', 50, 350);
ctx.fillText('"ild" 组合视觉上不平衡', 50, 375);

paper.view.draw();
fs.writeFileSync('./output/ild-analysis.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/ild-analysis.png');

/**
 * 精确测试英文字符位置
 */
import { TextSplitter } from '../src/utils/text-splitter.js';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';

initDefaultFont();

console.log('=== 精确测试英文字符位置 ===\n');

// 创建画布用于可视化
const canvas = createCanvas(1920, 400);
paper.setup(canvas);

// 测试各种英文文本
const testTexts = [
  { text: 'ABC', fontFamily: 'Arial', fontSize: 100 },
  { text: 'HELLO', fontFamily: 'Arial', fontSize: 80 },
  { text: 'PATUA', fontFamily: 'PatuaOne', fontSize: 100 },
  { text: 'AAAAA', fontFamily: 'Arial', fontSize: 100 },  // 相同字符
];

const ctx = canvas.getContext('2d');
let yPos = 50;

testTexts.forEach(({ text, fontFamily, fontSize }) => {
  console.log(`\n--- "${text}" | 字体: ${fontFamily} | 字号: ${fontSize} ---`);

  const fallbackChain = getFontFallbackChain(fontFamily);

  const splitter = new TextSplitter(text, {
    fontSize,
    fontFamily: fallbackChain,
    fontWeight: 'normal',
    fontStyle: 'normal',
    dynamicSpacing: false, // 禁用动态间距，使用固定间距
  });

  const chars = splitter.getCharacters();
  const totalWidth = splitter.getTotalWidth();

  console.log(`charSpacing: ${splitter.options.charSpacing}`);
  console.log(`totalWidth: ${totalWidth.toFixed(2)}`);
  console.log('字符详情:');
  chars.forEach((c, i) => {
    console.log(`  [${i}] "${c.text}" width=${c.width.toFixed(2)} x=${c.x.toFixed(2)}`);
  });

  // 计算相邻字符的间距
  for (let i = 0; i < chars.length - 1; i++) {
    const gap = chars[i + 1].x - chars[i].x - chars[i].width;
    console.log(`  间距 [${i}]->[${i+1}]: ${gap.toFixed(2)}`);
  }

  // 可视化
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, yPos - 30, 1920, 120);

  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = '#000000';
  ctx.fillText(text, 100, yPos + 20);

  // 画每个字符的位置标记
  ctx.fillStyle = '#ff0000';
  chars.forEach((c, i) => {
    const absX = 100 + c.x;
    // 画字符起始位置
    ctx.fillRect(absX - 1, yPos - 10, 2, 20);
    // 画字符宽度线
    ctx.fillRect(absX + c.width, yPos + 5, 2, 10);
  });

  // 画文本起始和结束标记
  ctx.strokeStyle = '#00ff00';
  ctx.strokeRect(100, yPos - 15, totalWidth, 40);

  // 标注宽度
  ctx.fillStyle = '#0066ff';
  ctx.fillText(`totalWidth=${totalWidth.toFixed(2)}`, 100 + totalWidth + 20, yPos + 20);

  yPos += 120;
});

// 保存图片
paper.view.draw();
fs.writeFileSync('./output/text-precision-test.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/text-precision-test.png');

// 直接用 Canvas 测量进行对比
console.log('\n=== Canvas 测量对比 ===');
testTexts.forEach(({ text, fontFamily, fontSize }) => {
  ctx.font = `${fontSize}px "${fontFamily}"`;

  // 测量整个文本
  const wholeWidth = ctx.measureText(text).width;

  // 测量每个字符
  let charWidthsSum = 0;
  for (const char of text) {
    charWidthsSum += ctx.measureText(char).width;
  }

  // 计算间距总和
  const spacingSum = wholeWidth - charWidthsSum;
  const avgSpacing = spacingSum / (text.length - 1);

  console.log(`\n"${text}":`);
  console.log(`  Canvas measureText 整个文本: ${wholeWidth.toFixed(2)}`);
  console.log(`  字符宽度总和: ${charWidthsSum.toFixed(2)}`);
  console.log(`  间距总和: ${spacingSum.toFixed(2)}`);
  console.log(`  平均间距: ${avgSpacing.toFixed(2)}`);
});

console.log('\n=== 测试完成 ===');

/**
 * 测试 Kerning 问题
 */
import { TextSplitter } from '../src/utils/text-splitter.js';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';

initDefaultFont();

console.log('=== Kerning 问题分析 ===\n');

// 分析 "PATUA" 的情况
const text = 'PATUA';
const fontSize = 100;
const fontFamily = 'Arial';
const fallbackChain = getFontFallbackChain(fontFamily);

const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false,
});

console.log(`文本: "${text}", 字体: ${fontFamily}, 字号: ${fontSize}`);
console.log(`charSpacing: ${splitter.options.charSpacing}`);
console.log(`TextSplitter totalWidth: ${splitter.getTotalWidth().toFixed(2)}`);

const chars = splitter.getCharacters();
console.log('\n字符信息:');
chars.forEach((c, i) => {
  console.log(`  [${i}] "${c.text}" width=${c.width.toFixed(2)}`);
});

// 手动计算
let sumWidths = 0;
chars.forEach(c => sumWidths += c.width);
const spacingSum = (chars.length - 1) * splitter.options.charSpacing;
const calculatedTotal = sumWidths + spacingSum;

console.log(`\n手动计算:`);
console.log(`  字符宽度和: ${sumWidths.toFixed(2)}`);
console.log(`  间距和 (${chars.length - 1} × ${splitter.options.charSpacing}): ${spacingSum.toFixed(2)}`);
console.log(`  计算总值: ${calculatedTotal.toFixed(2)}`);

// 测试 Canvas measureText
import { createCanvas } from 'canvas';
const canvas = createCanvas(1, 1);
const ctx = canvas.getContext('2d');
ctx.font = `${fontSize}px "${fontFamily}"`;

const canvasWholeText = ctx.measureText(text).width;
console.log(`\nCanvas measureText("${text}"): ${canvasWholeText.toFixed(2)}`);
console.log(`Canvas measureText 单字符和: ${sumWidths.toFixed(2)}`);
console.log(`Canvas Kerning 影响: ${(canvasWholeText - sumWidths).toFixed(2)}`);

// 测试不同间距的效果
console.log('\n=== 测试不同 charSpacing 的效果 ===');
console.log('文本: "AAAAA", 字体: Arial, 字号: 100');
const text2 = 'AAAAA';
ctx.font = `${fontSize}px "${fontFamily}"`;

const wholeWidth = ctx.measureText(text2).width;
console.log(`Canvas measureText: ${wholeWidth.toFixed(2)}`);

// 累加单字符
let sumA = 0;
for (const c of text2) {
  sumA += ctx.measureText(c).width;
}
console.log(`单字符和: ${sumA.toFixed(2)}`);

// 不同 charSpacing
[0, 5, 10, 15, 20].forEach(spacing => {
  const total = sumA + (text2.length - 1) * spacing;
  console.log(`  charSpacing=${spacing}: totalWidth=${total.toFixed(2)}, 视觉间距=${total - wholeWidth >= 0 ? '偏宽' : '偏窄'}`);
});

console.log('\n=== 问题分析 ===');
console.log('如果 charSpacing=10，总宽度 = 333.50 + 40 = 373.50');
console.log('Canvas 测量整个文本宽度 = 333.50');
console.log('差异 = 373.50 - 333.50 = 40 = 4 × 10');
console.log('');
console.log('所以当 charSpacing=10 时，TextSplitter 的 totalWidth 会比');
console.log('Canvas measureText 多出 (n-1) × charSpacing');
console.log('');
console.log('这意味着如果用 totalWidth 来居中文本，实际字符会比预期位置更靠右！');

console.log('\n=== 修复方案 ===');
console.log('方案1: 用 Canvas measureText 的值作为 totalWidth（考虑 kerning）');
console.log('方案2: 调整 charSpacing 的计算，考虑 kerning');
console.log('方案3: 位置计算时不依赖 totalWidth，而是动态计算');

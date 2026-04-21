/**
 * 检查字体 kerning - 对比 measureText 单字符 vs 组合字符
 */
import { createCanvas } from 'canvas';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';

initDefaultFont();

console.log('=== 字体 Kerning 检查 ===\n');

const fontSize = 120;
const fontFamily = 'PatuaOne';

const canvas = createCanvas(1, 1);
const ctx = canvas.getContext('2d');
ctx.font = `${fontSize}px "${fontFamily}"`;

// 测试 kerning 字符组合
const testPairs = [
  ['F', 'u'],
  ['u', 'b'],
  ['b', 'u'],
  ['u', 'i'],
  ['i', 'l'],
  ['l', 'd'],
  ['d', 'e'],
  ['e', 'r'],
];

console.log('Kerning 对比 (单位: px):');
let sumIndividual = 0;
let sumPaired = 0;

testPairs.forEach(([char1, char2]) => {
  const w1 = ctx.measureText(char1).width;
  const w2 = ctx.measureText(char2).width;
  const paired = ctx.measureText(char1 + char2).width;
  const kerning = paired - (w1 + w2);

  sumIndividual += w1 + w2;
  sumPaired += paired;

  console.log(`  "${char1}${char2}": "${char1}"=${w1.toFixed(2)} + "${char2}"=${w2.toFixed(2)} = ${(w1+w2).toFixed(2)}, paired=${paired.toFixed(2)}, kerning=${kerning.toFixed(2)}`);
});

console.log(`\n字符宽度和: ${sumIndividual.toFixed(2)}`);
console.log(`组合测量: ${sumPaired.toFixed(2)}`);
console.log(`总 Kerning: ${(sumPaired - sumIndividual).toFixed(2)}`);

// 测试整个文本
const text = 'Fubuilder';
const wholeWidth = ctx.measureText(text).width;
const charWidths = text.split('').map(c => ctx.measureText(c).width);
const sumWidths = charWidths.reduce((a, b) => a + b, 0);

console.log(`\n整个文本 "${text}":`);
console.log(`  measureText 整体: ${wholeWidth.toFixed(2)}`);
console.log(`  分割求和: ${sumWidths.toFixed(2)}`);
console.log(`  Kerning 差异: ${(wholeWidth - sumWidths).toFixed(2)}`);

// 窄字符 vs 宽字符
console.log('\n=== 窄字符 vs 宽字符 ===');
['i', 'l', 'r', 't', 'i'].forEach(c => {
  console.log(`  "${c}": ${ctx.measureText(c).width.toFixed(2)}px (窄)`);
});
['F', 'u', 'b', 'd', 'e', 'o'].forEach(c => {
  console.log(`  "${c}": ${ctx.measureText(c).width.toFixed(2)}px (宽)`);
});

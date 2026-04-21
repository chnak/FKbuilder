/**
 * 精确测试 TextSplitter 的输出
 */
import { TextSplitter } from '../src/utils/text-splitter.js';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';

initDefaultFont();

console.log('=== TextSplitter 精确测试 ===\n');

// 测试 "AB"
const text = 'AB';
const fontSize = 100;
const fontFamily = 'Arial';
const fallbackChain = getFontFallbackChain(fontFamily);

console.log(`文本: "${text}", 字体: ${fontFamily}, 字号: ${fontSize}`);
console.log(`字体回退链: ${fallbackChain}`);

// 使用与 TextElement 相同的参数创建分割器
const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: true, // 启用动态间距
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();
const totalHeight = splitter.getTotalHeight();

console.log(`\n字符数: ${chars.length}`);
chars.forEach((c, i) => {
  console.log(`  [${i}] "${c.text}" width=${c.width.toFixed(2)} x=${c.x.toFixed(2)}`);
});

console.log(`\ntotalWidth: ${totalWidth.toFixed(2)}`);
console.log(`totalHeight: ${totalHeight.toFixed(2)}`);

// 手动计算总宽度
let manualWidth = 0;
chars.forEach((c, i) => {
  manualWidth += c.width;
  if (i < chars.length - 1) {
    // 如果有动态间距，应该在这里加
  }
});
console.log(`手动计算宽度 (不含间距): ${manualWidth.toFixed(2)}`);

// 计算间距总和
let spacingSum = 0;
for (let i = 0; i < chars.length - 1; i++) {
  const gap = chars[i + 1].x - chars[i].x - chars[i].width;
  spacingSum += gap;
  console.log(`  字符 [${i}] "${chars[i].text}" 和 [${i+1}] "${chars[i+1].text}" 之间间距: ${gap.toFixed(2)}`);
}
console.log(`间距总和: ${spacingSum.toFixed(2)}`);

// 验证
console.log(`\n验证: totalWidth = 最后一个字符的x + 最后一个字符的宽度 + 最后间距`);
const lastChar = chars[chars.length - 1];
const calculatedTotal = lastChar.x + lastChar.width;
console.log(`  最后一个字符 "[${chars.length - 1}] '${lastChar.text}'": x=${lastChar.x.toFixed(2)}, width=${lastChar.width.toFixed(2)}`);
console.log(`  计算值: ${calculatedTotal.toFixed(2)}`);
console.log(`  totalWidth: ${totalWidth.toFixed(2)}`);
console.log(`  匹配: ${Math.abs(calculatedTotal - totalWidth) < 0.01 ? '✓' : '✗ 不匹配!'}`);

// 检查 charSpacing
console.log(`\ncharSpacing: ${splitter.options.charSpacing}`);
console.log(`dynamicSpacing: ${splitter.options.dynamicSpacing}`);

console.log('\n=== 测试完成 ===');

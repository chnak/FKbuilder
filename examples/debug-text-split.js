/**
 * 调试文本分割计算
 */
import { TextSplitter } from '../src/utils/text-splitter.js';
import { initDefaultFont, getFontFallbackChain, getRegisteredFontNames } from '../src/index.js';

initDefaultFont();

console.log('=== 文本分割调试 ===\n');

// 测试不同字体的文本分割
const testCases = [
  { text: 'FKbuilder', fontFamily: 'PatuaOne', fontSize: 120 },
  { text: 'Hello', fontFamily: 'Arial', fontSize: 60 },
  { text: '你好', fontFamily: 'Microsoft YaHei', fontSize: 60 },
  { text: '😀🎉🚀', fontFamily: 'SegoeUI', fontSize: 80 },
  { text: 'A1B2', fontFamily: 'Arial', fontSize: 100 },
];

testCases.forEach(({ text, fontFamily, fontSize }) => {
  console.log(`\n--- 文本: "${text}", 字体: ${fontFamily}, 字号: ${fontSize} ---`);

  // 应用字体回退链（与 TextElement 相同的逻辑）
  const fallbackChain = getFontFallbackChain(fontFamily);
  console.log(`回退链: ${fallbackChain}`);

  // 使用回退链创建分割器
  const splitter = new TextSplitter(text, {
    fontSize,
    fontFamily: fallbackChain,
    fontWeight: 'normal',
    fontStyle: 'normal',
    dynamicSpacing: false, // 禁用动态间距以便观察
  });

  // 获取字符信息
  const chars = splitter.getCharacters();
  console.log(`字符数: ${chars.length}`);
  console.log('字符详情:');
  chars.forEach((c, i) => {
    console.log(`  [${i}] "${c.text}" width=${c.width.toFixed(2)} x=${c.x.toFixed(2)}`);
  });

  // 获取总宽度
  console.log(`总宽度: ${splitter.getTotalWidth().toFixed(2)}`);
});

console.log('\n=== 调试完成 ===');

/**
 * 调试文本位置计算
 */
import { TextSplitter } from '../src/utils/text-splitter.js';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';

initDefaultFont();

console.log('=== 文本位置计算调试 ===\n');

// 测试场景：文本居中显示
const testCases = [
  { text: 'FKbuilder', fontFamily: 'PatuaOne', fontSize: 120, canvasWidth: 1920, x: '50%' },
  { text: 'ABC', fontFamily: 'Arial', fontSize: 100, canvasWidth: 1920, x: '50%' },
  { text: '你好', fontFamily: 'Microsoft YaHei', fontSize: 60, canvasWidth: 1920, x: '50%' },
];

testCases.forEach(({ text, fontFamily, fontSize, canvasWidth, x }) => {
  console.log(`\n--- 文本: "${text}", 字体: ${fontFamily}, 字号: ${fontSize}, 画布: ${canvasWidth}x1080 ---`);

  // 应用字体回退链
  const fallbackChain = getFontFallbackChain(fontFamily);

  // 创建分割器
  const splitter = new TextSplitter(text, {
    fontSize,
    fontFamily: fallbackChain,
    fontWeight: 'normal',
    fontStyle: 'normal',
    dynamicSpacing: true,
  });

  // 获取字符信息
  const chars = splitter.getCharacters();
  const totalWidth = splitter.getTotalWidth();

  console.log(`\n字符信息 (字体回退链: ${fallbackChain}):`);
  chars.forEach((c, i) => {
    console.log(`  [${i}] "${c.text}" width=${c.width.toFixed(2)} x=${c.x.toFixed(2)}`);
  });
  console.log(`总宽度: ${totalWidth.toFixed(2)}`);

  // 计算居中对齐时的位置
  // x: '50%' 表示元素中心在画布中心
  const canvasCenterX = canvasWidth / 2;

  // 如果文本要居中，文本的起点应该是：
  // canvasCenterX - totalWidth / 2
  const textStartX = canvasCenterX - totalWidth / 2;
  console.log(`\n居中对齐计算:`);
  console.log(`  画布中心: ${canvasCenterX}`);
  console.log(`  文本起点: ${textStartX.toFixed(2)}`);

  // 计算每个字符在画布上的实际位置
  console.log(`\n每个字符在画布上的位置 (当文本居中时):`);
  chars.forEach((c, i) => {
    const charCenterX = textStartX + c.x + c.width / 2;
    console.log(`  [${i}] "${c.text}" 字符中心 x=${charCenterX.toFixed(2)}`);
  });

  // 计算相邻字符之间的距离（中心到中心）
  console.log(`\n相邻字符中心距离:`);
  for (let i = 0; i < chars.length - 1; i++) {
    const char1Center = textStartX + chars[i].x + chars[i].width / 2;
    const char2Center = textStartX + chars[i + 1].x + chars[i + 1].width / 2;
    const distance = char2Center - char1Center;
    console.log(`  "${chars[i].text}" -> "${chars[i + 1].text}": ${distance.toFixed(2)}`);
  }

  // 计算视觉间距（字符边缘之间的距离）
  console.log(`\n相邻字符边缘距离 (视觉间距):`);
  for (let i = 0; i < chars.length - 1; i++) {
    const char1End = textStartX + chars[i].x + chars[i].width;
    const char2Start = textStartX + chars[i + 1].x;
    const visualGap = char2Start - char1End;
    console.log(`  "${chars[i].text}" -> "${chars[i + 1].text}": ${visualGap.toFixed(2)}`);
  }
});

console.log('\n=== 调试完成 ===');

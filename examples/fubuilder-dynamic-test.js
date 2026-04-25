/**
 * 测试 VideoBuilder 中的实际渲染（使用 dynamicSpacing）
 */
import { createCanvas } from 'canvas';
import paper from '@chnak/paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';
import { VideoBuilder } from '../src/index.js';

initDefaultFont();

console.log('=== VideoBuilder 渲染测试（dynamicSpacing=true）===\n');

const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

// 使用 dynamicSpacing: true（与 VideoBuilder 中的 TextElement 相同）
const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: true, // 与 TextElement 中的配置相同
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log('TextSplitter (dynamicSpacing=true) 数据:');
console.log(`totalWidth: ${totalWidth.toFixed(2)}`);
chars.forEach((c, i) => {
  const nextChar = chars[i + 1];
  const gap = nextChar ? (nextChar.x - (c.x + c.width)) : 0;
  console.log(`  [${i}] "${c.text}": x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}, gap=${gap.toFixed(2)}`);
});

// 创建画布
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

// Paper.js 整体渲染
const textItem = new paper.PointText(new paper.Point(960, 80));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

ctx.fillStyle = '#333333';
ctx.font = '20px Arial';
ctx.fillText(`Paper.js 整体渲染: bounds.width=${textItem.bounds.width.toFixed(2)}`, 50, 30);

// 使用 dynamicSpacing 渲染字符
const centerX = 960;
const startX = centerX - totalWidth / 2;

ctx.fillStyle = '#333333';
ctx.fillText(`分割渲染 (dynamicSpacing=true): startX=${startX.toFixed(2)}`, 50, 130);

let xPos = startX;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos + c.width / 2, 200));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 4 || i === 5 ? '#ff0000' : '#000000';
  charItem.justification = 'center';

  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(xPos, 200 - fontSize, c.width, fontSize);

  // 更新 xPos 使用实际的 gap
  xPos += c.width;
  if (i < chars.length - 1) {
    const gap = chars[i + 1].x - (c.x + c.width);
    xPos += gap;
  }
});

// 标注
ctx.fillStyle = '#ff0000';
ctx.font = '16px Arial';
ctx.fillText('红色: i(35px), l(33px) - 窄字符间距已减少', 50, 280);

// 画边界
const lastChar = chars[chars.length - 1];
const endX = lastChar.x + lastChar.width;
ctx.strokeStyle = '#00ff00';
ctx.strokeRect(startX, 200 - fontSize, endX - startX, fontSize);

ctx.fillStyle = '#00aa00';
ctx.font = '16px Arial';
ctx.fillText(`分割渲染总宽度: ${(endX - startX).toFixed(2)}`, 50, 320);

paper.view.draw();
fs.writeFileSync('./output/video-builder-dynamic-test.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/video-builder-dynamic-test.png');

// 渲染完整视频
console.log('\n=== 渲染完整视频 ===');

const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 30,
});

const track = builder.createTrack({ zIndex: 1 });

track.createScene({ duration: 3, startTime: 0 })
  .addBackground({ color: '#ffffff' })
  .addText({
    text: text,
    x: '50%',
    y: '50%',
    fontSize: fontSize,
    fontFamily: fontFamily,
    color: '#000000',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 3,
    startTime: 0,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.3,
  });

builder.render('./output/fubuilder-dynamic-test.mp4').then(() => {
  console.log('✅ 视频已导出: output/fubuilder-dynamic-test.mp4');
}).catch(err => {
  console.error('❌ 导出失败:', err);
});

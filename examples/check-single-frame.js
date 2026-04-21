/**
 * 渲染单帧检查分割字符位置
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain, VideoBuilder } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';

initDefaultFont();

console.log('=== 渲染单帧检查 ===\n');

// 1. 先用 TextSplitter 打印位置
const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: false,
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log('TextSplitter 位置:');
chars.forEach((c, i) => {
  console.log(`  [${i}] "${c.text}": x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}, nextX=${(c.x + c.width).toFixed(2)}`);
});

// 2. 渲染到 Canvas
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

// 父元素居中位置
const centerX = 960;
const startX = centerX - totalWidth / 2;

ctx.fillStyle = '#333333';
ctx.font = '24px Arial';
ctx.fillText(`startX=${startX.toFixed(2)}, totalWidth=${totalWidth.toFixed(2)}`, 50, 30);

// 逐字符渲染（使用 Paper.js，每个字符单独定位）
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(startX + c.x + c.width / 2, 200));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 4 || i === 5 || i === 6 ? '#ff0000' : '#000000'; // 标记 i, l, d
  charItem.justification = 'center';

  // 画字符边界
  ctx.strokeStyle = '#8800ff';
  ctx.strokeRect(startX + c.x, 200 - fontSize, c.width, fontSize);

  // 画字符中心点
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(startX + c.x + c.width / 2, 200, 5, 0, Math.PI * 2);
  ctx.fill();
});

// 标注字符编号
ctx.font = '16px Arial';
chars.forEach((c, i) => {
  ctx.fillStyle = '#ff0000';
  ctx.fillText(`${i}`, startX + c.x + c.width / 2, 120);
});

paper.view.draw();
fs.writeFileSync('./output/single-frame-check.png', canvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/single-frame-check.png');

// 3. 现在创建 VideoBuilder 来渲染一帧
console.log('\n=== 渲染 VideoBuilder 单帧 ===');

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

// 创建一个 debug hook 来保存第一帧
let frameCount = 0;
const originalRenderFrame = builder.render.bind(builder);

builder.render('./output/video-frame-test.mp4').then(() => {
  console.log('视频已导出');
}).catch(err => {
  console.error('导出失败:', err);
});

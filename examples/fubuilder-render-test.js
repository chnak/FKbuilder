/**
 * 完整渲染测试 - 验证 Fubuilder 分割渲染
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import fs from 'fs';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import { TextSplitter } from '../src/utils/text-splitter.js';
import { VideoBuilder } from '../src/index.js';

initDefaultFont();

console.log('=== 完整渲染测试 ===\n');

// 测试 TextSplitter 的行为
const text = 'Fubuilder';
const fontSize = 120;
const fontFamily = 'PatuaOne';
const fallbackChain = getFontFallbackChain(fontFamily);

console.log(`文本: "${text}"`);
console.log(`字体: ${fontFamily}`);
console.log(`字号: ${fontSize}`);
console.log(`charSpacing: ${fontSize * 0.1}`);

const splitter = new TextSplitter(text, {
  fontSize,
  fontFamily: fallbackChain,
  fontWeight: 'normal',
  fontStyle: 'normal',
  dynamicSpacing: true, // 使用与 TextElement 相同的设置
});

const chars = splitter.getCharacters();
const totalWidth = splitter.getTotalWidth();

console.log(`\ntotalWidth: ${totalWidth.toFixed(2)}`);
console.log('字符位置:');
chars.forEach((c, i) => {
  console.log(`  [${i}] "${c.text}": x=${c.x.toFixed(2)}, width=${c.width.toFixed(2)}`);
});

// Canvas 测量
const canvas = createCanvas(1920, 1080);
paper.setup(canvas);
const ctx = canvas.getContext('2d');
ctx.font = `${fontSize}px "${fontFamily}"`;

const canvasWidth = ctx.measureText(text).width;
console.log(`\nCanvas measureText: ${canvasWidth.toFixed(2)}`);

// 创建可视化
const visCanvas = createCanvas(1920, 400);
paper.setup(visCanvas);
const visCtx = visCanvas.getContext('2d');

visCtx.fillStyle = '#ffffff';
visCtx.fillRect(0, 0, 1920, 400);

// 中心线
visCtx.strokeStyle = '#ff0000';
visCtx.setLineDash([5, 5]);
visCtx.beginPath();
visCtx.moveTo(960, 0);
visCtx.lineTo(960, 400);
visCtx.stroke();
visCtx.setLineDash([]);

// ===== 方法1: Paper.js 居中渲染整个文本 =====
const centerX = 960;
const startX_method1 = centerX - canvasWidth / 2;

const textItem = new paper.PointText(new paper.Point(centerX, 100));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = '#000000';
textItem.justification = 'center';

console.log(`\n方法1 (Paper.js): startX=${startX_method1.toFixed(2)}`);
console.log(`  bounds.x=${textItem.bounds.x.toFixed(2)}`);

visCtx.strokeStyle = '#0066ff';
visCtx.strokeRect(textItem.bounds.x, textItem.bounds.y, textItem.bounds.width, textItem.bounds.height);

visCtx.fillStyle = '#333333';
visCtx.font = '20px Arial';
visCtx.fillText('方法1: Paper.js 居中渲染 (justification="center")', 100, 30);
visCtx.fillText(`startX=${startX_method1.toFixed(2)}, canvasWidth=${canvasWidth.toFixed(2)}`, 100, 55);

// ===== 方法2: TextSplitter 分割渲染 =====
const startX_method2 = centerX - totalWidth / 2;

visCtx.fillStyle = '#333333';
visCtx.font = '20px Arial';
visCtx.fillText('方法2: TextSplitter 分割渲染 (手动定位每个字符)', 100, 180);

let xPos = startX_method2;
chars.forEach((c, i) => {
  const charItem = new paper.PointText(new paper.Point(xPos, 250));
  charItem.content = c.text;
  charItem.fontSize = fontSize;
  charItem.fontFamily = fontFamily;
  charItem.fillColor = i === 0 ? '#ff0000' : '#000000';
  charItem.justification = 'left';

  visCtx.strokeStyle = '#ff8800';
  visCtx.strokeRect(xPos, 250 - fontSize, c.width, fontSize + 10);

  xPos += c.width + splitter.options.charSpacing;
});

console.log(`\n方法2 (TextSplitter): startX=${startX_method2.toFixed(2)}`);

// 画方法2的总宽度
visCtx.strokeStyle = '#00ff00';
visCtx.strokeRect(startX_method2, 270, totalWidth, 40);
visCtx.fillStyle = '#00aa00';
visCtx.fillText(`TextSplitter totalWidth=${totalWidth.toFixed(2)}`, startX_method2, 330);

// ===== 对比 =====
visCtx.fillStyle = '#333333';
visCtx.fillText('对比:', 100, 370);
visCtx.fillText(`方法1 startX: ${startX_method1.toFixed(2)}`, 200, 370);
visCtx.fillText(`方法2 startX: ${startX_method2.toFixed(2)}`, 500, 370);
visCtx.fillText(`差异: ${Math.abs(startX_method1 - startX_method2).toFixed(2)}`, 800, 370);

paper.view.draw();
fs.writeFileSync('./output/fubuilder-render-test.png', visCanvas.toBuffer('image/png'));
console.log('\n图片已保存到: output/fubuilder-render-test.png');

// ===== 实际 VideoBuilder 渲染测试 =====
console.log('\n=== 实际 VideoBuilder 渲染测试 ===');

const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 30,
});

const track = builder.createTrack({ zIndex: 1 });

// 测试用 TextSplitter 分割
const scene = track.createScene({ duration: 3, startTime: 0 })
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
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
  });

const outputPath = './output/fubuilder-split-test.mp4';
builder.render(outputPath).then(() => {
  console.log(`\n✅ 视频已导出: ${outputPath}`);
}).catch(err => {
  console.error('❌ 导出失败:', err);
});

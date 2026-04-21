/**
 * 简单字符位置测试 - 直接渲染到 canvas 检查
 */
import { createCanvas } from 'canvas';
import paper from 'paper';
import { initDefaultFont, getFontFallbackChain } from '../src/index.js';
import fs from 'fs';

initDefaultFont();

// 设置 Paper.js
const canvas = createCanvas(1920, 200);
paper.setup(canvas);

console.log('=== 简单字符位置测试 ===\n');

// 测试文本
const text = 'AB';
const fontSize = 100;
const fontFamily = 'Arial';

// 应用字体回退链
const fallbackChain = getFontFallbackChain(fontFamily);
console.log(`字体回退链: ${fallbackChain}`);

// 测量文本
const ctx = canvas.getContext('2d');
ctx.font = `${fontSize}px "${fontFamily}"`;
const metrics = ctx.measureText(text);
console.log(`测量文本 "${text}": width=${metrics.width}`);

// 测量单个字符
const charA = ctx.measureText('A');
const charB = ctx.measureText('B');
console.log(`A: width=${charA.width}`);
console.log(`B: width=${charB.width}`);

// 使用 Paper.js 创建文本
const textItem = new paper.PointText(new paper.Point(100, 100));
textItem.content = text;
textItem.fontSize = fontSize;
textItem.fontFamily = fontFamily;
textItem.fillColor = 'black';

console.log(`\nPaper.js 测量结果:`);
console.log(`  content: "${textItem.content}"`);
console.log(`  fontFamily: "${textItem.fontFamily}"`);
console.log(`  fontSize: ${textItem.fontSize}`);
console.log(`  bounds: ${JSON.stringify(textItem.bounds)}`);

// 渲染
paper.view.draw();
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./output/simple-char-test.png', buffer);
console.log(`\n图片已保存到: output/simple-char-test.png`);

// 测试居中放置
console.log(`\n=== 居中测试 ===`);
const centerX = 960;
const textWidth = metrics.width;
const startX = centerX - textWidth / 2;
console.log(`中心: ${centerX}, 文本宽度: ${textWidth}, 起点: ${startX}`);

// A 的位置
const aWidth = charA.width;
const aCenterX = startX + aWidth / 2;
console.log(`A 中心位置: ${aCenterX}`);

// B 的位置
const bStartX = startX + aWidth;
const bCenterX = bStartX + charB.width / 2;
console.log(`B 起始: ${bStartX}, B 中心: ${bCenterX}`);

// A 和 B 之间的距离
console.log(`A 和 B 中心距离: ${bCenterX - aCenterX}`);
console.log(`A 和 B 边缘距离: ${bStartX - (startX + aWidth)}`);

// 创建视觉化图片
const visCanvas = createCanvas(1920, 300);
const visCtx = visCanvas.getContext('2d');
visCtx.fillStyle = '#ffffff';
visCtx.fillRect(0, 0, 1920, 300);

// 画中心线
visCtx.strokeStyle = '#ff0000';
visCtx.setLineDash([5, 5]);
visCtx.beginPath();
visCtx.moveTo(centerX, 0);
visCtx.lineTo(centerX, 300);
visCtx.stroke();

// 画文本
visCtx.font = `${fontSize}px "${fontFamily}"`;
visCtx.fillStyle = '#000000';
visCtx.fillText(text, startX, 150);

// 画标记
visCtx.fillStyle = '#ff0000';
visCtx.fillRect(startX - 2, 140, 4, 20);  // 文本起点
visCtx.fillRect(bStartX - 2, 140, 4, 20);  // B 起点

// A 的中心
visCtx.fillStyle = '#00ff00';
visCtx.beginPath();
visCtx.arc(aCenterX, 150, 5, 0, Math.PI * 2);
visCtx.fill();

// B 的中心
visCtx.fillStyle = '#0000ff';
visCtx.beginPath();
visCtx.arc(bCenterX, 150, 5, 0, Math.PI * 2);
visCtx.fill();

fs.writeFileSync('./output/simple-char-vis.png', visCanvas.toBuffer('image/png'));
console.log(`\n可视化图片已保存到: output/simple-char-vis.png`);

console.log('\n=== 测试完成 ===');

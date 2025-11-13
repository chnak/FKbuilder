/**
 * 测试 SpriteJS 是否能在 Node.js 环境下正常工作
 */
import { Composition, TextElement, RectElement, CircleElement } from './src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSpriteJS() {
  console.log('创建测试合成...');
  
  // 创建合成
  const composition = new Composition({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 1,
    backgroundColor: '#1a1a1a',
  });

  // 创建元素图层
  const layer = composition.createElementLayer();

  // 测试1: 矩形元素（应该能用 SpriteJS 渲染）
  console.log('添加矩形元素...');
  const rectElement = new RectElement({
    x: 400,
    y: 300,
    width: 300,
    height: 200,
    bgcolor: '#ff0000', // 红色矩形
    borderRadius: 10,
  });
  layer.addElement(rectElement);

  // 测试2: 圆形元素（应该能用 SpriteJS 渲染）
  console.log('添加圆形元素...');
  const circleElement = new CircleElement({
    x: 800,
    y: 300,
    radius: 100,
    bgcolor: '#00ff00', // 绿色圆形
  });
  layer.addElement(circleElement);

  // 测试3: 文本元素（不使用分割，测试 SpriteJS Label）
  console.log('添加文本元素...');
  const textElement = new TextElement({
    text: 'Hello SpriteJS!',
    x: 960,
    y: 600,
    fontSize: 64,
    fontFamily: 'Arial',
    color: '#ffffff',
    textAlign: 'center',
    // 不设置 width 和 height，让 SpriteJS 自动计算
  });
  layer.addElement(textElement);

  // 测试渲染第一帧
  console.log('测试渲染第一帧（使用 SpriteJS）...');
  
  // 确保渲染器已初始化
  if (!composition.renderer.initialized) {
    await composition.renderer.init();
  }

  // 渲染一帧
  const canvas = await composition.renderer.renderFrame(
    composition.getLayers(),
    0,
    composition.backgroundColor
  );

  // 保存截图
  const outputDir = path.join(__dirname, 'output');
  await fs.ensureDir(outputDir);
  const screenshotPath = path.join(outputDir, 'spritejs-test.png');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(screenshotPath, buffer);
  
  console.log(`截图已保存: ${screenshotPath}`);
  console.log(`文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
  
  // 检查是否有内容（文件大小应该大于几KB）
  if (buffer.length < 5000) {
    console.warn('⚠️  警告: 截图文件很小，可能没有正确渲染内容');
  } else {
    console.log('✅ 截图文件大小正常，应该包含内容');
  }

  // 也测试一下 Canvas 2D 直接渲染
  console.log('\n测试 Canvas 2D 直接渲染...');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(1200, 300, 200, 200);
  ctx.fillStyle = '#ffffff';
  ctx.font = '48px Arial';
  ctx.fillText('Canvas 2D', 1200, 600);
  
  const canvas2dPath = path.join(outputDir, 'canvas2d-test.png');
  const buffer2d = canvas.toBuffer('image/png');
  await fs.writeFile(canvas2dPath, buffer2d);
  console.log(`Canvas 2D 测试截图已保存: ${canvas2dPath}`);

  composition.destroy();
  console.log('\n测试完成！');
}

testSpriteJS().catch(console.error);


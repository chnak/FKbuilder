/**
 * 测试元素尺寸和位置
 */
import { Composition, TextElement, RectElement } from './src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSize() {
  console.log('创建测试合成...');
  
  const composition = new Composition({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 1,
    backgroundColor: '#000000',
  });

  const layer = composition.createElementLayer();

  // 测试1: 矩形 - 明确指定尺寸
  console.log('添加矩形元素 (400x300)...');
  const rect1 = new RectElement({
    x: 200,
    y: 200,
    width: 400,
    height: 300,
    bgcolor: '#ff0000',
  });
  layer.addElement(rect1);

  // 测试2: 文本 - 检查尺寸
  console.log('添加文本元素...');
  const text1 = new TextElement({
    text: '测试文本',
    x: 960,
    y: 540,
    fontSize: 64,
    fontFamily: 'Arial',
    color: '#ffffff',
    textAlign: 'center',
    width: 1920,  // 明确指定宽度
    height: 100,  // 明确指定高度
  });
  
  // 检查文本元素的状态
  const state = text1.getStateAtTime(0, { width: 1920, height: 1080 });
  console.log('文本元素状态:', {
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    fontSize: state.fontSize,
  });
  
  layer.addElement(text1);

  // 测试3: 小矩形 - 测试位置
  const rect2 = new RectElement({
    x: 1600,
    y: 200,
    width: 200,
    height: 200,
    bgcolor: '#00ff00',
  });
  layer.addElement(rect2);

  // 渲染并保存
  if (!composition.renderer.initialized) {
    await composition.renderer.init();
  }

  const canvas = await composition.renderer.renderFrame(
    composition.getLayers(),
    0,
    composition.backgroundColor
  );

  const outputDir = path.join(__dirname, 'output');
  await fs.ensureDir(outputDir);
  const screenshotPath = path.join(outputDir, 'size-debug.png');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(screenshotPath, buffer);
  
  console.log(`\n截图已保存: ${screenshotPath}`);
  console.log(`文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
  console.log(`Canvas 尺寸: ${canvas.width}x${canvas.height}`);

  composition.destroy();
}

testSize().catch(console.error);



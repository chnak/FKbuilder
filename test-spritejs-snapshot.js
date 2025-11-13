/**
 * 测试 SpriteJS snapshot 的正确用法
 */
import { Composition, TextElement, RectElement } from './src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSnapshot() {
  console.log('创建测试合成...');
  
  const composition = new Composition({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 1,
    backgroundColor: '#000000',
  });

  const layer = composition.createElementLayer();

  // 添加矩形
  const rect = new RectElement({
    x: 400,
    y: 300,
    width: 300,
    height: 200,
    bgcolor: '#ff0000',
  });
  layer.addElement(rect);

  // 添加文本（不使用分割）
  const text = new TextElement({
    text: 'Hello SpriteJS!',
    x: 960,
    y: 600,
    fontSize: 64,
    fontFamily: 'Arial',
    color: '#ffffff',
    textAlign: 'center',
    // 不设置 width 和 height，让 SpriteJS 自动计算
  });
  layer.addElement(text);

  // 初始化渲染器
  if (!composition.renderer.initialized) {
    await composition.renderer.init();
  }

  console.log('渲染第一帧...');
  const canvas = await composition.renderer.renderFrame(
    composition.getLayers(),
    0,
    composition.backgroundColor
  );

  // 保存截图
  const outputDir = path.join(__dirname, 'output');
  await fs.ensureDir(outputDir);
  const screenshotPath = path.join(outputDir, 'snapshot-test.png');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(screenshotPath, buffer);
  
  console.log(`截图已保存: ${screenshotPath}`);
  console.log(`文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
  console.log(`Canvas 尺寸: ${canvas.width}x${canvas.height}`);

  composition.destroy();
  console.log('测试完成！');
}

testSnapshot().catch(console.error);



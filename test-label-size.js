/**
 * 测试 SpriteJS Label 的 size 属性
 */
import spritejs from 'spritejs';
import { createCanvas } from 'canvas';

const { Scene, Label } = spritejs;

// 创建 Canvas
const canvas = createCanvas(1920, 1080);
const container = {
  clientWidth: 1920,
  clientHeight: 1080,
  offsetWidth: 1920,
  offsetHeight: 1080,
  appendChild: () => {},
  removeChild: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    width: 1920,
    height: 1080,
  }),
  style: {
    position: 'relative',
    width: '1920px',
    height: '1080px',
  },
};

const scene = new Scene({
  container: container,
  width: 1920,
  height: 1080,
  canvas: canvas,
});

const layer = scene.layer();

// 测试1: 不设置 size
console.log('测试1: 不设置 size');
try {
  const label1 = new Label({
    text: '测试文本1',
    pos: [960, 200],
    font: '64px Arial',
    color: '#ffffff',
    textAlign: 'center',
  });
  layer.appendChild(label1);
  console.log('✅ Label1 创建成功');
} catch (error) {
  console.error('❌ Label1 创建失败:', error.message);
}

// 测试2: 设置 size
console.log('\n测试2: 设置 size [1920, 100]');
try {
  const label2 = new Label({
    text: '测试文本2',
    pos: [960, 400],
    size: [1920, 100],
    font: '64px Arial',
    color: '#ffffff',
    textAlign: 'center',
  });
  layer.appendChild(label2);
  console.log('✅ Label2 创建成功');
} catch (error) {
  console.error('❌ Label2 创建失败:', error.message);
}

// 测试3: 设置较小的 size
console.log('\n测试3: 设置 size [400, 100]');
try {
  const label3 = new Label({
    text: '测试文本3',
    pos: [960, 600],
    size: [400, 100],
    font: '64px Arial',
    color: '#ffffff',
    textAlign: 'center',
  });
  layer.appendChild(label3);
  console.log('✅ Label3 创建成功');
} catch (error) {
  console.error('❌ Label3 创建失败:', error.message);
}

// 渲染
try {
  await scene.snapshot();
  console.log('\n✅ Snapshot 成功');
  
  // 保存截图
  const fs = await import('fs-extra');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const outputPath = path.join(__dirname, 'output', 'label-size-test.png');
  await fs.ensureDir(path.dirname(outputPath));
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
  console.log(`截图已保存: ${outputPath}`);
} catch (error) {
  console.error('❌ Snapshot 失败:', error.message);
}



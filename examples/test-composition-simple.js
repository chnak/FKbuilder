import { VideoMaker } from '../src/core/VideoMaker.js';
import { CompositionElement } from '../src/elements/CompositionElement.js';
import fs from 'fs-extra';

/**
 * 最简单的 Composition 测试 - 只测试一个矩形
 */
async function testCompositionSimple() {
  console.log('=== 测试 1: 最简单的 Composition（只有一个矩形）===');
  
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 2,
    backgroundColor: '#000000',
  });
  
  const layer = videoMaker.createElementLayer();
  
  // 创建 Composition 元素（只包含一个矩形）
  const composition = new CompositionElement({
    x: '50%',
    y: '50%',
    width: 400,
    height: 300,
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 2,
    zIndex: 1,
    // 子元素配置
    elements: [
      {
        type: 'rect',
        x: '50%', // 相对于 Composition 的中心
        y: '50%',
        width: 400,
        height: 300,
        fillColor: '#ff0000', // 红色，容易看到
        strokeColor: '#00ff00', // 绿色边框
        strokeWidth: 5,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 2,
        zIndex: 0,
      },
    ],
  });
  
  layer.addElement(composition);
  
  // 先测试渲染第一帧，保存为图片
  console.log('初始化 renderer...');
  await videoMaker.renderer.init();
  
  console.log('渲染第一帧...');
  const canvas = await videoMaker.renderer.renderFrame(
    videoMaker.timeline.getLayers(),
    0,
    videoMaker.backgroundColor
  );
  
  // 检查 canvas 内容
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let redPixels = 0;
  let greenPixels = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    if (a > 0) {
      if (r > 200 && g < 50 && b < 50) {
        redPixels++; // 红色像素
      }
      if (g > 200 && r < 50 && b < 50) {
        greenPixels++; // 绿色像素
      }
    }
  }
  
  console.log(`Canvas 尺寸: ${canvas.width}x${canvas.height}`);
  console.log(`红色像素数: ${redPixels}`);
  console.log(`绿色像素数: ${greenPixels}`);
  
  // 保存第一帧为图片
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-composition-simple-frame0.png', buffer);
  console.log('第一帧已保存: output/test-composition-simple-frame0.png');
  
  // 导出视频
  console.log('导出视频...');
  await videoMaker.export('output/test-composition-simple.mp4');
  console.log('完成');
  
  videoMaker.destroy();
}

testCompositionSimple().catch(console.error);


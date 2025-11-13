import { VideoMaker } from '../src/core/VideoMaker.js';
import { CompositionElement } from '../src/elements/CompositionElement.js';
import fs from 'fs-extra';

/**
 * 调试 Composition - 保存临时 canvas
 */
async function testCompositionDebug() {
  console.log('=== 调试 Composition ===');
  
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 1,
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
    duration: 1,
    zIndex: 1,
    elements: [
      {
        type: 'rect',
        x: '50%',
        y: '50%',
        width: 400,
        height: 300,
        fillColor: '#ff0000',
        strokeColor: '#00ff00',
        strokeWidth: 5,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 1,
        zIndex: 0,
      },
    ],
  });
  
  layer.addElement(composition);
  
  // 初始化
  await videoMaker.renderer.init();
  await composition.initialize();
  
  // 手动调用 render 方法，检查临时 canvas
  console.log('检查临时 canvas...');
  const tempCanvas = await composition.tempComposition.renderer.renderFrame(
    composition.tempComposition.timeline.getLayers(),
    0,
    'transparent'
  );
  
  if (tempCanvas) {
    // 检查临时 canvas 内容
    const ctx = tempCanvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let redPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      if (a > 0 && r > 200 && g < 50 && b < 50) {
        redPixels++;
      }
    }
    console.log(`临时 canvas 尺寸: ${tempCanvas.width}x${tempCanvas.height}`);
    console.log(`临时 canvas 红色像素数: ${redPixels}`);
    
    // 保存临时 canvas
    await fs.ensureDir('output');
    const tempBuffer = tempCanvas.toBuffer('image/png');
    await fs.writeFile('output/test-composition-temp-canvas.png', tempBuffer);
    console.log('临时 canvas 已保存: output/test-composition-temp-canvas.png');
  }
  
  // 渲染第一帧
  console.log('渲染第一帧...');
  const canvas = await videoMaker.renderer.renderFrame(
    videoMaker.timeline.getLayers(),
    0,
    videoMaker.backgroundColor
  );
  
  // 检查最终 canvas
  const finalCtx = canvas.getContext('2d');
  const finalImageData = finalCtx.getImageData(0, 0, canvas.width, canvas.height);
  let redPixelsFinal = 0;
  for (let i = 0; i < finalImageData.data.length; i += 4) {
    const r = finalImageData.data[i];
    const g = finalImageData.data[i + 1];
    const b = finalImageData.data[i + 2];
    const a = finalImageData.data[i + 3];
    if (a > 0 && r > 200 && g < 50 && b < 50) {
      redPixelsFinal++;
    }
  }
  console.log(`最终 canvas 尺寸: ${canvas.width}x${canvas.height}`);
  console.log(`最终 canvas 红色像素数: ${redPixelsFinal}`);
  
  // 保存最终 canvas
  const finalBuffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-composition-final-canvas.png', finalBuffer);
  console.log('最终 canvas 已保存: output/test-composition-final-canvas.png');
  
  videoMaker.destroy();
}

testCompositionDebug().catch(console.error);


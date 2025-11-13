import { VideoMaker } from '../src/core/VideoMaker.js';
import { CompositionElement } from '../src/elements/CompositionElement.js';
import fs from 'fs-extra';

/**
 * 测试嵌套 CompositionElement（类似 VideoBuilder 的结构）
 */
async function testCompositionNestedSimple() {
  console.log('=== 测试嵌套 CompositionElement ===');
  
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 5,
    backgroundColor: '#000000',
  });
  
  const layer = videoMaker.createElementLayer();
  
  // 外层 Composition（类似 Track）
  const outerComposition = new CompositionElement({
    x: '50%',
    y: '50%',
    width: 1920,
    height: 1080,
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 5,
    zIndex: 0,
    elements: [
      // 内层 Composition（类似 Scene）
      {
        type: 'composition',
        x: '50%',
        y: '50%',
        width: 1920,
        height: 1080,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 5,
        zIndex: 0,
        elements: [
          // 背景
          {
            type: 'rect',
            x: '50%',
            y: '50%',
            width: 1920,
            height: 1080,
            bgcolor: '#000000',
            anchor: [0.5, 0.5],
            startTime: 0,
            duration: 5,
            zIndex: -9999,
          },
          // 文本
          {
            type: 'text',
            text: '测试文本',
            color: '#ffffff',
            fontSize: 48,
            x: '50%',
            y: '50%',
            textAlign: 'center',
            startTime: 0,
            duration: 5,
            zIndex: 0,
          },
        ],
      },
    ],
  });
  
  layer.addElement(outerComposition);
  
  // 测试渲染第一帧
  console.log('渲染第一帧...');
  await videoMaker.renderer.init();
  const canvas = await videoMaker.renderer.renderFrame(
    videoMaker.timeline.getLayers(),
    1, // 渲染第1秒
    videoMaker.backgroundColor
  );
  
  // 检查 canvas 内容
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let hasContent = false;
  let pixelCount = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] > 0 && 
        (imageData.data[i] > 10 || imageData.data[i + 1] > 10 || imageData.data[i + 2] > 10)) {
      hasContent = true;
      pixelCount++;
    }
  }
  
  console.log(`Canvas 有内容: ${hasContent}, 像素数: ${pixelCount}`);
  
  // 保存第一帧
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-composition-nested-simple.png', buffer);
  console.log('第一帧已保存: output/test-composition-nested-simple.png');
  
  // 导出视频
  console.log('\n导出视频...');
  await videoMaker.export('output/test-composition-nested-simple.mp4');
  console.log('完成');
  
  videoMaker.destroy();
}

testCompositionNestedSimple().catch(console.error);


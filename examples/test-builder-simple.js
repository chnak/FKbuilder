import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';

/**
 * 测试简单的 VideoBuilder
 */
async function testBuilderSimple() {
  console.log('=== 测试简单的 VideoBuilder ===');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground({color: '#cccccc',duration: 5 })
    .addText({
      text: "测试文本",
      color: "#000000", // 改为黑色，在灰色背景上更明显
      fontSize: 48,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
      zIndex: 1, // 确保文本在背景之上
    });

  // 构建 VideoMaker
  const videoMaker = builder.build();
  
  console.log('检查结构:');
  console.log(`  主合成图层数: ${videoMaker.timeline.getLayers().length}`);
  
  for (const layer of videoMaker.timeline.getLayers()) {
    console.log(`    图层: ${layer.type}, zIndex: ${layer.zIndex}`);
    if (layer.elements) {
      console.log(`      元素数: ${layer.elements.length}`);
      for (const element of layer.elements) {
        console.log(`        元素: ${element.type}, startTime: ${element.startTime}, duration: ${element.duration}`);
        if (element.type === 'composition' && element.elementsConfig) {
          console.log(`          子元素数: ${element.elementsConfig.length}`);
        }
      }
    }
  }
  
  // 测试渲染第一帧
  console.log('\n渲染第一帧...');
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
  await fs.writeFile('output/test-builder-simple.png', buffer);
  console.log('第一帧已保存: output/test-builder-simple.png');
  
  // 导出视频
  console.log('\n导出视频...');
  await builder.export('output/test-builder-simple.mp4');
  console.log('完成');
  
  videoMaker.destroy();
}

testBuilderSimple().catch(console.error);


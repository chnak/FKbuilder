import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';

/**
 * 调试 VideoBuilder 的文本渲染问题
 */
async function testBuilderDebug() {
  console.log('=== 调试 VideoBuilder 文本渲染 ===');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground({color: '#cccccc'})
    .addText({
      text: "测试文本",
      color: "#000000",
      fontSize: 48,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
      zIndex: 1,
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
          for (const subElementConfig of element.elementsConfig) {
            console.log(`            子元素: ${subElementConfig.type}, zIndex: ${subElementConfig.zIndex}`);
            if (subElementConfig.type === 'composition' && subElementConfig.elements) {
              console.log(`              子子元素数: ${subElementConfig.elements.length}`);
              for (const subSubElementConfig of subElementConfig.elements) {
                console.log(`                子子元素: ${subSubElementConfig.type}, zIndex: ${subSubElementConfig.zIndex}, text: ${subSubElementConfig.text || 'N/A'}`);
              }
            }
          }
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
  let grayPixels = 0; // 灰色背景像素
  let blackPixels = 0; // 黑色文本像素
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    if (a > 0) {
      hasContent = true;
      pixelCount++;
      // 检查灰色背景（#cccccc = rgb(204, 204, 204)）
      if (r > 200 && r < 210 && g > 200 && g < 210 && b > 200 && b < 210) {
        grayPixels++;
      }
      // 检查黑色文本（#000000 = rgb(0, 0, 0)）
      if (r < 10 && g < 10 && b < 10) {
        blackPixels++;
      }
    }
  }
  
  console.log(`Canvas 有内容: ${hasContent}, 总像素数: ${pixelCount}`);
  console.log(`灰色背景像素数: ${grayPixels}`);
  console.log(`黑色文本像素数: ${blackPixels}`);
  
  // 保存第一帧
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-builder-debug.png', buffer);
  console.log('第一帧已保存: output/test-builder-debug.png');
  
  videoMaker.destroy();
}

testBuilderDebug().catch(console.error);


import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';

/**
 * 调试 app.js 的问题
 */
async function testAppDebug() {
  console.log('=== 调试 app.js ===');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: '#000000',
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground()
    .addText({
      text: "测试文本",
      color: "#ffffff",
      fontSize: 48,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
    });

  // 构建 VideoMaker
  const videoMaker = builder.build();
  
  console.log('检查结构:');
  console.log(`  主合成图层数: ${videoMaker.timeline.getLayers().length}`);
  
  for (const layer of videoMaker.timeline.getLayers()) {
    console.log(`    图层: ${layer.type}, zIndex: ${layer.zIndex}`);
    if (layer.type === 'composition' && layer.composition) {
      console.log(`      嵌套合成（Track）图层数: ${layer.composition.timeline.getLayers().length}`);
      for (const trackLayer of layer.composition.timeline.getLayers()) {
        console.log(`        嵌套图层: ${trackLayer.type}, zIndex: ${trackLayer.zIndex}`);
        if (trackLayer.type === 'composition' && trackLayer.composition) {
          console.log(`          嵌套合成（Scene）图层数: ${trackLayer.composition.timeline.getLayers().length}`);
          for (const sceneLayer of trackLayer.composition.timeline.getLayers()) {
            console.log(`            场景图层: ${sceneLayer.type}, zIndex: ${sceneLayer.zIndex}`);
            if (sceneLayer.elements) {
              console.log(`              场景图层元素数: ${sceneLayer.elements.length}`);
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
  await fs.writeFile('output/test-app-debug.png', buffer);
  console.log('第一帧已保存: output/test-app-debug.png');
  
  videoMaker.destroy();
}

testAppDebug().catch(console.error);


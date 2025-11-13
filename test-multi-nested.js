// 测试多层嵌套合成
import { VideoBuilder } from './src/index.js';
import fs from 'fs-extra';

const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 30,
  backgroundColor: '#000000',
});

const mainTrack = builder.createTrack({ zIndex: 1 });
const scene = mainTrack.createScene({ duration: 3 })
  .addBackground()
  .addText({
    text: "测试文本",
    color: "#ffffff",
    fontSize: 64,
    x: "50%",
    y: "50%",
    textAlign: "center",
    duration: 3,
    startTime: 0,
  });

async function test() {
  console.log('构建 VideoMaker...');
  const videoMaker = builder.build();
  
  console.log('检查结构:');
  console.log('主合成图层数:', videoMaker.timeline.getLayers().length);
  
  for (const layer of videoMaker.timeline.getLayers()) {
    console.log('  图层类型:', layer.type, '元素数:', layer.elements ? layer.elements.length : 0);
    if (layer.elements) {
      for (const element of layer.elements) {
        console.log('    元素类型:', element.type);
        if (element.type === 'composition' && element.composition) {
          console.log('      嵌套层级1 - Track合成');
          const trackLayers = element.composition.timeline.getLayers();
          console.log('        图层数:', trackLayers.length);
          for (const trackLayer of trackLayers) {
            console.log('          图层类型:', trackLayer.type, '元素数:', trackLayer.elements ? trackLayer.elements.length : 0);
            if (trackLayer.elements) {
              for (const trackElement of trackLayer.elements) {
                console.log('            元素类型:', trackElement.type);
                if (trackElement.type === 'composition' && trackElement.composition) {
                  console.log('              嵌套层级2 - Scene合成');
                  const sceneLayers = trackElement.composition.timeline.getLayers();
                  console.log('                图层数:', sceneLayers.length);
                  for (const sceneLayer of sceneLayers) {
                    console.log('                  图层类型:', sceneLayer.type, '元素数:', sceneLayer.elements ? sceneLayer.elements.length : 0);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // 渲染第一帧
  console.log('\n渲染第一帧...');
  await videoMaker.renderer.init();
  const canvas = await videoMaker.renderer.renderFrame(
    videoMaker.timeline.getLayers(),
    0,
    videoMaker.backgroundColor
  );
  
  // 检查内容
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, 100, 100);
  let hasContent = false;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] > 0 && 
        (imageData.data[i] > 50 || imageData.data[i + 1] > 50 || imageData.data[i + 2] > 50)) {
      hasContent = true;
      break;
    }
  }
  console.log('Canvas 有内容:', hasContent);
  
  // 保存图片
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-multi-nested.png', buffer);
  console.log('图片已保存');
}

test().catch(console.error);


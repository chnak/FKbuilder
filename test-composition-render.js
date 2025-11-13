// 测试嵌套合成的渲染
import { VideoMaker } from './src/core/VideoMaker.js';
import { CompositionElement } from './src/elements/CompositionElement.js';
import { TextElement } from './src/elements/TextElement.js';
import fs from 'fs-extra';

async function test() {
  // 创建嵌套合成
  const nestedVideo = new VideoMaker({
    width: 800,
    height: 600,
    fps: 30,
    duration: 3,
    backgroundColor: '#333333',
  });

  const nestedLayer = nestedVideo.createElementLayer({ zIndex: 1 });
  const nestedText = new TextElement({
    text: "嵌套合成文本",
    color: "#ffffff",
    fontSize: 64,
    x: "50%",
    y: "50%",
    textAlign: "center",
    duration: 3,
    startTime: 0,
  });
  nestedLayer.addElement(nestedText);

  // 创建主合成
  const mainVideo = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 3,
    backgroundColor: '#000000',
  });

  const mainLayer = mainVideo.createElementLayer({ zIndex: 1 });
  const compositionElement = new CompositionElement({
    composition: nestedVideo,
    x: '50%',
    y: '50%',
    width: 800,
    height: 600,
    duration: 3,
    startTime: 0,
    anchor: [0.5, 0.5],
  });
  mainLayer.addElement(compositionElement);

  // 先测试嵌套合成单独渲染
  console.log('测试嵌套合成单独渲染...');
  await nestedVideo.renderer.init();
  const nestedCanvas = await nestedVideo.renderer.renderFrame(
    nestedVideo.timeline.getLayers(),
    0,
    nestedVideo.backgroundColor
  );
  
  // 检查嵌套 canvas 内容
  const nestedCtx = nestedCanvas.getContext('2d');
  const nestedImageData = nestedCtx.getImageData(0, 0, 100, 100);
  let nestedHasContent = false;
  for (let i = 0; i < nestedImageData.data.length; i += 4) {
    if (nestedImageData.data[i + 3] > 0 && 
        (nestedImageData.data[i] > 50 || nestedImageData.data[i + 1] > 50 || nestedImageData.data[i + 2] > 50)) {
      nestedHasContent = true;
      break;
    }
  }
  console.log('嵌套 Canvas 有内容:', nestedHasContent);
  
  // 保存嵌套合成图片
  await fs.ensureDir('output');
  const nestedBuffer = nestedCanvas.toBuffer('image/png');
  await fs.writeFile('output/test-nested-composition.png', nestedBuffer);
  console.log('嵌套合成图片已保存');

  // 测试主合成渲染
  console.log('测试主合成渲染...');
  await mainVideo.renderer.init();
  const mainCanvas = await mainVideo.renderer.renderFrame(
    mainVideo.timeline.getLayers(),
    0,
    mainVideo.backgroundColor
  );
  
  // 检查主 canvas 内容
  const mainCtx = mainCanvas.getContext('2d');
  const mainImageData = mainCtx.getImageData(0, 0, 100, 100);
  let mainHasContent = false;
  for (let i = 0; i < mainImageData.data.length; i += 4) {
    if (mainImageData.data[i + 3] > 0 && 
        (mainImageData.data[i] > 50 || mainImageData.data[i + 1] > 50 || mainImageData.data[i + 2] > 50)) {
      mainHasContent = true;
      break;
    }
  }
  console.log('主 Canvas 有内容:', mainHasContent);
  
  // 保存主合成图片
  const mainBuffer = mainCanvas.toBuffer('image/png');
  await fs.writeFile('output/test-main-composition.png', mainBuffer);
  console.log('主合成图片已保存');
}

test().catch(console.error);


// 检查嵌套合成渲染时 canvas 的内容
import { VideoMaker } from './src/core/VideoMaker.js';
import { TextElement } from './src/elements/TextElement.js';
import fs from 'fs-extra';

async function test() {
  const video = new VideoMaker({
    width: 800,
    height: 600,
    fps: 30,
    duration: 3,
    backgroundColor: '#333333',
  });

  const layer = video.createElementLayer({ zIndex: 1 });
  const text = new TextElement({
    text: "测试文本",
    color: "#ffffff",
    fontSize: 64,
    x: "50%",
    y: "50%",
    textAlign: "center",
    duration: 3,
    startTime: 0,
  });
  layer.addElement(text);

  // 第一次渲染
  console.log('第一次渲染...');
  await video.renderer.init();
  const canvas1 = await video.renderer.renderFrame(
    video.timeline.getLayers(),
    0,
    video.backgroundColor
  );
  
  // 检查内容
  const ctx1 = canvas1.getContext('2d');
  const imageData1 = ctx1.getImageData(0, 0, 100, 100);
  let hasContent1 = false;
  for (let i = 0; i < imageData1.data.length; i += 4) {
    if (imageData1.data[i + 3] > 0 && 
        (imageData1.data[i] > 50 || imageData1.data[i + 1] > 50 || imageData1.data[i + 2] > 50)) {
      hasContent1 = true;
      break;
    }
  }
  console.log('第一次渲染有内容:', hasContent1);
  await fs.writeFile('output/test-render1.png', canvas1.toBuffer('image/png'));

  // 第二次渲染（模拟嵌套合成的情况）
  console.log('第二次渲染（重新 setup）...');
  // 模拟父合成重新 setup
  const { createCanvas } = await import('canvas');
  const tempCanvas = createCanvas(1920, 1080);
  const paper = (await import('paper-jsdom-canvas')).default;
  paper.setup(tempCanvas);
  
  // 再次渲染
  const canvas2 = await video.renderer.renderFrame(
    video.timeline.getLayers(),
    0,
    video.backgroundColor
  );
  
  // 检查内容
  const ctx2 = canvas2.getContext('2d');
  const imageData2 = ctx2.getImageData(0, 0, 100, 100);
  let hasContent2 = false;
  for (let i = 0; i < imageData2.data.length; i += 4) {
    if (imageData2.data[i + 3] > 0 && 
        (imageData2.data[i] > 50 || imageData2.data[i + 1] > 50 || imageData2.data[i + 2] > 50)) {
      hasContent2 = true;
      break;
    }
  }
  console.log('第二次渲染有内容:', hasContent2);
  await fs.writeFile('output/test-render2.png', canvas2.toBuffer('image/png'));
}

test().catch(console.error);


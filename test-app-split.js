// 测试分割文本
import { VideoMaker } from './src/core/VideoMaker.js';
import { TextElement } from './src/elements/TextElement.js';
import fs from 'fs-extra';

async function test() {
  const video = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 3,
    backgroundColor: '#000000',
  });

  const layer = video.createElementLayer({ zIndex: 1 });
  
  // 添加分割文本
  const text = new TextElement({
    text: "测试文本",
    color: "#ffffff",
    fontSize: 64,
    x: "50%",
    y: "50%",
    textAlign: "center",
    duration: 3,
    startTime: 0,
    split: "letter",
    splitDelay: 0.1,
    splitDuration: 0.3,
    animations: ["bounceIn"],
  });
  layer.addElement(text);

  // 渲染第一帧
  await video.renderer.init();
  console.log('渲染第一帧...');
  console.log('文本元素 segments 数量:', text.segments ? text.segments.length : 0);
  
  const canvas = await video.renderer.renderFrame(
    video.timeline.getLayers(),
    0,
    video.backgroundColor
  );
  
  // 检查 canvas 内容
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
  let hasContent = false;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] > 0) { // alpha > 0
      hasContent = true;
      break;
    }
  }
  console.log('Canvas 有内容:', hasContent);
  
  // 保存测试图片
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-app-split.png', buffer);
  console.log('测试图片已保存');
  
  // 导出视频
  console.log('导出视频...');
  await video.export('output/test-app-split.mp4');
  console.log('完成');
}

test().catch(console.error);


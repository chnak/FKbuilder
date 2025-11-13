import { VideoMaker } from '../src/core/VideoMaker.js';
import { CompositionElement } from '../src/elements/CompositionElement.js';
import fs from 'fs-extra';

/**
 * 验证嵌套 Composition 的内容是否正确显示
 */
async function testNestedCompositionVerify() {
  console.log('=== 验证嵌套 Composition ===');
  
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 3,
    backgroundColor: '#000000',
  });
  
  const layer = videoMaker.createElementLayer();
  
  // 外层 Composition
  const outerComposition = new CompositionElement({
    x: '50%',
    y: '50%',
    width: 1000,
    height: 600,
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 3,
    zIndex: 1,
    elements: [
      // 外层背景（蓝色）
      {
        type: 'rect',
        x: '50%',
        y: '50%',
        width: 1000,
        height: 600,
        fillColor: '#0000ff', // 蓝色
        strokeColor: '#ffffff',
        strokeWidth: 5,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 3,
        zIndex: 0,
      },
      // 外层文本
      {
        type: 'text',
        text: '外层',
        fontSize: 60,
        color: '#ffffff',
        x: '50%',
        y: '20%',
        textAlign: 'center',
        startTime: 0,
        duration: 3,
        zIndex: 2,
      },
      // 内层 Composition
      {
        type: 'composition',
        x: '50%',
        y: '60%',
        width: 600,
        height: 300,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 3,
        zIndex: 1,
        elements: [
          // 内层背景（红色）
          {
            type: 'rect',
            x: '50%',
            y: '50%',
            width: 600,
            height: 300,
            fillColor: '#ff0000', // 红色
            strokeColor: '#ffffff',
            strokeWidth: 3,
            anchor: [0.5, 0.5],
            startTime: 0,
            duration: 3,
            zIndex: 0,
          },
          // 内层文本
          {
            type: 'text',
            text: '内层',
            fontSize: 40,
            color: '#ffffff',
            x: '50%',
            y: '50%',
            textAlign: 'center',
            startTime: 0,
            duration: 3,
            zIndex: 1,
          },
        ],
      },
    ],
  });
  
  layer.addElement(outerComposition);
  
  // 初始化并渲染第一帧
  console.log('初始化 renderer...');
  await videoMaker.renderer.init();
  
  console.log('渲染第一帧...');
  const canvas = await videoMaker.renderer.renderFrame(
    videoMaker.timeline.getLayers(),
    1, // 渲染第1秒，确保所有元素都显示
    videoMaker.backgroundColor
  );
  
  // 检查 canvas 内容
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let bluePixels = 0;
  let redPixels = 0;
  let whitePixels = 0;
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    
    if (a > 0) {
      // 检查蓝色（外层背景）
      if (b > 200 && r < 50 && g < 50) {
        bluePixels++;
      }
      // 检查红色（内层背景）
      if (r > 200 && g < 50 && b < 50) {
        redPixels++;
      }
      // 检查白色（文本和边框）
      if (r > 200 && g > 200 && b > 200) {
        whitePixels++;
      }
    }
  }
  
  console.log(`Canvas 尺寸: ${canvas.width}x${canvas.height}`);
  console.log(`蓝色像素数（外层背景）: ${bluePixels}`);
  console.log(`红色像素数（内层背景）: ${redPixels}`);
  console.log(`白色像素数（文本/边框）: ${whitePixels}`);
  
  // 保存第一帧
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-composition-nested-verify.png', buffer);
  console.log('第一帧已保存: output/test-composition-nested-verify.png');
  
  // 导出视频
  console.log('导出视频...');
  await videoMaker.export('output/test-composition-nested-verify.mp4');
  console.log('完成');
  
  videoMaker.destroy();
}

testNestedCompositionVerify().catch(console.error);


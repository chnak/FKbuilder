// 详细测试 app.js 的文本渲染
import { VideoBuilder } from './src/index.js';
import { registerFontFile } from './src/utils/font-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 注册字体
const fontPath = 'D:/code/foliko-trade/public/fonts/MicrosoftYaHei-Bold-01.ttf';
try {
  registerFontFile(fontPath, 'MicrosoftYaHei');
} catch (error) {
  console.warn('字体注册失败:', error.message);
}

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
    text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
    color: "#ffffff",
    fontSize: "18rpx",
    x: "50vw",
    y: "10vh",
    textAlign: "center",
    duration: 3,
    startTime: 0,
    fontFamily: "MicrosoftYaHei",
    split: "letter",
    splitDelay: 0.1,
    splitDuration: 0.3,
    stroke: true,
    strokeColor: "#000000",
    strokeWidth: 2,
    animations: ["bounceIn"],
  });

async function test() {
  // 构建 VideoMaker
  const videoMaker = builder.build();
  console.log('VideoMaker 构建完成');
  
  // 渲染第一帧
  await videoMaker.renderer.init();
  console.log('渲染第一帧...');
  
  // 检查图层
  const layers = videoMaker.timeline.getLayers();
  console.log('图层数量:', layers.length);
  
  for (const layer of layers) {
    console.log('图层类型:', layer.type, '元素数量:', layer.elements ? layer.elements.length : 0);
    if (layer.elements) {
      for (const element of layer.elements) {
        console.log('  元素类型:', element.type);
        if (element.type === 'composition' && element.composition) {
          console.log('    嵌套合成元素，检查内部...');
          const nestedLayers = element.composition.timeline.getLayers();
          console.log('      嵌套图层数量:', nestedLayers.length);
          for (const nestedLayer of nestedLayers) {
            console.log('        嵌套图层类型:', nestedLayer.type, '元素数量:', nestedLayer.elements ? nestedLayer.elements.length : 0);
            if (nestedLayer.elements) {
              for (const nestedElement of nestedLayer.elements) {
                console.log('          嵌套元素类型:', nestedElement.type);
                if (nestedElement.type === 'text') {
                  console.log('            文本元素:', nestedElement.config?.text?.substring(0, 20));
                  if (nestedElement.split && nestedElement.segments) {
                    console.log('              分割片段数:', nestedElement.segments.length);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  const canvas = await videoMaker.renderer.renderFrame(
    layers,
    0,
    videoMaker.backgroundColor
  );
  
  // 检查 canvas 内容
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let hasContent = false;
  let whitePixels = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    if (a > 0 && (r > 200 || g > 200 || b > 200)) {
      hasContent = true;
      whitePixels++;
    }
  }
  console.log('Canvas 有内容:', hasContent);
  console.log('白色像素数:', whitePixels);
  
  // 保存测试图片
  await fs.ensureDir('output');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile('output/test-app-detailed.png', buffer);
  console.log('测试图片已保存');
}

test().catch(console.error);


// 调试 app.js 的文本显示问题
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
    text: "测试文本",
    color: "#ffffff",
    fontSize: 64,
    x: "50%",
    y: "50%",
    textAlign: "center",
    duration: 3,
    startTime: 0,
    fontFamily: "MicrosoftYaHei",
  });

async function test() {
  // 先测试渲染第一帧
  const videoMaker = builder.getVideoMaker();
  await videoMaker.renderer.init();
  
  console.log('渲染第一帧...');
  const canvas = await videoMaker.renderer.renderFrame(
    videoMaker.timeline.getLayers(),
    0,
    videoMaker.backgroundColor
  );
  
  // 检查 canvas 是否有内容
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
  await fs.writeFile('output/test-app-debug.png', buffer);
  console.log('测试图片已保存: output/test-app-debug.png');
  
  // 导出视频
  const outputPath = path.join(__dirname, 'output/test-app-debug.mp4');
  console.log('开始导出视频...');
  await builder.export(outputPath);
  console.log(`视频已生成: ${outputPath}`);
}

test().catch(console.error);


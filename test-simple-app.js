/**
 * 简化版 app.js 测试 - 使用更大的字体和简单配置
 */
import { VideoBuilder } from './src/index.js';
import { registerFontFile } from './src/utils/font-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 注册字体（如果字体文件存在）
const fontPath = 'D:/code/foliko-trade/public/fonts/MicrosoftYaHei-Bold-01.ttf';
try {
  registerFontFile(fontPath, 'MicrosoftYaHei');
} catch (error) {
  console.warn('字体注册失败，将使用默认字体:', error.message);
}

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
    fontSize: 72, // 使用像素单位，确保可见
    x: 960, // 中心位置
    y: 540, // 中心位置
    textAlign: "center",
    duration: 5,
    startTime: 0,
    fontFamily: "MicrosoftYaHei",
    // 不使用分割，测试基本渲染
    // split: "letter",
  });

async function main() {
  const outputPath = path.join(__dirname, 'output/test-simple-app.mp4');
  console.log('开始渲染视频...');
  await builder.export(outputPath);
  console.log(`视频已生成: ${outputPath}`);
  builder.destroy();
}

main().catch(console.error);



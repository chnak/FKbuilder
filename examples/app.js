/**
 * 移植自 FKVideo 的 app.js 示例
 */
import { VideoBuilder } from '../src/index.js';
import { registerFontFile } from '../src/utils/font-manager.js';
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
    text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
    color: "#ffffff",
    fontSize: "18rpx",
    x: "50vw",
    y: "10vh",
    textAlign: "center",
    duration: 5,
    startTime: 0,
    fontFamily: "MicrosoftYaHei", // 使用注册的字体名称
    split: "letter",
    splitDelay: 0.1,
    splitDuration: 0.3,
    stroke: true,
    strokeColor: "#000000",
    strokeWidth: 2,
    animations: [
      "bounceIn", // 映射到现有的预设动画
    ]
  })
  .addText({
    text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
    color: "#ffffff",
    fontSize: "18rpx",
    x: "50vw",
    y: "20vh",
    textAlign: "center",
    duration: 5,
    startTime: 0,
    fontFamily: "MicrosoftYaHei",
    split: "letter",
    splitDelay: 0.1,
    splitDuration: 0.3,
    stroke: true,
    strokeColor: "#000000",
    strokeWidth: 2,
    animations: [
      "zoomIn", // 映射到现有的预设动画
      "zoomOut"
    ]
  })
  // .addText({
  //   text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
  //   color: "#ffffff",
  //   fontSize: "18rpx",
  //   x: "50vw",
  //   y: "30vh",
  //   textAlign: "center",
  //   duration: 10,
  //   startTime: 0,
  //   fontFamily: "MicrosoftYaHei",
  //   split: "letter",
  //   splitDelay: 0.1,
  //   splitDuration: 0.3,
  //   stroke: true,
  //   strokeColor: "#000000",
  //   strokeWidth: 2,
  //   animations: [
  //     "fadeInUp", // 映射到现有的预设动画
  //   ]
  // })
  // .addText({
  //   text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
  //   color: "#ffffff",
  //   fontSize: "18rpx",
  //   x: "50vw",
  //   y: "40vh",
  //   textAlign: "center",
  //   duration: 10,
  //   startTime: 0,
  //   fontFamily: "MicrosoftYaHei",
  //   split: "letter",
  //   splitDelay: 0.1,
  //   splitDuration: 0.3,
  //   stroke: true,
  //   strokeColor: "#000000",
  //   strokeWidth: 2,
  //   animations: [
  //     "rotateIn", // 映射到现有的预设动画
  //   ]
  // })
  // .addText({
  //   text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
  //   color: "#ffffff",
  //   fontSize: "18rpx",
  //   x: "50vw",
  //   y: "50vh",
  //   textAlign: "center",
  //   duration: 10,
  //   startTime: 0,
  //   fontFamily: "MicrosoftYaHei",
  //   split: "letter",
  //   splitDelay: 0.1,
  //   splitDuration: 0.3,
  //   stroke: true,
  //   strokeColor: "#000000",
  //   strokeWidth: 2,
  //   animations: [
  //     "zoomIn", // 映射到现有的预设动画
  //   ]
  // })
  // .addText({
  //   text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
  //   color: "#ffffff",
  //   fontSize: "18rpx",
  //   x: "50vw",
  //   y: "60vh",
  //   textAlign: "center",
  //   duration: 10,
  //   startTime: 0,
  //   fontFamily: "MicrosoftYaHei",
  //   split: "letter",
  //   splitDelay: 0.1,
  //   splitDuration: 0.3,
  //   stroke: true,
  //   strokeColor: "#000000",
  //   strokeWidth: 2,
  //   animations: [
  //     "bounceIn", // 映射到现有的预设动画
  //   ]
  // })
  // .addText({
  //   text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
  //   color: "#ffffff",
  //   fontSize: "18rpx",
  //   x: "50vw",
  //   y: "70vh",
  //   textAlign: "center",
  //   duration: 10,
  //   startTime: 0,
  //   fontFamily: "MicrosoftYaHei",
  //   split: "letter",
  //   splitDelay: 0.1,
  //   splitDuration: 0.3,
  //   stroke: true,
  //   strokeColor: "#000000",
  //   strokeWidth: 2,
  //   animations: [
  //     "slideInLeft", // 映射到现有的预设动画
  //   ]
  // })
  // .addText({
  //   text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
  //   color: "#ffffff",
  //   fontSize: "18rpx",
  //   x: "50vw",
  //   y: "80vh",
  //   textAlign: "center",
  //   duration: 10,
  //   startTime: 0,
  //   fontFamily: "MicrosoftYaHei",
  //   split: "letter",
  //   splitDelay: 0.1,
  //   splitDuration: 0.3,
  //   stroke: true,
  //   strokeColor: "#000000",
  //   strokeWidth: 2,
  //   animations: [
  //     "slideInLeft", // 映射到现有的预设动画
  //   ]
  // })
  // .addText({
  //   text: "一天，奇奇发现了一颗特别大的金色橡果，它兴奋地跳来跳去",
  //   color: "#ffffff",
  //   fontSize: "18rpx",
  //   x: "50vw",
  //   y: "100vh",
  //   textAlign: "center",
  //   duration: 10,
  //   startTime: 0,
  //   fontFamily: "MicrosoftYaHei",
  //   split: "letter",
  //   splitDelay: 0.1,
  //   splitDuration: 0.3,
  //   stroke: true,
  //   strokeColor: "#000000",
  //   strokeWidth: 2,
  //   animations: [
  //     "fadeInUp", // 映射到现有的预设动画
  //   ]
  // });

async function main() {
  const outputPath = path.join(__dirname, '../output/my-video.mp4');
  console.log('开始渲染视频...');
  await builder.export(outputPath);
  console.log(`视频已生成: ${outputPath}`);
  builder.destroy();
}

main().catch(console.error);


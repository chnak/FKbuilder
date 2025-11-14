import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试视频元素功能
 */
async function testVideo() {
  console.log('🧪 测试视频元素功能...\n');

  // 检查 assets 目录中是否有视频文件
  const assetsDir = path.join(__dirname, '../assets');
  const videoFiles = [];
  
  if (await fs.pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir);
    videoFiles.push(...files.filter(f => 
      /\.(mp4|webm|mov|avi|mkv)$/i.test(f)
    ));
  }

  if (videoFiles.length === 0) {
    console.log('⚠️  未找到视频文件，请将视频放在 assets 目录中');
    console.log('   支持的格式: mp4, webm, mov, avi, mkv');
    return;
  }

  console.log(`🎬 找到 ${videoFiles.length} 个视频文件:`);
  videoFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('');

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 测试场景1: 基本视频显示
  const videoPath = path.join(assetsDir, videoFiles[0]);
  console.log(`📹 使用视频: ${videoFiles[0]}`);
  
  const scene1 = mainTrack.createScene({ duration: 5, startTime: 0 })
    .addBackground()
    .addText({
      text: "基本视频显示",
      color: "#FFFFFF",
      fontSize: 50,
      x: "50%",
      y: "10%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 5,
    })
    .addVideo({
      src: videoPath,
      x: "50%",
      y: "50%",
      width: "100%",
      height: "70%",
      anchor: [0.5, 0.5],
      duration: 5,
      fit: 'cover', // 覆盖整个区域
      mute: false, // 不禁音，保留视频音频
      volume: 0.8, // 音量 80%
    });

  // 测试场景2: 视频裁剪
  if (videoFiles.length > 0) {
    const scene2 = mainTrack.createScene({ duration: 3, startTime: 5 })
      .addBackground()
      .addText({
        text: "视频裁剪 (0-3秒)",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 3,
      })
      .addVideo({
        src: videoPath,
        x: "50%",
        y: "50%",
        width: "80%",
        height: "60%",
        anchor: [0.5, 0.5],
        duration: 3,
        fit: 'contain', // 完整显示
        cutFrom: 0,
        cutTo: 3, // 只取前3秒
      });
  }

  // 测试场景3: 视频循环
  if (videoFiles.length > 0) {
    const scene3 = mainTrack.createScene({ duration: 5, startTime: 8 })
      .addBackground()
      .addText({
        text: "视频循环播放",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 5,
      })
      .addVideo({
        src: videoPath,
        x: "50%",
        y: "50%",
        width: "80%",
        height: "60%",
        anchor: [0.5, 0.5],
        duration: 5,
        fit: 'contain',
        loop: true, // 循环播放
        cutFrom: 0,
        cutTo: 2, // 循环播放前2秒
      });
  }

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-video.mp4');

  try {
    console.log('🎬 开始渲染...');
    const videoMaker = builder.build();
    await videoMaker.export(outputPath);
    
    console.log('');
    console.log('✅ 视频测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testVideo().catch(console.error);


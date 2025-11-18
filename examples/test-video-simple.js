import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简单的视频元素测试
 */
async function testVideoSimple() {
  console.log('🧪 简单视频元素测试...\n');

  // 检查 assets 目录中是否有视频文件
  const assetsDir = path.join(__dirname, '../assets');
  const videoFiles = [];
  
  if (await fs.pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir);
    videoFiles.push(...files.filter(f => 
      /\.(mp4|webm|mov)$/i.test(f)
    ));
  }

  if (videoFiles.length === 0) {
    console.log('⚠️  未找到视频文件');
    return;
  }

  const videoPath = path.join(assetsDir, videoFiles[0]);
  console.log(`📹 使用视频: ${videoFiles[0]}\n`);

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 只测试一个短场景（5秒，测试视频播放速度）
  const scene1 = mainTrack.createScene({ duration: 5, startTime: 0 })
    .addBackground()
    .addText({
      text: "视频测试 - 5秒",
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
      duration: 5, // 元素duration为5秒，应该只提取5秒的帧
      fit: 'contain',
      mute: false, // 启用视频音频
      volume: 1.0, // 音量 100%
    });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-video-simple.mp4');

  try {
    console.log('🎬 开始渲染（5秒视频，测试视频播放速度和帧提取）...');
    const startTime = Date.now();
    const videoMaker = builder.build();
    await videoMaker.export(outputPath, {
      usePipe: true,
      parallel: true,
      maxWorkers: 2,
    });
    const endTime = Date.now();
    
    console.log('');
    console.log('✅ 视频测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log(`⏱️  耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
    
    // 检查输出文件大小
    const stats = await fs.stat(outputPath);
    console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('详细错误:', error.stack);
    }
    process.exit(1);
  }
}

testVideoSimple().catch(console.error);


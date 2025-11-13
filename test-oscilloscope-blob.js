import { VideoBuilder } from './src/index.js';
import { getAudioDuration } from './src/utils/audio-utils.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 单独测试 Blob 球体碰撞示波器
 */
async function testBlobOscilloscope() {
  console.log('=== 测试 Blob 球体碰撞示波器 ===\n');
  
  // 使用 assets 目录下的音频文件
  const audioFile = path.join(__dirname, 'assets/1.mp3');
  
  if (!await fs.pathExists(audioFile)) {
    console.error(`音频文件不存在: ${audioFile}`);
    console.log('请确保 assets 目录下有音频文件');
    return;
  }

  // 获取音频文件时长
  console.log('正在获取音频文件时长...');
  const audioTotalDuration = await getAudioDuration(audioFile);
  console.log(`音频文件总时长: ${audioTotalDuration.toFixed(2)} 秒\n`);
  
  // ========== 配置参数 ==========
  const AUDIO_START_TIME = 0;
  const AUDIO_DURATION = 10;
  const VIDEO_DURATION = 10;
  // ==============================
  
  console.log(`使用音频文件: ${audioFile}`);
  console.log(`音频起始时间: ${AUDIO_START_TIME} 秒`);
  console.log(`音频读取时长: ${AUDIO_DURATION} 秒`);
  console.log(`视频时长: ${VIDEO_DURATION} 秒\n`);

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });
  
  // 创建场景
  const scene = track.createScene({ duration: VIDEO_DURATION })
    .addBackground({ color: '#000000' })
    .addText({
      text: "Blob 球体碰撞示波器测试",
      color: "#ffffff",
      fontSize: 60,
      x: "50%",
      y: "10%",
      textAlign: "center",
      duration: VIDEO_DURATION,
      startTime: 0,
      zIndex: 10,
    });

  // 计算音频截取参数
  const cutTo = AUDIO_START_TIME + AUDIO_DURATION;
  
  // 添加 Blob 示波器
  console.log('添加 Blob 球体碰撞示波器...');
  await scene.addOscilloscope({
    audioPath: audioFile,
    cutFrom: AUDIO_START_TIME,
    cutTo: cutTo,
    x: '50%',
    y: '50%',
    width: 800,
    height: 800,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    style: 'blob',
    sensitivity: 3.0,
    blobBallCount: 6,
    particleColors: [
      '#ff0080', '#ff4080', '#ff8000', '#ffc000',
      '#ffff00', '#80ff00', '#00ff80', '#00ffff',
      '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
    ],
    windowSize: 0.1,
    startTime: 0,
    duration: VIDEO_DURATION,
    zIndex: 1,
  });

  // 添加音频
  scene.addAudio({
    src: audioFile,
    startTime: 0,
    duration: AUDIO_DURATION,
    cutFrom: AUDIO_START_TIME,
    cutTo: cutTo,
    volume: 0.8,
  });
  
  const videoMaker = builder.build();
  const outputDir = path.join(__dirname, 'output');
  await fs.ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, 'test-oscilloscope-blob.mp4');
  
  console.log('\n开始渲染视频...');
  const startTime = Date.now();
  await videoMaker.export(outputPath);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ 视频导出完成: ${outputPath}`);
  console.log(`⏱️  总耗时: ${duration} 秒`);
  
  videoMaker.destroy();
  builder.destroy();
}

testBlobOscilloscope().catch(console.error);


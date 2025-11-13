import { VideoBuilder } from './src/index.js';
import { getAudioDuration } from './src/utils/audio-utils.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简单测试示波器功能
 */
async function testOscilloscope() {
  console.log('=== 测试示波器功能 ===\n');
  
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
  // 从音频文件的哪个时间点开始读取（秒）
  const AUDIO_START_TIME = 0;
  // 读取音频的时长（秒），如果为 null 或 0 则读取到文件末尾
  const AUDIO_DURATION = 10; // 设置为 0 或 null 则使用完整音频时长
  // 视频时长（秒），如果未指定则使用音频时长
  const VIDEO_DURATION = 30;
  // ==============================
  
  console.log(`使用音频文件: ${audioFile}`);
  console.log(`音频起始时间: ${AUDIO_START_TIME} 秒`);
  console.log(`音频读取时长: ${AUDIO_DURATION > 0 ? AUDIO_DURATION : '完整时长'} 秒`);
  console.log(`视频时长: ${VIDEO_DURATION.toFixed(2)} 秒\n`);

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });
  
  // 创建场景并添加示波器
  const scene = track.createScene({ duration: 60 })
    .addBackground({ color: '#0a0a0a' })
    .addText({
      text: "示波器测试",
      color: "#ffffff",
      fontSize: 60,
      x: "50%",
      y: "10%",
      textAlign: "center",
      duration: 60,
      startTime: 0,
      zIndex: 10,
    });

  // 计算音频截取参数
  const cutTo = AUDIO_DURATION > 0 ? AUDIO_START_TIME + AUDIO_DURATION : undefined;
  
  // 添加示波器 - 线条样式（顶部）
  console.log('添加线条样式示波器...');
  await scene.addOscilloscope({
    audioPath: audioFile,
    cutFrom: AUDIO_START_TIME, // 从音频文件的哪个时间点开始
    cutTo: cutTo, // 裁剪到哪个时间点
    x: '50%',
    y: '30%',
    width: 1600,
    height: 200,
    waveColor: '#00ff00',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    style: 'line',
    lineWidth: 2,
    mirror: true,
    smoothing: 0.3,
    sensitivity: 3.0, // 增大振幅
    windowSize: 0.1, // 显示窗口 0.1 秒
    startTime: 0,
    duration: 60,
    cutFrom: 0, // 从音频文件的哪个时间点开始
    cutTo: 60, // 裁剪到哪个时间点
    zIndex: 1,
  });

  // 添加示波器 - 柱状样式（中间）
  console.log('添加柱状样式示波器...');
  await scene.addOscilloscope({
    audioPath: audioFile,
    cutFrom: AUDIO_START_TIME, // 从音频文件的哪个时间点开始
    cutTo: cutTo, // 裁剪到哪个时间点
    x: '50%',
    y: '55%',
    width: 1600,
    height: 200,
    waveColor: '#00ffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    style: 'bars',
    barWidth: 3,
    barGap: 1,
    mirror: true,
    sensitivity: 3.0, // 增大振幅
    windowSize: 0.1,
    startTime: 0,
    duration: 60,
    cutFrom: 0, // 从音频文件的哪个时间点开始
    cutTo: 60, // 裁剪到哪个时间点
    zIndex: 1,
  });

  // 添加示波器 - 粒子样式（底部）
  console.log('添加粒子样式示波器...');
  await scene.addOscilloscope({
    audioPath: audioFile,
    cutFrom: AUDIO_START_TIME, // 从音频文件的哪个时间点开始
    cutTo: cutTo, // 裁剪到哪个时间点
    x: '50%',
    y: '80%',
    width: 500,
    height: 500,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    style: 'particles',
    mirror: true,
    sensitivity: 3.0, // 增大振幅
    particleCount: 60,
    particleMinSize: 4,
    particleMaxSize: 20,
    particleColors: [
      '#ff0080', '#ff4080', '#ff8000', '#ffc000',
      '#ffff00', '#80ff00', '#00ff80', '#00ffff',
      '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
    ],
    particleTrail: true,
    windowSize: 0.1,
    startTime: 0,
    duration: 60,
    cutFrom: 0, // 从音频文件的哪个时间点开始
    cutTo: 60, // 裁剪到哪个时间点
    zIndex: 1,
  });

  // 添加音频
  const actualAudioDuration = AUDIO_DURATION > 0 ? AUDIO_DURATION : audioTotalDuration;
  scene.addAudio({
    src: audioFile,
    startTime: 0,
    duration: 60,
    cutFrom: 0, // 从音频文件的哪个时间点开始
    cutTo: 60, // 裁剪到哪个时间点
    volume: 0.8,
  });
  
  const videoMaker = builder.build();
  const outputDir = path.join(__dirname, 'output');
  await fs.ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, 'test-oscilloscope-simple.mp4');
  
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

testOscilloscope().catch(console.error);


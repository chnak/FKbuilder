import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试示波器元素
 */
async function testOscilloscope() {
  console.log('=== 测试示波器元素 ===\n');
  
  // 检查音频文件是否存在
  const audioFile = path.join(__dirname, '../assets/帝女芳魂.mp3');
  if (!await fs.pathExists(audioFile)) {
    console.error(`音频文件不存在: ${audioFile}`);
    console.log('请确保 assets 目录下有音频文件');
    return;
  }

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });
  
  // 创建场景并添加示波器
  const scene = track.createScene({ duration: 10 })
    .addBackground({ color: '#1a1a1a' })
    .addText({
      text: "音频示波器演示",
      color: "#ffffff",
      fontSize: 60,
      x: "50%",
      y: "15%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 2,
    });

  // 添加示波器 - 线条样式
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: '50%',
    y: '40%',
    width: 1600,
    height: 200,
    waveColor: '#00ff00',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    style: 'line',
    lineWidth: 2,
    mirror: true,
    smoothing: 0.3,
    sensitivity: 1.0,
    windowSize: 0.1, // 显示窗口 0.1 秒
    startTime: 0,
    duration: 10,
    zIndex: 1,
  });

  // 添加示波器 - 柱状样式
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: '50%',
    y: '65%',
    width: 1600,
    height: 200,
    waveColor: '#00ffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    style: 'bars',
    barWidth: 3,
    barGap: 1,
    mirror: true,
    sensitivity: 1.2,
    windowSize: 0.1,
    startTime: 0,
    duration: 10,
    zIndex: 1,
  });

  // 添加示波器 - 频谱样式
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: '50%',
    y: '90%',
    width: 1600,
    height: 200,
    waveColor: '#ff00ff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    style: 'spectrum',
    mirror: true,
    sensitivity: 1.5,
    windowSize: 0.1,
    startTime: 0,
    duration: 10,
    zIndex: 1,
  });

  // 添加音频
  scene.addAudio({
    src: audioFile,
    startTime: 0,
    duration: 10,
    volume: 0.8,
  });
  
  const videoMaker = builder.build();
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, 'test-oscilloscope.mp4');
  
  console.log('开始渲染视频...');
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


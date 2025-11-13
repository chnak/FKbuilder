import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简单测试多彩圆点粒子示波器效果
 */
async function testOscilloscopeParticles() {
  console.log('=== 测试多彩圆点粒子示波器 ===\n');

  // 检查音频文件
  const audioFile = path.join(__dirname, '../assets/离家出走.mp3');
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

  // 创建场景
  const scene = track.createScene({ duration: 10 })
    .addBackground({ color: '#000000' })
    .addText({
      text: "多种示波器样式展示",
      color: "#FFFFFF",
      fontSize: 50,
      x: "50%",
      y: "8%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 10,
    });

  // 样式1: 线条波形（左上）
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: "25%",
    y: "30%",
    width: 400,
    height: 200,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    waveColor: "#00ff00",
    style: 'line',
    lineWidth: 2,
    mirror: true,
    sensitivity: 1.2,
    windowSize: 0.1,
    duration: 10,
    startTime: 0,
    zIndex: 1,
  });

  // 样式2: 柱状波形（右上）
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: "75%",
    y: "30%",
    width: 400,
    height: 200,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    waveColor: "#00ffff",
    style: 'bars',
    barWidth: 3,
    barGap: 1,
    mirror: true,
    sensitivity: 1.3,
    windowSize: 0.1,
    duration: 10,
    startTime: 0,
    zIndex: 1,
  });

  // 样式3: 圆形波形（左下）
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: "25%",
    y: "70%",
    width: 400,
    height: 400,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    waveColor: "#ff00ff",
    style: 'circle',
    lineWidth: 2,
    sensitivity: 1.5,
    windowSize: 0.1,
    duration: 10,
    startTime: 0,
    zIndex: 1,
  });

  // 样式4: 频谱波形（右下）
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: "75%",
    y: "70%",
    width: 400,
    height: 200,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    waveColor: "#ffff00",
    style: 'spectrum',
    mirror: true,
    sensitivity: 1.5,
    windowSize: 0.1,
    duration: 10,
    startTime: 0,
    zIndex: 1,
  });

  // 样式5: 多彩圆点粒子（中心）
  await scene.addOscilloscope({
    audioPath: audioFile,
    x: "50%",
    y: "50%",
    width: 500,
    height: 500,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    style: 'particles',
    mirror: true,
    sensitivity: 1.5,
    particleCount: 80,
    particleMinSize: 5,
    particleMaxSize: 25,
    particleColors: [
      '#ff0080', '#ff4080', '#ff8000', '#ffc000',
      '#ffff00', '#80ff00', '#00ff80', '#00ffff',
      '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
    ],
    particleTrail: true,
    windowSize: 0.1,
    duration: 10,
    startTime: 0,
    zIndex: 2,
  });

  // 添加音频
  scene.addAudio({
    src: audioFile,
    volume: 1,
    duration: 10,
    startTime: 0,
  });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-oscilloscope-particles.mp4');

  console.log('开始渲染...');
  const videoMaker = builder.build();
  await videoMaker.export(outputPath);

  console.log(`\n✅ 完成: ${outputPath}`);
  
  videoMaker.destroy();
  builder.destroy();
}

testOscilloscopeParticles().catch(console.error);


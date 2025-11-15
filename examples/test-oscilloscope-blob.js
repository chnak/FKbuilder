/**
 * 测试 Blob 球体碰撞变形示波器效果
 * 测试大小不一的球体功能
 */
import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testOscilloscopeBlob() {
  console.log('🎬 测试 Blob 球体碰撞变形示波器效果（大小不一的球体）...\n');

  // 检查音频文件
  const audioFiles = [
    path.join(__dirname, '../assets/星光背后.mp3'),
    path.join(__dirname, '../assets/有何不可.mp3'),
    path.join(__dirname, '../assets/彩云追月.mp3'),
  ];
  
  let audioFile = null;
  for (const file of audioFiles) {
    if (await fs.pathExists(file)) {
      audioFile = file;
      break;
    }
  }

  if (!audioFile) {
    console.error('未找到音频文件，请确保 assets 目录下有音频文件');
    return;
  }

  console.log(`使用音频文件: ${path.basename(audioFile)}\n`);

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 场景1：默认配置（大小范围 0.4 - 2.0）
  console.log('创建场景1: 默认大小范围（0.4 - 2.0）...');
  const scene1 = track.createScene({ duration: 8, startTime: 0 })
    .addBackground({ color: '#0a0a0a' })
    .addText({
      text: 'Blob 效果 - 默认大小范围',
      color: '#FFFFFF',
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 8,
      startTime: 0,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textShadow: true,
      textShadowColor: '#000000',
      textShadowBlur: 20,
    })
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '50%',
      width: 1600,
      height: 800,
      backgroundColor: '#E4EBE0',
      style: 'blob',
      blobBallCount: 15,
      sensitivity: 1.5,
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
        '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
        '#ff4080', '#ff8000', '#ffc000',
      ],
      windowSize: 0.1,
      duration: 8,
      startTime: 0,
    });

  // 场景2：更大的大小差异（0.3 - 3.0）
  console.log('创建场景2: 更大的大小差异（0.3 - 3.0）...');
  const scene2 = track.createScene({ duration: 8, startTime: 8 })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: 'Blob 效果 - 更大差异（0.3 - 3.0）',
      color: '#FFFFFF',
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 8,
      startTime: 0,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textShadow: true,
      textShadowColor: '#000000',
      textShadowBlur: 20,
    })
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '50%',
      width: 1600,
      height: 800,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      style: 'blob',
      blobBallCount: 15,
      minRadiusRatio: 0.3,
      maxRadiusRatio: 3.0,
      sensitivity: 1.5,
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
        '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
        '#ff4080', '#ff8000', '#ffc000',
      ],
      windowSize: 0.1,
      duration: 8,
      startTime: 0,
    });

  // 场景3：更小的大小差异（0.6 - 1.5）
  console.log('创建场景3: 更小的大小差异（0.6 - 1.5）...');
  const scene3 = track.createScene({ duration: 8, startTime: 16 })
    .addBackground({ color: '#2d3436' })
    .addText({
      text: 'Blob 效果 - 更小差异（0.6 - 1.5）',
      color: '#FFFFFF',
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 8,
      startTime: 0,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textShadow: true,
      textShadowColor: '#000000',
      textShadowBlur: 20,
    })
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '50%',
      width: 1600,
      height: 800,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      style: 'blob',
      blobBallCount: 15,
      minRadiusRatio: 0.6,
      maxRadiusRatio: 1.5,
      sensitivity: 1.5,
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
        '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
        '#ff4080', '#ff8000', '#ffc000',
      ],
      windowSize: 0.1,
      duration: 8,
      startTime: 0,
    });

  // 场景4：更多球体，大小差异明显
  console.log('创建场景4: 更多球体（20个），大小差异明显...');
  const scene4 = track.createScene({ duration: 8, startTime: 24 })
    .addBackground({ color: '#0a0a0a' })
    .addText({
      text: 'Blob 效果 - 20个球体，大小差异明显',
      color: '#FFFFFF',
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 8,
      startTime: 0,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textShadow: true,
      textShadowColor: '#000000',
      textShadowBlur: 20,
    })
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '50%',
      width: 1600,
      height: 800,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      style: 'blob',
      blobBallCount: 20,
      minRadiusRatio: 0.4,
      maxRadiusRatio: 2.5,
      sensitivity: 1.8,
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
        '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
        '#ff4080', '#ff8000', '#ffc000', '#ffff00',
        '#80ff00', '#00ff80', '#00ffff', '#0080ff',
      ],
      windowSize: 0.1,
      duration: 8,
      startTime: 0,
    });

  // 添加转场
  track.addTransition({
    name: 'fade',
    duration: 0.5,
    startTime: 8,
  });

  track.addTransition({
    name: 'CrossZoom',
    duration: 0.5,
    startTime: 16,
  });

  track.addTransition({
    name: 'Swirl',
    duration: 0.5,
    startTime: 24,
  });

  // 添加音频
  scene1.addAudio({
    src: audioFile,
    volume: 1,
    duration: 32,
    startTime: 0,
  });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-oscilloscope-blob.mp4');

  console.log(`\n🚀 开始导出视频...`);
  console.log(`输出路径: ${outputPath}\n`);
  console.log(`总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
  console.log(`场景数: ${track.scenes.length}`);
  console.log(`转场数: ${track.transitions.length}\n`);

  try {
    await builder.export(outputPath, {
      quality: 'high',
      bitrate: '10M',
    });

    console.log('✅ 视频导出成功！');
    console.log(`📁 文件位置: ${outputPath}`);
    console.log(`⏱️  总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
    console.log('\n测试场景：');
    console.log('  1. 默认大小范围（0.4 - 2.0）- 15个球体');
    console.log('  2. 更大的大小差异（0.3 - 3.0）- 15个球体');
    console.log('  3. 更小的大小差异（0.6 - 1.5）- 15个球体');
    console.log('  4. 更多球体（20个），大小差异明显（0.4 - 2.5）');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testOscilloscopeBlob().catch(console.error);


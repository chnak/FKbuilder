import { VideoBuilder } from './src/index.js';
import { getAudioDuration } from './src/utils/audio-utils.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试所有示波器渲染器样式
 */
async function testAllOscilloscopeStyles() {
  console.log('=== 测试所有示波器渲染器样式 ===\n');
  
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
  const AUDIO_DURATION = 15; // 15秒音频
  const VIDEO_DURATION = 15; // 15秒视频
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
      text: "示波器渲染器样式展示",
      color: "#ffffff",
      fontSize: 50,
      x: "50%",
      y: "3%",
      textAlign: "center",
      duration: VIDEO_DURATION,
      startTime: 0,
      zIndex: 100,
    });

  // 计算音频截取参数
  const cutTo = AUDIO_START_TIME + AUDIO_DURATION;
  
  // 定义所有样式及其配置
  const styles = [
    {
      name: 'line',
      title: '线条波形',
      x: '25%',
      y: '12%',
      width: 400,
      height: 150,
      waveColor: '#00ff00',
    },
    {
      name: 'bars',
      title: '柱状波形',
      x: '75%',
      y: '12%',
      width: 400,
      height: 150,
      waveColor: '#00ffff',
    },
    {
      name: 'circle',
      title: '圆形波形',
      x: '25%',
      y: '32%',
      width: 300,
      height: 300,
      waveColor: '#ff00ff',
    },
    {
      name: 'spectrum',
      title: '频谱波形',
      x: '75%',
      y: '32%',
      width: 400,
      height: 150,
      waveColor: '#ffff00',
    },
    {
      name: 'particles',
      title: '粒子波形',
      x: '25%',
      y: '62%',
      width: 350,
      height: 350,
      particleCount: 50,
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
        '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
      ],
    },
    {
      name: 'waterfall',
      title: '瀑布图',
      x: '75%',
      y: '62%',
      width: 400,
      height: 150,
      waterfallBands: 64,
    },
    {
      name: 'spiral',
      title: '螺旋波形',
      x: '25%',
      y: '92%',
      width: 300,
      height: 300,
      waveColor: '#ff8000',
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
      ],
    },
    {
      name: 'ripple',
      title: '涟漪波形',
      x: '75%',
      y: '92%',
      width: 300,
      height: 300,
      waveColor: '#00ffff',
      rippleCount: 5,
      rippleSpeed: 1.0,
    },
    {
      name: 'grid',
      title: '网格波形',
      x: '50%',
      y: '50%',
      width: 400,
      height: 200,
      waveColor: '#80ff00',
      gridRows: 8,
      gridCols: 16,
    },
    {
      name: 'explosion',
      title: '爆炸波形',
      x: '50%',
      y: '75%',
      width: 400,
      height: 400,
      explosionParticles: 80,
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
        '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
      ],
    },
  ];

  // 添加所有样式的示波器
  for (const styleConfig of styles) {
    console.log(`添加 ${styleConfig.title} (${styleConfig.name})...`);
    
    const config = {
      audioPath: audioFile,
      cutFrom: AUDIO_START_TIME,
      cutTo: cutTo,
      x: styleConfig.x,
      y: styleConfig.y,
      width: styleConfig.width,
      height: styleConfig.height,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      style: styleConfig.name,
      sensitivity: 3.0,
      mirror: true,
      windowSize: 0.1,
      startTime: 0,
      duration: VIDEO_DURATION,
      zIndex: 1,
    };

    // 添加样式特定的配置
    if (styleConfig.waveColor) {
      config.waveColor = styleConfig.waveColor;
    }
    if (styleConfig.particleCount) {
      config.particleCount = styleConfig.particleCount;
    }
    if (styleConfig.particleColors) {
      config.particleColors = styleConfig.particleColors;
    }
    if (styleConfig.waterfallBands) {
      config.waterfallBands = styleConfig.waterfallBands;
    }
    if (styleConfig.rippleCount) {
      config.rippleCount = styleConfig.rippleCount;
    }
    if (styleConfig.rippleSpeed) {
      config.rippleSpeed = styleConfig.rippleSpeed;
    }
    if (styleConfig.gridRows) {
      config.gridRows = styleConfig.gridRows;
    }
    if (styleConfig.gridCols) {
      config.gridCols = styleConfig.gridCols;
    }
    if (styleConfig.explosionParticles) {
      config.explosionParticles = styleConfig.explosionParticles;
    }

    await scene.addOscilloscope(config);

    // 添加样式标题文字
    scene.addText({
      text: styleConfig.title,
      color: "#ffffff",
      fontSize: 24,
      x: styleConfig.x,
      y: (parseFloat(styleConfig.y) - 8) + '%',
      textAlign: "center",
      duration: VIDEO_DURATION,
      startTime: 0,
      zIndex: 10,
    });
  }

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
  
  const outputPath = path.join(outputDir, 'test-oscilloscope-all-styles.mp4');
  
  console.log('\n开始渲染视频...');
  const startTime = Date.now();
  await videoMaker.export(outputPath);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ 视频导出完成: ${outputPath}`);
  console.log(`⏱️  总耗时: ${duration} 秒`);
  console.log(`\n展示了 ${styles.length} 种示波器渲染器样式：`);
  styles.forEach(s => console.log(`  - ${s.title} (${s.name})`));
  
  videoMaker.destroy();
  builder.destroy();
}

testAllOscilloscopeStyles().catch(console.error);


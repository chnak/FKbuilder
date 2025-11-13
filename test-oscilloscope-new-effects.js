import { VideoBuilder } from './src/index.js';
import { getAudioDuration } from './src/utils/audio-utils.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试新的酷炫示波器效果
 */
async function testNewOscilloscopeEffects() {
  console.log('=== 测试新的酷炫示波器效果 ===\n');
  
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
  const AUDIO_START_TIME = 30;
  const AUDIO_DURATION = 20; // 20秒音频
  const VIDEO_DURATION = 20; // 20秒视频
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
      text: "新的酷炫示波器效果展示",
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
  
  // 定义新效果样式及其配置
  const newStyles = [
    {
      name: 'rotating3d',
      title: '3D旋转波形',
      x: '25%',
      y: '15%',
      width: 400,
      height: 400,
      waveColor: '#00ffff',
      sensitivity: 3.0,
      rotationSpeed: 1.0,
      particleColors: ['#00ffff', '#0080ff', '#8000ff', '#ff0080'],
    },
    {
      name: 'trail',
      title: '粒子轨迹追踪',
      x: '75%',
      y: '15%',
      width: 400,
      height: 300,
      waveColor: '#ff00ff',
      sensitivity: 3.0,
      trailParticleCount: 15,
      trailLength: 60,
      trailSpeed: 1.2,
      particleColors: ['#ff00ff', '#ff4080', '#ff8000', '#ffff00'],
    },
    {
      name: 'weave',
      title: '波形编织',
      x: '25%',
      y: '60%',
      width: 400,
      height: 300,
      waveColor: '#00ff00',
      sensitivity: 3.0,
      weaveLayers: 6,
      weaveLayerSpacing: 25,
      weaveSpeed: 0.6,
      mirror: true,
      particleColors: ['#00ff00', '#80ff00', '#ffff00', '#ff8000'],
    },
    {
      name: 'lightwave',
      title: '光波扩散',
      x: '75%',
      y: '60%',
      width: 400,
      height: 400,
      waveColor: '#ffff00',
      sensitivity: 4.0,
      lightwaveCount: 10,
      lightwaveSpeed: 2.5,
      lightwaveSegments: 80,
      particleColors: ['#ffff00', '#ff8000', '#ff0080', '#8000ff'],
    },
    {
      name: 'particleflow',
      title: '波形粒子流',
      x: '50%',
      y: '37.5%',
      width: 500,
      height: 250,
      waveColor: '#00ffff',
      sensitivity: 3.5,
      flowParticleCount: 150,
      flowSpeed: 1.5,
      showWaveform: true,
      particleTrail: true,
      particleTrailLength: 5,
      particleColors: [
        '#ff0080', '#ff4080', '#ff8000', '#ffc000',
        '#ffff00', '#80ff00', '#00ff80', '#00ffff',
        '#0080ff', '#8000ff'
      ],
    },
  ];
  
  // 添加每个新效果
  for (const styleConfig of newStyles) {
    console.log(`添加 ${styleConfig.title} (${styleConfig.name})...`);
    
    // 添加标题
    scene.addText({
      text: styleConfig.title,
      color: "#ffffff",
      fontSize: 24,
      x: styleConfig.x,
      y: `${parseFloat(styleConfig.y) - 5}%`,
      textAlign: "center",
      duration: VIDEO_DURATION,
      startTime: 0,
      zIndex: 50,
    });
    
    // 添加示波器（支持链式调用，不需要 await）
    scene.addOscilloscope({
      audioPath: audioFile,
      style: styleConfig.name,
      x: styleConfig.x,
      y: styleConfig.y,
      width: styleConfig.width,
      height: styleConfig.height,
      waveColor: styleConfig.waveColor,
      sensitivity: styleConfig.sensitivity,
      cutFrom: AUDIO_START_TIME,
      cutTo: cutTo,
      duration: VIDEO_DURATION,
      startTime: 0,
      zIndex: 10,
      // 传递特定样式的配置
      ...(styleConfig.rotationSpeed !== undefined && { rotationSpeed: styleConfig.rotationSpeed }),
      ...(styleConfig.trailParticleCount !== undefined && { trailParticleCount: styleConfig.trailParticleCount }),
      ...(styleConfig.trailLength !== undefined && { trailLength: styleConfig.trailLength }),
      ...(styleConfig.trailSpeed !== undefined && { trailSpeed: styleConfig.trailSpeed }),
      ...(styleConfig.weaveLayers !== undefined && { weaveLayers: styleConfig.weaveLayers }),
      ...(styleConfig.weaveLayerSpacing !== undefined && { weaveLayerSpacing: styleConfig.weaveLayerSpacing }),
      ...(styleConfig.weaveSpeed !== undefined && { weaveSpeed: styleConfig.weaveSpeed }),
      ...(styleConfig.lightwaveCount !== undefined && { lightwaveCount: styleConfig.lightwaveCount }),
      ...(styleConfig.lightwaveSpeed !== undefined && { lightwaveSpeed: styleConfig.lightwaveSpeed }),
      ...(styleConfig.lightwaveSegments !== undefined && { lightwaveSegments: styleConfig.lightwaveSegments }),
      ...(styleConfig.flowParticleCount !== undefined && { flowParticleCount: styleConfig.flowParticleCount }),
      ...(styleConfig.flowSpeed !== undefined && { flowSpeed: styleConfig.flowSpeed }),
      ...(styleConfig.showWaveform !== undefined && { showWaveform: styleConfig.showWaveform }),
      ...(styleConfig.particleTrail !== undefined && { particleTrail: styleConfig.particleTrail }),
      ...(styleConfig.particleTrailLength !== undefined && { particleTrailLength: styleConfig.particleTrailLength }),
      ...(styleConfig.mirror !== undefined && { mirror: styleConfig.mirror }),
      ...(styleConfig.particleColors && { particleColors: styleConfig.particleColors }),
    });
  }
  
  // 添加音频
  scene.addAudio({
    src: audioFile,
    cutFrom: AUDIO_START_TIME,
    cutTo: cutTo,
    duration: VIDEO_DURATION,
    startTime: 0,
    volume: 0.8,
  });
  
  console.log('\n开始渲染视频...\n');
  
  const videoMaker = builder.build();
  const outputDir = path.join(__dirname, 'output');
  await fs.ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, 'oscilloscope-new-effects.mp4');
  
  const startTime = Date.now();
  await videoMaker.export(outputPath);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ 视频导出完成: ${outputPath}`);
  console.log(`⏱️  总耗时: ${duration} 秒`);
  
  videoMaker.destroy();
  builder.destroy();
}

// 运行测试
testNewOscilloscopeEffects().catch(console.error);


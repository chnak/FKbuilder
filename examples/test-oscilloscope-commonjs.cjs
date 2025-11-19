/**
 * CommonJS 示波器测试脚本
 * 运行方式: node examples/test-oscilloscope-commonjs.cjs
 */
const fkbuilder = require('../dist/cjs/index.cjs');
const { VideoBuilder, getAudioDuration } = fkbuilder;
const path = require('path');
const fs = require('fs');

/**
 * 测试示波器元素 - 展示多种示波器样式
 */
async function testOscilloscope() {
  console.log('=== 测试示波器元素 (CommonJS) ===\n');
  
  // 检查音频文件是否存在
  const assetsDir = path.join(__dirname, '../assets');
  const audioFile = path.join(assetsDir, '1.mp3');
  
  // 尝试查找其他音频文件
  let audioFilePath = null;
  const audioExtensions = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'];
  
  if (fs.existsSync(audioFile)) {
    audioFilePath = audioFile;
  } else if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (audioExtensions.includes(ext)) {
        audioFilePath = path.join(assetsDir, file);
        console.log(`✅ 找到音频文件: ${file}`);
        break;
      }
    }
  }
  
  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    console.error(`❌ 音频文件不存在: ${audioFile}`);
    console.log('请确保 assets 目录下有音频文件（支持格式: mp3, m4a, wav, flac, aac, ogg）');
    return;
  }

  console.log(`📁 使用音频文件: ${path.basename(audioFilePath)}\n`);

  // 获取音频时长
  let audioDurationNum = 0;
  try {
    const audioDuration = await getAudioDuration(audioFilePath);
    audioDurationNum = Number(audioDuration) || 0;
  } catch (error) {
    console.warn(`⚠️  无法获取音频时长: ${error.message}`);
    console.log('将使用默认时长 10 秒');
    audioDurationNum = 10;
  }
  
  if (audioDurationNum <= 0) {
    console.warn('⚠️  音频时长为 0，使用默认时长 10 秒');
    audioDurationNum = 10;
  } else {
    console.log(`⏱️  音频时长: ${audioDurationNum.toFixed(2)} 秒\n`);
  }

  // 创建视频构建器
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });
  
  // 创建场景并添加示波器
  const scene = track.createScene({ duration: audioDurationNum })
    .addBackground({ color: '#1a1a1a' })
    .addText({
      text: "音频示波器演示 (CommonJS)",
      color: "#ffffff",
      fontSize: 60,
      x: "50%",
      y: "10%",
      textAlign: "center",
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
    });

  // ========== 示波器样式1: 线条样式 ==========
  console.log('📊 添加示波器 - 线条样式 (line)...');
  await scene.addOscilloscope({
    audioPath: audioFilePath,
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
    sensitivity: 1.0,
    windowSize: 0.1, // 显示窗口 0.1 秒
    startTime: 0,
    duration: audioDurationNum,
    zIndex: 1,
  });

  // ========== 示波器样式2: 柱状样式 ==========
  console.log('📊 添加示波器 - 柱状样式 (bars)...');
  await scene.addOscilloscope({
    audioPath: audioFilePath,
    x: '50%',
    y: '50%',
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
    duration: audioDurationNum,
    zIndex: 1,
  });

  // ========== 示波器样式3: 粒子样式 ==========
  console.log('📊 添加示波器 - 粒子样式 (particles)...');
  await scene.addOscilloscope({
    audioPath: audioFilePath,
    x: '50%',
    y: '75%',
    width: 400,
    height: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    style: 'particles',
    mirror: true,
    sensitivity: 1.5,
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
    duration: audioDurationNum,
    zIndex: 1,
  });

  // 添加音频
  console.log('🎵 添加音频轨道...');
  scene.addAudio({
    src: audioFilePath,
    startTime: 0,
    duration: audioDurationNum,
    volume: 0.8,
  });
  
  const videoMaker = builder.build();
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'test-oscilloscope-commonjs.mp4');
  
  console.log('\n🎬 开始渲染视频...');
  console.log(`📹 输出路径: ${outputPath}`);
  console.log(`⏱️  视频时长: ${audioDurationNum.toFixed(2)} 秒\n`);
  
  const startTime = Date.now();
  try {
    await videoMaker.export(outputPath, {
      usePipe: true,
      parallel: false, // CommonJS 模式下使用串行渲染
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ 视频导出完成: ${outputPath}`);
    console.log(`⏱️  总耗时: ${duration} 秒`);
    console.log(`📊 平均速度: ${(audioDurationNum / parseFloat(duration)).toFixed(2)}x`);
  } catch (error) {
    console.error('\n❌ 渲染失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
    process.exit(1);
  } finally {
    videoMaker.destroy();
    builder.destroy();
  }
  
  process.exit(0);
}

// 运行测试
testOscilloscope().catch(error => {
  console.error('❌ 测试失败:', error.message);
  if (error.stack) {
    console.error('错误堆栈:', error.stack);
  }
  process.exit(1);
});


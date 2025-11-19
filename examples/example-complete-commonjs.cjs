/**
 * CommonJS 完整示例 - 展示所有元素类型的使用
 * 运行方式: node examples/example-complete-commonjs.cjs
 */
const fkbuilder = require('../dist/cjs/index.cjs');
const { VideoBuilder } = fkbuilder;
const path = require('path');
const fs = require('fs');

async function completeExample() {
  console.log('🎬 CommonJS 完整示例 - 所有元素类型演示\n');
  console.log('='.repeat(60));

  const assetsDir = path.join(__dirname, '../assets');
  const outputDir = path.join(__dirname, '../output');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 查找资源文件
  let imageFiles = [];
  let videoFiles = [];
  
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    videoFiles = files.filter(f => /\.(mp4|webm|mov|avi|mkv)$/i.test(f));
  }

  console.log(`📸 找到 ${imageFiles.length} 个图片文件`);
  console.log(`🎬 找到 ${videoFiles.length} 个视频文件\n`);

  // 创建视频构建器
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1, name: '主轨道' });

  // ========== 场景1: 文本元素 ==========
  console.log('📝 场景1: 文本元素');
  const scene1 = mainTrack.createScene({ duration: 3, startTime: 0 })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: '文本元素演示',
      color: '#FFFFFF',
      fontSize: 80,
      x: '50%',
      y: '20%',
      textAlign: 'center',
      fontWeight: 'bold',
      duration: 3,
      animations: ['fadeIn'],
    })
    .addText({
      text: '普通文本',
      color: '#FFD700',
      fontSize: 56,
      x: '25%',
      y: '45%',
      textAlign: 'center',
      duration: 3,
    })
    .addText({
      text: '粗体文本',
      color: '#FF6B6B',
      fontSize: 56,
      x: '50%',
      y: '55%',
      textAlign: 'center',
      fontWeight: 'bold',
      duration: 3,
    })
    .addText({
      text: '斜体文本',
      color: '#4ECDC4',
      fontSize: 56,
      x: '75%',
      y: '65%',
      textAlign: 'center',
      fontStyle: 'italic',
      duration: 3,
    });

  // ========== 场景2: 图片元素 ==========
  if (imageFiles.length > 0) {
    console.log('📸 场景2: 图片元素');
    const imagePath = path.join(assetsDir, imageFiles[0]);
    
    const scene2 = mainTrack.createScene({ duration: 3, startTime: 3 })
      .addBackground({ color: '#16213e' })
      .addText({
        text: '图片元素演示',
        color: '#FFFFFF',
        fontSize: 80,
        x: '50%',
        y: '10%',
        textAlign: 'center',
        duration: 3,
      })
      .addImage({
        src: imagePath,
        x: '50%',
        y: '50%',
        width: '60%',
        height: '70%',
        anchor: [0.5, 0.5],
        fit: 'contain',
        duration: 3,
        animations: ['zoomIn'],
      });
  }

  // ========== 场景3: 视频元素 ==========
  if (videoFiles.length > 0) {
    console.log('🎬 场景3: 视频元素');
    const videoPath = path.join(assetsDir, videoFiles[0]);
    
    const scene3 = mainTrack.createScene({ duration: 3, startTime: 6 })
      .addBackground({ color: '#0f3460' })
      .addText({
        text: '视频元素演示',
        color: '#FFFFFF',
        fontSize: 80,
        x: '50%',
        y: '10%',
        textAlign: 'center',
        duration: 3,
      })
      .addVideo({
        src: videoPath,
        x: '50%',
        y: '50%',
        width: '60%',
        height: '70%',
        anchor: [0.5, 0.5],
        fit: 'cover',
        duration: 3,
        mute: true,
        loop: true,
      });
  }

  // ========== 场景4: 矩形和圆形元素 ==========
  console.log('🔷 场景4: 矩形和圆形元素');
  const scene4 = mainTrack.createScene({ duration: 3, startTime: 9 })
    .addBackground({ color: '#2c3e50' })
    .addText({
      text: '矩形和圆形元素演示',
      color: '#FFFFFF',
      fontSize: 80,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      duration: 3,
    })
    .addRect({
      x: '30%',
      y: '40%',
      width: 350,
      height: 250,
      bgcolor: '#3498db',
      borderRadius: 25,
      anchor: [0.5, 0.5],
      duration: 3,
      animations: ['fadeIn', 'slideInLeft'],
    })
    .addRect({
      x: '70%',
      y: '40%',
      width: 350,
      height: 250,
      bgcolor: '#e74c3c',
      borderRadius: 25,
      anchor: [0.5, 0.5],
      duration: 3,
      animations: ['fadeIn', 'slideInRight'],
    })
    .addCircle({
      x: '30%',
      y: '75%',
      radius: 120,
      bgcolor: '#2ecc71',
      anchor: [0.5, 0.5],
      duration: 3,
      animations: ['fadeIn', 'zoomIn'],
    })
    .addCircle({
      x: '70%',
      y: '75%',
      radius: 120,
      bgcolor: '#f39c12',
      anchor: [0.5, 0.5],
      duration: 3,
      animations: ['fadeIn', 'zoomIn'],
    });

  // ========== 场景5: SVG 元素 ==========
  console.log('🎨 场景5: SVG 元素');
  const starSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <polygon points="100,10 120,70 180,70 135,110 155,170 100,135 45,170 65,110 20,70 80,70" 
               fill="#4ecdc4" 
               stroke="#ffffff" 
               stroke-width="3"/>
    </svg>
  `;

  const heartSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <path d="M100,180 C100,180 20,120 20,80 C20,50 40,30 70,30 C85,30 100,40 100,55 C100,40 115,30 130,30 C160,30 180,50 180,80 C180,120 100,180 100,180 Z" 
            fill="#ff6b6b" 
            stroke="#ffffff" 
            stroke-width="2"/>
    </svg>
  `;

  const scene5 = mainTrack.createScene({ duration: 3, startTime: 12 })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: 'SVG 元素演示',
      color: '#FFFFFF',
      fontSize: 80,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      duration: 3,
    })
    .addSVG({
      svgString: starSVG,
      x: '30%',
      y: '50%',
      width: 350,
      height: 350,
      anchor: [0.5, 0.5],
      fit: 'contain',
      duration: 3,
      animations: ['fadeIn', 'rotateIn'],
    })
    .addSVG({
      svgString: heartSVG,
      x: '70%',
      y: '50%',
      width: 350,
      height: 350,
      anchor: [0.5, 0.5],
      fit: 'contain',
      duration: 3,
      animations: ['fadeIn', 'zoomIn'],
    });

  // ========== 添加转场效果 ==========
  console.log('✨ 添加转场效果');
  const scenes = mainTrack.getScenes();
  
  if (scenes.length > 1) {
    mainTrack.addTransition({
      name: 'fade',
      duration: 0.5,
      startTime: 3,
    });
  }
  
  if (scenes.length > 2) {
    mainTrack.addTransition({
      name: 'directional-left',
      duration: 0.5,
      startTime: 6,
    });
  }
  
  if (scenes.length > 3) {
    mainTrack.addTransition({
      name: 'CircleCrop',
      duration: 0.5,
      startTime: 9,
    });
  }
  
  if (scenes.length > 4) {
    mainTrack.addTransition({
      name: 'wipeLeft',
      duration: 0.5,
      startTime: 12,
    });
  }

  // ========== 导出视频 ==========
  const outputPath = path.join(outputDir, 'example-complete-commonjs.mp4');
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 构建信息:');
  console.log(`  总时长: ${builder.getTotalDuration()} 秒`);
  console.log(`  轨道数: ${builder.getTracks().length}`);
  console.log(`  场景数: ${mainTrack.getScenes().length}`);
  console.log(`  转场数: ${mainTrack.transitions.length}`);
  console.log('='.repeat(60));
  
  try {
    console.log('\n🎬 开始渲染视频（CommonJS 模式）...');
    const startTime = Date.now();
    
    await builder.render(outputPath, {
        parallel: true,
        usePipe: true,
        maxWorkers: 4,
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ 渲染完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log(`⏱️  耗时: ${duration} 秒`);
    const totalFrames = builder.getTotalDuration() * 30;
    console.log(`📊 平均每帧: ${(duration / totalFrames * 1000).toFixed(2)} ms (${totalFrames}帧)`);
    
  } catch (error) {
    console.error('\n❌ 渲染失败:', error.message);
    if (error.stack) {
      console.error('详细错误:', error.stack.split('\n').slice(0, 10).join('\n'));
    }
    process.exit(1);
  } finally {
    builder.destroy();
  }
  
  // 确保程序退出
  process.exit(0);
}

// 运行示例
completeExample().catch(error => {
  console.error('❌ 示例运行失败:', error);
  process.exit(1);
});


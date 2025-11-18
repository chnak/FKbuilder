import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试图片和视频元素的统一渲染方式和属性支持
 */
async function testImageVideoUnified() {
  console.log('🧪 测试图片和视频元素的统一渲染方式...\n');

  const assetsDir = path.join(__dirname, '../assets');
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);

  // 查找图片和视频文件
  const imageFiles = [];
  const videoFiles = [];
  
  if (await fs.pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir);
    imageFiles.push(...files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)));
    videoFiles.push(...files.filter(f => /\.(mp4|webm|mov|avi|mkv)$/i.test(f)));
  }

  if (imageFiles.length === 0 && videoFiles.length === 0) {
    console.log('⚠️  未找到图片或视频文件');
    console.log('   请将图片或视频放在 assets 目录中');
    return;
  }

  console.log(`📸 找到 ${imageFiles.length} 个图片文件`);
  console.log(`🎬 找到 ${videoFiles.length} 个视频文件\n`);

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 4;

  // 场景1: 基本显示对比 - 验证位置和尺寸计算一致
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景1: 基本显示对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene1 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#1a1a2e' })
      .addText({
        text: "基本显示对比 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 图片 - 左侧
    scene1.addText({
      text: "图片",
      color: "#FFFFFF",
      fontSize: 40,
      x: "25%",
      y: "20%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
    }).addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "40%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
    });

    // 视频 - 右侧
    scene1.addText({
      text: "视频",
      color: "#FFFFFF",
      fontSize: 40,
      x: "75%",
      y: "20%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
    }).addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "40%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
    });

    currentTime += sceneDuration;
  }

  // 场景2: 边框效果对比
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景2: 边框效果对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene2 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#16213e' })
      .addText({
        text: "边框效果 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 图片 - 带边框
    scene2.addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      borderWidth: 10,
      borderColor: '#FFD700',
      borderRadius: 20,
    });

    // 视频 - 带边框
    scene2.addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
      borderWidth: 10,
      borderColor: '#FFD700',
      borderRadius: 20,
    });

    currentTime += sceneDuration;
  }

  // 场景3: 阴影效果对比
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景3: 阴影效果对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene3 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#0f3460' })
      .addText({
        text: "阴影效果 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 图片 - 带阴影
    scene3.addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      shadowBlur: 30,
      shadowColor: '#FF0000',
      shadowOffsetX: 15,
      shadowOffsetY: 15,
    });

    // 视频 - 带阴影
    scene3.addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
      shadowBlur: 30,
      shadowColor: '#FF0000',
      shadowOffsetX: 15,
      shadowOffsetY: 15,
    });

    currentTime += sceneDuration;
  }

  // 场景4: 滤镜效果对比
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景4: 滤镜效果对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene4 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#2c3e50' })
      .addText({
        text: "滤镜效果 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 图片 - 亮度/对比度/饱和度调整
    scene4.addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      brightness: 1.3,
      contrast: 1.2,
      saturation: 1.4,
    });

    // 视频 - 亮度/对比度/饱和度调整
    scene4.addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
      brightness: 1.3,
      contrast: 1.2,
      saturation: 1.4,
    });

    currentTime += sceneDuration;
  }

  // 场景5: 翻转效果对比
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景5: 翻转效果对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene5 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#533483' })
      .addText({
        text: "翻转效果 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 图片 - 水平翻转
    scene5.addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      flipX: true,
    });

    // 视频 - 水平翻转
    scene5.addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
      flipX: true,
    });

    currentTime += sceneDuration;
  }

  // 场景6: 混合模式对比
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景6: 混合模式对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene6 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#8b2635' })
      .addText({
        text: "混合模式 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 图片 - Screen 混合模式
    scene6.addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      blendMode: 'screen',
    });

    // 视频 - Screen 混合模式
    scene6.addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
      blendMode: 'screen',
    });

    currentTime += sceneDuration;
  }

  // 场景7: 毛玻璃效果对比
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景7: 毛玻璃效果对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene7 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#1e3a5f' })
      .addText({
        text: "毛玻璃效果 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 背景图片
    scene7.addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "100%",
      height: "100%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      zIndex: 0,
    });

    // 图片 - 毛玻璃效果
    scene7.addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      zIndex: 10,
      glassEffect: true,
      glassBlur: 20,
      glassOpacity: 0.6,
      glassTint: '#ffffff',
      glassBorder: true,
      glassBorderColor: '#ffffff',
      glassBorderWidth: 2,
      borderRadius: 20,
    });

    // 视频 - 毛玻璃效果
    scene7.addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
      zIndex: 10,
      glassEffect: true,
      glassBlur: 20,
      glassOpacity: 0.6,
      glassTint: '#ffffff',
      glassBorder: true,
      glassBorderColor: '#ffffff',
      glassBorderWidth: 2,
      borderRadius: 20,
    });

    currentTime += sceneDuration;
  }

  // 场景8: 综合效果对比 - 所有效果叠加
  if (imageFiles.length > 0 && videoFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`📋 场景8: 综合效果对比 (${currentTime}s - ${currentTime + sceneDuration}s)`);
    
    const scene8 = mainTrack.createScene({ duration: sceneDuration, startTime: currentTime })
      .addBackground({ color: '#2d1b3d' })
      .addText({
        text: "综合效果 - 图片 vs 视频",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "8%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: sceneDuration,
      });

    // 图片 - 所有效果叠加
    scene8.addImage({
      src: imagePath,
      x: "25%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      borderWidth: 8,
      borderColor: '#00FF00',
      borderRadius: 15,
      shadowBlur: 25,
      shadowColor: '#0000FF',
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      brightness: 1.2,
      contrast: 1.1,
      saturation: 1.3,
      flipX: false,
      blendMode: 'multiply',
    });

    // 视频 - 所有效果叠加
    scene8.addVideo({
      src: videoPath,
      x: "75%",
      y: "55%",
      width: "35%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      fit: 'cover',
      mute: true,
      borderWidth: 8,
      borderColor: '#00FF00',
      borderRadius: 15,
      shadowBlur: 25,
      shadowColor: '#0000FF',
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      brightness: 1.2,
      contrast: 1.1,
      saturation: 1.3,
      flipX: false,
      blendMode: 'multiply',
    });

    currentTime += sceneDuration;
  }

  const outputPath = path.join(outputDir, 'test-image-video-unified.mp4');

  try {
    console.log('\n🎬 开始渲染...');
    console.log(`📊 总时长: ${currentTime} 秒`);
    const startTime = Date.now();
    const videoMaker = builder.build();
    await videoMaker.export(outputPath);
    const endTime = Date.now();
    
    console.log('');
    console.log('✅ 图片和视频统一渲染测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log(`⏱️  耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
    console.log('');
    console.log('📋 测试场景:');
    console.log('   1. 基本显示对比');
    console.log('   2. 边框效果对比');
    console.log('   3. 阴影效果对比');
    console.log('   4. 滤镜效果对比');
    console.log('   5. 翻转效果对比');
    console.log('   6. 混合模式对比');
    console.log('   7. 毛玻璃效果对比');
    console.log('   8. 综合效果对比');
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('详细错误:', error.stack);
    }
  }
}

testImageVideoUnified().catch(console.error);



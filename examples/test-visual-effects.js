import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试图片和视频的视觉效果
 */
async function testVisualEffects() {
  console.log('🎨 视觉效果测试...\n');

  const assetsDir = path.join(__dirname, '../assets');
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);

  // 查找图片和视频文件
  const imageFiles = [];
  const videoFiles = [];
  
  if (await fs.pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir);
    imageFiles.push(...files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)));
    videoFiles.push(...files.filter(f => /\.(mp4|webm|mov)$/i.test(f)));
  }

  if (imageFiles.length === 0 && videoFiles.length === 0) {
    console.log('⚠️  未找到图片或视频文件');
    return;
  }

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 场景1: 图片滤镜效果
  if (imageFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    console.log(`📸 场景1: 图片滤镜效果 - ${imageFiles[0]}`);
    
    const scene1 = mainTrack.createScene({ duration: 3, startTime: 0 })
      .addBackground({ color: '#1a1a2e' })
      .addText({
        text: "滤镜效果展示",
        color: "#FFFFFF",
        fontSize: 60,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 3,
      });

    // 原始图片
    scene1.addImage({
      src: imagePath,
      x: "25%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
    });

    // 亮度调整
    scene1.addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      brightness: 1.5, // 更亮
    });

    // 对比度调整
    scene1.addImage({
      src: imagePath,
      x: "75%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      contrast: 1.5, // 更高对比度
    });
  }

  // 场景2: 图片混合模式和边框
  if (imageFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    console.log(`🎭 场景2: 混合模式和边框 - ${imageFiles[0]}`);
    
    const scene2 = mainTrack.createScene({ duration: 3, startTime: 3 })
      .addBackground({ color: '#16213e' })
      .addText({
        text: "混合模式 & 边框",
        color: "#FFFFFF",
        fontSize: 60,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 3,
      });

    // Screen 混合模式
    scene2.addImage({
      src: imagePath,
      x: "25%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      blendMode: 'screen',
    });

    // 带边框的图片
    scene2.addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      borderWidth: 10,
      borderColor: '#FFD700',
      borderRadius: 20,
    });

    // 带阴影的图片
    scene2.addImage({
      src: imagePath,
      x: "75%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      shadowBlur: 30,
      shadowColor: '#FF0000',
      shadowOffsetX: 10,
      shadowOffsetY: 10,
    });
  }

  // 场景3: 图片翻转和色彩调整
  if (imageFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    console.log(`🔄 场景3: 翻转和色彩调整 - ${imageFiles[0]}`);
    
    const scene3 = mainTrack.createScene({ duration: 3, startTime: 6 })
      .addBackground({ color: '#0f3460' })
      .addText({
        text: "翻转 & 色彩调整",
        color: "#FFFFFF",
        fontSize: 60,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 3,
      });

    // 水平翻转
    scene3.addImage({
      src: imagePath,
      x: "25%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      flipX: true,
    });

    // 饱和度调整
    scene3.addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      saturation: 1.5, // 更高饱和度
    });

    // 灰度效果
    scene3.addImage({
      src: imagePath,
      x: "75%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      grayscale: 0.8, // 80% 灰度
    });
  }

  // 场景4: 毛玻璃效果
  if (imageFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    console.log(`🔮 场景4: 毛玻璃效果 - ${imageFiles[0]}`);
    
    const scene4 = mainTrack.createScene({ duration: 3, startTime: 9 })
      .addBackground({ color: '#2c3e50' })
      .addText({
        text: "毛玻璃效果",
        color: "#FFFFFF",
        fontSize: 60,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 3,
      });

    // 背景图片（作为毛玻璃效果的背景）
    scene4.addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "100%",
      height: "100%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      zIndex: 0,
    });

    // 毛玻璃效果图片1 - 白色毛玻璃
    scene4.addImage({
      src: imagePath,
      x: "25%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      zIndex: 10,
      glassEffect: true,
      glassBlur: 15,
      glassOpacity: 0.6,
      glassTint: '#ffffff',
      glassBorder: true,
      glassBorderColor: '#ffffff',
      glassBorderWidth: 2,
      borderRadius: 20,
    });

    // 毛玻璃效果图片2 - 彩色毛玻璃
    scene4.addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      zIndex: 10,
      glassEffect: true,
      glassBlur: 20,
      glassOpacity: 0.5,
      glassTint: '#e8f4f8',
      glassBorder: true,
      glassBorderColor: '#b0d4e3',
      glassBorderWidth: 2,
      borderRadius: 20,
    });

    // 毛玻璃效果图片3 - 强模糊
    scene4.addImage({
      src: imagePath,
      x: "75%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
      zIndex: 10,
      glassEffect: true,
      glassBlur: 30,
      glassOpacity: 0.7,
      glassTint: '#ffffff',
      glassBorder: true,
      glassBorderColor: '#ffffff',
      glassBorderWidth: 1,
      borderRadius: 20,
    });
  }

  // 场景5: 视频效果（如果有视频文件）
  if (videoFiles.length > 0) {
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`🎬 场景5: 视频视觉效果 - ${videoFiles[0]}`);
    
    const scene5 = mainTrack.createScene({ duration: 5, startTime: 12 })
      .addBackground({ color: '#533483' })
      .addText({
        text: "视频视觉效果",
        color: "#FFFFFF",
        fontSize: 60,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 5,
      });

    // 原始视频
    scene5.addVideo({
      src: videoPath,
      x: "25%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 5,
      fit: 'cover',
      mute: true,
    });

    // 带边框的视频
    scene5.addVideo({
      src: videoPath,
      x: "50%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 5,
      fit: 'cover',
      mute: true,
      borderWidth: 8,
      loop: true,
      borderColor: '#00FF00',
      borderRadius: 15,
    });

    // 带滤镜的视频
    scene5.addVideo({
      src: videoPath,
      x: "75%",
      y: "50%",
      width: "20%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 5,
      fit: 'cover',
      mute: true,
      brightness: 1.3,
      loop: true,
      contrast: 1.2,
      saturation: 1.4,
    });
  }

  const outputPath = path.join(outputDir, 'test-visual-effects.mp4');

  try {
    console.log('\n🎬 开始渲染...');
    const startTime = Date.now();
    const videoMaker = builder.build();
    await videoMaker.export(outputPath);
    const endTime = Date.now();
    
    console.log('');
    console.log('✅ 视觉效果测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log(`⏱️  耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('详细错误:', error.stack);
    }
  }
}

testVisualEffects().catch(console.error);


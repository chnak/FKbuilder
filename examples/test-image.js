import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试图片元素功能
 */
async function testImage() {
  console.log('🧪 测试图片元素功能...\n');

  // 检查 assets 目录中是否有图片文件
  const assetsDir = path.join(__dirname, '../assets');
  const imageFiles = [];
  
  if (await fs.pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir);
    imageFiles.push(...files.filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
    ));
  }

  if (imageFiles.length === 0) {
    console.log('⚠️  未找到图片文件，请将图片放在 assets 目录中');
    console.log('   支持的格式: jpg, jpeg, png, gif, webp');
    return;
  }

  console.log(`📸 找到 ${imageFiles.length} 个图片文件:`);
  imageFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('');

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 测试场景1: 基本图片显示
  const imagePath = path.join(assetsDir, imageFiles[0]);
  console.log(`📷 使用图片: ${imageFiles[0]}`);
  
  const scene1 = mainTrack.createScene({ duration: 3, startTime: 0 })
    .addBackground()
    .addText({
      text: "基本图片显示",
      color: "#FFFFFF",
      fontSize: 50,
      x: "50%",
      y: "10%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 3,
    })
    .addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "80%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'contain', // 完整显示图片
    });

  // 测试场景2: 图片动画
  const scene2 = mainTrack.createScene({ duration: 4, startTime: 3 })
    .addBackground()
    .addText({
      text: "图片淡入淡出",
      color: "#FFFFFF",
      fontSize: 50,
      x: "50%",
      y: "10%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
    })
    .addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "80%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 4,
      fit: 'cover', // 覆盖整个区域
      animations: ['fadeIn', 'fadeOut'],
    });

  // 测试场景3: 图片缩放动画
  const scene3 = mainTrack.createScene({ duration: 4, startTime: 7 })
    .addBackground()
    .addText({
      text: "图片缩放动画",
      color: "#FFFFFF",
      fontSize: 50,
      x: "50%",
      y: "10%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
    })
    .addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "60%",
      height: "50%",
      anchor: [0.5, 0.5],
      duration: 4,
      fit: 'contain',
      animations: ['zoomIn', 'zoomOut'],
    });

  // 测试场景4: 图片滑入动画
  const scene4 = mainTrack.createScene({ duration: 4, startTime: 11 })
    .addBackground()
    .addText({
      text: "图片滑入动画",
      color: "#FFFFFF",
      fontSize: 50,
      x: "50%",
      y: "10%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
    })
    .addImage({
      src: imagePath,
      x: "50%",
      y: "50%",
      width: "80%",
      height: "60%",
      anchor: [0.5, 0.5],
      duration: 4,
      fit: 'contain',
      animations: ['slideInLeft', 'slideOutRight'],
    });

  // 如果有多个图片，测试多图片场景
  if (imageFiles.length > 1) {
    const imagePath2 = path.join(assetsDir, imageFiles[1]);
    const scene5 = mainTrack.createScene({ duration: 3, startTime: 15 })
      .addBackground()
      .addText({
        text: "多图片切换",
        color: "#FFFFFF",
        fontSize: 50,
        x: "50%",
        y: "10%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 3,
      })
      .addImage({
        src: imagePath,
        x: "30%",
        y: "50%",
        width: "35%",
        height: "50%",
        anchor: [0.5, 0.5],
        duration: 3,
        fit: 'cover',
        animations: ['fadeIn'],
      })
      .addImage({
        src: imagePath2,
        x: "70%",
        y: "50%",
        width: "35%",
        height: "50%",
        anchor: [0.5, 0.5],
        duration: 3,
        fit: 'cover',
        animations: ['fadeIn'],
      });
  }

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-image.mp4');

  try {
    console.log('🎬 开始渲染...');
    const videoMaker = builder.build();
    await videoMaker.export(outputPath);
    
    console.log('');
    console.log('✅ 图片测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testImage().catch(console.error);


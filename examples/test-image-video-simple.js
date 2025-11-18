import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简单的图片和视频测试
 */
async function testImageVideoSimple() {
  console.log('🧪 简单测试图片和视频元素...\n');

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

  // 场景1: 图片测试
  if (imageFiles.length > 0) {
    const imagePath = path.join(assetsDir, imageFiles[0]);
    console.log(`📷 测试图片: ${imageFiles[0]}`);
    
    const scene1 = mainTrack.createScene({ duration: 3, startTime: 0 })
      .addBackground({ color: '#1a1a2e' })
      .addText({
        text: "图片测试",
        fillColor: "#FFFFFF",
        fontSize: 60,
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
        width: "60%",
        height: "70%",
        anchor: [0.5, 0.5],
        duration: 3,
        fit: 'cover',
      });
  }

  // 场景2: 视频测试
  if (videoFiles.length > 0) {
    const videoPath = path.join(assetsDir, videoFiles[0]);
    console.log(`🎬 测试视频: ${videoFiles[0]}`);
    
    const scene2 = mainTrack.createScene({ duration: 3, startTime: 3 })
      .addBackground({ color: '#16213e' })
      .addText({
        text: "视频测试",
        color: "#FFFFFF",
        fontSize: 60,
        x: "50%",
        y: "10%",
        textAlign: "center",
        split: 'letter',
        splitDelay: 0.1,
        splitDuration: 0.5,
        anchor: [0.5, 0.5],
        duration: 3
      })
      .addVideo({
        src: videoPath,
        x: "50%",
        y: "50%",
        width: "60%",
        height: "70%",
        anchor: [0.5, 0.5],
        duration: 3,
        fit: 'cover',
        mute: true,
      });
  }

  const outputPath = path.join(outputDir, 'test-image-video-simple.mp4');

  try {
    console.log('\n🎬 开始渲染...');
    const startTime = Date.now();
    await builder.render(outputPath,{
      parallel: true,
      maxWorkers: 4,
    });
    const endTime = Date.now();
    
    console.log('');
    console.log('✅ 测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log(`⏱️  耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('详细错误:', error.stack);
    }
  }
}

testImageVideoSimple().catch(console.error);



import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试随机背景颜色功能
 */
async function testRandomBackground() {
  console.log('🧪 测试随机背景颜色功能...\n');

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 创建多个场景，不指定背景颜色，应该随机分配
  for (let i = 0; i < 5; i++) {
    const scene = mainTrack.createScene({ duration: 2, startTime: i * 2 })
      .addBackground() // 不指定颜色，应该随机分配
      .addText({
        text: `随机背景 ${i + 1}`,
        color: "#FFFFFF",
        fontSize: 60,
        x: "50%",
        y: "50%",
        textAlign: "center",
        anchor: [0.5, 0.5],
        duration: 2,
      });
    
    console.log(`场景 ${i + 1} 背景颜色: ${scene.backgroundLayer.config.backgroundColor}`);
  }

  // 创建一个指定颜色的场景作为对比
  const sceneWithColor = mainTrack.createScene({ duration: 2, startTime: 10 })
    .addBackground({ color: "#FF0000" }) // 指定红色
    .addText({
      text: "指定红色背景",
      color: "#FFFFFF",
      fontSize: 60,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 2,
    });
  
  console.log(`指定颜色的场景背景: ${sceneWithColor.backgroundLayer.config.backgroundColor}`);

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-random-background.mp4');

  try {
    console.log('\n🎬 开始渲染...');
    const videoMaker = builder.build();
    await videoMaker.export(outputPath);
    
    console.log('');
    console.log('✅ 测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testRandomBackground().catch(console.error);


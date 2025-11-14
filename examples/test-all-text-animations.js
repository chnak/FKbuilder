import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试所有文本动画效果
 */
async function testAllTextAnimations() {
  console.log('🧪 测试所有文本动画效果...\n');

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 场景1: 淡入淡出动画
  const scene1 = mainTrack.createScene({ duration: 3, startTime: 0 })
    .addBackground({ color: "#1a1a2e" })
    .addText({
      text: "淡入淡出",
      color: "#FFFFFF",
      fontSize: 60,
      x: "50%",
      y: "30%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 3,
      animations: ['fadeIn', 'fadeOut'],
    });

  // 场景2: 滑入动画
  const scene2 = mainTrack.createScene({ duration: 4, startTime: 3 })
    .addBackground({ color: "#16213e" })
    .addText({
      text: "从上方滑入",
      color: "#00D4FF",
      fontSize: 50,
      x: "50%",
      y: "25%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['slideInTop'],
    })
    .addText({
      text: "从下方滑入",
      color: "#FF6B6B",
      fontSize: 50,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['slideInBottom'],
    })
    .addText({
      text: "从左侧滑入",
      color: "#4ECDC4",
      fontSize: 50,
      x: "50%",
      y: "75%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['slideInLeft'],
    });

  // 场景3: 缩放动画
  const scene3 = mainTrack.createScene({ duration: 4, startTime: 7 })
    .addBackground({ color: "#0f3460" })
    .addText({
      text: "放大进入",
      color: "#FFD93D",
      fontSize: 60,
      x: "50%",
      y: "40%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['zoomIn', 'zoomOut'],
    })
    .addText({
      text: "Big In",
      color: "#95E1D3",
      fontSize: 50,
      x: "50%",
      y: "60%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['bigIn', 'bigOut'],
    });

  // 场景4: 旋转动画
  const scene4 = mainTrack.createScene({ duration: 4, startTime: 11 })
    .addBackground({ color: "#1e3a5f" })
    .addText({
      text: "旋转进入",
      color: "#FF6B9D",
      fontSize: 55,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['rotateIn', 'rotateOut'],
    });

  // 场景5: 弹跳动画
  const scene5 = mainTrack.createScene({ duration: 4, startTime: 15 })
    .addBackground({ color: "#2d3561" })
    .addText({
      text: "弹跳效果",
      color: "#C44569",
      fontSize: 60,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['bounceIn', 'bounceOut'],
    });

  // 场景6: 组合动画（淡入+移动）
  const scene6 = mainTrack.createScene({ duration: 4, startTime: 19 })
    .addBackground({ color: "#1a1a2e" })
    .addText({
      text: "淡入上移",
      color: "#A8E6CF",
      fontSize: 50,
      x: "50%",
      y: "40%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['fadeInUp', 'fadeOutUp'],
    })
    .addText({
      text: "淡入下移",
      color: "#FFD3B6",
      fontSize: 50,
      x: "50%",
      y: "60%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 4,
      animations: ['fadeInDown', 'fadeOutDown'],
    });

  // 场景7: 分割文本 - 逐字进入
  const scene7 = mainTrack.createScene({ duration: 5, startTime: 23 })
    .addBackground({ color: "#16213e" })
    .addText({
      text: "逐字进入",
      color: "#00D4FF",
      fontSize: 70,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 5,
      split: 'letter',
      splitDelay: 0.1,
      splitDuration: 0.5,
      animations: ['fadeIn'],
    });

  // 场景8: 分割文本 - 逐字退出
  const scene8 = mainTrack.createScene({ duration: 5, startTime: 28 })
    .addBackground({ color: "#0f3460" })
    .addText({
      text: "逐字退出",
      color: "#FF6B6B",
      fontSize: 70,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 5,
      split: 'letter',
      splitDelay: 0.1,
      splitDuration: 0.5,
      animations: ['fadeOut'],
    });

  // 场景9: 分割文本 - 逐字进入和退出
  const scene9 = mainTrack.createScene({ duration: 5, startTime: 33 })
    .addBackground({ color: "#1e3a5f" })
    .addText({
      text: "逐字动画",
      color: "#FFD93D",
      fontSize: 70,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 5,
      split: 'letter',
      splitDelay: 0.1,
      splitDuration: 0.5,
      animations: ['bigIn', 'bigOut'],
    });

  // 场景10: 分割文本 - 逐字滑入
  const scene10 = mainTrack.createScene({ duration: 5, startTime: 38 })
    .addBackground({ color: "#2d3561" })
    .addText({
      text: "逐字滑入",
      color: "#4ECDC4",
      fontSize: 60,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 5,
      split: 'letter',
      splitDelay: 0.15,
      splitDuration: 0.6,
      animations: ['slideInLeft'],
    });

  // 场景11: 分割文本 - 逐字旋转
  const scene11 = mainTrack.createScene({ duration: 5, startTime: 43 })
    .addBackground({ color: "#1a1a2e" })
    .addText({
      text: "逐字旋转",
      color: "#FF6B9D",
      fontSize: 60,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 5,
      split: 'letter',
      splitDelay: 0.1,
      splitDuration: 0.5,
      animations: ['rotateIn', 'rotateOut'],
    });

  // 场景12: 分割文本 - 逐字弹跳
  const scene12 = mainTrack.createScene({ duration: 5, startTime: 48 })
    .addBackground({ color: "#16213e" })
    .addText({
      text: "逐字弹跳",
      color: "#C44569",
      fontSize: 60,
      x: "50%",
      y: "50%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: 5,
      split: 'letter',
      splitDelay: 0.1,
      splitDuration: 0.5,
      animations: ['bounceIn', 'bounceOut'],
    });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-all-text-animations.mp4');

  try {
    console.log('🎬 开始渲染所有文本动画...');
    console.log('📋 测试场景：');
    console.log('  1. 淡入淡出动画');
    console.log('  2. 滑入动画（上/下/左）');
    console.log('  3. 缩放动画（zoomIn/zoomOut, bigIn/bigOut）');
    console.log('  4. 旋转动画');
    console.log('  5. 弹跳动画');
    console.log('  6. 组合动画（淡入+移动）');
    console.log('  7. 分割文本 - 逐字进入');
    console.log('  8. 分割文本 - 逐字退出');
    console.log('  9. 分割文本 - 逐字进入和退出');
    console.log('  10. 分割文本 - 逐字滑入');
    console.log('  11. 分割文本 - 逐字旋转');
    console.log('  12. 分割文本 - 逐字弹跳');
    console.log('');
    
    const videoMaker = builder.build();
    await videoMaker.export(outputPath);
    
    console.log('');
    console.log('✅ 所有文本动画测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log(`⏱️  总时长: 53 秒`);
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testAllTextAnimations().catch(console.error);


/**
 * Emoji 渲染测试
 */
import { VideoBuilder, getFontFallbackChain, initDefaultFont } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化字体（包括系统字体）
initDefaultFont();

async function testEmoji() {
  console.log('🎨 测试 Emoji 渲染...\n');
  console.log('字体回退链:', getFontFallbackChain('Arial'));

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 场景1：基础 Emoji 展示
  const scene1 = mainTrack.createScene({ duration: 5, startTime: 0 })
    .addBackground({ color: '#1a1a2e' })

    .addText({
      text: '😀 🎉 🚀 Emoji 测试',
      color: '#ffffff',
      fontSize: 80,
      x: '50%',
      y: '25%',
      textAlign: 'center',
      duration: 5,
      startTime: 0,
      fontFamily: 'Arial',
      animations: ['fadeIn'],
    });

  // Emoji 网格展示
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩'];
  const cols = 4;
  const startX = 25; // 25%
  const startY = 40; // 40%
  const spacingX = 12; // 12%
  const spacingY = 15; // 15%

  emojis.forEach((emoji, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * spacingX;
    const y = startY + row * spacingY;

    scene1.addText({
      text: emoji,
      color: '#ffffff',
      fontSize: 64,
      x: `${x}%`,
      y: `${y}%`,
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.2 + i * 0.05,
      fontFamily: 'Arial',
      animations: [
        { type: 'scale', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.3, delay: 0.2 + i * 0.05, easing: 'easeOut' },
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.3, delay: 0.2 + i * 0.05 },
      ],
    });
  });

  // 场景2：彩色 Emoji
  const scene2 = mainTrack.createScene({ duration: 4, startTime: 5 })
    .addBackground({ color: '#0f0f23' })

    .addText({
      text: '🎨 彩色表情符号 🎨',
      color: '#ff6b6b',
      fontSize: 72,
      x: '50%',
      y: '20%',
      textAlign: 'center',
      duration: 4,
      startTime: 0,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 动物 Emoji
  const animalEmojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
  animalEmojis.forEach((emoji, i) => {
    const x = 15 + i * 6.5;
    scene2.addText({
      text: emoji,
      color: '#ffffff',
      fontSize: 56,
      x: `${x}%`,
      y: '50%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.3 + i * 0.08,
      fontFamily: 'Arial',
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.3, delay: 0.3 + i * 0.08 },
        { type: 'slide', fromY: 20, toY: 0, duration: 0.3, delay: 0.3 + i * 0.08 },
      ],
    });
  });

  // 食物 Emoji
  const foodEmojis = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑'];
  foodEmojis.forEach((emoji, i) => {
    const x = 15 + i * 6.5;
    scene2.addText({
      text: emoji,
      color: '#ffffff',
      fontSize: 56,
      x: `${x}%`,
      y: '70%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.5 + i * 0.08,
      fontFamily: 'Arial',
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.3, delay: 0.5 + i * 0.08 },
        { type: 'slide', fromY: -20, toY: 0, duration: 0.3, delay: 0.5 + i * 0.08 },
      ],
    });
  });

  // 场景3：大号 Emoji
  const scene3 = mainTrack.createScene({ duration: 3, startTime: 9 })
    .addBackground({ color: '#2d1b4e' })

    .addText({
      text: '👍',
      color: '#ffffff',
      fontSize: 300,
      x: '50%',
      y: '45%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 0,
      fontFamily: 'Arial',
      animations: [
        { type: 'scale', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 1, easing: 'easeOut' },
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
      ],
    })

    .addText({
      text: '👍 ❤️ 😂',
      color: '#ffffff',
      fontSize: 120,
      x: '50%',
      y: '80%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 0.5,
      fontFamily: 'Arial',
      animations: ['fadeIn'],
    });

  // 添加转场
  mainTrack.addTransition({ name: 'CrossZoom', duration: 0.5 });
  mainTrack.addTransition({ name: 'Dreamy', duration: 0.5 });

  // 导出视频
  const outputPath = path.join(__dirname, '../output/test-emoji.mp4');
  console.log('🎬 开始导出视频...\n');

  await builder.export(outputPath, {
    usePipe: true,
    parallel: false,
  });

  console.log('\n✅ Emoji 测试完成！');
  console.log(`📁 输出文件: ${outputPath}`);
}

testEmoji().catch(console.error);

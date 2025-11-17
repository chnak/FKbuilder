import { VideoBuilder } from '../src/builder/VideoBuilder.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建视频构建器
const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 30,
  backgroundColor: '#1a1a2e',
});

// 创建主轨道
const mainTrack = builder.createTrack('main');

// ========== 场景1：基本竖排文本 ==========
const scene1 = mainTrack.createScene({ duration: 3 })
  .addBackground({ color: '#16213e' })
  .addText({
    text: '竖排文本',
    x: '50%',
    y: '50%',
    fontSize: 80,
    color: '#ffffff',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 30,
    anchor: [0.5, 0.5],
    duration: 3,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
    ],
  });

// ========== 场景2：竖排文本分割动画（逐字） ==========
const scene2 = mainTrack.createScene({ duration: 5 })
  .addBackground({ color: '#0f3460' })
  .addText({
    text: '逐字显示',
    x: '50%',
    y: '50%',
    fontSize: 72,
    color: '#e94560',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 25,
    anchor: [0.5, 0.5],
    split: 'letter',
    splitDelay: 0.15,
    splitDuration: 0.4,
    duration: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.4 },
      { type: 'slide', fromX: 0, toX: 0, fromY: -30, toY: 0, duration: 0.4 },
    ],
  });

// ========== 场景3：竖排文本分割动画（逐词） ==========
const scene3 = mainTrack.createScene({ duration: 6 })
  .addBackground({ color: '#533483' })
  .addText({
    text: '逐词 显示 效果',
    x: '50%',
    y: '50%',
    fontSize: 64,
    color: '#f5a623',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 20,
    anchor: [0.5, 0.5],
    split: 'word',
    splitDelay: 0.2,
    splitDuration: 0.5,
    duration: 6,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
      { type: 'scale', fromScaleX: 0.5, toScaleX: 1, fromScaleY: 0.5, toScaleY: 1, duration: 0.5 },
    ],
  });

// ========== 场景4：竖排文本多种动画效果 ==========
const scene4 = mainTrack.createScene({ duration: 8 })
  .addBackground({ color: '#1e3c72' })
  .addText({
    text: '动画效果',
    x: '30%',
    y: '50%',
    fontSize: 70,
    color: '#00d4ff',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 28,
    anchor: [0.5, 0.5],
    duration: 8,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
      { type: 'slide', fromX: 0, toX: 0, fromY: -100, toY: 0, duration: 1.5, delay: 0 },
      { type: 'scale', fromScaleX: 0.8, toScaleX: 1.2, fromScaleY: 0.8, toScaleY: 1.2, duration: 2, delay: 2 },
      { type: 'scale', fromScaleX: 1.2, toScaleX: 1, fromScaleY: 1.2, toScaleY: 1, duration: 1, delay: 4 },
      { type: 'rotate', fromRotation: 0, toRotation: 360, duration: 2, delay: 5 },
    ],
  })
  .addText({
    text: '旋转缩放',
    x: '70%',
    y: '50%',
    fontSize: 70,
    color: '#ff6b9d',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 28,
    anchor: [0.5, 0.5],
    duration: 8,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1, delay: 0.5 },
      { type: 'rotate', fromRotation: -180, toRotation: 0, duration: 1.5, delay: 0.5 },
      { type: 'scale', fromScaleX: 0, toScaleX: 1, fromScaleY: 0, toScaleY: 1, duration: 1.5, delay: 0.5 },
    ],
  });

// ========== 场景5：竖排文本渐变和发光效果 ==========
const scene5 = mainTrack.createScene({ duration: 5 })
  .addBackground({ color: '#0a0e27' })
  .addText({
    text: '渐变发光',
    x: '50%',
    y: '50%',
    fontSize: 80,
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 30,
    anchor: [0.5, 0.5],
    gradient: true,
    gradientColors: ['#ff006e', '#8338ec', '#3a86ff'],
    gradientDirection: 'vertical',
    textGlow: true,
    textGlowColor: '#00f5ff',
    textGlowBlur: 30,
    textGlowIntensity: 1,
    duration: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
    ],
  });

// ========== 场景6：竖排文本描边和阴影效果 ==========
const scene6 = mainTrack.createScene({ duration: 5 })
  .addBackground({ color: '#2d3436' })
  .addText({
    text: '描边阴影',
    x: '50%',
    y: '50%',
    fontSize: 75,
    color: '#ffffff',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 28,
    anchor: [0.5, 0.5],
    stroke: true,
    strokeColor: '#e17055',
    strokeWidth: 4,
    textShadow: true,
    textShadowColor: '#000000',
    textShadowBlur: 15,
    textShadowOffsetX: 5,
    textShadowOffsetY: 5,
    textShadowOpacity: 0.8,
    duration: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
    ],
  });

// ========== 场景7：对比横排和竖排 ==========
const scene7 = mainTrack.createScene({ duration: 6 })
  .addBackground({ color: '#1a1a2e' })
  .addText({
    text: '横排文本',
    x: '50%',
    y: '30%',
    fontSize: 60,
    color: '#74b9ff',
    fontFamily: '微软雅黑',
    writingMode: 'horizontal',
    anchor: [0.5, 0.5],
    duration: 6,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
    ],
  })
  .addText({
    text: '竖排文本',
    x: '50%',
    y: '70%',
    fontSize: 60,
    color: '#fd79a8',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 25,
    anchor: [0.5, 0.5],
    duration: 6,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1, delay: 0.5 },
    ],
  });

// ========== 场景8：竖排文本长文本 ==========
const scene8 = mainTrack.createScene({ duration: 8 })
  .addBackground({ color: '#0c2461' })
  .addText({
    text: '这是一段较长的竖排文本示例，用于测试竖排文本的显示效果和动画表现。',
    x: '50%',
    y: '50%',
    fontSize: 48,
    color: '#ffffff',
    fontFamily: '微软雅黑',
    writingMode: 'vertical',
    verticalCharSpacing: 20,
    anchor: [0.5, 0.5],
    split: 'letter',
    splitDelay: 0.05,
    splitDuration: 0.3,
    duration: 8,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.3 },
    ],
  });

// 渲染视频
async function render() {
  try {
    console.log('开始渲染竖排文本测试视频...');
    const outputPath = path.join(__dirname, '../output/test-vertical-text.mp4');
    await builder.render(outputPath);
    console.log(`视频渲染完成: ${outputPath}`);
  } catch (error) {
    console.error('渲染失败:', error);
  }
}

render();


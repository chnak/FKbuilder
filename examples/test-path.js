import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案
const colors = {
  charcoal: '#63747a',
  slate: '#c0c2c9',
  royalBlue: '#123175',
  aquamarine: '#5298c1',
};

/**
 * 测试路径元素功能
 */
async function testPath() {
  console.log('🧪 测试路径元素功能...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 4;
  const transitionDuration = 0.5;

  // ========== 场景1：基础路径 ==========
  console.log('创建场景1: 基础路径...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.charcoal })
    .addText({
      text: '基础路径',
      color: colors.aquamarine,
      fontSize: 80,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 直线路径
  scene1.addPath({
    points: [
      { x: 200, y: 300 },
      { x: 400, y: 300 },
      { x: 600, y: 300 },
      { x: 800, y: 300 },
    ],
    closed: false,
    smooth: false,
    strokeColor: colors.aquamarine,
    strokeWidth: 5,
    fillColor: null,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
  });

  // 折线路径
  scene1.addPath({
    points: [
      { x: 200, y: 500 },
      { x: 400, y: 400 },
      { x: 600, y: 500 },
      { x: 800, y: 400 },
      { x: 1000, y: 500 },
    ],
    closed: false,
    smooth: false,
    strokeColor: colors.royalBlue,
    strokeWidth: 4,
    fillColor: null,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
  });

  // 闭合三角形
  scene1.addPath({
    points: [
      { x: 960, y: 650 },
      { x: 1060, y: 750 },
      { x: 860, y: 750 },
    ],
    closed: true,
    smooth: false,
    fillColor: colors.aquamarine,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: 2, delay: 0.5, easing: 'linear' },
    ],
  });

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：平滑路径 ==========
  console.log('创建场景2: 平滑路径...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '平滑路径',
      color: colors.slate,
      fontSize: 80,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 平滑波浪线
  scene2.addPath({
    points: [
      { x: 200, y: 400 },
      { x: 400, y: 350 },
      { x: 600, y: 400 },
      { x: 800, y: 350 },
      { x: 1000, y: 400 },
      { x: 1200, y: 350 },
      { x: 1400, y: 400 },
      { x: 1600, y: 350 },
      { x: 1720, y: 400 },
    ],
    closed: false,
    smooth: true,
    strokeColor: colors.aquamarine,
    strokeWidth: 6,
    fillColor: null,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
    ],
  });

  // 平滑曲线
  scene2.addPath({
    points: [
      { x: 200, y: 700 },
      { x: 500, y: 600 },
      { x: 800, y: 700 },
      { x: 1100, y: 600 },
      { x: 1400, y: 700 },
      { x: 1720, y: 650 },
    ],
    closed: false,
    smooth: true,
    strokeColor: colors.slate,
    strokeWidth: 5,
    fillColor: null,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
    ],
  });

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：闭合路径 ==========
  console.log('创建场景3: 闭合路径...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.charcoal })
    .addText({
      text: '闭合路径',
      color: colors.aquamarine,
      fontSize: 80,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 五角星
  const starPoints = [];
  const centerX = 960;
  const centerY = 500;
  const outerRadius = 150;
  const innerRadius = 75;
  const numPoints = 5;

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    starPoints.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  scene3.addPath({
    points: starPoints,
    closed: true,
    smooth: false,
    fillColor: colors.aquamarine,
    strokeColor: colors.royalBlue,
    strokeWidth: 4,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.5 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: 3, delay: 0.5, easing: 'linear' },
      { type: 'transform', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1.2, toScaleY: 1.2, duration: 3, delay: 0.5, easing: 'easeInOut' },
    ],
  });

  // 六边形
  const hexPoints = [];
  const hexCenterX = 960;
  const hexCenterY = 750;
  const hexRadius = 100;

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    hexPoints.push({
      x: hexCenterX + Math.cos(angle) * hexRadius,
      y: hexCenterY + Math.sin(angle) * hexRadius,
    });
  }

  scene3.addPath({
    points: hexPoints,
    closed: true,
    smooth: false,
    fillColor: colors.royalBlue,
    strokeColor: colors.aquamarine,
    strokeWidth: 3,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 1.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.5 },
      { type: 'transform', fromRotation: 0, toRotation: -360, duration: 2.5, delay: 0.5, easing: 'linear' },
    ],
  });

  currentTime = scene3StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'Swirl',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景4：虚线路径 ==========
  console.log('创建场景4: 虚线路径...');
  const scene4StartTime = currentTime - transitionDuration;
  const scene4 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene4StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '虚线路径',
      color: colors.slate,
      fontSize: 80,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 虚线波浪
  scene4.addPath({
    points: [
      { x: 200, y: 400 },
      { x: 400, y: 350 },
      { x: 600, y: 400 },
      { x: 800, y: 350 },
      { x: 1000, y: 400 },
      { x: 1200, y: 350 },
      { x: 1400, y: 400 },
      { x: 1600, y: 350 },
      { x: 1720, y: 400 },
    ],
    closed: false,
    smooth: true,
    strokeColor: colors.aquamarine,
    strokeWidth: 5,
    fillColor: null,
    dashArray: [20, 10],
    dashOffset: 0,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
  });

  // 点线
  scene4.addPath({
    points: [
      { x: 200, y: 600 },
      { x: 400, y: 550 },
      { x: 600, y: 600 },
      { x: 800, y: 550 },
      { x: 1000, y: 600 },
      { x: 1200, y: 550 },
      { x: 1400, y: 600 },
      { x: 1600, y: 550 },
      { x: 1720, y: 600 },
    ],
    closed: false,
    smooth: true,
    strokeColor: colors.slate,
    strokeWidth: 4,
    fillColor: null,
    dashArray: [5, 10],
    dashOffset: 0,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
  });

  // 虚线矩形边框
  const rectPoints = [
    { x: 600, y: 700 },
    { x: 1320, y: 700 },
    { x: 1320, y: 900 },
    { x: 600, y: 900 },
  ];

  scene4.addPath({
    points: rectPoints,
    closed: true,
    smooth: false,
    fillColor: null,
    strokeColor: colors.aquamarine,
    strokeWidth: 4,
    dashArray: [15, 5, 5, 5],
    dashOffset: 0,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
    ],
  });

  currentTime = scene4StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'Bounce',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景5：复杂路径组合 ==========
  console.log('创建场景5: 复杂路径组合...');
  const scene5StartTime = currentTime - transitionDuration;
  const scene5 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene5StartTime,
  })
    .addBackground({ color: colors.charcoal })
    .addText({
      text: '复杂路径组合',
      color: colors.aquamarine,
      fontSize: 80,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 心形路径
  const heartPoints = [];
  const heartCenterX = 960;
  const heartCenterY = 500;
  const heartSize = 100;

  for (let i = 0; i <= 20; i++) {
    const t = (i / 20) * Math.PI * 2;
    const x = heartCenterX + heartSize * (16 * Math.pow(Math.sin(t), 3));
    const y = heartCenterY - heartSize * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    heartPoints.push({ x, y });
  }

  scene5.addPath({
    points: heartPoints,
    closed: true,
    smooth: true,
    fillColor: colors.aquamarine,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.5 },
      { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.2, toScaleY: 1.2, duration: 3, delay: 0.5, easing: 'easeInOut' },
    ],
  });

  // 螺旋路径
  const spiralPoints = [];
  const spiralCenterX = 960;
  const spiralCenterY = 750;
  const spiralTurns = 3;
  const spiralMaxRadius = 80;

  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * spiralTurns * Math.PI * 2;
    const radius = (i / 100) * spiralMaxRadius;
    spiralPoints.push({
      x: spiralCenterX + Math.cos(t) * radius,
      y: spiralCenterY + Math.sin(t) * radius,
    });
  }

  scene5.addPath({
    points: spiralPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.slate,
    strokeWidth: 4,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
    ],
  });

  currentTime = scene5StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-path.mp4');

  try {
    console.log('\n🚀 开始导出视频...');
    console.log(`输出路径: ${outputPath}\n`);
    console.log(`总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
    console.log(`场景数: ${mainTrack.scenes.length}`);
    console.log(`转场数: ${mainTrack.transitions.length}\n`);

    await builder.export(outputPath, {
      quality: 'high',
      bitrate: '10M',
      usePipe: true,
    });

    console.log('✅ 视频导出成功！');
    console.log(`📁 文件位置: ${outputPath}`);
    console.log(`⏱️  总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testPath().catch(console.error);


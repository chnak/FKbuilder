import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from '@chnak/paper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案
const colors = {
  midnightBlue: '#153c64',
  mistyBlue: '#bed5eb',
  royalBlue: '#0070e0',
  blueGrotto: '#4a90a4',
};

/**
 * 测试 Paper.js 的各种有趣功能
 */
async function testPaperFeatures() {
  console.log('🎨 测试 Paper.js 各种有趣功能...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 5;
  const transitionDuration = 0.5;

  // ========== 场景1：Symbol（符号）- 可复用的图形实例 ==========
  console.log('创建场景1: Symbol（符号）...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: 'Symbol - 可复用图形',
      color: colors.mistyBlue,
      fontSize: 70,
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

  // 注意：Symbol 功能需要在渲染时通过自定义元素实现
  // 这里先展示概念，实际实现需要创建 SymbolElement

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：路径布尔运算 ==========
  console.log('创建场景2: 路径布尔运算...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '路径布尔运算',
      color: colors.mistyBlue,
      fontSize: 70,
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

  // 圆形路径（用于演示布尔运算）
  const circle1Points = [];
  const circle1CenterX = 600;
  const circle1CenterY = 400;
  const circle1Radius = 150;
  for (let i = 0; i <= 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    circle1Points.push({
      x: circle1CenterX + Math.cos(angle) * circle1Radius,
      y: circle1CenterY + Math.sin(angle) * circle1Radius,
    });
  }

  scene2.addPath({
    points: circle1Points,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
    ],
  });

  // 第二个圆形（重叠）
  const circle2Points = [];
  const circle2CenterX = 800;
  const circle2CenterY = 400;
  const circle2Radius = 150;
  for (let i = 0; i <= 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    circle2Points.push({
      x: circle2CenterX + Math.cos(angle) * circle2Radius,
      y: circle2CenterY + Math.sin(angle) * circle2Radius,
    });
  }

  scene2.addPath({
    points: circle2Points,
    closed: true,
    smooth: true,
    fillColor: colors.blueGrotto,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
    ],
  });

  // 第三个圆形（形成交集）
  const circle3Points = [];
  const circle3CenterX = 700;
  const circle3CenterY = 550;
  const circle3Radius = 150;
  for (let i = 0; i <= 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    circle3Points.push({
      x: circle3CenterX + Math.cos(angle) * circle3Radius,
      y: circle3CenterY + Math.sin(angle) * circle3Radius,
    });
  }

  scene2.addPath({
    points: circle3Points,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.6,
    duration: sceneDuration,
    startTime: 1.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
    ],
  });

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：复合路径（带孔洞） ==========
  console.log('创建场景3: 复合路径（带孔洞）...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '复合路径（带孔洞）',
      color: colors.mistyBlue,
      fontSize: 70,
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

  // 外圆（大圆）
  const outerCirclePoints = [];
  const outerCenterX = 960;
  const outerCenterY = 500;
  const outerRadius = 200;
  for (let i = 0; i <= 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    outerCirclePoints.push({
      x: outerCenterX + Math.cos(angle) * outerRadius,
      y: outerCenterY + Math.sin(angle) * outerRadius,
    });
  }

  scene3.addPath({
    points: outerCirclePoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 4,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.5 },
    ],
  });

  // 内圆（孔洞）- 使用不同的颜色和透明度来模拟孔洞效果
  const innerCirclePoints = [];
  const innerRadius = 100;
  for (let i = 0; i <= 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    innerCirclePoints.push({
      x: outerCenterX + Math.cos(angle) * innerRadius,
      y: outerCenterY + Math.sin(angle) * innerRadius,
    });
  }

  // 使用背景色填充内圆来模拟孔洞
  scene3.addPath({
    points: innerCirclePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 1,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 3,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
  });

  currentTime = scene3StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'Swirl',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景4：径向渐变效果 ==========
  console.log('创建场景4: 径向渐变效果...');
  const scene4StartTime = currentTime - transitionDuration;
  const scene4 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene4StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '径向渐变效果',
      color: colors.mistyBlue,
      fontSize: 70,
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

  // 使用多个圆形叠加来模拟径向渐变
  const gradientCircles = [
    { radius: 250, color: colors.mistyBlue, opacity: 0.3 },
    { radius: 200, color: colors.blueGrotto, opacity: 0.4 },
    { radius: 150, color: colors.royalBlue, opacity: 0.5 },
    { radius: 100, color: colors.midnightBlue, opacity: 0.6 },
  ];

  gradientCircles.forEach((circle, index) => {
    scene4.addCircle({
      x: '50%',
      y: '50%',
      radius: circle.radius,
      fillColor: circle.color,
      opacity: circle.opacity,
      duration: sceneDuration,
      startTime: 0.5 + index * 0.2,
      zIndex: 2 + index,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: circle.opacity, duration: 0.5 },
        { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1, toScaleY: 1, duration: 0.8, delay: 0.2 },
      ],
    });
  });

  currentTime = scene4StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'Bounce',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景5：混合模式效果 ==========
  console.log('创建场景5: 混合模式效果...');
  const scene5StartTime = currentTime - transitionDuration;
  const scene5 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene5StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '混合模式效果',
      color: colors.mistyBlue,
      fontSize: 70,
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

  // 基础圆形
  scene5.addCircle({
    x: '50%',
    y: '50%',
    radius: 200,
    fillColor: colors.mistyBlue,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
    ],
  });

  // 叠加圆形（模拟混合模式）
  scene5.addCircle({
    x: '55%',
    y: '50%',
    radius: 180,
    fillColor: colors.royalBlue,
    opacity: 0.6,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 3,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
    ],
  });

  // 第三个圆形
  scene5.addCircle({
    x: '50%',
    y: '55%',
    radius: 160,
    fillColor: colors.blueGrotto,
    opacity: 0.5,
    duration: sceneDuration,
    startTime: 1.5,
    zIndex: 4,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 0.5 },
    ],
  });

  currentTime = scene5StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'Dreamy',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景6：路径文本（沿着路径排列） ==========
  console.log('创建场景6: 路径文本效果...');
  const scene6StartTime = currentTime - transitionDuration;
  const scene6 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene6StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '路径文本效果',
      color: colors.mistyBlue,
      fontSize: 70,
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

  // 创建弧形路径
  const arcPathPoints = [];
  const arcCenterX = 960;
  const arcCenterY = 500;
  const arcRadius = 200;
  const startAngle = -Math.PI / 3;
  const endAngle = Math.PI / 3;

  for (let i = 0; i <= 30; i++) {
    const angle = startAngle + (i / 30) * (endAngle - startAngle);
    arcPathPoints.push({
      x: arcCenterX + Math.cos(angle) * arcRadius,
      y: arcCenterY + Math.sin(angle) * arcRadius,
    });
  }

  scene6.addPath({
    points: arcPathPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.mistyBlue,
    strokeWidth: 2,
    opacity: 0.5,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    dashArray: [5, 5],
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 0.5 },
    ],
  });

  // 在路径上放置文本（使用多个文本元素模拟）
  const textOnPath = 'PAPER.JS';
  const textLength = textOnPath.length;
  arcPathPoints.forEach((point, index) => {
    if (index % Math.floor(arcPathPoints.length / textLength) === 0 && index < textLength * Math.floor(arcPathPoints.length / textLength)) {
      const charIndex = Math.floor(index / Math.floor(arcPathPoints.length / textLength));
      if (charIndex < textLength) {
        // 计算角度以旋转文本
        const nextIndex = Math.min(index + 1, arcPathPoints.length - 1);
        const angle = Math.atan2(
          arcPathPoints[nextIndex].y - point.y,
          arcPathPoints[nextIndex].x - point.x
        ) * 180 / Math.PI;

        scene6.addText({
          text: textOnPath[charIndex],
          color: colors.mistyBlue,
          fontSize: 40,
          x: point.x,
          y: point.y,
          textAlign: 'center',
          anchor: [0.5, 0.5],
          duration: sceneDuration,
          startTime: 1 + charIndex * 0.1,
          zIndex: 3,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          rotation: angle,
          animations: [
            { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.3 },
            { type: 'transform', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.3 },
          ],
        });
      }
    }
  });

  currentTime = scene6StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-paper-features.mp4');

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
    console.log('\n✨ Paper.js 功能演示完成！');
    console.log('包含的功能：');
    console.log('  - Symbol（符号）概念');
    console.log('  - 路径布尔运算（重叠效果）');
    console.log('  - 复合路径（带孔洞）');
    console.log('  - 径向渐变效果');
    console.log('  - 混合模式效果');
    console.log('  - 路径文本效果');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testPaperFeatures().catch(console.error);


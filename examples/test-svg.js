import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * 测试 SVG 元素功能
 */
async function testSVG() {
  console.log('🎨 测试 SVG 元素功能...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 5;
  const transitionDuration = 0.5;

  // ========== 场景1：SVG 字符串 ==========
  console.log('创建场景1: SVG 字符串...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: 'SVG 字符串',
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

  // 创建一个简单的 SVG 字符串（星形）
  const starSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <polygon points="100,10 120,70 180,70 135,110 155,170 100,135 45,170 65,110 20,70 80,70" 
               fill="${colors.mistyBlue}" 
               stroke="${colors.royalBlue}" 
               stroke-width="3"/>
    </svg>
  `;

  scene1.addSVG({
    svgString: starSVG,
    x: '30%',
    y: '50%',
    width: 300,
    height: 300,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: 4, delay: 0.8, easing: 'linear' },
    ],
  });

  // 创建一个圆形 SVG
  const circleSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="80" 
              fill="${colors.royalBlue}" 
              stroke="${colors.mistyBlue}" 
              stroke-width="5"/>
      <circle cx="100" cy="100" r="50" 
              fill="${colors.blueGrotto}" 
              stroke="${colors.mistyBlue}" 
              stroke-width="3"/>
    </svg>
  `;

  scene1.addSVG({
    svgString: circleSVG,
    x: '70%',
    y: '50%',
    width: 300,
    height: 300,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.2, toScaleY: 1.2, duration: 3.2, delay: 1, easing: 'easeInOut' },
    ],
  });

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：SVG 文件（如果存在） ==========
  console.log('创建场景2: SVG 文件...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: 'SVG 文件',
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

  // 尝试从 assets 目录加载 SVG 文件
  const assetsDir = path.join(__dirname, '../assets');
  const svgFiles = await fs.readdir(assetsDir).catch(() => []);
  const svgFile = svgFiles.find(file => file.toLowerCase().endsWith('.svg'));

  if (svgFile) {
    const svgPath = path.join(assetsDir, svgFile);
    scene2.addSVG({
      src: svgPath,
      x: '50%',
      y: '50%',
      width: 600,
      height: 600,
      anchor: [0.5, 0.5],
      fit: 'contain',
      duration: sceneDuration,
      startTime: 0.5,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      ],
    });
  } else {
    // 如果没有 SVG 文件，使用内联 SVG
    const heartSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <path d="M150,250 C150,250 50,150 50,100 C50,60 80,40 120,60 C150,75 150,100 150,100 C150,100 150,75 180,60 C220,40 250,60 250,100 C250,150 150,250 150,250 Z" 
              fill="${colors.mistyBlue}" 
              stroke="${colors.royalBlue}" 
              stroke-width="5"/>
      </svg>
    `;

    scene2.addSVG({
      svgString: heartSVG,
      x: '50%',
      y: '50%',
      width: 500,
      height: 500,
      anchor: [0.5, 0.5],
      fit: 'contain',
      duration: sceneDuration,
      startTime: 0.5,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
        { type: 'transform', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1.2, toScaleY: 1.2, duration: 3.2, delay: 0.8, easing: 'easeInOut' },
      ],
    });
  }

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：复杂 SVG ==========
  console.log('创建场景3: 复杂 SVG...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '复杂 SVG',
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

  // 创建一个复杂的 SVG（包含多个元素）
  const complexSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.mistyBlue};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.royalBlue};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="150" fill="url(#grad1)" stroke="${colors.royalBlue}" stroke-width="5"/>
      <circle cx="200" cy="200" r="100" fill="${colors.blueGrotto}" opacity="0.7"/>
      <circle cx="200" cy="200" r="50" fill="${colors.mistyBlue}"/>
      <rect x="150" y="150" width="100" height="100" fill="none" stroke="${colors.royalBlue}" stroke-width="3" opacity="0.5"/>
    </svg>
  `;

  scene3.addSVG({
    svgString: complexSVG,
    x: '50%',
    y: '50%',
    width: 600,
    height: 600,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: 4, delay: 0.8, easing: 'linear' },
    ],
  });

  currentTime = scene3StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-svg.mp4');

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
    console.log('\n✨ SVG 功能测试完成！');
    console.log('包含的功能：');
    console.log('  - SVG 字符串导入');
    console.log('  - SVG 文件导入');
    console.log('  - 复杂 SVG 渲染');
    console.log('  - SVG 动画效果');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testSVG().catch(console.error);


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
 * 测试 SVG 内部元素动画功能
 */
async function testSVGAnimation() {
  console.log('🎨 测试 SVG 内部元素动画功能...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 5;
  const transitionDuration = 0.5;

  // ========== 场景1：使用 SVG 字符串，演示内部元素动画 ==========
  console.log('创建场景1: SVG 内部元素动画...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: 'SVG 内部元素动画',
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

  // 创建一个包含多个元素的 SVG
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- 圆形 - 使用 ID 选择器 -->
      <circle id="circle1" cx="200" cy="300" r="50" fill="#0070e0" />
      
      <!-- 矩形 - 使用类名选择器 -->
      <rect class="rect-animated" x="400" y="250" width="100" height="100" fill="#bed5eb" />
      
      <!-- 路径 - 使用 ID 选择器 -->
      <path id="path1" d="M 600 200 L 700 300 L 600 400" stroke="#4a90a4" stroke-width="5" fill="none" />
      
      <!-- 多个圆形 - 使用类名选择器 -->
      <circle class="dot" cx="150" cy="150" r="20" fill="#0070e0" />
      <circle class="dot" cx="250" cy="150" r="20" fill="#bed5eb" />
      <circle class="dot" cx="350" cy="150" r="20" fill="#4a90a4" />
    </svg>
  `;

  // 添加 SVG 元素，使用回调函数操作内部元素
  scene1.addSVG({
    svgString: svgString,
    x: '50%',
    y: '50%',
    width: 800,
    height: 600,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
    ],
    // SVG 加载完成后的回调
    onLoaded: function(svgElement, time) {
      // 在这里可以查找和配置 SVG 内部元素
      // 例如：为元素添加动画配置
      
      // 1. 圆形旋转和缩放动画（使用 ID 选择器）
      // 动画函数参数：(relativeTime, element, svgElement, { absoluteTime, relativeTime, startTime, duration, progress })
      svgElement.animateElement('#circle1', (relativeTime, element, svgElement, info) => {
        const progress = info.progress; // 0 到 1 的进度值
        
        return {
          rotation: progress * 360 * 2, // 旋转 2 圈
          scale: 1 + Math.sin(progress * Math.PI * 4) * 0.3, // 缩放动画
          opacity: 0.5 + Math.sin(progress * Math.PI * 2) * 0.5, // 透明度动画
        };
      });

      // 2. 矩形移动和颜色动画（使用类名选择器）
      svgElement.animateElement('.rect-animated', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        
        return {
          x: Math.sin(progress * Math.PI * 2) * 100, // 相对于原始位置的左右移动
          y: Math.cos(progress * Math.PI * 2) * 50, // 相对于原始位置的上下移动
          rotation: progress * 360, // 旋转
          fillColor: {
            hue: 200 + progress * 60, // 颜色变化
            saturation: 0.7,
            brightness: 0.9,
          },
        };
      });

      // 3. 路径移动动画（使用 ID 选择器）
      svgElement.animateElement('#path1', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        
        return {
          y: Math.sin(progress * Math.PI * 4) * 50, // 相对于原始位置的上下移动
          strokeWidth: 5 + Math.sin(progress * Math.PI * 2) * 3, // 描边宽度动画
        };
      });

      // 4. 多个圆点的动画
      svgElement.animateElement('.dot', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        
        return {
          scale: 1 + Math.sin(progress * Math.PI * 4) * 0.5,
          opacity: 0.5 + Math.sin(progress * Math.PI * 2) * 0.5,
        };
      });
    },
    // 每次渲染时的回调（可选）
    onRender: function(svgElement, time) {
      // 在这里可以实时操作 SVG 内部元素
      // 例如：根据时间动态修改元素属性
      
      // 示例：直接查找并操作元素
      const circle = svgElement.findElement('#circle1');
      if (circle) {
        // 可以在这里直接操作元素
        // circle.rotation = time * 10;
      }
    },
  });

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：使用静态配置对象 ==========
  console.log('创建场景2: 静态动画配置...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '静态动画配置',
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

  // 创建一个简单的 SVG
  const svgString2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <circle id="static-circle" cx="300" cy="200" r="80" fill="#bed5eb" />
      <rect id="static-rect" x="200" y="100" width="200" height="200" fill="#4a90a4" opacity="0.5" />
    </svg>
  `;

  scene2.addSVG({
    svgString: svgString2,
    x: '50%',
    y: '50%',
    width: 600,
    height: 400,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    // 使用静态配置对象
    loaded: function(svgItem, svgElement) {
      svgElement.animateElement('#static-circle', {
        rotation: 45,
        scale: 1.2,
        fillColor: colors.mistyBlue,
      });

      svgElement.animateElement('#static-rect', {
        rotation: -30,
        opacity: 0.8,
      });
    },
  });

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：说明信息 ==========
  console.log('创建场景3: 说明信息...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: 'SVG 内部元素动画 API',
      color: colors.mistyBlue,
      fontSize: 80,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• findElement(selector) - 查找元素',
      color: colors.mistyBlue,
      fontSize: 40,
      x: '50%',
      y: '35%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• animateElement(selector, config) - 添加动画',
      color: colors.mistyBlue,
      fontSize: 40,
      x: '50%',
      y: '50%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 1,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• 支持 ID、类名、标签名选择器',
      color: colors.mistyBlue,
      fontSize: 40,
      x: '50%',
      y: '65%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 1.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• 支持函数和对象两种配置方式',
      color: colors.mistyBlue,
      fontSize: 40,
      x: '50%',
      y: '80%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 2,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime = scene3StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-svg-animation.mp4');

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
    console.log('\n✨ SVG 内部元素动画功能测试完成！');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testSVGAnimation().catch(console.error);


import { VideoBuilder } from '../src/index.js';
import paper from 'paper-jsdom-canvas';
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
  pink: '#ff6b9d',
  orange: '#ff8844',
  yellow: '#ffcc44',
  green: '#44ff88',
};

/**
 * 测试蝴蝶 SVG 动画
 */
async function testButterflyAnimation() {
  console.log('🦋 测试蝴蝶 SVG 动画...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 8;
  const transitionDuration = 0.5;

  // ========== 场景1：蝴蝶飞行路径动画 ==========
  console.log('创建场景1: 蝴蝶飞行路径...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '蝴蝶飞行动画',
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

  const butterflySVGPath = path.join(__dirname, '../assets/1437245.svg');

  scene1.addSVG({
    src: butterflySVGPath,
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
    onLoaded: function(svgElement, time) {
      console.log('蝴蝶 SVG 加载完成');
      // 查找蝴蝶路径元素
      const butterflyPath = svgElement.findElement('path');
      
      if (butterflyPath) {
        console.log('找到蝴蝶路径元素');
        // 配置动画
        svgElement.animateElement('path', (relativeTime, element, svgElement, info) => {
          const progress = info.progress;
          
          return {
            rotation: Math.sin(progress * Math.PI * 4) * 5, // 轻微摆动
            scale: 1 + Math.sin(progress * Math.PI * 8) * 0.1, // 翅膀扇动效果
          };
        });
      }
    },
    onRender: function(svgElement, time) {
      const svgItem = svgElement.svgItem;
      // 直接操作蝴蝶，实现飞行路径
      const relativeTime = time - 0.5;
      const duration = sceneDuration;
      const progress = Math.max(0, Math.min(1, relativeTime / duration));
      
      // 创建飞行路径（波浪形）
      const centerX = 960; // 画布中心
      const centerY = 540;
      const amplitude = 200; // 波动幅度
      const frequency = 2; // 波动频率
      
      const x = centerX + (progress - 0.5) * 800; // 从左到右移动
      const y = centerY + Math.sin(progress * Math.PI * frequency) * amplitude; // 上下波动
      
      // 计算飞行角度（根据路径方向）
      const angle = Math.atan2(
        Math.cos(progress * Math.PI * frequency) * amplitude * frequency * Math.PI,
        800 / duration
      ) * 180 / Math.PI;
      
      // 翅膀扇动效果
      const wingFlap = Math.sin(progress * Math.PI * 16) * 0.15; // 快速扇动
      
      if (svgItem) {
        svgItem.position = new paper.Point(x, y);
        svgItem.rotation = angle + Math.sin(progress * Math.PI * 4) * 5;
        svgItem.scaling = new paper.Point(1 + wingFlap, 1 - wingFlap * 0.3);
      }
    },
  });

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：蝴蝶翅膀扇动 + 颜色变化 ==========
  console.log('创建场景2: 翅膀扇动和颜色变化...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '翅膀扇动 + 颜色变化',
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

  scene2.addSVG({
    src: butterflySVGPath,
    x: '50%',
    y: '50%',
    width: 800,
    height: 800,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    onRender: function(svgElement, time) {
      const svgItem = svgElement.svgItem;
      const relativeTime = time - 0.5;
      const duration = sceneDuration;
      const progress = Math.max(0, Math.min(1, relativeTime / duration));
      
      // 翅膀扇动效果（更明显）
      const wingFlapSpeed = 12; // 扇动速度
      const wingFlap = Math.sin(progress * Math.PI * wingFlapSpeed) * 0.3;
      
      // 颜色变化（彩虹效果）
      const hue = (progress * 360) % 360;
      
      if (svgItem) {
        // 翅膀扇动：左右缩放不同
        svgItem.scaling = new paper.Point(1 + wingFlap, 1 - wingFlap * 0.5);
        
        // 颜色变化
        const butterflyPath = svgElement.findElement('path');
        if (butterflyPath) {
          butterflyPath.fillColor = {
            hue: hue,
            saturation: 0.8,
            brightness: 0.9,
          };
        }
        
        // 轻微旋转
        svgItem.rotation = Math.sin(progress * Math.PI * 2) * 10;
      }
    },
  });

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：蝴蝶旋转飞舞 ==========
  console.log('创建场景3: 旋转飞舞...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '旋转飞舞',
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

  scene3.addSVG({
    src: butterflySVGPath,
    x: '50%',
    y: '50%',
    width: 600,
    height: 600,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    onRender: function(svgElement, time) {
      const svgItem = svgElement.svgItem;
      const relativeTime = time - 0.5;
      const duration = sceneDuration;
      const progress = Math.max(0, Math.min(1, relativeTime / duration));
      
      // 圆形路径
      const centerX = 960;
      const centerY = 540;
      const radius = 300;
      const angle = progress * Math.PI * 2;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // 翅膀扇动
      const wingFlap = Math.sin(progress * Math.PI * 20) * 0.2;
      
      if (svgItem) {
        svgItem.position = new paper.Point(x, y);
        svgItem.rotation = (angle * 180 / Math.PI) + 90; // 面向运动方向
        svgItem.scaling = new paper.Point(1 + wingFlap, 1 - wingFlap * 0.4);
      }
    },
  });

  currentTime = scene3StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景4：多个蝴蝶飞舞 ==========
  console.log('创建场景4: 多个蝴蝶飞舞...');
  const scene4StartTime = currentTime - transitionDuration;
  const scene4 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene4StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '多个蝴蝶飞舞',
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

  // 创建3个蝴蝶
  for (let i = 0; i < 3; i++) {
    const delay = i * 0.3;
    scene4.addSVG({
      src: butterflySVGPath,
      x: '50%',
      y: '50%',
      width: 400,
      height: 400,
      anchor: [0.5, 0.5],
      fit: 'contain',
      duration: sceneDuration,
      startTime: 0.5 + delay,
      zIndex: 2 + i,
      render: function(svgItem, time, svgElement) {
        const relativeTime = time - (0.5 + delay);
        const duration = sceneDuration - delay;
        const progress = Math.max(0, Math.min(1, relativeTime / duration));
        
        // 每个蝴蝶不同的路径
        const centerX = 960;
        const centerY = 540;
        const radius = 200 + i * 100;
        const angle = (progress * Math.PI * 2) + (i * Math.PI * 2 / 3);
        const speed = 1 + i * 0.3;
        
        const x = centerX + Math.cos(angle * speed) * radius;
        const y = centerY + Math.sin(angle * speed) * radius;
        
        // 翅膀扇动（不同频率）
        const wingFlap = Math.sin(progress * Math.PI * (15 + i * 5)) * 0.25;
        
        // 颜色变化
        const hue = (progress * 360 + i * 120) % 360;
        
        if (svgItem) {
          svgItem.position = new paper.Point(x, y);
          svgItem.rotation = (angle * speed * 180 / Math.PI) + 90;
          svgItem.scaling = new paper.Point(1 + wingFlap, 1 - wingFlap * 0.5);
          
          // 颜色变化
          const butterflyPath = svgElement.findElement('path');
          if (butterflyPath) {
            butterflyPath.fillColor = {
              hue: hue,
              saturation: 0.7 + i * 0.1,
              brightness: 0.8 + i * 0.1,
            };
          }
        }
      },
    });
  }

  currentTime = scene4StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-butterfly-animation.mp4');

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
    console.log('\n✨ 蝴蝶动画测试完成！');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testButterflyAnimation().catch(console.error);


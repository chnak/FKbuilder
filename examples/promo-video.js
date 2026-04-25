import { VideoBuilder } from '../src/index.js';
import paper from '@chnak/paper';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案 - 现代科技感
const colors = {
  dark: '#0a0e27',
  darkBlue: '#1a1f3a',
  blue: '#2d5aa0',
  lightBlue: '#4a90e2',
  cyan: '#00d4ff',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  yellow: '#fbbf24',
  green: '#10b981',
  white: '#ffffff',
  gray: '#6b7280',
};

/**
 * 项目宣传视频 - 1分钟
 */
async function createPromoVideo() {
  console.log('🎬 创建项目宣传视频（1分钟）...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const totalDuration = 60; // 60秒
  let currentTime = 0;
  const transitionDuration = 0.5;

  // ========== 场景1：开场 - 项目名称 ==========
  console.log('创建场景1: 开场...');
  const scene1 = mainTrack.createScene({
    duration: 5,
    startTime: currentTime,
  })
    .addBackground({ color: colors.dark })
    .addText({
      text: 'FKNew',
      color: colors.cyan,
      fontSize: 150,
      x: '50%',
      y: '40%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      gradient: true,
      gradientColors: [colors.cyan, colors.purple, colors.pink],
      gradientDirection: 'horizontal',
      textShadow: true,
      textShadowColor: colors.cyan,
      textShadowBlur: 30,
      textShadowOffsetX: 0,
      textShadowOffsetY: 0,
      textGlow: true,
      textGlowColor: colors.cyan,
      textGlowBlur: 40,
      textGlowIntensity: 1.5,
      stroke: true,
      strokeColor: colors.white,
      strokeWidth: 2,
      duration: 5,
      startTime: 0,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
        { type: 'scale', fromScale: 0.5, toScale: 1, duration: 1 },
        { type: 'fade', fromOpacity: 1, toOpacity: 0, duration: 0.8, delay: 4.2 },
      ],
    })
    .addText({
      text: '基于 Paper.js 的程序化视频生成库',
      color: colors.white,
      fontSize: 50,
      x: '50%',
      y: '60%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      duration: 5,
      startTime: 1,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
        { type: 'move', fromX: '50%', fromY: '70%', toX: '50%', toY: '60%', duration: 0.8 },
        { type: 'fade', fromOpacity: 1, toOpacity: 0, duration: 0.8, delay: 3.2 },
      ],
    });

  currentTime += 5;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：文本效果展示 ==========
  console.log('创建场景2: 文本效果...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: 8,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.darkBlue })
    .addText({
      text: '丰富的文本效果',
      color: colors.white,
      fontSize: 70,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      duration: 8,
      startTime: 0,
      animations: ['fadeIn'],
    })
    // 渐变文本
    .addText({
      text: '渐变文字',
      color: colors.white,
      fontSize: 80,
      x: '25%',
      y: '40%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      gradient: true,
      gradientColors: [colors.cyan, colors.purple, colors.pink],
      gradientDirection: 'horizontal',
      duration: 8,
      startTime: 0.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
        { type: 'scale', fromScale: 0.8, toScale: 1.1, duration: 2, delay: 0.5 },
        { type: 'scale', fromScale: 1.1, toScale: 1, duration: 1, delay: 2.5 },
      ],
    })
    // 阴影文本
    .addText({
      text: '阴影文字',
      color: colors.yellow,
      fontSize: 80,
      x: '75%',
      y: '40%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      textShadow: true,
      textShadowColor: colors.orange,
      textShadowBlur: 20,
      textShadowOffsetX: 5,
      textShadowOffsetY: 5,
      duration: 8,
      startTime: 1,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
        { type: 'rotate', fromRotation: -10, toRotation: 10, duration: 2, delay: 1.5, repeat: 2 },
      ],
    })
    // 描边文本
    .addText({
      text: '描边文字',
      color: colors.green,
      fontSize: 80,
      x: '25%',
      y: '70%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      stroke: true,
      strokeColor: colors.cyan,
      strokeWidth: 3,
      duration: 8,
      startTime: 1.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
        { type: 'scale', fromScale: 1, toScale: 1.2, duration: 1.5, delay: 0.5, repeat: 2 },
      ],
    })
    // 发光文本
    .addText({
      text: '发光文字',
      color: colors.pink,
      fontSize: 80,
      x: '75%',
      y: '70%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      textGlow: true,
      textGlowColor: colors.pink,
      textGlowBlur: 30,
      textGlowIntensity: 2,
      duration: 8,
      startTime: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
        { type: 'fade', fromOpacity: 1, toOpacity: 0.5, duration: 1, delay: 0.5, repeat: 3 },
      ],
    })
    // 分割文本动画
    .addText({
      text: '分割动画',
      color: colors.purple,
      fontSize: 100,
      x: '50%',
      y: '50%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      split: 'letter',
      minDuration: 0.5,
      maxDuration: 1.5,
      duration: 8,
      startTime: 3,
      animations: ['bigIn'],
    });

  currentTime = scene2StartTime + 8;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：图形元素展示 ==========
  console.log('创建场景3: 图形元素...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: 8,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.dark })
    .addText({
      text: '多样化的图形元素',
      color: colors.white,
      fontSize: 70,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      duration: 8,
      startTime: 0,
      animations: ['fadeIn'],
    })
    // 圆形
    .addCircle({
      x: '20%',
      y: '40%',
      radius: 80,
      fillColor: colors.cyan,
      opacity: 0.8,
      duration: 8,
      startTime: 0.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'rotate', fromRotation: 0, toRotation: 360, duration: 3, delay: 1, repeat: 2 },
      ],
    })
    // 矩形
    .addRect({
      x: '50%',
      y: '40%',
      width: 160,
      height: 160,
      fillColor: colors.purple,
      opacity: 0.8,
      cornerRadius: 20,
      duration: 8,
      startTime: 1,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'rotate', fromRotation: 0, toRotation: -360, duration: 3, delay: 1.5, repeat: 2 },
      ],
    })
    // 路径 - 星形
    .addPath({
      points: [
        { x: 0, y: -100 },
        { x: 30, y: -30 },
        { x: 100, y: -30 },
        { x: 45, y: 20 },
        { x: 60, y: 90 },
        { x: 0, y: 50 },
        { x: -60, y: 90 },
        { x: -45, y: 20 },
        { x: -100, y: -30 },
        { x: -30, y: -30 },
      ],
      closed: true,
      smooth: false,
      fillColor: colors.pink,
      strokeColor: colors.white,
      strokeWidth: 3,
      opacity: 0.8,
      duration: 8,
      startTime: 1.5,
      x: '80%',
      y: '40%',
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'rotate', fromRotation: 0, toRotation: 360, duration: 4, delay: 2, repeat: 1.5 },
      ],
    })
    // 多个圆形组合
    .addCircle({
      x: '20%',
      y: '70%',
      radius: 60,
      fillColor: colors.orange,
      opacity: 0.6,
      duration: 8,
      startTime: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
        { type: 'move', fromX: '20%', fromY: '70%', toX: '50%', toY: '70%', duration: 2, delay: 0.5 },
        { type: 'move', fromX: '50%', fromY: '70%', toX: '80%', toY: '70%', duration: 2, delay: 2.5 },
        { type: 'move', fromX: '80%', fromY: '70%', toX: '20%', toY: '70%', duration: 2, delay: 4.5 },
      ],
    })
    .addCircle({
      x: '50%',
      y: '70%',
      radius: 60,
      fillColor: colors.green,
      opacity: 0.6,
      duration: 8,
      startTime: 2.2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
        { type: 'move', fromX: '50%', fromY: '70%', toX: '80%', toY: '70%', duration: 2, delay: 0.3 },
        { type: 'move', fromX: '80%', fromY: '70%', toX: '20%', toY: '70%', duration: 2, delay: 2.3 },
        { type: 'move', fromX: '20%', fromY: '70%', toX: '50%', toY: '70%', duration: 2, delay: 4.3 },
      ],
    })
    .addCircle({
      x: '80%',
      y: '70%',
      radius: 60,
      fillColor: colors.yellow,
      opacity: 0.6,
      duration: 8,
      startTime: 2.4,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
        { type: 'move', fromX: '80%', fromY: '70%', toX: '20%', toY: '70%', duration: 2, delay: 0.1 },
        { type: 'move', fromX: '20%', fromY: '70%', toX: '50%', toY: '70%', duration: 2, delay: 2.1 },
        { type: 'move', fromX: '50%', fromY: '70%', toX: '80%', toY: '70%', duration: 2, delay: 4.1 },
      ],
    });

  currentTime = scene3StartTime + 8;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景4：SVG 动画 ==========
  console.log('创建场景4: SVG动画...');
  const scene4StartTime = currentTime - transitionDuration;
  const butterflySVGPath = path.join(__dirname, '../assets/1437245.svg');
  const scene4 = mainTrack.createScene({
    duration: 8,
    startTime: scene4StartTime,
  })
    .addBackground({ color: colors.darkBlue })
    .addText({
      text: 'SVG 动画支持',
      color: colors.white,
      fontSize: 70,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      duration: 8,
      startTime: 0,
      animations: ['fadeIn'],
    })
    .addSVG({
      src: butterflySVGPath,
      x: '50%',
      y: '50%',
      width: 600,
      height: 600,
      anchor: [0.5, 0.5],
      fit: 'contain',
      duration: 8,
      startTime: 0.5,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      ],
      onLoaded: function(svgElement, time) {
        const butterflyPath = svgElement.findElement('path');
        if (butterflyPath) {
          butterflyPath.fillColor = {
            hue: 200,
            saturation: 0.8,
            brightness: 0.9,
          };
        }
      },
      onRender: function(svgElement, time) {
        const svgItem = svgElement.svgItem;
        if (!svgItem) return;
        const relativeTime = time - 0.5;
        const duration = 8;
        const progress = Math.max(0, Math.min(1, relativeTime / duration));
        
        // 8字形路径
        const centerX = 960;
        const centerY = 540;
        const radiusX = 350;
        const radiusY = 200;
        const t = progress * Math.PI * 4;
        const x = centerX + radiusX * Math.sin(t);
        const y = centerY + radiusY * Math.sin(t) * Math.cos(t);
        const dx = radiusX * Math.cos(t);
        const dy = radiusY * (Math.cos(t) * Math.cos(t) - Math.sin(t) * Math.sin(t));
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const wingFlap = Math.sin(progress * Math.PI * 15) * 0.25;
        
        svgItem.position = new paper.Point(x, y);
        svgItem.rotation = angle;
        svgItem.scaling = new paper.Point(1 + wingFlap, 1 - wingFlap * 0.4);
        
        const butterflyPath = svgElement.findElement('path');
        if (butterflyPath) {
          const hue = (progress * 360) % 360;
          butterflyPath.fillColor = {
            hue: hue,
            saturation: 0.8,
            brightness: 0.9,
          };
        }
      },
    });

  currentTime = scene4StartTime + 8;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景5：示波器效果 ==========
  console.log('创建场景5: 示波器效果...');
  const scene5StartTime = currentTime - transitionDuration;
  const audioFile = path.join(__dirname, '../assets/sample1.m4a');
  const scene5 = mainTrack.createScene({
    duration: 8,
    startTime: scene5StartTime,
  })
    .addBackground({ color: colors.dark })
    .addText({
      text: '音频可视化',
      color: colors.white,
      fontSize: 70,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      duration: 8,
      startTime: 0,
      animations: ['fadeIn'],
    })
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '50%',
      width: 800,
      height: 400,
      anchor: [0.5, 0.5],
      style: 'particles',
      mirror: true,
      sensitivity: 2,
      particleCount: 150,
      particleMinSize: 3,
      particleMaxSize: 25,
      particleColors: [colors.cyan, colors.purple, colors.pink, colors.orange],
      particleTrail: true,
      windowSize: 0.1,
      duration: 8,
      startTime: 0.5,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      ],
    });

  currentTime = scene5StartTime + 8;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景6：综合展示 ==========
  console.log('创建场景6: 综合展示...');
  const scene6StartTime = currentTime - transitionDuration;
  const scene6 = mainTrack.createScene({
    duration: 10,
    startTime: scene6StartTime,
  })
    .addBackground({ color: colors.darkBlue })
    .addText({
      text: '功能全面',
      color: colors.cyan,
      fontSize: 100,
      x: '50%',
      y: '30%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      gradient: true,
      gradientColors: [colors.cyan, colors.purple],
      textGlow: true,
      textGlowColor: colors.cyan,
      textGlowBlur: 40,
      duration: 10,
      startTime: 0,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
        { type: 'scale', fromScale: 0.8, toScale: 1, duration: 0.8 },
      ],
    })
    .addText({
      text: '• 文本效果 • 图形元素 • SVG动画',
      color: colors.white,
      fontSize: 45,
      x: '50%',
      y: '50%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      duration: 10,
      startTime: 1,
      split: 'word',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• 音频可视化 • 转场效果 • 多轨道场景',
      color: colors.white,
      fontSize: 45,
      x: '50%',
      y: '60%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      duration: 10,
      startTime: 2,
      split: 'word',
      animations: ['fadeIn'],
    })
    // 装饰性元素
    .addCircle({
      x: '20%',
      y: '75%',
      radius: 50,
      fillColor: colors.cyan,
      opacity: 0.6,
      duration: 10,
      startTime: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'rotate', fromRotation: 0, toRotation: 360, duration: 3, delay: 0.8, repeat: 2 },
      ],
    })
    .addCircle({
      x: '50%',
      y: '75%',
      radius: 50,
      fillColor: colors.purple,
      opacity: 0.6,
      duration: 10,
      startTime: 3.2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'rotate', fromRotation: 0, toRotation: -360, duration: 3, delay: 0.6, repeat: 2 },
      ],
    })
    .addCircle({
      x: '80%',
      y: '75%',
      radius: 50,
      fillColor: colors.pink,
      opacity: 0.6,
      duration: 10,
      startTime: 3.4,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'rotate', fromRotation: 0, toRotation: 360, duration: 3, delay: 0.4, repeat: 2 },
      ],
    });

  currentTime = scene6StartTime + 10;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景7：结尾 ==========
  console.log('创建场景7: 结尾...');
  const scene7StartTime = currentTime - transitionDuration;
  const scene7 = mainTrack.createScene({
    duration: 8,
    startTime: scene7StartTime,
  })
    .addBackground({ color: colors.dark })
    .addText({
      text: 'FKNew',
      color: colors.cyan,
      fontSize: 120,
      x: '50%',
      y: '40%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      gradient: true,
      gradientColors: [colors.cyan, colors.purple, colors.pink],
      textGlow: true,
      textGlowColor: colors.cyan,
      textGlowBlur: 50,
      stroke: true,
      strokeColor: colors.white,
      strokeWidth: 3,
      duration: 8,
      startTime: 0,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
        { type: 'scale', fromScale: 0.5, toScale: 1.1, duration: 1 },
        { type: 'scale', fromScale: 1.1, toScale: 1, duration: 0.5, delay: 1 },
      ],
    })
    .addText({
      text: '让视频创作更简单',
      color: colors.white,
      fontSize: 60,
      x: '50%',
      y: '60%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      fontFamily: 'MicrosoftYaHei',
      duration: 8,
      startTime: 1.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
        { type: 'move', fromX: '50%', fromY: '70%', toX: '50%', toY: '60%', duration: 0.8 },
      ],
    })
    // 装饰性粒子效果
    .addCircle({
      x: '30%',
      y: '30%',
      radius: 30,
      fillColor: colors.cyan,
      opacity: 0.4,
      duration: 8,
      startTime: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'move', fromX: '30%', fromY: '30%', toX: '70%', toY: '30%', duration: 3, delay: 0.8 },
        { type: 'fade', fromOpacity: 0.4, toOpacity: 0, duration: 0.5, delay: 3.8 },
      ],
    })
    .addCircle({
      x: '70%',
      y: '70%',
      radius: 30,
      fillColor: colors.purple,
      opacity: 0.4,
      duration: 8,
      startTime: 2.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.5 },
        { type: 'scale', fromScale: 0, toScale: 1, duration: 0.8 },
        { type: 'move', fromX: '70%', fromY: '70%', toX: '30%', toY: '70%', duration: 3, delay: 0.3 },
        { type: 'fade', fromOpacity: 0.4, toOpacity: 0, duration: 0.5, delay: 3.3 },
      ],
    });

  currentTime = scene7StartTime + 8;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'promo-video-60s.mp4');

  try {
    console.log('\n🚀 开始导出视频...');
    console.log(`输出路径: ${outputPath}\n`);
    console.log(`总时长: ${totalDuration} 秒`);
    console.log(`场景数: ${mainTrack.scenes.length}`);
    console.log(`转场数: ${mainTrack.transitions.length}\n`);

    await builder.export(outputPath, {
      quality: 'high',
      bitrate: '12M',
      usePipe: true,
    });

    console.log('✅ 视频导出成功！');
    console.log(`📁 文件位置: ${outputPath}`);
    console.log(`⏱️  总时长: ${totalDuration} 秒`);
    console.log('\n✨ 宣传视频制作完成！');
    console.log('\n视频包含：');
    console.log('  ✓ 丰富的文本效果（渐变、阴影、描边、发光、分割动画）');
    console.log('  ✓ 多样化图形元素（圆形、矩形、路径）');
    console.log('  ✓ SVG 动画（蝴蝶飞舞）');
    console.log('  ✓ 音频可视化（示波器）');
    console.log('  ✓ 转场效果');
    console.log('  ✓ 综合展示');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

createPromoVideo().catch(console.error);


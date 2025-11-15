/**
 * FKbuilder 项目演示视频
 * 全面展示项目的主要功能和特性
 */
import { VideoBuilder, getAudioDuration } from '../src/index.js';
import { registerFontFile } from '../src/utils/font-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 注册字体
const fontPath = 'D:/code/foliko-trade/public/fonts/MicrosoftYaHei-Bold-01.ttf';
try {
  registerFontFile(fontPath, 'MicrosoftYaHei');
} catch (error) {
  console.warn('字体注册失败，将使用默认字体:', error.message);
}

async function createDemoVideo() {
  console.log('🎬 开始创建演示视频...\n');

  // 检查音频文件
  const audioFile = path.join(__dirname, '../assets/happy-day.mp3');
  let audioDuration = 0;
  if (await fs.pathExists(audioFile)) {
    audioDuration = await getAudioDuration(audioFile);
    audioDuration = Number(audioDuration) || 0;
    console.log(`✅ 找到背景音乐，时长: ${audioDuration.toFixed(2)} 秒\n`);
  } else {
    console.warn('⚠️  未找到背景音乐文件，将不使用背景音乐\n');
  }

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1, name: '主轨道' });
  let currentTime = 0;
  const sceneDuration = 5;
  const transitionDuration = 0.8;

  // ========== 场景1：项目介绍 ==========
  console.log('创建场景1: 项目介绍...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: 'FKbuilder',
      color: '#ffffff',
      fontSize: 120,
      x: '50%',
      y: '35%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      textShadow: true,
      textShadowBlur: 30,
      textGlow: true,
      textGlowColor: '#4ECDC4',
      textGlowBlur: 40,
      animations: ['fadeIn', 'zoomIn'],
    })
    .addText({
      text: '程序化视频生成库',
      color: '#4ECDC4',
      fontSize: 56,
      x: '50%',
      y: '50%',
      textAlign: 'center',
      duration: 3.5,
      startTime: 1,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeInUp'],
    })
    .addText({
      text: '基于 Node.js + Paper.js',
      color: '#ffe66d',
      fontSize: 42,
      x: '50%',
      y: '60%',
      textAlign: 'center',
      duration: 3,
      startTime: 1.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '强大 · 灵活 · 易用',
      color: '#a8e6cf',
      fontSize: 36,
      x: '50%',
      y: '70%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景2：文本动画展示 ==========
  console.log('创建场景2: 文本动画展示...');
  // 转场的 startTime 应该是转场结束的时间（目标场景开始的时间）
  const scene2StartTime = currentTime;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: scene2StartTime, // 转场结束时间 = 目标场景开始时间
  });

  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: '#2c3e50' })
    .addText({
      text: '丰富的文本动画',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      textShadow: true,
      animations: ['fadeIn'],
    })
    .addText({
      text: '淡入淡出',
      color: '#ff6b6b',
      fontSize: 48,
      x: '25%',
      y: '35%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 0.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '缩放进入',
      color: '#4ecdc4',
      fontSize: 48,
      x: '50%',
      y: '35%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 0.8,
      fontFamily: 'MicrosoftYaHei',
      animations: ['zoomIn'],
    })
    .addText({
      text: '弹跳效果',
      color: '#ffe66d',
      fontSize: 48,
      x: '75%',
      y: '35%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 1.1,
      fontFamily: 'MicrosoftYaHei',
      animations: ['bounceIn'],
    })
    .addText({
      text: '文字拆分动画',
      color: '#a8e6cf',
      fontSize: 64,
      x: '50%',
      y: '60%',
      textAlign: 'center',
      duration: 3,
      startTime: 1.5,
      fontFamily: 'MicrosoftYaHei',
      split: 'letter',
      splitDelay: 0.08,
      splitDuration: 0.3,
      animations: ['fadeIn'],
      textShadow: true,
    })
    .addText({
      text: '渐变 · 阴影 · 发光',
      color: '#ffffff',
      fontSize: 48,
      x: '50%',
      y: '75%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2.5,
      fontFamily: 'MicrosoftYaHei',
      gradient: true,
      gradientColors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
      gradientDirection: 'horizontal',
      textShadow: true,
      textShadowBlur: 20,
      textGlow: true,
      textGlowColor: '#FFFFFF',
      textGlowBlur: 30,
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景3：形状和图形 ==========
  console.log('创建场景3: 形状和图形...');
  const scene3StartTime = currentTime;
  mainTrack.addTransition({
    name: 'CircleCrop',
    duration: transitionDuration,
    startTime: scene3StartTime,
  });

  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: '丰富的图形元素',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    })
    .addRect({
      x: '25%',
      y: '45%',
      width: 300,
      height: 200,
      bgcolor: '#ff6b6b',
      borderRadius: 20,
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 0.5,
      animations: ['fadeIn', 'zoomIn'],
      shadowBlur: 30,
      shadowColor: '#000000',
    })
    .addCircle({
      x: '50%',
      y: '45%',
      radius: 100,
      bgcolor: '#4ecdc4',
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 0.8,
      animations: ['bounceIn'],
      shadowBlur: 30,
      shadowColor: '#000000',
    })
    .addCircle({
      x: '75%',
      y: '45%',
      radius: 100,
      bgcolor: '#ffe66d',
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 1.1,
      animations: ['rotateIn'],
      shadowBlur: 30,
      shadowColor: '#000000',
    })
    .addText({
      text: '矩形 · 圆形 · 路径',
      color: '#a8e6cf',
      fontSize: 48,
      x: '50%',
      y: '70%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景4：转场效果 ==========
  console.log('创建场景4: 转场效果...');
  const scene4StartTime = currentTime;
  mainTrack.addTransition({
    name: 'Swirl',
    duration: transitionDuration,
    startTime: scene4StartTime,
  });

  const scene4 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene4StartTime,
  })
    .addBackground({ color: '#2d3436' })
    .addText({
      text: '丰富的转场效果',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '30%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    })
    .addText({
      text: '淡入淡出 · 交叉缩放 · 圆形裁剪',
      color: '#4ecdc4',
      fontSize: 42,
      x: '50%',
      y: '45%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 1,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '漩涡 · 方向擦除 · 弹跳',
      color: '#ffe66d',
      fontSize: 42,
      x: '50%',
      y: '55%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 1.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '支持 gl-transitions 所有效果',
      color: '#a8e6cf',
      fontSize: 36,
      x: '50%',
      y: '70%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景5：多轨道多场景 ==========
  console.log('创建场景5: 多轨道多场景...');
  const scene5StartTime = currentTime;
  mainTrack.addTransition({
    name: 'LinearBlur',
    duration: transitionDuration,
    startTime: scene5StartTime,
  });

  const scene5 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene5StartTime,
  })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: '多轨道多场景系统',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '30%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    })
    .addText({
      text: '灵活的轨道管理',
      color: '#4ecdc4',
      fontSize: 48,
      x: '25%',
      y: '50%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 1,
      fontFamily: 'MicrosoftYaHei',
      animations: ['slideInLeft'],
    })
    .addText({
      text: '精确的时间控制',
      color: '#ffe66d',
      fontSize: 48,
      x: '50%',
      y: '50%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 1.3,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn', 'zoomIn'],
    })
    .addText({
      text: '场景叠加组合',
      color: '#a8e6cf',
      fontSize: 48,
      x: '75%',
      y: '50%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 1.6,
      fontFamily: 'MicrosoftYaHei',
      animations: ['slideInRight'],
    });

  // 添加叠加轨道
  const overlayTrack = builder.createTrack({ zIndex: 2, name: '叠加轨道' });
  const overlayScene = overlayTrack.createScene({
    duration: sceneDuration,
    startTime: scene5StartTime,
  })
    .addText({
      text: '轨道叠加示例',
      color: '#ff6b6b',
      fontSize: 36,
      x: '50%',
      y: '75%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      textShadow: true,
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景6：持续动画 ==========
  console.log('创建场景6: 持续动画...');
  const scene6StartTime = currentTime;
  mainTrack.addTransition({
    name: 'Radial',
    duration: transitionDuration,
    startTime: scene6StartTime,
  });

  const scene6 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene6StartTime,
  })
    .addBackground({ color: '#2c3e50' })
    .addText({
      text: 'onFrame 持续动画',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '20%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    })
    // 旋转的圆形
    .addCircle({
      x: '25%',
      y: '45%',
      radius: 60,
      bgcolor: '#4ecdc4',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0.5,
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const relativeTime = event.time - element.startTime;
        const rotationSpeed = 180; // 度/秒
        const rotation = (relativeTime * rotationSpeed) % 360;
        paperItem.rotation = rotation;
      },
      animations: ['fadeIn'],
    })
    // 脉冲的圆形
    .addCircle({
      x: '50%',
      y: '45%',
      radius: 60,
      bgcolor: '#ff6b6b',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0.8,
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const relativeTime = event.time - element.startTime;
        const pivot = paperItem.position || paperItem.center;
        if (pivot) {
          // 脉冲效果：在0.8到1.2之间缩放
          const pulseSpeed = 2; // 脉冲速度（周期/秒）
          const pulsePhase = relativeTime * pulseSpeed * 2 * Math.PI;
          const pulseScale = 1 + Math.sin(pulsePhase) * 0.2;
          const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
          paperItem.scale(pulseScale / currentScale, pivot);
        }
      },
      animations: ['fadeIn'],
    })
    // 闪烁的圆形
    .addCircle({
      x: '75%',
      y: '45%',
      radius: 60,
      bgcolor: '#ffe66d',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 1.1,
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const relativeTime = event.time - element.startTime;
        // 闪烁效果：透明度在0.3到1.0之间变化
        const twinkleSpeed = 3; // 闪烁速度（周期/秒）
        const twinklePhase = relativeTime * twinkleSpeed * 2 * Math.PI;
        const twinkleValue = (Math.sin(twinklePhase) + 1) / 2; // 0到1之间
        const opacity = 0.3 + twinkleValue * 0.7;
        paperItem.opacity = opacity;
      },
      animations: ['fadeIn'],
    })
    // 颜色变化的圆形
    .addCircle({
      x: '50%',
      y: '65%',
      radius: 50,
      bgcolor: '#4ecdc4',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 1.4,
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const relativeTime = event.time - element.startTime;
        // 颜色变化：色相在0到360度之间循环
        const hueSpeed = 60; // 色相变化速度（度/秒）
        const hue = (relativeTime * hueSpeed) % 360;
        if (paperItem.fillColor) {
          paperItem.fillColor.hue = hue;
        }
      },
      animations: ['fadeIn'],
    })
    .addText({
      text: '旋转 · 脉冲 · 闪烁 · 颜色变化',
      color: '#ffe66d',
      fontSize: 42,
      x: '50%',
      y: '80%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景7：SVG 元素展示 ==========
  console.log('创建场景7: SVG 元素展示...');
  const scene7StartTime = currentTime;
  mainTrack.addTransition({
    name: 'Mosaic',
    duration: transitionDuration,
    startTime: scene7StartTime,
  });

  const scene7 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene7StartTime,
  })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: 'SVG 元素支持',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 星形 SVG
  const starSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <polygon points="100,10 120,70 180,70 135,110 155,170 100,135 45,170 65,110 20,70 80,70" 
               fill="#4ecdc4" 
               stroke="#ffffff" 
               stroke-width="3"/>
    </svg>
  `;

  scene7.addSVG({
    svgString: starSVG,
    x: '30%',
    y: '50%',
    width: 250,
    height: 250,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    onFrame: (element, event, paperItem) => {
      if (!paperItem) return;
      const relativeTime = event.time - element.startTime;
      const rotationSpeed = 90; // 度/秒
      const rotation = (relativeTime * rotationSpeed) % 360;
      paperItem.rotation = rotation;
    },
    animations: ['fadeIn', 'zoomIn'],
  });

  // 心形 SVG
  const heartSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <path d="M100,180 C100,180 20,120 20,80 C20,50 40,30 70,30 C85,30 100,40 100,55 C100,40 115,30 130,30 C160,30 180,50 180,80 C180,120 100,180 100,180 Z" 
            fill="#ff6b6b" 
            stroke="#ffffff" 
            stroke-width="2"/>
    </svg>
  `;

  scene7.addSVG({
    svgString: heartSVG,
    x: '70%',
    y: '50%',
    width: 250,
    height: 250,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.8,
    onFrame: (element, event, paperItem) => {
      if (!paperItem) return;
      const relativeTime = event.time - element.startTime;
      const pivot = paperItem.position || paperItem.center;
      if (pivot) {
        // 心跳效果
        const pulseSpeed = 2;
        const pulsePhase = relativeTime * pulseSpeed * 2 * Math.PI;
        const pulseScale = 1 + Math.sin(pulsePhase) * 0.15;
        const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
        paperItem.scale(pulseScale / currentScale, pivot);
      }
    },
    animations: ['fadeIn'],
  })
    .addText({
      text: '支持 SVG 字符串和文件',
      color: '#a8e6cf',
      fontSize: 42,
      x: '50%',
      y: '75%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景8：Path 元素展示 ==========
  console.log('创建场景8: Path 元素展示...');
  const scene8StartTime = currentTime;
  mainTrack.addTransition({
    name: 'PolkaDotsCurtain',
    duration: transitionDuration,
    startTime: scene8StartTime,
  });

  const scene8 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene8StartTime,
  })
    .addBackground({ color: '#2c3e50' })
    .addText({
      text: 'Path 路径元素',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '15%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    })
    // 波浪路径
    .addPath({
      points: [
        { x: 200, y: 400 },
        { x: 400, y: 380 },
        { x: 600, y: 400 },
        { x: 800, y: 380 },
        { x: 1000, y: 400 },
        { x: 1200, y: 380 },
        { x: 1400, y: 400 },
        { x: 1600, y: 380 },
        { x: 1720, y: 400 },
      ],
      closed: false,
      smooth: true,
      strokeColor: '#4ecdc4',
      strokeWidth: 4,
      fillColor: null,
      duration: sceneDuration,
      startTime: 0.5,
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const relativeTime = event.time - element.startTime;
        // 波浪动画：路径点上下移动
        if (paperItem.segments && paperItem.segments.length > 0) {
          paperItem.segments.forEach((segment, index) => {
            if (index > 0 && index < paperItem.segments.length - 1) {
              const waveSpeed = 2;
              const wavePhase = relativeTime * waveSpeed * 2 * Math.PI + index * 0.5;
              const waveAmplitude = 20;
              const originalY = 400;
              segment.point.y = originalY + Math.sin(wavePhase) * waveAmplitude;
            }
          });
        }
      },
      animations: ['fadeIn'],
    })
    // 圆形路径
    .addPath({
      points: (() => {
        const points = [];
        const centerX = 960;
        const centerY = 600;
        const radius = 100;
        for (let i = 0; i <= 360; i += 10) {
          const angle = (i * Math.PI) / 180;
          points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          });
        }
        return points;
      })(),
      closed: true,
      smooth: true,
      fillColor: '#ff6b6b',
      strokeColor: '#ffffff',
      strokeWidth: 3,
      opacity: 0.7,
      duration: sceneDuration,
      startTime: 1,
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const relativeTime = event.time - element.startTime;
        const rotationSpeed = 120; // 度/秒
        const rotation = (relativeTime * rotationSpeed) % 360;
        paperItem.rotation = rotation;
      },
      animations: ['fadeIn'],
    })
    .addText({
      text: '自定义路径 · 平滑曲线 · 动态效果',
      color: '#ffe66d',
      fontSize: 42,
      x: '50%',
      y: '80%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景9：示波器展示 ==========
  console.log('创建场景9: 示波器展示...');
  const scene9StartTime = currentTime;
  mainTrack.addTransition({
    name: 'ZoomInCircles',
    duration: transitionDuration,
    startTime: scene9StartTime,
  });

  const scene9 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene9StartTime,
  })
    .addBackground({ color: '#1a1a1a' })
    .addText({
      text: '音频示波器',
      color: '#ffffff',
      fontSize: 72,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 添加示波器（如果有音频文件）
  if (await fs.pathExists(audioFile) && audioDuration > 0) {
    await scene9.addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '40%',
      width: 1600,
      height: 200,
      waveColor: '#4ecdc4',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      style: 'line',
      lineWidth: 3,
      mirror: true,
      smoothing: 0.3,
      sensitivity: 1.0,
      windowSize: 0.1,
      startTime: 0.5,
      duration: Math.min(sceneDuration - 0.5, audioDuration),
      zIndex: 1,
    });

    await scene9.addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '65%',
      width: 1600,
      height: 200,
      waveColor: '#ff6b6b',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      style: 'bars',
      barWidth: 4,
      barGap: 2,
      mirror: true,
      sensitivity: 1.2,
      windowSize: 0.1,
      startTime: 0.5,
      duration: Math.min(sceneDuration - 0.5, audioDuration),
      zIndex: 1,
    });
  } else {
    scene9.addText({
      text: '（需要音频文件才能显示示波器）',
      color: '#888888',
      fontSize: 36,
      x: '50%',
      y: '50%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 1,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });
  }

  scene9.addText({
    text: '线条样式 · 柱状样式 · 多种效果',
    color: '#ffe66d',
    fontSize: 42,
    x: '50%',
    y: '85%',
    textAlign: 'center',
    duration: 2.5,
    startTime: 2.5,
    fontFamily: 'MicrosoftYaHei',
    animations: ['fadeIn'],
  });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景10：功能总结 ==========
  console.log('创建场景10: 功能总结...');
  const scene10StartTime = currentTime;
  mainTrack.addTransition({
    name: 'Dreamy',
    duration: transitionDuration,
    startTime: scene10StartTime,
  });

  const scene10 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene10StartTime,
  })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: '核心特性',
      color: '#ffffff',
      fontSize: 80,
      x: '50%',
      y: '25%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      textGlow: true,
      textGlowColor: '#4ECDC4',
      textGlowBlur: 40,
      animations: ['fadeIn'],
    })
    .addText({
      text: '🎬 多轨道多场景',
      color: '#4ecdc4',
      fontSize: 42,
      x: '50%',
      y: '40%',
      textAlign: 'center',
      duration: 2,
      startTime: 0.8,
      fontFamily: 'MicrosoftYaHei',
      animations: ['slideInLeft'],
    })
    .addText({
      text: '🎨 丰富的元素类型',
      color: '#ffe66d',
      fontSize: 42,
      x: '50%',
      y: '48%',
      textAlign: 'center',
      duration: 2,
      startTime: 1.2,
      fontFamily: 'MicrosoftYaHei',
      animations: ['slideInLeft'],
    })
    .addText({
      text: '✨ 强大的动画系统',
      color: '#a8e6cf',
      fontSize: 42,
      x: '50%',
      y: '56%',
      textAlign: 'center',
      duration: 2,
      startTime: 1.6,
      fontFamily: 'MicrosoftYaHei',
      animations: ['slideInLeft'],
    })
    .addText({
      text: '🎭 丰富的转场效果',
      color: '#ff6b6b',
      fontSize: 42,
      x: '50%',
      y: '64%',
      textAlign: 'center',
      duration: 2,
      startTime: 2,
      fontFamily: 'MicrosoftYaHei',
      animations: ['slideInLeft'],
    })
    .addText({
      text: '🚀 高性能渲染',
      color: '#45B7D1',
      fontSize: 42,
      x: '50%',
      y: '72%',
      textAlign: 'center',
      duration: 2,
      startTime: 2.4,
      fontFamily: 'MicrosoftYaHei',
      animations: ['slideInLeft'],
    });

  currentTime += sceneDuration - transitionDuration;

  // ========== 场景11：结束 ==========
  console.log('创建场景11: 结束...');
  const scene11StartTime = currentTime;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: scene11StartTime,
  });

  const scene11 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene11StartTime,
  })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: 'FKbuilder',
      color: '#ffffff',
      fontSize: 120,
      x: '50%',
      y: '40%',
      textAlign: 'center',
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      textGlow: true,
      textGlowColor: '#4ECDC4',
      textGlowBlur: 50,
      animations: ['fadeIn', 'zoomIn'],
    })
    .addText({
      text: '开始你的视频创作之旅',
      color: '#4ECDC4',
      fontSize: 56,
      x: '50%',
      y: '55%',
      textAlign: 'center',
      duration: 3,
      startTime: 1.5,
      fontFamily: 'MicrosoftYaHei',
      gradient: true,
      gradientColors: ['#4ECDC4', '#45B7D1'],
      gradientDirection: 'horizontal',
      animations: ['fadeInUp'],
    })
    .addText({
      text: '基于 Node.js 的纯 JavaScript 视频制作库',
      color: '#ffe66d',
      fontSize: 36,
      x: '50%',
      y: '70%',
      textAlign: 'center',
      duration: 2.5,
      startTime: 2.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  // 添加背景音乐（如果有音频文件）
  if (await fs.pathExists(audioFile) && audioDuration > 0) {
    const totalDuration = builder.getTotalDuration();
    const audioTrack = builder.createTrack({ zIndex: 0, name: '音频轨道' });
    const audioScene = audioTrack.createScene({
      duration: Math.min(totalDuration, audioDuration),
      startTime: 0,
    });
    audioScene.addAudio({
      src: audioFile,
      startTime: 0,
      duration: Math.min(totalDuration, audioDuration),
      volume: 0.3, // 降低音量作为背景音乐
      fadeIn: 1,
      fadeOut: 1,
    });
    console.log('✅ 已添加背景音乐\n');
  }

  // 导出视频
  const outputPath = path.join(__dirname, '../output/demo-video.mp4');
  console.log('\n🎬 开始导出视频...');
  console.log(`输出路径: ${outputPath}\n`);

  await builder.export(outputPath, {
    usePipe: true,
  });

  console.log('\n✅ 演示视频创建完成！');
  console.log(`📁 输出文件: ${outputPath}`);
}

createDemoVideo().catch(console.error);


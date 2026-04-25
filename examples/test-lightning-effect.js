import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from '@chnak/paper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试闪电效果
 * 使用SVG路径和onFrame实现闪烁的闪电动画
 */
async function testLightningEffect() {
  console.log('⚡ 测试闪电效果...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const duration = 10; // 10秒视频

  // 创建场景
  const scene = mainTrack.createScene({ duration })
    // 深色背景（暴风雨天空）
    .addBackground({ color: '#1a1a2e' });

  // 生成多个闪电路径
  const lightningPaths = [
    // 闪电1：从左上到右下
    {
      points: [
        { x: 200, y: 50 },
        { x: 180, y: 150 },
        { x: 220, y: 200 },
        { x: 190, y: 300 },
        { x: 210, y: 400 },
        { x: 180, y: 500 },
        { x: 200, y: 600 },
        { x: 190, y: 700 },
        { x: 210, y: 800 },
        { x: 200, y: 900 },
        { x: 190, y: 1000 },
        { x: 200, y: 1080 },
      ],
      x: 0,
      y: 0,
      startTime: 0,
      flashInterval: 1.5, // 每1.5秒闪烁一次
      flashDuration: 0.1, // 每次闪烁持续0.1秒
      initialDelay: 0.5,
    },
    // 闪电2：从右上到左下
    {
      points: [
        { x: 1700, y: 80 },
        { x: 1720, y: 200 },
        { x: 1690, y: 300 },
        { x: 1710, y: 400 },
        { x: 1680, y: 500 },
        { x: 1700, y: 600 },
        { x: 1690, y: 700 },
        { x: 1710, y: 800 },
        { x: 1680, y: 900 },
        { x: 1700, y: 1000 },
        { x: 1690, y: 1080 },
      ],
      x: 0,
      y: 0,
      startTime: 0,
      flashInterval: 2.0,
      flashDuration: 0.15,
      initialDelay: 1.0,
    },
    // 闪电3：中间偏左
    {
      points: [
        { x: 600, y: 100 },
        { x: 580, y: 250 },
        { x: 620, y: 350 },
        { x: 590, y: 500 },
        { x: 610, y: 650 },
        { x: 580, y: 800 },
        { x: 600, y: 950 },
        { x: 590, y: 1080 },
      ],
      x: 0,
      y: 0,
      startTime: 0,
      flashInterval: 1.8,
      flashDuration: 0.12,
      initialDelay: 0.8,
    },
    // 闪电4：中间偏右
    {
      points: [
        { x: 1300, y: 120 },
        { x: 1280, y: 280 },
        { x: 1320, y: 420 },
        { x: 1290, y: 580 },
        { x: 1310, y: 720 },
        { x: 1280, y: 880 },
        { x: 1300, y: 1020 },
        { x: 1290, y: 1080 },
      ],
      x: 0,
      y: 0,
      startTime: 0,
      flashInterval: 2.2,
      flashDuration: 0.08,
      initialDelay: 1.5,
    },
  ];

  // 为每个闪电创建路径元素
  lightningPaths.forEach((lightning, index) => {
    scene.addPath({
      points: lightning.points,
      closed: false,
      smooth: false,
      strokeColor: '#ffffff',
      strokeWidth: 8,
      fillColor: null,
      opacity: 0,
      duration: duration,
      startTime: lightning.startTime,
      zIndex: 10,
      x: lightning.x,
      y: lightning.y,
      // 使用onFrame实现闪烁效果
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        
        // 计算相对于元素开始的时间
        const relativeTime = event.time - element.startTime;
        
        // 计算当前是否在闪烁周期内
        const cycleTime = (relativeTime - lightning.initialDelay) % lightning.flashInterval;
        const isFlashing = cycleTime >= 0 && cycleTime < lightning.flashDuration;
        
        if (isFlashing) {
          // 闪烁时：快速出现和消失
          // 使用指数衰减模拟闪电的快速闪烁
          const flashProgress = cycleTime / lightning.flashDuration;
          // 前半段快速出现，后半段快速消失
          let opacity;
          if (flashProgress < 0.3) {
            // 快速出现
            opacity = flashProgress / 0.3;
          } else if (flashProgress < 0.6) {
            // 保持高亮度
            opacity = 1.0;
          } else {
            // 快速消失
            opacity = 1.0 - (flashProgress - 0.6) / 0.4;
          }
          
          // 添加一些随机性，让闪电更真实
          const randomFlicker = 0.7 + Math.random() * 0.3;
          paperItem.opacity = opacity * randomFlicker;
          
          // 闪电颜色：白色到淡蓝色
          const blueTint = Math.random() * 0.3;
          paperItem.strokeColor = new paper.Color(1 - blueTint, 1 - blueTint * 0.5, 1);
        } else {
          // 不闪烁时：完全透明
          paperItem.opacity = 0;
        }
      },
    });
    
    // 添加闪电的发光效果（更粗的路径作为光晕）
    scene.addPath({
      points: lightning.points,
      closed: false,
      smooth: false,
      strokeColor: '#aaccff',
      strokeWidth: 20,
      fillColor: null,
      opacity: 0,
      duration: duration,
      startTime: lightning.startTime,
      zIndex: 9, // 在主要闪电下方
      x: lightning.x,
      y: lightning.y,
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        
        const relativeTime = event.time - element.startTime;
        const cycleTime = (relativeTime - lightning.initialDelay) % lightning.flashInterval;
        const isFlashing = cycleTime >= 0 && cycleTime < lightning.flashDuration;
        
        if (isFlashing) {
          const flashProgress = cycleTime / lightning.flashDuration;
          let opacity;
          if (flashProgress < 0.3) {
            opacity = flashProgress / 0.3;
          } else if (flashProgress < 0.6) {
            opacity = 0.4; // 光晕保持较低亮度
          } else {
            opacity = 0.4 * (1.0 - (flashProgress - 0.6) / 0.4);
          }
          paperItem.opacity = opacity * 0.3; // 光晕更淡
        } else {
          paperItem.opacity = 0;
        }
      },
    });
  });

  // 添加标题
  scene.addText({
    text: '⚡ 闪电效果测试 ⚡',
    color: '#ffffff',
    fontSize: 72,
    x: '50%',
    y: '10%',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: duration,
    startTime: 0,
    zIndex: 20,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    textShadow: true,
    textShadowColor: '#000000',
    textShadowBlur: 20,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
    ],
  });

  // 添加说明文字
  scene.addText({
    text: '使用 SVG 路径 + onFrame 实现闪烁动画',
    color: '#cccccc',
    fontSize: 32,
    x: '50%',
    y: '90%',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: duration,
    startTime: 0,
    zIndex: 20,
    fontFamily: 'Arial',
    opacity: 0.8,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 1, delay: 0.5 },
    ],
  });

  // 使用SVG方式创建闪电（备选方案）
  // 创建一个更复杂的闪电SVG
  const lightningSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 1000" width="200" height="1000">
      <defs>
        <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#aaccff;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path id="lightningPath" d="M 100 0 L 90 150 L 110 250 L 85 400 L 115 550 L 90 700 L 110 850 L 95 1000" 
            stroke="url(#lightningGrad)" 
            stroke-width="8" 
            fill="none" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#glow)"/>
    </svg>
  `;

  // 添加SVG闪电（作为对比）
  scene.addSVG({
    svgString: lightningSVG,
    x: '25%',
    y: '50%',
    width: 200,
    height: 1000,
    anchor: [0.5, 0.5],
    duration: duration,
    startTime: 0,
    zIndex: 11,
    opacity: 0,
    onFrame: (element, event, paperItem) => {
      if (!paperItem) return;
      
      // 每2秒闪烁一次
      const flashInterval = 2.0;
      const flashDuration = 0.1;
      const cycleTime = event.time % flashInterval;
      const isFlashing = cycleTime < flashDuration;
      
      if (isFlashing) {
        const flashProgress = cycleTime / flashDuration;
        let opacity;
        if (flashProgress < 0.3) {
          opacity = flashProgress / 0.3;
        } else if (flashProgress < 0.7) {
          opacity = 1.0;
        } else {
          opacity = 1.0 - (flashProgress - 0.7) / 0.3;
        }
        paperItem.opacity = opacity * (0.8 + Math.random() * 0.2);
      } else {
        paperItem.opacity = 0;
      }
    },
  });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'lightning-effect.mp4');

  try {
    console.log('🎬 开始渲染闪电效果...');
    const videoMaker = builder.build();
    
    console.log(`场景时长: ${duration} 秒`);
    console.log(`总帧数: ${Math.ceil(duration * 30)} 帧\n`);
    
    await videoMaker.export(outputPath);
    
    console.log('');
    console.log('✅ 测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log('⚡ 闪电效果测试成功！');
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testLightningEffect().catch(console.error);


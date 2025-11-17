/**
 * 酷炫视频示例 - 展示各种功能和效果
 */
import { VideoBuilder, Component } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createCoolVideo() {
  console.log('🎬 创建酷炫视频...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 60, // 60fps 更流畅
  });

  // 创建主轨道
  const mainTrack = builder.createTrack({ zIndex: 1 });

  // ========== 场景1: 开场动画 ==========
  const scene1 = mainTrack.createScene({
    duration: 3,
    startTime: 0,
  });
  scene1.addBackground({ color: '#0a0a0a' });
  
  // 标题文字 - 从中心放大
  scene1.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: '#5acbed',
    textAlign: 'center',
    fontWeight: 'bold',
    startTime: 0,
    duration: 3,
    animations: ['zoomIn', 'fadeOut'],
    onFrame: (element, progress, time) => {
      // 发光效果
      const glow = Math.sin(time * 8) * 0.3 + 0.7;
      if (element.config) {
        element.config.opacity = glow;
      }
    }
  });
  
  // 副标题
  scene1.addText({
    text: '强大的视频制作工具',
    x: '50%',
    y: '55%',
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    startTime: 0.5,
    duration: 2.5,
    animations: ['fadeIn', 'fadeOut'],
  });

  // 粒子效果 - 多个圆形
  for (let i = 0; i < 20; i++) {
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const randomRadius = 5 + Math.random() * 15;
    const randomOpacity = 0.3 + Math.random() * 0.4;
    const randomStartTime = Math.random() * 2;
    const randomDuration = 1 + Math.random() * 2;
    const randomPhase = Math.random() * Math.PI * 2; // 随机相位，避免所有粒子同步
    
    // 将 randomPhase 硬编码到函数体中
    const onFrameFunc = new Function('item', 'progress', 'time', `
      item.rotation += 2;
      const scale = 1 + Math.sin(time * 3 + ${randomPhase}) * 0.3;
      item.scaleX = scale;
      item.scaleY = scale;
    `);
    
    scene1.addCircle({
      x: `${randomX}%`,
      y: `${randomY}%`,
      radius: randomRadius,
      fillColor: `rgba(90, 203, 237, ${randomOpacity})`,
      startTime: randomStartTime,
      duration: randomDuration,
      animations: ['fadeIn', 'fadeOut'],
      onFrame: onFrameFunc
    });
  }

  // ========== 场景2: 功能展示卡片 ==========
  const scene2 = mainTrack.createScene({
    duration: 4,
    startTime: 3,
  });
  scene2.addBackground({ color: '#1a1a2e' });
  
  // 创建一个可复用的卡片组件
  const cardComponent = new Component({
    name: 'FeatureCard',
    width: 500,
    height: 400,
    x: '50%',
    y: '50%',
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 3,
    zIndex: 10,
  });
  
  cardComponent
    .addBackground({ color: '#2e3b3c' })
    .addRect({
      x: '50%',
      y: '50%',
      width: '90%',
      height: '85%',
      fillColor: 'rgba(32, 138, 183, 0.2)',
      strokeColor: '#5acbed',
      strokeWidth: 3,
      borderRadius: 20,
      startTime: 0,
      duration: 3,
      animations: ['zoomIn'],
    })
    .addText({
      text: '功能特性',
      x: '50%',
      y: '30%',
      fontSize: 48,
      color: '#5acbed',
      textAlign: 'center',
      fontWeight: 'bold',
      startTime: 0.3,
      duration: 2.7,
      animations: ['fadeIn'],
    })
    .addText({
      text: '• 丰富的动画效果\n• 组件化设计\n• 高性能渲染',
      x: '50%',
      y: '60%',
      fontSize: 32,
      color: '#ffffff',
      textAlign: 'center',
      startTime: 0.6,
      duration: 2.4,
      animations: ['fadeIn'],
    });
  
  scene2.addComponent(cardComponent);

  // 添加转场效果
  mainTrack.addTransition({
    fromScene: scene1,
    toScene: scene2,
    type: 'CrossZoom',
    duration: 0.5,
  });

  // ========== 场景3: 动画演示 ==========
  const scene3 = mainTrack.createScene({
    duration: 5,
    startTime: 7,
  });
  scene3.addBackground({ color: '#0d659d' });
  
  // 旋转的几何图形
  const shapes = [
    { type: 'rect', color: '#5acbed', x: '25%', y: '30%' },
    { type: 'circle', color: '#208ab7', x: '50%', y: '30%' },
    { type: 'rect', color: '#cbe7e8', x: '75%', y: '30%' },
  ];
  
  shapes.forEach((shape, index) => {
    const shapeIndex = index;
    const phaseOffset = index * 0.5; // 每个形状的相位偏移
    
    // 直接创建函数，将 phaseOffset 硬编码到函数体中
    const onFrameFunc = new Function('item', 'progress', 'time', `
      item.rotation += 3;
      const pulse = 1 + Math.sin(time * 4 + ${phaseOffset}) * 0.2;
      item.scaleX = pulse;
      item.scaleY = pulse;
    `);
    
    if (shape.type === 'rect') {
      scene3.addRect({
        x: shape.x,
        y: shape.y,
        width: 150,
        height: 150,
        fillColor: shape.color,
        strokeColor: '#ffffff',
        strokeWidth: 4,
        borderRadius: 20,
        startTime: shapeIndex * 0.2,
        duration: 4.5 - shapeIndex * 0.2,
        animations: ['zoomIn'],
        onFrame: onFrameFunc
      });
    } else {
      scene3.addCircle({
        x: shape.x,
        y: shape.y,
        radius: 75,
        fillColor: shape.color,
        strokeColor: '#ffffff',
        strokeWidth: 4,
        startTime: shapeIndex * 0.2,
        duration: 4.5 - shapeIndex * 0.2,
        animations: ['zoomIn'],
        onFrame: onFrameFunc
      });
    }
  });
  
  // 文字动画
  const initialY = 1080 * 0.7; // 70% of 1080
  // onFrame 回调参数: (element, progress, time, paperInstance)
  // element 是元素本身，可以通过 element.config.y 或直接修改 element 的属性
  const onFrameText = new Function('element', 'progress', 'time', `
    const wave = Math.sin(time * 2) * 10;
    if (element.config) {
      element.config.y = ${initialY} + wave;
    }
  `);
  
  scene3.addText({
    text: '流畅的动画效果',
    x: '50%',
    y: '70%',
    fontSize: 64,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    startTime: 1,
    duration: 4,
    animations: ['fadeIn'],
    onFrame: onFrameText
  });

  // 添加转场
  mainTrack.addTransition({
    fromScene: scene2,
    toScene: scene3,
    type: 'Swirl',
    duration: 0.8,
  });

  // ========== 场景4: 组件复用演示 ==========
  const scene4 = mainTrack.createScene({
    duration: 4,
    startTime: 12,
  });
  scene4.addBackground({ color: '#2e3b3c' });
  
  // 创建多个卡片组件实例
  const cardPositions = [
    { x: '25%', y: '50%', delay: 0 },
    { x: '50%', y: '50%', delay: 0.2 },
    { x: '75%', y: '50%', delay: 0.4 },
  ];
  
  cardPositions.forEach((pos, index) => {
    const card = new Component({
      name: `Card${index}`,
      width: 400,
      height: 300,
      x: pos.x,
      y: pos.y,
      anchor: [0.5, 0.5],
      startTime: pos.delay,
      duration: 3.5 - pos.delay,
      zIndex: 10,
    });
    
    card
      .addBackground({ color: '#0d659d' })
      .addRect({
        x: '50%',
        y: '50%',
        width: '85%',
        height: '80%',
        fillColor: 'rgba(90, 203, 237, 0.3)',
        strokeColor: '#5acbed',
        strokeWidth: 2,
        borderRadius: 15,
        startTime: 0,
        duration: 3.5 - pos.delay,
        animations: ['zoomIn'],
      })
      .addText({
        text: `卡片 ${index + 1}`,
        x: '50%',
        y: '50%',
        fontSize: 36,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
        startTime: 0.3,
        duration: 3.2 - pos.delay,
        animations: ['fadeIn'],
      });
    
    scene4.addComponent(card);
  });
  
  scene4.addText({
    text: '组件化设计，轻松复用',
    x: '50%',
    y: '85%',
    fontSize: 48,
    color: '#5acbed',
    textAlign: 'center',
    startTime: 1.5,
    duration: 2.5,
    animations: ['fadeIn'],
  });

  // 添加转场
  mainTrack.addTransition({
    fromScene: scene3,
    toScene: scene4,
    type: 'Radial',
    duration: 0.6,
  });

  // ========== 场景5: 结尾 ==========
  const scene5 = mainTrack.createScene({
    duration: 3,
    startTime: 16,
  });
  scene5.addBackground({ color: '#0a0a0a' });
  
  // 结尾文字
  scene5.addText({
    text: '感谢观看',
    x: '50%',
    y: '45%',
    fontSize: 100,
    color: '#5acbed',
    textAlign: 'center',
    fontWeight: 'bold',
    startTime: 0,
    duration: 3,
    animations: ['zoomIn', 'fadeOut'],
    onFrame: (item, progress, time) => {
      const glow = Math.sin(time * 6) * 0.2 + 0.8;
      item.opacity = glow;
    }
  });
  
  scene5.addText({
    text: 'GitHub: https://github.com/your-repo/FKbuilder',
    x: '50%',
    y: '60%',
    fontSize: 32,
    color: '#ffffff',
    textAlign: 'center',
    startTime: 0.8,
    duration: 2.2,
    animations: ['fadeIn'],
  });
  
  // 粒子效果
  for (let i = 0; i < 30; i++) {
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const randomRadius = 3 + Math.random() * 10;
    const randomOpacity = 0.2 + Math.random() * 0.5;
    const randomStartTime = Math.random() * 2;
    const randomDuration = 1 + Math.random() * 2;
    const randomPhase = Math.random() * Math.PI * 2; // 随机相位
    
    // 将 randomPhase 硬编码到函数体中
    const onFrameFunc = new Function('item', 'progress', 'time', `
      item.rotation += 1.5;
      const scale = 1 + Math.sin(time * 2 + ${randomPhase}) * 0.4;
      item.scaleX = scale;
      item.scaleY = scale;
    `);
    
    scene5.addCircle({
      x: `${randomX}%`,
      y: `${randomY}%`,
      radius: randomRadius,
      fillColor: `rgba(90, 203, 237, ${randomOpacity})`,
      startTime: randomStartTime,
      duration: randomDuration,
      animations: ['fadeIn', 'fadeOut'],
      onFrame: onFrameFunc
    });
  }

  // 添加转场
  mainTrack.addTransition({
    fromScene: scene4,
    toScene: scene5,
    type: 'Dreamy',
    duration: 0.8,
  });

  // 导出视频
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'cool-video.mp4');

  console.log('开始渲染视频...\n');
  const startTime = Date.now();

  await builder.render(outputPath, {
    parallel: true,
    usePipe: true,
    maxWorkers: 4,
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n✅ 视频渲染完成！`);
  console.log(`输出文件: ${outputPath}`);
  console.log(`渲染耗时: ${duration} 秒`);
  console.log(`视频时长: 19 秒`);
}

createCoolVideo().catch(console.error);


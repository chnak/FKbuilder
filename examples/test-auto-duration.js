import { VideoBuilder, getAudioDuration } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案
const colors = {
  charcoal: '#63747a',      // 深灰蓝 - 用于背景和深色元素
  slate: '#c0c2c9',         // 浅灰蓝 - 用于次要文本和装饰
  royalBlue: '#123175',     // 深蓝色 - 用于强调和主要元素
  aquamarine: '#5298c1',    // 青蓝色 - 用于高亮和交互元素
};

/**
 * 测试自动检测音频时长功能
 * 使用多轨道构建器实现，采用新的配色方案
 */
async function testAutoDuration() {
  console.log('🧪 测试自动检测音频时长功能（新配色方案）...\n');

  const name = "彩云追月";
  const audioFile = path.join(__dirname, `../assets/${name}.mp3`);
  const lrcFile = path.join(__dirname, `../assets/${name}.lrc`);

  // 检查文件是否存在
  if (!await fs.pathExists(audioFile)) {
    console.error(`音频文件不存在: ${audioFile}`);
    return;
  }

  if (!await fs.pathExists(lrcFile)) {
    console.error(`LRC 文件不存在: ${lrcFile}`);
    return;
  }

  // 获取音频时长
  console.log('📊 正在获取音频时长...');
  const audioDuration = await getAudioDuration(audioFile);
  const audioDurationNum = Number(audioDuration) || 0;
  
  if (audioDurationNum <= 0) {
    console.error('无法获取音频时长');
    return;
  }

  console.log(`✅ 音频时长: ${audioDurationNum.toFixed(2)} 秒\n`);

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 创建场景，使用音频时长作为场景时长
  const scene = mainTrack.createScene({ duration: audioDurationNum })
    // 背景使用深灰蓝色
    .addBackground({ color: colors.charcoal })
    
    // 添加装饰性圆形背景（左上角）- 优化：在onFrame中添加持续旋转和脉冲效果
    .addCircle({
      x: '10%',
      y: '10%',
      radius: 120,
      fillColor: colors.royalBlue,
      opacity: 0.2,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 1,
      animations: [
        { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.2, toScaleY: 1.2, duration: audioDurationNum, easing: 'easeInOut' },
        { type: 'fade', fromOpacity: 0.2, toOpacity: 0.4, duration: audioDurationNum / 2 },
        { type: 'fade', fromOpacity: 0.4, toOpacity: 0.2, duration: audioDurationNum / 2, delay: audioDurationNum / 2 },
      ],
      // 持续旋转动画（每帧更新）
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        // 持续旋转：每秒旋转180度
        const rotationSpeed = 180; // 度/秒
        const rotation = (event.time * rotationSpeed) % 360;
        const pivot = paperItem.position || paperItem.center;
        if (pivot) {
          const currentRotation = paperItem.rotation || 0;
          paperItem.rotate(rotation - currentRotation, pivot);
        }
      },
    })
    
    // 添加装饰性圆形背景（右下角）- 优化：在onFrame中添加反向旋转和持续脉冲
    .addCircle({
      x: '90%',
      y: '90%',
      radius: 150,
      fillColor: colors.aquamarine,
      opacity: 0.15,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 1,
      animations: [
        { type: 'transform', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1.3, toScaleY: 1.3, duration: audioDurationNum, easing: 'easeInOut' },
        { type: 'fade', fromOpacity: 0.15, toOpacity: 0.3, duration: audioDurationNum / 2 },
        { type: 'fade', fromOpacity: 0.3, toOpacity: 0.15, duration: audioDurationNum / 2, delay: audioDurationNum / 2 },
      ],
      // 持续反向旋转和脉冲动画
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const pivot = paperItem.position || paperItem.center;
        if (pivot) {
          // 反向旋转：每秒旋转-120度
          const rotationSpeed = -120; // 度/秒（负数为反向）
          const rotation = (event.time * rotationSpeed) % 360;
          const currentRotation = paperItem.rotation || 0;
          paperItem.rotate(rotation - currentRotation, pivot);
          
          // 持续脉冲：使用正弦波实现呼吸效果
          const pulseSpeed = 2; // 脉冲速度（周期/秒）
          const pulsePhase = event.time * pulseSpeed * 2 * Math.PI;
          const pulseScale = 1 + Math.sin(pulsePhase) * 0.1; // 在1.0到1.1之间变化
          const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
          paperItem.scale(pulseScale / currentScale, pivot);
        }
      },
    })
    
    // 添加装饰性矩形（顶部装饰条）- 优化：添加宽度动画
    .addRect({
      x: '50%',
      y: '5%',
      width: '80%',
      height: 4,
      fillColor: colors.aquamarine,
      opacity: 0.6,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
        { type: 'transform', fromScaleX: 0, toScaleX: 1, duration: 0.8, easing: 'easeOut' },
        { type: 'fade', fromOpacity: 0.6, toOpacity: 0.3, duration: audioDurationNum - 1, delay: 0.5 },
        { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.5, delay: audioDurationNum - 0.5 },
      ],
    })
    
    // 主标题 - 使用青蓝色，带渐变和阴影 - 优化：在onFrame中添加持续呼吸效果
    .addText({
      text: name,
      color: colors.aquamarine,
      fontSize: 72,
      x: "50%",
      y: "15%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 10,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      split: 'letter',
      splitDelay: 0.08,
      splitDuration: 0.4,
      gradient: true,
      gradientColors: [colors.aquamarine, colors.royalBlue],
      gradientDirection: 'horizontal',
      textShadow: true,
      textShadowColor: colors.royalBlue,
      textShadowBlur: 20,
      textShadowOffsetX: 0,
      textShadowOffsetY: 4,
      textGlow: true,
      textGlowColor: colors.aquamarine,
      textGlowBlur: 15,
      stroke: true,
      strokeColor: colors.royalBlue,
      strokeWidth: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
        { type: 'transform', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1, toScaleY: 1, duration: 0.6, easing: 'easeOut' },
        { type: 'fade', fromOpacity: 1, toOpacity: 0, duration: 0.5, delay: audioDurationNum - 0.5 },
      ],
      // 持续呼吸动画（轻微缩放）
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        const pivot = paperItem.position || paperItem.center;
        if (pivot) {
          // 呼吸效果：在0.98到1.02之间轻微缩放
          const breathSpeed = 1.5; // 呼吸速度（周期/秒）
          const breathPhase = event.time * breathSpeed * 2 * Math.PI;
          const breathScale = 1 + Math.sin(breathPhase) * 0.02;
          const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
          paperItem.scale(breathScale / currentScale, pivot);
        }
      },
    })
    
    // 副标题 - 使用浅灰蓝色 - 优化：添加滑动进入效果
    .addText({
      text: 'AUTOMATIC DURATION',
      color: colors.slate,
      fontSize: 24,
      x: "50%",
      y: "22%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: audioDurationNum,
      startTime: 0.5,
      zIndex: 9,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      opacity: 0.8,
      textShadow: true,
      textShadowColor: colors.charcoal,
      textShadowBlur: 10,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
        { type: 'move', fromY: '22%', toY: '22%', fromX: '-20%', toX: '50%', duration: 0.6, easing: 'easeOut' },
        { type: 'fade', fromOpacity: 0.8, toOpacity: 0, duration: 0.5, delay: audioDurationNum - 1 },
      ],
    });

  // 添加示波器（音频可视化器）- 使用配色方案 - 优化：添加缩放进入效果
  scene.addOscilloscope({
    audioPath: audioFile,
    x: "50%",
    y: "50%",
    width: 650,
    height: 650,
    anchor: [0.5, 0.5],
    backgroundColor: `${colors.royalBlue}60`, // 深蓝色半透明背景
    style: 'particles',
    mirror: true,
    sensitivity: 1.8,
    particleCount: 100,
    particleMinSize: 4,
    particleMaxSize: 30,
    particleColors: [
      colors.aquamarine,
      colors.royalBlue,
      colors.slate,
      '#7ab8d1', // 浅青蓝色变体
      '#2a5a8a', // 深蓝色变体
      '#8fa5b8', // 灰蓝色变体
    ],
    particleTrail: true,
    windowSize: 0.1,
    duration: audioDurationNum,
    startTime: 0.3,
    zIndex: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      { type: 'transform', fromScaleX: 0.7, fromScaleY: 0.7, toScaleX: 1, toScaleY: 1, duration: 0.8, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 1, toOpacity: 0, duration: 0.8, delay: audioDurationNum - 0.8 },
    ],
  });

  // 添加装饰性矩形边框（围绕示波器）- 优化：在onFrame中添加持续摆动和脉冲
  scene.addRect({
    x: '50%',
    y: '50%',
    width: 680,
    height: 680,
    anchor: [0.5, 0.5],
    fillColor: 'transparent',
    strokeColor: colors.aquamarine,
    strokeWidth: 2,
    opacity: 0.5,
    duration: audioDurationNum,
    startTime: 0.5,
    zIndex: 6,
    borderRadius: 20,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 0.5 },
      { type: 'transform', fromScaleX: 0.9, fromScaleY: 0.9, toScaleX: 1, toScaleY: 1, duration: 0.8, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 0.5, toOpacity: 0.3, duration: audioDurationNum - 1, delay: 0.5 },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.5, delay: audioDurationNum - 0.5 },
    ],
    // 持续摆动和脉冲动画
    onFrame: (element, event, paperItem) => {
      if (!paperItem) return;
      const pivot = paperItem.position || paperItem.center;
      if (pivot) {
        // 轻微摆动：在-3度到3度之间摆动
        const swingSpeed = 1; // 摆动速度（周期/秒）
        const swingPhase = event.time * swingSpeed * 2 * Math.PI;
        const swingRotation = Math.sin(swingPhase) * 3; // -3到3度
        const currentRotation = paperItem.rotation || 0;
        paperItem.rotate(swingRotation - currentRotation, pivot);
        
        // 轻微脉冲：在0.98到1.02之间缩放
        const pulseSpeed = 1.2;
        const pulsePhase = event.time * pulseSpeed * 2 * Math.PI;
        const pulseScale = 1 + Math.sin(pulsePhase) * 0.02;
        const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
        paperItem.scale(pulseScale / currentScale, pivot);
      }
    },
  });

  // 添加音频
  scene.addAudio({
    src: audioFile,
    volume: 1,
    duration: audioDurationNum,
    startTime: 0,
  });

  // 添加 LRC 歌词 - 使用配色方案 - 优化：启用所有文本效果
  scene.addLRC(lrcFile, {
    textColor: colors.slate,
    fontSize: 42,
    x: '50%',
    y: '82%',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    split: 'letter',
    splitDelay: 0.05,
    minDuration: 1,
    maxDuration: 5,
    fontFamily: 'MicrosoftYaHei',
    fontWeight: 'normal',
    animations: ['bigIn'],
  });
  
  // 添加底部装饰条 - 优化：添加宽度动画
  scene.addRect({
    x: '50%',
    y: '95%',
    width: '70%',
    height: 3,
    fillColor: colors.aquamarine,
    opacity: 0.5,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 0.5 },
      { type: 'transform', fromScaleX: 0, toScaleX: 1, duration: 0.8, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 0.5, toOpacity: 0.3, duration: audioDurationNum - 1, delay: 0.5 },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.5, delay: audioDurationNum - 0.5 },
    ],
  });
  
  // 添加装饰性路径（波浪线）- 使用配色方案 - 优化：添加移动动画
  scene.addPath({
    points: [
      { x: 50, y: 200 },
      { x: 150, y: 180 },
      { x: 250, y: 200 },
      { x: 350, y: 180 },
      { x: 450, y: 200 },
      { x: 550, y: 180 },
      { x: 650, y: 200 },
    ],
    closed: false,
    smooth: true,
    strokeColor: colors.aquamarine,
    strokeWidth: 3,
    fillColor: null,
    opacity: 0.6,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 3,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.8 },
      { type: 'move', fromX: -50, toX: 0, duration: 1, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 0.6, toOpacity: 0.3, duration: audioDurationNum - 1.6, delay: 0.8 },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.8, delay: audioDurationNum - 0.8 },
    ],
  });
  
  // 添加装饰性路径（星形）- 使用配色方案 - 优化：在onFrame中添加持续旋转和脉冲
  const starPoints = [];
  const centerX = 360; // 画布中心 X
  const centerY = 200; // 顶部区域
  const outerRadius = 40;
  const innerRadius = 20;
  const numPoints = 5;
  
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    starPoints.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }
  
  scene.addPath({
    points: starPoints,
    closed: true,
    smooth: false,
    fillColor: colors.royalBlue,
    strokeColor: colors.aquamarine,
    strokeWidth: 2,
    opacity: 0.4,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.5 },
      { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1, toScaleY: 1, duration: 0.6, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0, duration: 0.5, delay: audioDurationNum - 0.5 },
    ],
    // 持续旋转和脉冲动画
    onFrame: (element, event, paperItem) => {
      if (!paperItem) return;
      const pivot = paperItem.position || paperItem.center;
      if (pivot) {
        // 快速旋转：每秒旋转360度（完整一圈）
        const rotationSpeed = 360; // 度/秒
        const rotation = (event.time * rotationSpeed) % 360;
        const currentRotation = paperItem.rotation || 0;
        paperItem.rotate(rotation - currentRotation, pivot);
        
        // 持续脉冲：在1.0到1.1之间缩放
        const pulseSpeed = 2; // 脉冲速度（周期/秒）
        const pulsePhase = event.time * pulseSpeed * 2 * Math.PI;
        const pulseScale = 1 + (Math.sin(pulsePhase) + 1) * 0.05; // 1.0到1.1之间
        const currentScale = paperItem.scaling ? paperItem.scaling.x : 1;
        paperItem.scale(pulseScale / currentScale, pivot);
      }
    },
  });
  
  // 添加闪烁的星星 - 分布在背景上
  const starPositions = [
    { x: 80, y: 150, size: 8 },   // 左上区域
    { x: 150, y: 100, size: 6 },
    { x: 250, y: 120, size: 10 },
    { x: 500, y: 80, size: 7 },   // 右上区域
    { x: 600, y: 150, size: 9 },
    { x: 650, y: 100, size: 5 },
    { x: 100, y: 1050, size: 8 }, // 左下区域
    { x: 200, y: 1100, size: 6 },
    { x: 550, y: 1080, size: 7 }, // 右下区域
    { x: 620, y: 1120, size: 9 },
  ];

  starPositions.forEach((star, index) => {
    // 创建星形路径
    const starPoints = [];
    const outerRadius = star.size;
    const innerRadius = star.size * 0.4;
    const numPoints = 5;
    
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      starPoints.push({
        x: star.x + Math.cos(angle) * radius,
        y: star.y + Math.sin(angle) * radius,
      });
    }
    
    // 每个星星有不同的闪烁频率和初始相位
    const twinkleSpeed = 0.8 + (index % 3) * 0.4; // 0.8到2.0之间
    const initialPhase = (index * 0.5) % (Math.PI * 2); // 不同的初始相位
    
    scene.addPath({
      points: starPoints,
      closed: true,
      smooth: false,
      fillColor: colors.aquamarine,
      strokeColor: colors.royalBlue,
      strokeWidth: 1,
      opacity: 0.6,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      x: 0,
      y: 0,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
      ],
      // 闪烁效果：在onFrame中实现
      onFrame: (element, event, paperItem) => {
        if (!paperItem) return;
        // 使用正弦波实现闪烁效果
        // 透明度在0.2到1.0之间变化
        const twinklePhase = event.time * twinkleSpeed * 2 * Math.PI + initialPhase;
        // 使用正弦波的绝对值，让闪烁更明显
        const twinkleValue = (Math.sin(twinklePhase) + 1) / 2; // 0到1之间
        // 映射到0.2到1.0的透明度范围
        const opacity = 0.2 + twinkleValue * 0.8;
        paperItem.opacity = opacity;
      },
    });
  });

  // 添加装饰性路径（曲线）- 使用配色方案 - 优化：添加从下往上滑入
  scene.addPath({
    points: [
      { x: 100, y: 1100 },
      { x: 200, y: 1080 },
      { x: 300, y: 1120 },
      { x: 400, y: 1070 },
      { x: 500, y: 1110 },
      { x: 600, y: 1085 },
    ],
    closed: false,
    smooth: true,
    strokeColor: colors.slate,
    strokeWidth: 2,
    fillColor: null,
    opacity: 0.5,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 3,
    x: 0,
    y: 0,
    dashArray: [10, 5],
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 0.6 },
      { type: 'move', fromY: 1280, toY: 0, duration: 0.8, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 0.5, toOpacity: 0.2, duration: audioDurationNum - 1.2, delay: 0.6 },
      { type: 'fade', fromOpacity: 0.2, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, `${name}.mp4`);

  try {
    console.log('🎬 开始渲染（自动检测时长）...');
    const videoMaker = builder.build();
    
    console.log(`场景时长: ${audioDurationNum.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(audioDurationNum * 30)} 帧\n`);
    
    await videoMaker.export(outputPath);
    
    console.log('');
    console.log('✅ 测试完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log('✨ 自动检测音频时长功能正常工作！');
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testAutoDuration().catch(console.error);


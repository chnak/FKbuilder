import { VideoBuilder, getAudioDuration } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案 - 禅院钟声
const colors = {
  midnightBlue: '#153c64',    // 深蓝 - 用于背景和深色元素
  mistyBlue: '#bed5eb',       // 淡蓝 - 用于次要文本和装饰
  royalBlue: '#0070e0',       // 皇家蓝 - 用于强调和主要元素
  blueGrotto: '#4a90a4',      // 洞穴蓝 - 用于高亮和交互元素（推断的颜色）
};

/**
 * 禅院钟声 - 自动检测音频时长
 * 结合禅意与宁静的视觉设计
 */
async function testZenTempleBell() {
  console.log('🧘 禅院钟声 - 视频生成...\n');

  const name = "禅院钟声";
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
    // 背景使用深蓝色，营造宁静的禅意氛围
    .addBackground({ color: colors.midnightBlue })
    
    // 添加装饰性圆形（左上角）- 象征月亮或钟声的波纹
    .addCircle({
      x: '15%',
      y: '12%',
      radius: 80,
      fillColor: colors.mistyBlue,
      opacity: 0.15,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 1,
      animations: [
        { type: 'transform', fromScaleX: 0.3, fromScaleY: 0.3, toScaleX: 1.5, toScaleY: 1.5, duration: audioDurationNum, easing: 'easeInOut' },
        { type: 'fade', fromOpacity: 0.15, toOpacity: 0.3, duration: audioDurationNum / 3 },
        { type: 'fade', fromOpacity: 0.3, toOpacity: 0.1, duration: audioDurationNum * 2 / 3, delay: audioDurationNum / 3 },
      ],
    })
    
    // 添加装饰性圆形（右上角）- 多层波纹效果
    .addCircle({
      x: '85%',
      y: '15%',
      radius: 60,
      fillColor: colors.blueGrotto,
      opacity: 0.12,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 1,
      animations: [
        { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.8, toScaleY: 1.8, duration: audioDurationNum, easing: 'easeInOut' },
        { type: 'fade', fromOpacity: 0.12, toOpacity: 0.25, duration: audioDurationNum / 2 },
        { type: 'fade', fromOpacity: 0.25, toOpacity: 0.08, duration: audioDurationNum / 2, delay: audioDurationNum / 2 },
      ],
    })
    
    // 添加装饰性圆形（左下角）- 宁静的波纹
    .addCircle({
      x: '10%',
      y: '88%',
      radius: 100,
      fillColor: colors.mistyBlue,
      opacity: 0.1,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 1,
      animations: [
        { type: 'transform', fromScaleX: 0.4, fromScaleY: 0.4, toScaleX: 1.6, toScaleY: 1.6, duration: audioDurationNum, easing: 'easeInOut' },
        { type: 'fade', fromOpacity: 0.1, toOpacity: 0.2, duration: audioDurationNum / 2 },
        { type: 'fade', fromOpacity: 0.2, toOpacity: 0.05, duration: audioDurationNum / 2, delay: audioDurationNum / 2 },
      ],
    })
    
    // 添加顶部装饰条 - 象征禅院的横梁
    .addRect({
      x: '50%',
      y: '3%',
      width: '85%',
      height: 2,
      fillColor: colors.mistyBlue,
      opacity: 0.4,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 1 },
        { type: 'fade', fromOpacity: 0.4, toOpacity: 0.2, duration: audioDurationNum - 2, delay: 1 },
        { type: 'fade', fromOpacity: 0.2, toOpacity: 0, duration: 1, delay: audioDurationNum - 1 },
      ],
    })
    
    // 主标题 - 使用淡蓝色，带渐变和阴影，营造禅意
    .addText({
      text: name,
      color: colors.mistyBlue,
      fontSize: 78,
      x: "50%",
      y: "14%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 10,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      split: 'letter',
      splitDelay: 0.12,
      splitDuration: 0.5,
      gradient: true,
      gradientColors: [colors.mistyBlue, colors.royalBlue, colors.blueGrotto],
      gradientDirection: 'horizontal',
      textShadow: true,
      textShadowColor: colors.midnightBlue,
      textShadowBlur: 25,
      textShadowOffsetX: 0,
      textShadowOffsetY: 5,
      stroke: true,
      strokeColor: colors.royalBlue,
      strokeWidth: 1.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
        { type: 'fade', fromOpacity: 1, toOpacity: 0.9, duration: audioDurationNum - 1.6, delay: 0.8 },
        { type: 'fade', fromOpacity: 0.9, toOpacity: 0, duration: 0.8, delay: audioDurationNum - 0.8 },
      ],
    })
    
    // 副标题 - 使用淡蓝色
    .addText({
      text: 'ZEN TEMPLE BELL',
      color: colors.mistyBlue,
      fontSize: 22,
      x: "50%",
      y: "21%",
      textAlign: "center",
      anchor: [0.5, 0.5],
      duration: audioDurationNum,
      startTime: 0.8,
      zIndex: 9,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      opacity: 0.7,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.6 },
        { type: 'fade', fromOpacity: 0.7, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 1.2 },
      ],
    });

  // 添加示波器（音频可视化器）- 使用柔和的配色方案，营造宁静氛围
  scene.addOscilloscope({
    audioPath: audioFile,
    x: "50%",
    y: "50%",
    width: 680,
    height: 680,
    anchor: [0.5, 0.5],
    backgroundColor: `${colors.midnightBlue}50`, // 深蓝色半透明背景
    style: 'particles',
    mirror: true,
    sensitivity: 1.5,
    particleCount: 80,
    particleMinSize: 3,
    particleMaxSize: 28,
    particleColors: [
      colors.mistyBlue,
      colors.royalBlue,
      colors.blueGrotto,
      '#7ab8d1', // 浅青蓝色变体
      '#2a5a8a', // 深蓝色变体
      '#8fa5b8', // 灰蓝色变体
    ],
    particleTrail: true,
    windowSize: 0.1,
    duration: audioDurationNum,
    startTime: 0.5,
    zIndex: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
      { type: 'fade', fromOpacity: 1, toOpacity: 0.9, duration: audioDurationNum - 2, delay: 1 },
      { type: 'fade', fromOpacity: 0.9, toOpacity: 0, duration: 1, delay: audioDurationNum - 1 },
    ],
  });

  // 添加装饰性圆形边框（围绕示波器）- 象征钟声的波纹
  scene.addCircle({
    x: '50%',
    y: '50%',
    radius: 350,
    fillColor: 'transparent',
    strokeColor: colors.mistyBlue,
    strokeWidth: 2,
    opacity: 0.3,
    duration: audioDurationNum,
    startTime: 0.8,
    zIndex: 6,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 0.6 },
      { type: 'transform', fromScaleX: 0.9, fromScaleY: 0.9, toScaleX: 1.1, toScaleY: 1.1, duration: audioDurationNum - 1.6, delay: 0.6, easing: 'easeInOut' },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 添加装饰性路径（波纹）- 象征钟声的扩散
  const ripplePoints1 = [];
  const rippleCenterX = 360;
  const rippleCenterY = 640;
  const rippleRadius = 200;
  const numRipplePoints = 20;

  for (let i = 0; i <= numRipplePoints; i++) {
    const angle = (i / numRipplePoints) * Math.PI * 2;
    const radius = rippleRadius + Math.sin(angle * 3) * 15; // 添加波纹效果
    ripplePoints1.push({
      x: rippleCenterX + Math.cos(angle) * radius,
      y: rippleCenterY + Math.sin(angle) * radius,
    });
  }

  scene.addPath({
    points: ripplePoints1,
    closed: true,
    smooth: true,
    fillColor: null,
    strokeColor: colors.mistyBlue,
    strokeWidth: 2,
    opacity: 0.25,
    duration: audioDurationNum,
    startTime: 1,
    zIndex: 4,
    x: 0,
    y: 0,
    dashArray: [8, 4],
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.25, duration: 0.8 },
      { type: 'transform', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1.3, toScaleY: 1.3, duration: audioDurationNum - 2.2, delay: 0.8, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 0.25, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 添加装饰性路径（内层波纹）
  const ripplePoints2 = [];
  const rippleRadius2 = 150;

  for (let i = 0; i <= numRipplePoints; i++) {
    const angle = (i / numRipplePoints) * Math.PI * 2;
    const radius = rippleRadius2 + Math.sin(angle * 4) * 10;
    ripplePoints2.push({
      x: rippleCenterX + Math.cos(angle) * radius,
      y: rippleCenterY + Math.sin(angle) * radius,
    });
  }

  scene.addPath({
    points: ripplePoints2,
    closed: true,
    smooth: true,
    fillColor: null,
    strokeColor: colors.blueGrotto,
    strokeWidth: 1.5,
    opacity: 0.2,
    duration: audioDurationNum,
    startTime: 1.2,
    zIndex: 4,
    x: 0,
    y: 0,
    dashArray: [6, 3],
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.2, duration: 0.6 },
      { type: 'transform', fromScaleX: 0.9, fromScaleY: 0.9, toScaleX: 1.2, toScaleY: 1.2, duration: audioDurationNum - 2.4, delay: 0.6, easing: 'easeOut' },
      { type: 'fade', fromOpacity: 0.2, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 添加音频
  scene.addAudio({
    src: audioFile,
    volume: 1,
    duration: audioDurationNum,
    startTime: 0,
  });

  // 添加 LRC 歌词 - 使用配色方案，营造禅意
  scene.addLRC(lrcFile, {
    textColor: colors.mistyBlue,
    fontSize: 40,
    x: '50%',
    y: '82%',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    split: 'letter',
    minDuration: 1,
    maxDuration: 5,
    fontFamily: 'MicrosoftYaHei',
    fontWeight: 'normal',
    gradient: true,
    gradientColors: [colors.mistyBlue, colors.royalBlue, colors.blueGrotto],
    gradientDirection: 'horizontal',
    textShadow: true,
    textShadowColor: colors.midnightBlue,
    textShadowBlur: 18,
    textShadowOffsetX: 0,
    textShadowOffsetY: 3,
    stroke: true,
    strokeColor: colors.midnightBlue,
    strokeWidth: 1,
    animations: ['bigIn'],
  });
  
  // 添加底部装饰条 - 象征禅院的地面
  scene.addRect({
    x: '50%',
    y: '96%',
    width: '75%',
    height: 2,
    fillColor: colors.mistyBlue,
    opacity: 0.4,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.8 },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0.2, duration: audioDurationNum - 1.6, delay: 0.8 },
      { type: 'fade', fromOpacity: 0.2, toOpacity: 0, duration: 0.8, delay: audioDurationNum - 0.8 },
    ],
  });

  // 添加装饰性路径（禅意曲线）- 象征禅意的流动
  scene.addPath({
    points: [
      { x: 100, y: 1150 },
      { x: 200, y: 1130 },
      { x: 300, y: 1155 },
      { x: 400, y: 1125 },
      { x: 500, y: 1145 },
      { x: 600, y: 1135 },
      { x: 620, y: 1140 },
    ],
    closed: false,
    smooth: true,
    strokeColor: colors.blueGrotto,
    strokeWidth: 2,
    fillColor: null,
    opacity: 0.3,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 3,
    x: 0,
    y: 0,
    dashArray: [12, 6],
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 0.8 },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0.15, duration: audioDurationNum - 1.6, delay: 0.8 },
      { type: 'fade', fromOpacity: 0.15, toOpacity: 0, duration: 0.8, delay: audioDurationNum - 0.8 },
    ],
  });

  // 添加佛头路径 - 象征禅意与智慧
  const buddhaHeadCenterX = 360;
  const buddhaHeadCenterY = 200;
  const buddhaHeadRadius = 60;
  
  // 佛头轮廓（头部）
  const buddhaHeadOutline = [];
  for (let i = 0; i <= 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    // 使用椭圆形状，稍微拉长
    const x = buddhaHeadCenterX + Math.cos(angle) * buddhaHeadRadius;
    const y = buddhaHeadCenterY + Math.sin(angle) * buddhaHeadRadius * 1.1;
    buddhaHeadOutline.push({ x, y });
  }
  
  scene.addPath({
    points: buddhaHeadOutline,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 0.4,
    duration: audioDurationNum,
    startTime: 1.5,
    zIndex: 7,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.8 },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0.3, duration: audioDurationNum - 2.2, delay: 0.8 },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 发髻（顶部）
  const hairBunPoints = [];
  const hairBunCenterX = buddhaHeadCenterX;
  const hairBunCenterY = buddhaHeadCenterY - buddhaHeadRadius * 0.8;
  const hairBunRadius = 25;
  
  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = hairBunCenterX + Math.cos(angle) * hairBunRadius;
    const y = hairBunCenterY + Math.sin(angle) * hairBunRadius * 0.8;
    hairBunPoints.push({ x, y });
  }
  
  scene.addPath({
    points: hairBunPoints,
    closed: true,
    smooth: true,
    fillColor: colors.royalBlue,
    strokeColor: colors.midnightBlue,
    strokeWidth: 1.5,
    opacity: 0.5,
    duration: audioDurationNum,
    startTime: 1.7,
    zIndex: 8,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 0.6 },
      { type: 'fade', fromOpacity: 0.5, toOpacity: 0.3, duration: audioDurationNum - 2.4, delay: 0.6 },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 左眼
  const leftEyePoints = [];
  const leftEyeX = buddhaHeadCenterX - 20;
  const leftEyeY = buddhaHeadCenterY - 5;
  const eyeWidth = 8;
  const eyeHeight = 4;
  
  for (let i = 0; i <= 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const x = leftEyeX + Math.cos(angle) * eyeWidth;
    const y = leftEyeY + Math.sin(angle) * eyeHeight;
    leftEyePoints.push({ x, y });
  }
  
  scene.addPath({
    points: leftEyePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 1,
    opacity: 0.6,
    duration: audioDurationNum,
    startTime: 2,
    zIndex: 8,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
      { type: 'fade', fromOpacity: 0.6, toOpacity: 0.4, duration: audioDurationNum - 2.5, delay: 0.5 },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 右眼
  const rightEyePoints = [];
  const rightEyeX = buddhaHeadCenterX + 20;
  const rightEyeY = buddhaHeadCenterY - 5;
  
  for (let i = 0; i <= 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const x = rightEyeX + Math.cos(angle) * eyeWidth;
    const y = rightEyeY + Math.sin(angle) * eyeHeight;
    rightEyePoints.push({ x, y });
  }
  
  scene.addPath({
    points: rightEyePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 1,
    opacity: 0.6,
    duration: audioDurationNum,
    startTime: 2,
    zIndex: 8,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
      { type: 'fade', fromOpacity: 0.6, toOpacity: 0.4, duration: audioDurationNum - 2.5, delay: 0.5 },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 鼻子
  const nosePoints = [
    { x: buddhaHeadCenterX, y: buddhaHeadCenterY + 5 },
    { x: buddhaHeadCenterX - 3, y: buddhaHeadCenterY + 15 },
    { x: buddhaHeadCenterX, y: buddhaHeadCenterY + 18 },
    { x: buddhaHeadCenterX + 3, y: buddhaHeadCenterY + 15 },
  ];
  
  scene.addPath({
    points: nosePoints,
    closed: true,
    smooth: true,
    fillColor: colors.royalBlue,
    strokeColor: colors.midnightBlue,
    strokeWidth: 1,
    opacity: 0.5,
    duration: audioDurationNum,
    startTime: 2.2,
    zIndex: 8,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 0.5 },
      { type: 'fade', fromOpacity: 0.5, toOpacity: 0.3, duration: audioDurationNum - 2.7, delay: 0.5 },
      { type: 'fade', fromOpacity: 0.3, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 嘴巴（微笑）
  const mouthPoints = [];
  const mouthCenterX = buddhaHeadCenterX;
  const mouthCenterY = buddhaHeadCenterY + 25;
  const mouthWidth = 15;
  const mouthHeight = 8;
  
  for (let i = 0; i <= 20; i++) {
    const t = (i / 20) * Math.PI;
    const x = mouthCenterX - mouthWidth / 2 + (i / 20) * mouthWidth;
    const y = mouthCenterY + Math.sin(t) * mouthHeight * 0.3; // 微笑曲线
    mouthPoints.push({ x, y });
  }
  
  scene.addPath({
    points: mouthPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 0.6,
    duration: audioDurationNum,
    startTime: 2.4,
    zIndex: 8,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 0.5 },
      { type: 'fade', fromOpacity: 0.6, toOpacity: 0.4, duration: audioDurationNum - 2.9, delay: 0.5 },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 左耳
  const leftEarPoints = [];
  const leftEarX = buddhaHeadCenterX - buddhaHeadRadius * 0.9;
  const leftEarY = buddhaHeadCenterY;
  const earWidth = 12;
  const earHeight = 25;
  
  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = leftEarX + Math.cos(angle) * earWidth;
    const y = leftEarY + Math.sin(angle) * earHeight;
    leftEarPoints.push({ x, y });
  }
  
  scene.addPath({
    points: leftEarPoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 1.5,
    opacity: 0.4,
    duration: audioDurationNum,
    startTime: 1.8,
    zIndex: 7,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.6 },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0.25, duration: audioDurationNum - 2.4, delay: 0.6 },
      { type: 'fade', fromOpacity: 0.25, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  // 右耳
  const rightEarPoints = [];
  const rightEarX = buddhaHeadCenterX + buddhaHeadRadius * 0.9;
  const rightEarY = buddhaHeadCenterY;
  
  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = rightEarX + Math.cos(angle) * earWidth;
    const y = rightEarY + Math.sin(angle) * earHeight;
    rightEarPoints.push({ x, y });
  }
  
  scene.addPath({
    points: rightEarPoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 1.5,
    opacity: 0.4,
    duration: audioDurationNum,
    startTime: 1.8,
    zIndex: 7,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.6 },
      { type: 'fade', fromOpacity: 0.4, toOpacity: 0.25, duration: audioDurationNum - 2.4, delay: 0.6 },
      { type: 'fade', fromOpacity: 0.25, toOpacity: 0, duration: 0.6, delay: audioDurationNum - 0.6 },
    ],
  });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, `${name}.mp4`);

  try {
    console.log('🎬 开始渲染（禅院钟声）...');
    const videoMaker = builder.build();
    
    console.log(`场景时长: ${audioDurationNum.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(audioDurationNum * 30)} 帧\n`);
    
    await videoMaker.export(outputPath);
    
    console.log('');
    console.log('✅ 视频生成完成！');
    console.log(`📁 输出文件: ${outputPath}`);
    console.log('🧘 禅意视频已生成！');
    
    videoMaker.destroy();
    builder.destroy();
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
  }
}

testZenTempleBell().catch(console.error);


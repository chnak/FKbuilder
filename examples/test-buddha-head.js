import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案 - 禅意配色
const colors = {
  midnightBlue: '#153c64',    // 深蓝 - 背景
  mistyBlue: '#bed5eb',       // 淡蓝 - 主要元素
  royalBlue: '#0070e0',       // 皇家蓝 - 强调
  blueGrotto: '#4a90a4',      // 洞穴蓝 - 高亮
  gold: '#d4af37',            // 金色 - 佛头装饰
};

/**
 * 测试佛头路径绘制
 */
async function testBuddhaHead() {
  console.log('🧘 测试佛头路径绘制...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 6;
  const transitionDuration = 0.5;

  // ========== 场景1：佛头正面 ==========
  console.log('创建场景1: 佛头正面...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '佛头 - 正面视图',
      color: colors.mistyBlue,
      fontSize: 60,
      x: '50%',
      y: '8%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  const buddhaHeadCenterX = 960;
  const buddhaHeadCenterY = 540;
  const buddhaHeadRadius = 200;

  // 佛头轮廓（头部）- 椭圆形
  const buddhaHeadOutline = [];
  for (let i = 0; i <= 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    // 使用椭圆形状，稍微拉长
    const x = buddhaHeadCenterX + Math.cos(angle) * buddhaHeadRadius;
    const y = buddhaHeadCenterY + Math.sin(angle) * buddhaHeadRadius * 1.15;
    buddhaHeadOutline.push({ x, y });
  }

  scene1.addPath({
    points: buddhaHeadOutline,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 4,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.8 },
      { type: 'transform', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1, toScaleY: 1, duration: 0.8 },
    ],
  });

  // 发髻（顶部）- 多层发髻
  const hairBunPoints = [];
  const hairBunCenterX = buddhaHeadCenterX;
  const hairBunCenterY = buddhaHeadCenterY - buddhaHeadRadius * 0.75;
  const hairBunRadius = 80;

  for (let i = 0; i <= 25; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const x = hairBunCenterX + Math.cos(angle) * hairBunRadius;
    const y = hairBunCenterY + Math.sin(angle) * hairBunRadius * 0.7;
    hairBunPoints.push({ x, y });
  }

  scene1.addPath({
    points: hairBunPoints,
    closed: true,
    smooth: true,
    fillColor: colors.royalBlue,
    strokeColor: colors.midnightBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 0.8,
    zIndex: 3,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.6 },
    ],
  });

  // 左眼
  const leftEyePoints = [];
  const leftEyeX = buddhaHeadCenterX - 60;
  const leftEyeY = buddhaHeadCenterY - 20;
  const eyeWidth = 25;
  const eyeHeight = 12;

  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = leftEyeX + Math.cos(angle) * eyeWidth;
    const y = leftEyeY + Math.sin(angle) * eyeHeight;
    leftEyePoints.push({ x, y });
  }

  scene1.addPath({
    points: leftEyePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 1.2,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.4 },
    ],
  });

  // 右眼
  const rightEyePoints = [];
  const rightEyeX = buddhaHeadCenterX + 60;
  const rightEyeY = buddhaHeadCenterY - 20;

  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = rightEyeX + Math.cos(angle) * eyeWidth;
    const y = rightEyeY + Math.sin(angle) * eyeHeight;
    rightEyePoints.push({ x, y });
  }

  scene1.addPath({
    points: rightEyePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 1.2,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.4 },
    ],
  });

  // 眉毛（左）
  const leftEyebrowPoints = [];
  const leftEyebrowX = buddhaHeadCenterX - 60;
  const leftEyebrowY = buddhaHeadCenterY - 50;
  const eyebrowWidth = 40;
  const eyebrowHeight = 8;

  for (let i = 0; i <= 15; i++) {
    const t = (i / 15) * Math.PI;
    const x = leftEyebrowX - eyebrowWidth / 2 + (i / 15) * eyebrowWidth;
    const y = leftEyebrowY - Math.sin(t) * eyebrowHeight;
    leftEyebrowPoints.push({ x, y });
  }

  scene1.addPath({
    points: leftEyebrowPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.4,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.4 },
    ],
  });

  // 眉毛（右）
  const rightEyebrowPoints = [];
  const rightEyebrowX = buddhaHeadCenterX + 60;
  const rightEyebrowY = buddhaHeadCenterY - 50;

  for (let i = 0; i <= 15; i++) {
    const t = (i / 15) * Math.PI;
    const x = rightEyebrowX - eyebrowWidth / 2 + (i / 15) * eyebrowWidth;
    const y = rightEyebrowY - Math.sin(t) * eyebrowHeight;
    rightEyebrowPoints.push({ x, y });
  }

  scene1.addPath({
    points: rightEyebrowPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.4,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.4 },
    ],
  });

  // 鼻子
  const nosePoints = [
    { x: buddhaHeadCenterX, y: buddhaHeadCenterY + 15 },
    { x: buddhaHeadCenterX - 8, y: buddhaHeadCenterY + 50 },
    { x: buddhaHeadCenterX, y: buddhaHeadCenterY + 60 },
    { x: buddhaHeadCenterX + 8, y: buddhaHeadCenterY + 50 },
  ];

  scene1.addPath({
    points: nosePoints,
    closed: true,
    smooth: true,
    fillColor: colors.royalBlue,
    strokeColor: colors.midnightBlue,
    strokeWidth: 2,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 1.6,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.4 },
    ],
  });

  // 嘴巴（微笑）
  const mouthPoints = [];
  const mouthCenterX = buddhaHeadCenterX;
  const mouthCenterY = buddhaHeadCenterY + 80;
  const mouthWidth = 50;
  const mouthHeight = 20;

  for (let i = 0; i <= 25; i++) {
    const t = (i / 25) * Math.PI;
    const x = mouthCenterX - mouthWidth / 2 + (i / 25) * mouthWidth;
    const y = mouthCenterY + Math.sin(t) * mouthHeight * 0.4; // 微笑曲线
    mouthPoints.push({ x, y });
  }

  scene1.addPath({
    points: mouthPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.8,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.4 },
    ],
  });

  // 左耳
  const leftEarPoints = [];
  const leftEarX = buddhaHeadCenterX - buddhaHeadRadius * 0.85;
  const leftEarY = buddhaHeadCenterY;
  const earWidth = 35;
  const earHeight = 80;

  for (let i = 0; i <= 25; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const x = leftEarX + Math.cos(angle) * earWidth;
    const y = leftEarY + Math.sin(angle) * earHeight;
    leftEarPoints.push({ x, y });
  }

  scene1.addPath({
    points: leftEarPoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2.5,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.6 },
    ],
  });

  // 右耳
  const rightEarPoints = [];
  const rightEarX = buddhaHeadCenterX + buddhaHeadRadius * 0.85;
  const rightEarY = buddhaHeadCenterY;

  for (let i = 0; i <= 25; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const x = rightEarX + Math.cos(angle) * earWidth;
    const y = rightEarY + Math.sin(angle) * earHeight;
    rightEarPoints.push({ x, y });
  }

  scene1.addPath({
    points: rightEarPoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2.5,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.6 },
    ],
  });

  // 额头装饰（白毫）- 圆形点
  scene1.addCircle({
    x: buddhaHeadCenterX,
    y: buddhaHeadCenterY - buddhaHeadRadius * 0.4,
    radius: 8,
    fillColor: colors.gold,
    strokeColor: colors.royalBlue,
    strokeWidth: 1,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 2,
    zIndex: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.3 },
      { type: 'transform', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.3 },
    ],
  });

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：佛头侧面 ==========
  console.log('创建场景2: 佛头侧面...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '佛头 - 侧面视图',
      color: colors.mistyBlue,
      fontSize: 60,
      x: '50%',
      y: '8%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  const sideHeadCenterX = 960;
  const sideHeadCenterY = 540;
  const sideHeadRadius = 200;

  // 侧面头部轮廓
  const sideHeadOutline = [];
  for (let i = 0; i <= 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    // 侧面视角，头部更圆
    const x = sideHeadCenterX + Math.cos(angle) * sideHeadRadius * 0.9;
    const y = sideHeadCenterY + Math.sin(angle) * sideHeadRadius * 1.1;
    sideHeadOutline.push({ x, y });
  }

  scene2.addPath({
    points: sideHeadOutline,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 4,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.8 },
      { type: 'transform', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1, toScaleY: 1, duration: 0.8 },
    ],
  });

  // 侧面发髻
  const sideHairBunPoints = [];
  const sideHairBunCenterX = sideHeadCenterX - sideHeadRadius * 0.3;
  const sideHairBunCenterY = sideHeadCenterY - sideHeadRadius * 0.7;
  const sideHairBunRadius = 70;

  for (let i = 0; i <= 25; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const x = sideHairBunCenterX + Math.cos(angle) * sideHairBunRadius;
    const y = sideHairBunCenterY + Math.sin(angle) * sideHairBunRadius * 0.6;
    sideHairBunPoints.push({ x, y });
  }

  scene2.addPath({
    points: sideHairBunPoints,
    closed: true,
    smooth: true,
    fillColor: colors.royalBlue,
    strokeColor: colors.midnightBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 0.8,
    zIndex: 3,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.6 },
    ],
  });

  // 侧面眼睛
  const sideEyePoints = [];
  const sideEyeX = sideHeadCenterX - sideHeadRadius * 0.2;
  const sideEyeY = sideHeadCenterY - 20;
  const sideEyeWidth = 20;
  const sideEyeHeight = 10;

  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = sideEyeX + Math.cos(angle) * sideEyeWidth;
    const y = sideEyeY + Math.sin(angle) * sideEyeHeight;
    sideEyePoints.push({ x, y });
  }

  scene2.addPath({
    points: sideEyePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 1.2,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.4 },
    ],
  });

  // 侧面鼻子
  const sideNosePoints = [
    { x: sideHeadCenterX - sideHeadRadius * 0.15, y: sideHeadCenterY + 15 },
    { x: sideHeadCenterX - sideHeadRadius * 0.05, y: sideHeadCenterY + 50 },
    { x: sideHeadCenterX, y: sideHeadCenterY + 60 },
    { x: sideHeadCenterX + 10, y: sideHeadCenterY + 50 },
  ];

  scene2.addPath({
    points: sideNosePoints,
    closed: true,
    smooth: true,
    fillColor: colors.royalBlue,
    strokeColor: colors.midnightBlue,
    strokeWidth: 2,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 1.6,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.4 },
    ],
  });

  // 侧面嘴巴
  const sideMouthPoints = [];
  const sideMouthCenterX = sideHeadCenterX;
  const sideMouthCenterY = sideHeadCenterY + 80;
  const sideMouthWidth = 40;
  const sideMouthHeight = 15;

  for (let i = 0; i <= 20; i++) {
    const t = (i / 20) * Math.PI;
    const x = sideMouthCenterX - sideMouthWidth / 2 + (i / 20) * sideMouthWidth;
    const y = sideMouthCenterY + Math.sin(t) * sideMouthHeight * 0.3;
    sideMouthPoints.push({ x, y });
  }

  scene2.addPath({
    points: sideMouthPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.8,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.4 },
    ],
  });

  // 侧面耳朵（更明显）
  const sideEarPoints = [];
  const sideEarX = sideHeadCenterX - sideHeadRadius * 0.7;
  const sideEarY = sideHeadCenterY;
  const sideEarWidth = 40;
  const sideEarHeight = 100;

  for (let i = 0; i <= 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const x = sideEarX + Math.cos(angle) * sideEarWidth;
    const y = sideEarY + Math.sin(angle) * sideEarHeight;
    sideEarPoints.push({ x, y });
  }

  scene2.addPath({
    points: sideEarPoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.6 },
    ],
  });

  // 侧面额头白毫
  scene2.addCircle({
    x: sideHeadCenterX - sideHeadRadius * 0.2,
    y: sideHeadCenterY - sideHeadRadius * 0.4,
    radius: 8,
    fillColor: colors.gold,
    strokeColor: colors.royalBlue,
    strokeWidth: 1,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 2,
    zIndex: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.3 },
      { type: 'transform', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.3 },
    ],
  });

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：佛头旋转动画 ==========
  console.log('创建场景3: 佛头旋转动画...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '佛头 - 旋转动画',
      color: colors.mistyBlue,
      fontSize: 60,
      x: '50%',
      y: '8%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  const rotateHeadCenterX = 960;
  const rotateHeadCenterY = 540;
  const rotateHeadRadius = 180;

  // 旋转的佛头轮廓
  const rotateHeadOutline = [];
  for (let i = 0; i <= 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const x = rotateHeadCenterX + Math.cos(angle) * rotateHeadRadius;
    const y = rotateHeadCenterY + Math.sin(angle) * rotateHeadRadius * 1.15;
    rotateHeadOutline.push({ x, y });
  }

  scene3.addPath({
    points: rotateHeadOutline,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 4,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.5 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 1, delay: 0.5, easing: 'linear' },
    ],
  });

  // 旋转的发髻
  const rotateHairBunPoints = [];
  const rotateHairBunCenterX = rotateHeadCenterX;
  const rotateHairBunCenterY = rotateHeadCenterY - rotateHeadRadius * 0.75;
  const rotateHairBunRadius = 70;

  for (let i = 0; i <= 25; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const x = rotateHairBunCenterX + Math.cos(angle) * rotateHairBunRadius;
    const y = rotateHairBunCenterY + Math.sin(angle) * rotateHairBunRadius * 0.7;
    rotateHairBunPoints.push({ x, y });
  }

  scene3.addPath({
    points: rotateHairBunPoints,
    closed: true,
    smooth: true,
    fillColor: colors.royalBlue,
    strokeColor: colors.midnightBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 0.8,
    zIndex: 3,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.4 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 1.2, delay: 0.8, easing: 'linear' },
    ],
  });

  // 旋转的眼睛（左）
  const rotateLeftEyePoints = [];
  const rotateLeftEyeX = rotateHeadCenterX - 60;
  const rotateLeftEyeY = rotateHeadCenterY - 20;
  const rotateEyeWidth = 25;
  const rotateEyeHeight = 12;

  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = rotateLeftEyeX + Math.cos(angle) * rotateEyeWidth;
    const y = rotateLeftEyeY + Math.sin(angle) * rotateEyeHeight;
    rotateLeftEyePoints.push({ x, y });
  }

  scene3.addPath({
    points: rotateLeftEyePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 1.2,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.3 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 1.5, delay: 1.2, easing: 'linear' },
    ],
  });

  // 旋转的眼睛（右）
  const rotateRightEyePoints = [];
  const rotateRightEyeX = rotateHeadCenterX + 60;
  const rotateRightEyeY = rotateHeadCenterY - 20;

  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = rotateRightEyeX + Math.cos(angle) * rotateEyeWidth;
    const y = rotateRightEyeY + Math.sin(angle) * rotateEyeHeight;
    rotateRightEyePoints.push({ x, y });
  }

  scene3.addPath({
    points: rotateRightEyePoints,
    closed: true,
    smooth: true,
    fillColor: colors.midnightBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 1.2,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.3 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 1.5, delay: 1.2, easing: 'linear' },
    ],
  });

  // 旋转的嘴巴
  const rotateMouthPoints = [];
  const rotateMouthCenterX = rotateHeadCenterX;
  const rotateMouthCenterY = rotateHeadCenterY + 80;
  const rotateMouthWidth = 50;
  const rotateMouthHeight = 20;

  for (let i = 0; i <= 25; i++) {
    const t = (i / 25) * Math.PI;
    const x = rotateMouthCenterX - rotateMouthWidth / 2 + (i / 25) * rotateMouthWidth;
    const y = rotateMouthCenterY + Math.sin(t) * rotateMouthHeight * 0.4;
    rotateMouthPoints.push({ x, y });
  }

  scene3.addPath({
    points: rotateMouthPoints,
    closed: false,
    smooth: true,
    fillColor: null,
    strokeColor: colors.royalBlue,
    strokeWidth: 3,
    opacity: 0.8,
    duration: sceneDuration,
    startTime: 1.8,
    zIndex: 4,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.3 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 2.1, delay: 1.8, easing: 'linear' },
    ],
  });

  // 旋转的耳朵（左）
  const rotateLeftEarPoints = [];
  const rotateLeftEarX = rotateHeadCenterX - rotateHeadRadius * 0.85;
  const rotateLeftEarY = rotateHeadCenterY;
  const rotateEarWidth = 35;
  const rotateEarHeight = 80;

  for (let i = 0; i <= 25; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const x = rotateLeftEarX + Math.cos(angle) * rotateEarWidth;
    const y = rotateLeftEarY + Math.sin(angle) * rotateEarHeight;
    rotateLeftEarPoints.push({ x, y });
  }

  scene3.addPath({
    points: rotateLeftEarPoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2.5,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.4 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 1.4, delay: 1, easing: 'linear' },
    ],
  });

  // 旋转的耳朵（右）
  const rotateRightEarPoints = [];
  const rotateRightEarX = rotateHeadCenterX + rotateHeadRadius * 0.85;
  const rotateRightEarY = rotateHeadCenterY;

  for (let i = 0; i <= 25; i++) {
    const angle = (i / 25) * Math.PI * 2;
    const x = rotateRightEarX + Math.cos(angle) * rotateEarWidth;
    const y = rotateRightEarY + Math.sin(angle) * rotateEarHeight;
    rotateRightEarPoints.push({ x, y });
  }

  scene3.addPath({
    points: rotateRightEarPoints,
    closed: true,
    smooth: true,
    fillColor: colors.mistyBlue,
    strokeColor: colors.royalBlue,
    strokeWidth: 2.5,
    opacity: 0.7,
    duration: sceneDuration,
    startTime: 1,
    zIndex: 2,
    x: 0,
    y: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.4 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 1.4, delay: 1, easing: 'linear' },
    ],
  });

  // 旋转的白毫
  scene3.addCircle({
    x: rotateHeadCenterX,
    y: rotateHeadCenterY - rotateHeadRadius * 0.4,
    radius: 8,
    fillColor: colors.gold,
    strokeColor: colors.royalBlue,
    strokeWidth: 1,
    opacity: 0.9,
    duration: sceneDuration,
    startTime: 2,
    zIndex: 5,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 0.2 },
      { type: 'transform', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.2 },
      { type: 'transform', fromRotation: 0, toRotation: 360, duration: sceneDuration - 2.2, delay: 2, easing: 'linear' },
    ],
  });

  currentTime = scene3StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-buddha-head.mp4');

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
    console.log('\n🧘 佛头路径测试完成！');
    console.log('包含的场景：');
    console.log('  - 场景1：佛头正面视图');
    console.log('  - 场景2：佛头侧面视图');
    console.log('  - 场景3：佛头旋转动画');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testBuddhaHead().catch(console.error);


/**
 * 帝女芳魂 - 根据歌词意境制作视频MV（增强版）
 * 主题：国破家亡、悲壮爱情、落花飘零、碧血殉葬
 * 增强：添加更多视觉元素，画面更加充实丰富
 */
import { VideoBuilder, getAudioDuration, withContext } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from '@chnak/paper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案 - 根据歌词意境：悲壮、血色、皇家、落花
const colors = {
  deepRed: '#8B0000',        // 深红色 - 碧血、殉葬
  bloodRed: '#DC143C',       // 血红色 - 血色、悲壮
  gold: '#FFD700',           // 金色 - 皇家、盛装
  darkGold: '#B8860B',       // 暗金色 - 古典、庄重
  lightGold: '#FFECB3',      // 浅金色 - 月光、温柔
  darkPurple: '#4B0082',     // 深紫色 - 悲壮、深沉
  darkNavy: '#1a1a2e',       // 深蓝黑 - 乱世、深沉
  white: '#ffffff',          // 白色 - 落花、纯洁
  palePink: '#FFE4E1',       // 淡粉色 - 落花、温柔
  lightYellow: '#FFFACD',    // 淡黄色 - 月光、温柔
  moonWhite: '#F0F8FF',      // 月白色 - 月光
  candleFlame: '#FFA500',    // 烛光橙 - 花烛
  wineRed: '#722F37',        // 酒红色 - 葡萄酿
  black: '#000000',          // 黑色 - 深沉、庄重
  starWhite: '#E6E6FA',      // 星白色 - 星星
};

async function createDiNvFangHunVideo() {
  console.log('🎬 帝女芳魂 - 视频MV生成（增强版）...\n');

  const name = "帝女芳魂";
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
    width: 1920,
    height: 1080,
    fps: 30,
  });

  // ========== 主轨道：视觉元素 ==========
  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 创建主场景，使用音频时长作为场景时长
  const scene = mainTrack.createScene({ duration: audioDurationNum })
    // 背景使用深蓝黑色，营造悲壮、乱世的氛围
    .addBackground({ color: colors.darkNavy })
    
    // ========== 标题：帝女芳魂 ==========
    .addText({
      text: '帝女芳魂',
      x: '50%',
      y: '12%',
      fontSize: 110,
      color: colors.gold,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 15,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 2 },
        { type: 'fade', fromOpacity: 1, toOpacity: 0.85, duration: audioDurationNum - 2, delay: 2 },
      ],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 35,
      textGlow: true,
      textGlowColor: colors.gold,
      textGlowBlur: 50,
      stroke: true,
      strokeColor: colors.darkGold,
      strokeWidth: 3,
      onFrame: withContext((element, event, paperItem) => {
        if (!paperItem) return;
        const time = event.time;
        const breath = 1 + Math.sin(time * 0.6) * 0.04;
        paperItem.scaling = new paper.Point(breath, breath);
        const glowIntensity = 0.85 + Math.sin(time * 2.5) * 0.15;
        if (paperItem.shadowColor) {
          paperItem.shadowColor.alpha = glowIntensity;
        }
      }, {}),
    })
    
    // ========== 示波器：使用 spectrum 样式，象征音乐的情感波动 ==========
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '50%',
      width: 1700,
      height: 350,
      style: 'spectrum',
      waveColor: colors.gold,
      backgroundColor: 'rgba(26, 26, 46, 0.5)',
      lineWidth: 4,
      sensitivity: 1.6,
      mirror: true,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 4,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 3 },
      ],
    })
    
    // ========== 装饰性路径：象征古典装饰线条 ==========
    // 顶部装饰线（波浪形）
    .addPath({
      points: [
        [100, 80],
        [300, 60],
        [500, 85],
        [700, 65],
        [900, 90],
        [1100, 70],
        [1300, 88],
        [1500, 68],
        [1700, 92],
        [1820, 75],
      ],
      closed: false,
      strokeColor: colors.gold,
      strokeWidth: 3,
      opacity: 0.5,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 2.5 },
      ],
    })
    
    // 底部装饰线（波浪形）
    .addPath({
      points: [
        [100, 1000],
        [300, 1020],
        [500, 995],
        [700, 1015],
        [900, 990],
        [1100, 1010],
        [1300, 992],
        [1500, 1012],
        [1700, 988],
        [1820, 1005],
      ],
      closed: false,
      strokeColor: colors.gold,
      strokeWidth: 3,
      opacity: 0.5,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 2.5 },
      ],
    })
    
    // ========== 装饰性矩形：多层古典边框 ==========
    // 外层边框
    .addRect({
      x: '50%',
      y: '50%',
      width: 1850,
      height: 950,
      bgcolor: 'transparent',
      borderColor: colors.gold,
      borderWidth: 4,
      borderRadius: 15,
      opacity: 0.35,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.35, duration: 2.5 },
      ],
    })
    
    // 内层边框
    .addRect({
      x: '50%',
      y: '50%',
      width: 1750,
      height: 850,
      bgcolor: 'transparent',
      borderColor: colors.darkGold,
      borderWidth: 2,
      borderRadius: 12,
      opacity: 0.4,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 3 },
      ],
    })
    
    // ========== 装饰文字：根据歌词段落显示不同文字 ==========
    // "落花遍千里万方" - 在开头显示
    .addText({
      text: '落花遍千里万方',
      x: '50%',
      y: '25%',
      fontSize: 52,
      color: colors.palePink,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.6,
      duration: 30,
      startTime: 0,
      zIndex: 6,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 2 },
        { type: 'fade', fromOpacity: 0.6, toOpacity: 0, duration: 2, delay: 28 },
      ],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 25,
      onFrame: withContext((element, event, paperItem) => {
        if (!paperItem) return;
        const time = event.time;
        const flicker = 0.4 + Math.sin(time * 3.5) * 0.2;
        paperItem.opacity = flicker;
      }, {}),
    })
    
    // "国土碧血未干" - 在第一段显示
    .addText({
      text: '国土碧血未干',
      x: '50%',
      y: '30%',
      fontSize: 50,
      color: colors.bloodRed,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.5,
      duration: 25,
      startTime: 30,
      zIndex: 6,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 2 },
        { type: 'fade', fromOpacity: 0.5, toOpacity: 0, duration: 2, delay: 23 },
      ],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 30,
      stroke: true,
      strokeColor: colors.darkGold,
      strokeWidth: 1,
    })
    
    // "帝女今配盛妆" - 在第三段显示
    .addText({
      text: '帝女今配盛妆',
      x: '50%',
      y: '28%',
      fontSize: 54,
      color: colors.gold,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.7,
      duration: 20,
      startTime: 146,
      zIndex: 6,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 2.5 },
        { type: 'fade', fromOpacity: 0.7, toOpacity: 0, duration: 2.5, delay: 17.5 },
      ],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 35,
      textGlow: true,
      textGlowColor: colors.lightGold,
      textGlowBlur: 40,
    })
    
    // "花烛一对直照无涯岸" - 在第四段显示
    .addText({
      text: '花烛一对直照无涯岸',
      x: '50%',
      y: '32%',
      fontSize: 48,
      color: colors.candleFlame,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.6,
      duration: 18,
      startTime: 206,
      zIndex: 6,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 2 },
        { type: 'fade', fromOpacity: 0.6, toOpacity: 0, duration: 2, delay: 16 },
      ],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 30,
      textGlow: true,
      textGlowColor: colors.candleFlame,
      textGlowBlur: 35,
    })
    
    // "谢过家邦 谢过先王" - 在结尾显示
    .addText({
      text: '谢过家邦 谢过先王',
      x: '50%',
      y: '30%',
      fontSize: 56,
      color: colors.gold,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.8,
      duration: audioDurationNum - 253,
      startTime: 253,
      zIndex: 6,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 3 },
      ],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 40,
      textGlow: true,
      textGlowColor: colors.lightGold,
      textGlowBlur: 50,
      stroke: true,
      strokeColor: colors.darkGold,
      strokeWidth: 2,
    });

  // ========== 星空背景：营造夜晚氛围 ==========
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    const index = i;
    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    const size = 1 + Math.random() * 3;
    const twinkleSpeed = 0.5 + Math.random() * 2;
    const twinklePhase = Math.random() * Math.PI * 2;
    
    const onFrameStar = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      const twinkle = 0.3 + Math.sin(time * twinkleSpeed + twinklePhase) * 0.4;
      paperItem.opacity = twinkle;
    }, { twinkleSpeed, twinklePhase });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.starWhite,
      opacity: 0.7,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 1,
      onFrame: onFrameStar,
    });
  }

  // ========== 月光效果：象征"泪光浸杯里月光" ==========
  // 主月光（大光晕）
  const moonOnFrame = withContext((element, event, paperItem) => {
    if (!paperItem) return;
    const time = event.time;
    const pulse = 1 + Math.sin(time * 0.8) * 0.1;
    paperItem.scaling = new paper.Point(pulse, pulse);
    const glow = 0.15 + Math.sin(time * 1.2) * 0.05;
    paperItem.opacity = glow;
  }, {});
  
  scene.addCircle({
    x: '15%',
    y: '20%',
    radius: 200,
    fillColor: colors.moonWhite,
    opacity: 0.15,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.15, duration: 3 },
    ],
    onFrame: moonOnFrame,
  });
  
  // 月光光晕层（多层叠加）
  for (let i = 0; i < 3; i++) {
    const index = i;
    const radius = 150 + i * 30;
    const opacity = 0.08 - i * 0.02;
    
    const onFrameMoonGlow = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      const pulse = 1 + Math.sin(time * (0.6 + index * 0.2)) * 0.08;
      paperItem.scaling = new paper.Point(pulse, pulse);
    }, { index });
    
    scene.addCircle({
      x: '15%',
      y: '20%',
      radius: radius,
      fillColor: colors.lightYellow,
      opacity: opacity,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: opacity, duration: 3 + index * 0.5 },
      ],
      onFrame: onFrameMoonGlow,
    });
  }

  // ========== 落花粒子系统：大幅增加数量 ==========
  const petalCount = 50; // 增加到50个
  for (let i = 0; i < petalCount; i++) {
    const index = i;
    const startX = Math.random() * 1920;
    const startY = -100 - Math.random() * 200;
    const fallSpeed = 25 + Math.random() * 60;
    const swingAmplitude = 40 + Math.random() * 120;
    const swingSpeed = 0.4 + Math.random() * 1.2;
    const rotationSpeed = 15 + Math.random() * 50;
    const size = 6 + Math.random() * 14;
    const delay = Math.random() * 5;
    
    const onFramePetal = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time - delay;
      if (time < 0) return;
      const fallY = startY + time * fallSpeed;
      const swingX = startX + Math.sin(time * swingSpeed + index) * swingAmplitude;
      paperItem.rotation = time * rotationSpeed;
      paperItem.position = new paper.Point(swingX, fallY);
      const opacity = Math.max(0, Math.min(0.7, 1 - (fallY / 1080) * 0.6));
      paperItem.opacity = opacity;
    }, { index, startX, startY, fallSpeed, swingAmplitude, swingSpeed, rotationSpeed, delay });
    
    scene.addCircle({
      x: startX,
      y: startY,
      radius: size,
      fillColor: colors.palePink,
      strokeColor: colors.white,
      strokeWidth: 1,
      opacity: 0.7,
      duration: audioDurationNum - delay,
      startTime: delay,
      zIndex: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 1.5 },
      ],
      onFrame: onFramePetal,
    });
  }

  // ========== 碧血粒子：增加数量和变化 ==========
  for (let i = 0; i < 15; i++) { // 增加到15个
    const index = i;
    const angle = (index / 15) * Math.PI * 2;
    const radius = 150 + Math.random() * 200;
    const centerX = 960;
    const centerY = 540;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const size = 12 + Math.random() * 25;
    
    const onFrameBlood = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      paperItem.rotation = time * (8 + index * 4);
      const pulse = 1 + Math.sin(time * (2.5 + index * 0.3)) * 0.25;
      paperItem.scaling = new paper.Point(pulse, pulse);
      const flicker = 0.25 + Math.sin(time * (3.5 + index * 0.4)) * 0.25;
      paperItem.opacity = flicker;
    }, { index });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.bloodRed,
      opacity: 0.35,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.35, duration: 2.5 + index * 0.15 },
      ],
      onFrame: onFrameBlood,
    });
  }

  // ========== 金色装饰圆形：增加数量和层次 ==========
  for (let i = 0; i < 12; i++) { // 增加到12个
    const index = i;
    const angle = (index / 12) * Math.PI * 2;
    const radius = 250 + Math.random() * 150;
    const centerX = 960;
    const centerY = 540;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const size = 20 + index * 4 + Math.random() * 10;
    
    const onFrameGold = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      paperItem.rotation = time * (12 + index * 4);
      const breath = 1 + Math.sin(time * (1.2 + index * 0.15)) * 0.18;
      paperItem.scaling = new paper.Point(breath, breath);
      const flicker = 0.15 + Math.sin(time * (3.5 + index * 0.3)) * 0.18;
      paperItem.opacity = flicker;
    }, { index });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.gold,
      strokeColor: colors.darkGold,
      strokeWidth: 2,
      opacity: 0.25,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.25, duration: 3.5 + index * 0.2 },
      ],
      onFrame: onFrameGold,
    });
  }

  // ========== 花烛元素：象征"花烛一对直照无涯岸" ==========
  // 左侧花烛
  const candle1OnFrame = withContext((element, event, paperItem) => {
    if (!paperItem) return;
    const time = event.time;
    const flicker = 0.7 + Math.sin(time * 8) * 0.2;
    paperItem.opacity = flicker;
    const scale = 1 + Math.sin(time * 6) * 0.05;
    paperItem.scaling = new paper.Point(scale, scale);
  }, {});
  
  // 烛光（火焰）
  scene.addCircle({
    x: '35%',
    y: '35%',
    radius: 25,
    fillColor: colors.candleFlame,
    opacity: 0.8,
    duration: audioDurationNum - 206,
    startTime: 206,
    zIndex: 7,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 1 },
    ],
    onFrame: candle1OnFrame,
  });
  
  // 右侧花烛
  const candle2OnFrame = withContext((element, event, paperItem) => {
    if (!paperItem) return;
    const time = event.time;
    const flicker = 0.7 + Math.sin(time * 7.5) * 0.2;
    paperItem.opacity = flicker;
    const scale = 1 + Math.sin(time * 5.5) * 0.05;
    paperItem.scaling = new paper.Point(scale, scale);
  }, {});
  
  scene.addCircle({
    x: '65%',
    y: '35%',
    radius: 25,
    fillColor: colors.candleFlame,
    opacity: 0.8,
    duration: audioDurationNum - 206,
    startTime: 206,
    zIndex: 7,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 1 },
    ],
    onFrame: candle2OnFrame,
  });

  // ========== 酒杯元素：象征"泪光浸杯里月光" ==========
  // 酒杯（用圆形和矩形组合）
  const wineGlassOnFrame = withContext((element, event, paperItem) => {
    if (!paperItem) return;
    const time = event.time;
    const glow = 0.4 + Math.sin(time * 2) * 0.2;
    paperItem.opacity = glow;
  }, {});
  
  // 酒杯主体（圆形，象征酒杯）
  scene.addCircle({
    x: '25%',
    y: '40%',
    radius: 40,
    fillColor: colors.wineRed,
    strokeColor: colors.gold,
    strokeWidth: 3,
    opacity: 0.5,
    duration: 30,
    startTime: 146,
    zIndex: 8,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 2 },
      { type: 'fade', fromOpacity: 0.5, toOpacity: 0, duration: 2, delay: 28 },
    ],
    onFrame: wineGlassOnFrame,
  });
  
  // 酒杯光晕
  scene.addCircle({
    x: '25%',
    y: '40%',
    radius: 50,
    fillColor: colors.lightYellow,
    opacity: 0.2,
    duration: 30,
    startTime: 146,
    zIndex: 7,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.2, duration: 2 },
      { type: 'fade', fromOpacity: 0.2, toOpacity: 0, duration: 2, delay: 28 },
    ],
  });

  // ========== 烟雾/云彩效果：营造氛围 ==========
  const cloudCount = 8;
  for (let i = 0; i < cloudCount; i++) {
    const index = i;
    const x = Math.random() * 1920;
    const y = 200 + Math.random() * 300;
    const size = 80 + Math.random() * 120;
    const driftSpeed = 5 + Math.random() * 15;
    const floatSpeed = 0.3 + Math.random() * 0.7;
    
    const onFrameCloud = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      const driftX = x + time * driftSpeed;
      const floatY = y + Math.sin(time * floatSpeed + index) * 30;
      paperItem.position = new paper.Point(driftX % 2020 - 50, floatY);
      const opacity = 0.15 + Math.sin(time * 0.5 + index) * 0.1;
      paperItem.opacity = opacity;
    }, { index, x, y, driftSpeed, floatSpeed });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.white,
      opacity: 0.2,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.2, duration: 3 },
      ],
      onFrame: onFrameCloud,
    });
  }

  // ========== 城墙/城门元素：用路径绘制 ==========
  // 底部城墙轮廓
  scene.addPath({
    points: [
      [0, 900],
      [200, 880],
      [400, 890],
      [600, 870],
      [800, 885],
      [1000, 875],
      [1200, 888],
      [1400, 872],
      [1600, 882],
      [1800, 878],
      [1920, 900],
      [1920, 1080],
      [0, 1080],
    ],
    closed: true,
    fillColor: colors.darkPurple,
    opacity: 0.3,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 3 },
    ],
  });
  
  // 城墙装饰线
  scene.addPath({
    points: [
      [0, 900],
      [200, 880],
      [400, 890],
      [600, 870],
      [800, 885],
      [1000, 875],
      [1200, 888],
      [1400, 872],
      [1600, 882],
      [1800, 878],
      [1920, 900],
    ],
    closed: false,
    strokeColor: colors.darkGold,
    strokeWidth: 2,
    opacity: 0.4,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 3,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 3 },
    ],
  });

  // ========== 额外装饰粒子：增加画面丰富度 ==========
  // 小金色粒子
  for (let i = 0; i < 30; i++) {
    const index = i;
    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    const size = 2 + Math.random() * 4;
    const floatSpeed = 0.5 + Math.random() * 1.5;
    
    const onFrameParticle = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      const floatY = y + Math.sin(time * floatSpeed + index) * 20;
      paperItem.position = new paper.Point(x, floatY);
      const twinkle = 0.3 + Math.sin(time * 4 + index) * 0.3;
      paperItem.opacity = twinkle;
    }, { index, x, y, floatSpeed });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.gold,
      opacity: 0.5,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 4,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.5, duration: 2 },
      ],
      onFrame: onFrameParticle,
    });
  }

  // ========== 歌词轨道：单独轨道显示歌词 ==========
  const lyricTrack = builder.createTrack({ zIndex: 20 });
  const lyricScene = lyricTrack.createScene({ duration: audioDurationNum })
    .addLRC(lrcFile, {
      position: 'bottom',
      fontSize: 44,
      color: colors.gold,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      maxLength: 20,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 20,
      split: 'letter',
      splitDelay: 0.08,
      splitDuration: 0.4,
      animations: ['fadeIn'],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 18,
      stroke: true,
      strokeColor: colors.darkGold,
      strokeWidth: 2,
      textGlow: true,
      textGlowColor: colors.gold,
      textGlowBlur: 25,
    });

  // ========== 音频轨道：单独轨道添加音频 ==========
  const audioTrack = builder.createTrack({ zIndex: 0 });
  audioTrack.createScene({ duration: audioDurationNum })
    .addAudio({
      src: audioFile,
      startTime: 0,
      duration: audioDurationNum,
    });

  // 构建并导出
  try {
    const videoMaker = builder.build();
    
    const outputPath = path.join(__dirname, '../output/帝女芳魂-video.mp4');
    console.log(`场景时长: ${audioDurationNum.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(audioDurationNum * 30)} 帧\n`);
    console.log('📊 视觉元素统计：');
    console.log(`  - 星空: ${starCount} 颗`);
    console.log(`  - 落花粒子: ${petalCount} 个`);
    console.log(`  - 碧血粒子: 15 个`);
    console.log(`  - 金色装饰: 12 个`);
    console.log(`  - 月光光晕: 4 层`);
    console.log(`  - 花烛: 2 个`);
    console.log(`  - 酒杯: 1 个`);
    console.log(`  - 烟雾: ${cloudCount} 朵`);
    console.log(`  - 装饰粒子: 30 个`);
    console.log(`  - 装饰文字: 5 组`);
    console.log(`  - 总计: ${starCount + petalCount + 15 + 12 + 4 + 2 + 1 + cloudCount + 30 + 5} 个视觉元素\n`);
    
    await videoMaker.export(outputPath, {
      parallel: false,
      usePipe: true,
      maxWorkers: 4,
    });
    
    console.log(`\n✅ 视频导出成功: ${outputPath}`);
    console.log('\n✨ 帝女芳魂视频MV制作完成（增强版）！');
    console.log('\n📝 设计说明：');
    console.log('  - 主题：国破家亡、悲壮爱情、落花飘零、碧血殉葬');
    console.log('  - 配色：深红色（碧血）、金色（皇家）、深蓝黑（乱世）');
    console.log('  - 视觉元素：');
    console.log('    * 80颗闪烁的星星营造夜晚氛围');
    console.log('    * 50个落花粒子持续飘落');
    console.log('    * 15个血色粒子象征碧血');
    console.log('    * 12个金色装饰圆形');
    console.log('    * 4层月光光晕');
    console.log('    * 2个花烛（在第四段出现）');
    console.log('    * 1个酒杯（在第三段出现）');
    console.log('    * 8朵烟雾/云彩');
    console.log('    * 30个小装饰粒子');
    console.log('    * 5组装饰文字（根据歌词段落显示）');
    console.log('    * 城墙轮廓和装饰线条');
    console.log('    * 多层古典边框');
    console.log('  - 示波器：spectrum 样式，象征音乐的情感波动');
    
    builder.destroy();
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
    builder.destroy();
  }
}

createDiNvFangHunVideo().catch(console.error);

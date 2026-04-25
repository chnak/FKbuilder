/**
 * 离家出走 - 根据歌词意境制作竖屏MV
 * 主题：自由、反叛、爱情、出走、沙丘、教堂、天与地
 * 竖屏格式，元素丰富，包含SVG元素
 */
import { VideoBuilder, getAudioDuration, withContext } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from '@chnak/paper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 创建竖排文本的辅助函数
 * @param {Scene} scene - 场景对象
 * @param {Object} config - 文本配置
 * @param {string} config.text - 文本内容
 * @param {number|string} config.x - X坐标
 * @param {number|string} config.y - Y坐标（中心点）
 * @param {number} config.fontSize - 字体大小
 * @param {string} config.color - 文字颜色
 * @param {string} config.fontFamily - 字体
 * @param {number} config.charSpacing - 字符间距（默认字体大小的0.3倍）
 * @param {Object} config.otherProps - 其他属性（如duration, startTime, animations等）
 */
function addVerticalText(scene, config) {
  const {
    text,
    x,
    y,
    fontSize = 24,
    color = '#ffffff',
    fontFamily = '微软雅黑',
    charSpacing = fontSize * 0.3,
    ...otherProps
  } = config;
  
  if (!text) return;
  
  // 将文本按字符分割
  const chars = Array.from(text);
  const totalHeight = chars.length * fontSize + (chars.length - 1) * charSpacing;
  
  // 竖屏尺寸：1080x1920
  const canvasHeight = 1920;
  
  // 为每个字符创建TextElement
  chars.forEach((char, index) => {
    // 计算每个字符的Y位置（垂直排列）
    // 从中心点向上偏移，使文本居中
    let charY;
    if (typeof y === 'string') {
      // 如果是百分比，先转换为像素值
      const yPercent = parseFloat(y) / 100;
      const centerY = canvasHeight * yPercent;
      const offsetY = totalHeight / 2 - index * (fontSize + charSpacing) - fontSize / 2;
      charY = centerY - offsetY;
    } else {
      // 如果是数字，直接计算
      const offsetY = totalHeight / 2 - index * (fontSize + charSpacing) - fontSize / 2;
      charY = y - offsetY;
    }
    
    scene.addText({
      text: char,
      x: x,
      y: charY,
      fontSize: fontSize,
      color: color,
      fontFamily: fontFamily,
      textAlign: 'center',
      anchor: [0.5, 0.5],
      ...otherProps,
    });
  });
}

// 配色方案 - 根据歌词意境：自由、浪漫、反叛、温暖
const colors = {
  skyBlue: '#87CEEB',        // 天空蓝 - 自由、广阔
  deepBlue: '#1E3A8A',       // 深蓝色 - 夜晚、深邃
  sunsetOrange: '#FF6B6B',   // 日落橙 - 温暖、浪漫
  sunsetPink: '#FF8E9B',     // 日落粉 - 浪漫
  sandBeige: '#F4E4BC',      // 沙色 - 沙丘
  sandBrown: '#D4A574',      // 沙棕色 - 沙漠
  gold: '#FFD700',           // 金色 - 温暖、希望
  white: '#ffffff',          // 白色 - 纯洁、自由
  darkGray: '#2C3E50',       // 深灰 - 城市、束缚
  lightGray: '#95A5A6',      // 浅灰 - 过渡
  churchGold: '#DAA520',     // 教堂金 - 神圣
  starWhite: '#F0F8FF',      // 星白色
  roadGray: '#708090',       // 道路灰
  earthGreen: '#228B22',     // 地球绿
  earthBlue: '#4682B4',      // 地球蓝
};

async function createLiJiaChuZouVideo() {
  console.log('🎬 离家出走 - 竖屏MV生成...\n');

  const name = "离家出走";
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

  // 竖屏尺寸：1080x1920 (9:16)
  const builder = new VideoBuilder({
    width: 1080,
    height: 1920,
    fps: 30,
  });

  // ========== 主轨道：视觉元素 ==========
  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 创建主场景
  const scene = mainTrack.createScene({ duration: audioDurationNum })
    // 渐变背景：从天空蓝到深蓝（象征从白天到夜晚）
    .addBackground({ color: colors.skyBlue })
    
    // ========== 标题：离家出走 ==========
    .addText({
      text: '离家出走',
      x: '50%',
      y: '10%',
      fontSize: 80,
      color: colors.white,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 20,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 2 },
      ],
      textShadow: true,
      textShadowColor: colors.deepBlue,
      textShadowBlur: 20,
      textGlow: true,
      textGlowColor: colors.gold,
      textGlowBlur: 30,
    })
    
    // ========== 天空渐变背景层 ==========
    .addRect({
      x: '50%',
      y: '30%',
      width: 1080,
      height: 960,
      bgcolor: colors.deepBlue,
      opacity: 0.6,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 1,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 5 },
      ],
    })
    
    // ========== 示波器：可视化音乐 ==========
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '75%',
      width: 900,
      height: 200,
      style: 'wave',
      waveColor: colors.sunsetOrange,
      backgroundColor: 'rgba(30, 58, 138, 0.3)',
      lineWidth: 3,
      sensitivity: 1.5,
      mirror: true,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 3 },
      ],
    });

  // ========== SVG元素：道路/路径（象征出走） ==========
  // 创建道路SVG
  const roadSVG = `
    <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.roadGray};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors.darkGray};stop-opacity:0.6" />
        </linearGradient>
      </defs>
      <path d="M 540 400 Q 400 800 540 1200 Q 680 1600 540 1920" 
            stroke="url(#roadGradient)" 
            stroke-width="60" 
            fill="none" 
            stroke-linecap="round"/>
      <path d="M 540 400 Q 400 800 540 1200 Q 680 1600 540 1920" 
            stroke="${colors.white}" 
            stroke-width="4" 
            fill="none" 
            stroke-dasharray="20,10" 
            opacity="0.6"/>
    </svg>
  `;
  
  const roadSVGPath = path.join(__dirname, '../output/temp-road.svg');
  await fs.writeFile(roadSVGPath, roadSVG);
  
  scene.addSVG({
    src: roadSVGPath,
    x: '50%',
    y: '50%',
    width: 1080,
    height: 1920,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 3,
    opacity: 0.7,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 3 },
    ],
  });

  // ========== SVG元素：沙丘（象征"自繁华浪处到沙丘"） ==========
  const sandSVG = `
    <svg width="1080" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.sandBeige};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors.sandBrown};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <path d="M 0 400 Q 200 350 400 380 Q 600 400 800 370 Q 1000 360 1080 400 L 1080 600 L 0 600 Z" 
            fill="url(#sandGradient)"/>
      <path d="M 0 450 Q 300 400 600 430 Q 900 450 1080 480 L 1080 600 L 0 600 Z" 
            fill="${colors.sandBrown}" 
            opacity="0.6"/>
    </svg>
  `;
  
  const sandSVGPath = path.join(__dirname, '../output/temp-sand.svg');
  await fs.writeFile(sandSVGPath, sandSVG);
  
  scene.addSVG({
    src: sandSVGPath,
    x: '50%',
    y: '85%',
    width: 1080,
    height: 600,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 4,
    opacity: 0.8,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 4 },
    ],
  });

  // ========== SVG元素：教堂（象征"在穷途入教堂进谏上帝"） ==========
  const churchSVG = `
    <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="churchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.white};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors.lightGray};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <!-- 教堂主体 -->
      <rect x="100" y="200" width="100" height="200" fill="url(#churchGradient)" stroke="${colors.darkGray}" stroke-width="2"/>
      <!-- 教堂尖顶 -->
      <polygon points="150,50 80,200 220,200" fill="${colors.churchGold}" stroke="${colors.darkGray}" stroke-width="2"/>
      <!-- 十字架 -->
      <line x1="150" y1="50" x2="150" y2="20" stroke="${colors.churchGold}" stroke-width="8" stroke-linecap="round"/>
      <line x1="130" y1="35" x2="170" y2="35" stroke="${colors.churchGold}" stroke-width="6" stroke-linecap="round"/>
      <!-- 门 -->
      <rect x="120" y="320" width="60" height="80" fill="${colors.darkGray}" opacity="0.7"/>
      <!-- 窗户 -->
      <circle cx="130" cy="250" r="15" fill="${colors.gold}" opacity="0.6"/>
      <circle cx="170" cy="250" r="15" fill="${colors.gold}" opacity="0.6"/>
    </svg>
  `;
  
  const churchSVGPath = path.join(__dirname, '../output/temp-church.svg');
  await fs.writeFile(churchSVGPath, churchSVG);
  
  scene.addSVG({
    src: churchSVGPath,
    x: '50%',
    y: '70%',
    width: 300,
    height: 400,
    duration: 30,
    startTime: 32,
    zIndex: 6,
    opacity: 0.9,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 2 },
      { type: 'fade', fromOpacity: 0.9, toOpacity: 0, duration: 2, delay: 28 },
    ],
  });

  // ========== SVG元素：地球/地图（象征"逛尽地球"） ==========
  const earthSVG = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="earthGradient" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:${colors.earthBlue};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors.deepBlue};stop-opacity:0.8" />
        </radialGradient>
      </defs>
      <!-- 地球 -->
      <circle cx="200" cy="200" r="180" fill="url(#earthGradient)" stroke="${colors.white}" stroke-width="3"/>
      <!-- 大陆轮廓 -->
      <path d="M 100 150 Q 150 120 200 130 Q 250 125 300 140 Q 280 180 250 200 Q 200 220 150 200 Q 120 180 100 150" 
            fill="${colors.earthGreen}" opacity="0.6"/>
      <path d="M 150 250 Q 200 240 250 260 Q 220 300 180 280 Q 150 270 150 250" 
            fill="${colors.earthGreen}" opacity="0.6"/>
      <!-- 经纬线 -->
      <ellipse cx="200" cy="200" rx="180" ry="60" fill="none" stroke="${colors.white}" stroke-width="1" opacity="0.3"/>
      <ellipse cx="200" cy="200" rx="180" ry="120" fill="none" stroke="${colors.white}" stroke-width="1" opacity="0.3"/>
      <line x1="20" y1="200" x2="380" y2="200" stroke="${colors.white}" stroke-width="1" opacity="0.3"/>
    </svg>
  `;
  
  const earthSVGPath = path.join(__dirname, '../output/temp-earth.svg');
  await fs.writeFile(earthSVGPath, earthSVG);
  
  scene.addSVG({
    src: earthSVGPath,
    x: '50%',
    y: '40%',
    width: 400,
    height: 400,
    duration: 20,
    startTime: 5,
    zIndex: 5,
    opacity: 0.8,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 2 },
      { type: 'fade', fromOpacity: 0.8, toOpacity: 0, duration: 2, delay: 18 },
      { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1, toScaleY: 1, duration: 2 },
    ],
  });

  // ========== 星空背景 ==========
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    const index = i;
    const x = Math.random() * 1080;
    const y = Math.random() * 960; // 上半部分天空
    const size = 1 + Math.random() * 3;
    const twinkleSpeed = 0.5 + Math.random() * 2;
    const twinklePhase = Math.random() * Math.PI * 2;
    
    const onFrameStar = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      const twinkle = 0.4 + Math.sin(time * twinkleSpeed + twinklePhase) * 0.4;
      paperItem.opacity = twinkle;
    }, { twinkleSpeed, twinklePhase });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.starWhite,
      opacity: 0.8,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      onFrame: onFrameStar,
    });
  }

  // ========== 日落/日出光晕 ==========
  const sunsetOnFrame = withContext((element, event, paperItem) => {
    if (!paperItem) return;
    const time = event.time;
    const pulse = 1 + Math.sin(time * 0.5) * 0.1;
    paperItem.scaling = new paper.Point(pulse, pulse);
    const glow = 0.3 + Math.sin(time * 0.8) * 0.1;
    paperItem.opacity = glow;
  }, {});
  
  // 主光晕
  scene.addCircle({
    x: '50%',
    y: '25%',
    radius: 400,
    fillColor: colors.sunsetOrange,
    opacity: 0.3,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 3 },
    ],
    onFrame: sunsetOnFrame,
  });
  
  // 粉色光晕层
  scene.addCircle({
    x: '50%',
    y: '25%',
    radius: 350,
    fillColor: colors.sunsetPink,
    opacity: 0.25,
    duration: audioDurationNum,
    startTime: 0,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.25, duration: 3.5 },
    ],
  });

  // ========== 流动粒子：象征自由、出走 ==========
  const particleCount = 60;
  for (let i = 0; i < particleCount; i++) {
    const index = i;
    const startX = Math.random() * 1080;
    const startY = 1920 + Math.random() * 200;
    const speed = 30 + Math.random() * 80;
    const swingAmplitude = 20 + Math.random() * 60;
    const swingSpeed = 0.3 + Math.random() * 1;
    const size = 3 + Math.random() * 6;
    const delay = Math.random() * 5;
    
    const onFrameParticle = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time - delay;
      if (time < 0) return;
      const moveY = startY - time * speed;
      const swingX = startX + Math.sin(time * swingSpeed + index) * swingAmplitude;
      paperItem.position = new paper.Point(swingX, moveY);
      const opacity = Math.max(0, Math.min(0.8, (moveY / 1920) * 0.8));
      paperItem.opacity = opacity;
    }, { index, startX, startY, speed, swingAmplitude, swingSpeed, delay });
    
    scene.addCircle({
      x: startX,
      y: startY,
      radius: size,
      fillColor: colors.gold,
      opacity: 0.8,
      duration: audioDurationNum - delay,
      startTime: delay,
      zIndex: 4,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 1 },
      ],
      onFrame: onFrameParticle,
    });
  }

  // ========== 沙粒粒子：在沙丘区域 ==========
  const sandParticleCount = 40;
  for (let i = 0; i < sandParticleCount; i++) {
    const index = i;
    const x = Math.random() * 1080;
    const y = 1500 + Math.random() * 400; // 沙丘区域
    const size = 2 + Math.random() * 4;
    const driftSpeed = 5 + Math.random() * 20;
    const floatSpeed = 0.2 + Math.random() * 0.8;
    
    const onFrameSand = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      const driftX = (x + time * driftSpeed) % 1130 - 25;
      const floatY = y + Math.sin(time * floatSpeed + index) * 15;
      paperItem.position = new paper.Point(driftX, floatY);
    }, { index, x, y, driftSpeed, floatSpeed });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.sandBeige,
      opacity: 0.6,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 3 },
      ],
      onFrame: onFrameSand,
    });
  }

  // ========== 装饰圆形：象征"天与地" ==========
  for (let i = 0; i < 8; i++) {
    const index = i;
    const angle = (index / 8) * Math.PI * 2;
    const radius = 200 + Math.random() * 150;
    const centerX = 540;
    const centerY = 960;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const size = 15 + Math.random() * 25;
    
    const onFrameCircle = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      paperItem.rotation = time * (10 + index * 3);
      const pulse = 1 + Math.sin(time * (2 + index * 0.3)) * 0.2;
      paperItem.scaling = new paper.Point(pulse, pulse);
      const flicker = 0.2 + Math.sin(time * (3 + index * 0.4)) * 0.2;
      paperItem.opacity = flicker;
    }, { index });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: size,
      fillColor: colors.sunsetOrange,
      opacity: 0.3,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 3 + index * 0.2 },
      ],
      onFrame: onFrameCircle,
    });
  }

  // ========== 装饰文字：根据歌词段落显示 ==========
  // "豁出去漫游" - 使用原生竖排功能
  scene.addText({
    text: '豁出去漫游',
    x: '20%', // 左侧竖排
    y: '50%',
    fontSize: 56,
    color: colors.white,
    fontFamily: '微软雅黑',
    writingMode: 'vertical', // 启用竖排
    verticalCharSpacing: 20, // 字符间距
    opacity: 0.8,
    duration: 8,
    startTime: 15,
    zIndex: 10,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 1.5 },
      { type: 'fade', fromOpacity: 0.8, toOpacity: 0, duration: 1.5, delay: 6.5 },
    ],
    textShadow: true,
    textShadowColor: colors.deepBlue,
    textShadowBlur: 20,
    textGlow: true,
    textGlowColor: colors.gold,
    textGlowBlur: 25,
  });
  
  // "自繁华浪处到沙丘" - 使用原生竖排功能
  scene.addText({
    text: '自繁华浪处到沙丘',
    x: '80%', // 右侧竖排
    y: '50%',
    fontSize: 52,
    color: colors.sandBeige,
    fontFamily: '微软雅黑',
    writingMode: 'vertical', // 启用竖排
    verticalCharSpacing: 18, // 字符间距
    opacity: 0.7,
    duration: 8,
    startTime: 57,
    zIndex: 10,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 1.5 },
      { type: 'fade', fromOpacity: 0.7, toOpacity: 0, duration: 1.5, delay: 6.5 },
    ],
    textShadow: true,
    textShadowColor: colors.sandBrown,
    textShadowBlur: 18,
  });
  
  // "在穷途入教堂进谏上帝" - 使用原生竖排功能
  scene.addText({
    text: '在穷途入教堂进谏上帝',
    x: '15%', // 左侧竖排
    y: '60%',
    fontSize: 50,
    color: colors.churchGold,
    fontFamily: '微软雅黑',
    writingMode: 'vertical', // 启用竖排
    verticalCharSpacing: 16, // 字符间距
    opacity: 0.8,
    duration: 8,
    startTime: 32,
    zIndex: 10,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 1.5 },
      { type: 'fade', fromOpacity: 0.8, toOpacity: 0, duration: 1.5, delay: 6.5 },
    ],
    textShadow: true,
    textShadowColor: colors.deepBlue,
    textShadowBlur: 20,
    textGlow: true,
    textGlowColor: colors.churchGold,
    textGlowBlur: 30,
  });
  
  // "天与地" - 使用原生竖排功能（居中）
  scene.addText({
    text: '天与地',
    x: '50%',
    y: '50%',
    fontSize: 64,
    color: colors.white,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    writingMode: 'vertical', // 启用竖排
    verticalCharSpacing: 25, // 字符间距
    opacity: 0.9,
    duration: 10,
    startTime: 29,
    zIndex: 10,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.9, duration: 2 },
      { type: 'fade', fromOpacity: 0.9, toOpacity: 0, duration: 2, delay: 8 },
    ],
    textShadow: true,
    textShadowColor: colors.deepBlue,
    textShadowBlur: 25,
    textGlow: true,
    textGlowColor: colors.sunsetOrange,
    textGlowBlur: 35,
  });
  
  // "回家安乐过亦有运气" - 使用原生竖排功能
  scene.addText({
    text: '回家安乐过亦有运气',
    x: '85%', // 右侧竖排
    y: '50%',
    fontSize: 54,
    color: colors.gold,
    fontFamily: '微软雅黑',
    writingMode: 'vertical', // 启用竖排
    verticalCharSpacing: 20, // 字符间距
    opacity: 0.8,
    duration: 8,
    startTime: 203,
    zIndex: 10,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 2 },
      { type: 'fade', fromOpacity: 0.8, toOpacity: 0, duration: 2, delay: 6 },
    ],
    textShadow: true,
    textShadowColor: colors.deepBlue,
    textShadowBlur: 22,
    textGlow: true,
    textGlowColor: colors.gold,
    textGlowBlur: 30,
  });

  // ========== 路径装饰：象征出走路线 ==========
  // 多条路径线条
  for (let i = 0; i < 5; i++) {
    const index = i;
    const startX = 200 + i * 170;
    const startY = 400;
    const endX = 300 + (i % 2 === 0 ? -100 : 100);
    const endY = 1600;
    
    const onFramePath = withContext((element, event, paperItem) => {
      if (!paperItem) return;
      const time = event.time;
      const progress = (time % 10) / 10;
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;
      paperItem.position = new paper.Point(currentX, currentY);
    }, { index, startX, startY, endX, endY });
    
    scene.addCircle({
      x: startX,
      y: startY,
      radius: 8,
      fillColor: colors.gold,
      opacity: 0.6,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 4,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 2 },
      ],
      onFrame: onFramePath,
    });
  }

  // ========== 歌词轨道：显示完整歌词 ==========
  const lyricTrack = builder.createTrack({ zIndex: 25 });
  lyricTrack.createScene({ duration: audioDurationNum })
    .addLRC(lrcFile, {
      position: 'bottom',
      fontSize: 38,
      color: colors.white,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      maxLength: 15,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 25,
      split: 'letter',
      splitDelay: 0.06,
      splitDuration: 0.3,
      animations: ['fadeIn'],
      textShadow: true,
      textShadowColor: colors.deepBlue,
      textShadowBlur: 15,
      stroke: true,
      strokeColor: colors.darkGray,
      strokeWidth: 1.5,
      textGlow: true,
      textGlowColor: colors.sunsetOrange,
      textGlowBlur: 20,
    });

  // ========== 音频轨道 ==========
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
    
    const outputPath = path.join(__dirname, '../output/离家出走-video.mp4');
    console.log(`场景时长: ${audioDurationNum.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(audioDurationNum * 30)} 帧\n`);
    console.log('📊 视觉元素统计：');
    console.log(`  - SVG元素: 4个（道路、沙丘、教堂、地球）`);
    console.log(`  - 星空: ${starCount} 颗`);
    console.log(`  - 流动粒子: ${particleCount} 个`);
    console.log(`  - 沙粒粒子: ${sandParticleCount} 个`);
    console.log(`  - 装饰圆形: 8 个`);
    console.log(`  - 路径装饰: 5 个`);
    console.log(`  - 装饰文字: 5 组`);
    console.log(`  - 日落光晕: 2 层`);
    console.log(`  - 总计: ${4 + starCount + particleCount + sandParticleCount + 8 + 5 + 5 + 2} 个视觉元素\n`);
    
    await videoMaker.export(outputPath, {
      parallel: true,
      usePipe: true,
      maxWorkers: 8,
    });
    
    // 清理临时SVG文件
    try {
      await fs.remove(roadSVGPath);
      await fs.remove(sandSVGPath);
      await fs.remove(churchSVGPath);
      await fs.remove(earthSVGPath);
    } catch (e) {
      console.warn('清理临时文件时出错:', e.message);
    }
    
    console.log(`\n✅ 视频导出成功: ${outputPath}`);
    console.log('\n✨ 离家出走竖屏MV制作完成！');
    console.log('\n📝 设计说明：');
    console.log('  - 主题：自由、反叛、爱情、出走、沙丘、教堂、天与地');
    console.log('  - 格式：竖屏 1080x1920 (9:16)');
    console.log('  - 配色：天空蓝、日落橙、沙色、金色');
    console.log('  - 视觉元素：');
    console.log('    * 4个SVG元素：道路、沙丘、教堂、地球');
    console.log('    * 100颗闪烁的星星');
    console.log('    * 60个流动粒子（象征自由出走）');
    console.log('    * 40个沙粒粒子（在沙丘区域）');
    console.log('    * 8个装饰圆形（象征天与地）');
    console.log('    * 5个路径装饰点（象征出走路线）');
    console.log('    * 5组装饰文字（根据歌词段落显示）');
    console.log('    * 2层日落/日出光晕');
    console.log('    * 示波器可视化音乐');
    console.log('  - 意境：从城市出走，到沙丘，到教堂，逛尽地球，最终回家');
    
    builder.destroy();
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
    builder.destroy();
  }
}

createLiJiaChuZouVideo().catch(console.error);


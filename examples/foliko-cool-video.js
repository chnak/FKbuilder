import { VideoBuilder, getAudioDuration, withContext } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 酷炫配色方案 - 赛博朋克风格
const colors = {
  primary: '#00d4ff',      // 电光蓝
  secondary: '#ff006e',    // 霓虹粉
  accent: '#ffbe0b',       // 荧光黄
  purple: '#8338ec',       // 幻紫
  dark: '#0a0a0f',         // 深黑
  darkBlue: '#0d1b2a',     // 深蓝黑
  light: '#f0f0f0',        // 浅色
  cyan: '#00ffcc',         // 青色
  pink: '#ff5fa2',         // 粉色
};

// 粒子类
function createParticle(x, y, size, color, delay) {
  return {
    x, y, radius: size, bgcolor: color, opacity: 0.6,
    duration: 3, startTime: delay,
    animations: ['zoomIn'],
  };
}

/**
 * Foliko.com 酷炫宣传视频
 */
async function createCoolFolikoVideo() {
  console.log('🎬 Foliko.com 酷炫宣传视频生成...\n');

  const name = "foliko-cool";
  const audioFile = path.join(__dirname, `../assets/cotton-clouds.mp3`);
  const outputPath = path.join(__dirname, `../output/${name}.mp4`);

  let audioDuration = 25;
  if (await fs.pathExists(audioFile)) {
    try {
      audioDuration = Number(await getAudioDuration(audioFile)) || 25;
      console.log(`✅ 音频时长: ${audioDuration.toFixed(2)} 秒`);
    } catch (e) {
      console.log('⚠️ 使用默认时长');
    }
  }

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const totalDuration = Math.min(audioDuration, 25);
  const fps = 30;

  // ========== 场景1：震撼开场 Logo ==========
  const scene1 = mainTrack.createScene({ duration: 5, startTime: 0 })
    .addBackground({ color: colors.dark })

    // 背景光晕
    .addCircle({
      x: '50%', y: '50%', radius: 400,
      bgcolor: colors.primary, opacity: 0.1, duration: 5, startTime: 0,
      animations: ['zoomIn'],
      onFrame: withContext((el, ev, item) => {
        if (!item) return;
        item.rotation = ev.time * 10;
      }, {}),
    })

    // 外圈光环
    .addCircle({
      x: '50%', y: '50%', radius: 500,
      bgcolor: colors.secondary, opacity: 0.05, duration: 5, startTime: 0.5,
      animations: ['zoomIn'],
    })

    // 主标题 - FOLIKO
    .addText({
      text: 'FOLIKO',
      x: '50%', y: '42%',
      fontSize: 200, color: colors.light,
      fontFamily: 'Arial', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5],
      duration: 5, startTime: 0,
      animations: ['bigIn'],
      textShadow: true, textShadowColor: colors.primary, textShadowBlur: 60,
    })

    // .com - 错位效果
    .addText({
      text: '.com',
      x: '57%', y: '42%',
      fontSize: 80, color: colors.secondary,
      fontFamily: 'Arial', fontWeight: 'normal',
      textAlign: 'left', anchor: [0, 0.5],
      duration: 5, startTime: 0.3,
      animations: ['fadeInUp'],
    })

    // 底部标语
    .addText({
      text: '简约的插件化 Agent 框架',
      x: '50%', y: '68%',
      fontSize: 42, color: colors.light,
      fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      opacity: 0.7, duration: 5, startTime: 0.8,
      animations: ['fadeInUp'],
    });

  // 添加动态粒子圆环
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const radius = 380 + Math.sin(i * 0.5) * 30;
    const x = 960 + Math.cos(angle) * radius;
    const y = 540 + Math.sin(angle) * radius;
    const size = 3 + Math.random() * 4;
    const c = i % 4 === 0 ? colors.primary : i % 4 === 1 ? colors.secondary : i % 4 === 2 ? colors.accent : colors.purple;

    scene1.addCircle({
      x, y, radius: size, bgcolor: c, opacity: 0.5,
      duration: 5, startTime: i * 0.04,
      animations: ['zoomIn'],
      onFrame: withContext((el, ev, item) => {
        if (!item) return;
        const t = ev.time;
        const idx = i;
        item.opacity = 0.3 + Math.sin(t * 3 + idx * 0.3) * 0.3;
        item.rotation = t * (20 + idx * 3);
      }, { i }),
    });
  }

  // ========== 场景2：特性卡片展示 ==========
  const scene2Start = 5;
  const scene2 = mainTrack.createScene({ duration: 6, startTime: scene2Start })
    .addBackground({ color: colors.darkBlue })

    // 顶部标题
    .addText({
      text: '核心能力',
      x: '50%', y: '12%',
      fontSize: 80, color: colors.light,
      fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0,
      animations: ['fadeInUp'],
    });

  // 六个特性 - 网格布局
  const features = [
    { icon: '🔌', title: '插件系统', desc: '模块化扩展', color: colors.primary, x: 20 },
    { icon: '🤖', title: '多 AI', desc: '灵活切换', color: colors.secondary, x: 38 },
    { icon: '⚡', title: '流式输出', desc: '实时响应', color: colors.accent, x: 56 },
    { icon: '🌐', title: '子 Agent', desc: '并行处理', color: colors.cyan, x: 74 },
    { icon: '📝', title: '记忆系统', desc: '上下文保持', color: colors.purple, x: 38 },
    { icon: '🔄', title: '多模型', desc: '协同工作', color: colors.pink, x: 56 },
  ];

  features.forEach((f, i) => {
    const y = i < 2 ? 45 : 70;

    // 卡片
    scene2.addRect({
      x: `${f.x}%`, y: `${y}%`,
      width: 320, height: 180,
      bgcolor: '#1a1a2e', borderRadius: 20,
      anchor: [0.5, 0.5], duration: 6, startTime: 0.2 + i * 0.1,
      animations: ['fadeInUp'],
      borderWidth: 1.5, borderColor: f.color,
      shadowBlur: 25, shadowColor: f.color, shadowOffsetX: 0, shadowOffsetY: 0,
      opacity: 0.9,
    });

    // 图标
    scene2.addText({
      text: f.icon, x: `${f.x}%`, y: `${y - 8}%`,
      fontSize: 56, color: f.color,
      fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.3 + i * 0.1,
      animations: ['zoomIn'],
    });

    // 标题
    scene2.addText({
      text: f.title, x: `${f.x}%`, y: `${y + 3}%`,
      fontSize: 36, color: colors.light,
      fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.4 + i * 0.1,
      animations: ['fadeInUp'],
    });

    // 描述
    scene2.addText({
      text: f.desc, x: `${f.x}%`, y: `${y + 12}%`,
      fontSize: 24, color: colors.light,
      fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      opacity: 0.6, duration: 6, startTime: 0.5 + i * 0.1,
      animations: ['fadeInUp'],
    });
  });

  // ========== 场景3：插件生态 ==========
  const scene3Start = scene2Start + 6;
  const scene3 = mainTrack.createScene({ duration: 6, startTime: scene3Start })
    .addBackground({ color: colors.dark })

    // 背景渐变圆
    .addCircle({
      x: '50%', y: '50%', radius: 500,
      bgcolor: colors.purple, opacity: 0.08, duration: 6, startTime: 0,
      animations: ['zoomIn'],
    })

    // 大标题
    .addText({
      text: '40+',
      x: '50%', y: '30%',
      fontSize: 280, color: colors.primary,
      fontFamily: 'Arial', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.2,
      animations: ['bigIn'],
      textShadow: true, textShadowColor: colors.secondary, textShadowBlur: 80,
    })

    // 副标题
    .addText({
      text: '插件生态',
      x: '50%', y: '55%',
      fontSize: 100, color: colors.light,
      fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.8,
      animations: ['fadeInUp'],
    })

    // 底部说明
    .addText({
      text: '开箱即用 · 自由扩展 · 持续更新',
      x: '50%', y: '72%',
      fontSize: 36, color: colors.accent,
      fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 1.2,
      animations: ['fadeInUp'],
    });

  // 插件图标演示
  const pluginIcons = ['📦', '🎨', '🌐', '🔍', '📊', '🔐', '📱', '🤝', '⚙️', '📈'];
  pluginIcons.forEach((icon, i) => {
    const angle = (i / pluginIcons.length) * Math.PI * 2 - Math.PI / 2;
    const radius = 380;
    const x = 960 + Math.cos(angle) * radius;
    const y = 540 + Math.sin(angle) * radius;

    scene3.addText({
      text: icon, x, y,
      fontSize: 48, color: colors.light,
      fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.5 + i * 0.08,
      animations: ['zoomIn'],
    });
  });

  // ========== 场景4：结尾 Logo ==========
  const scene4Start = scene3Start + 6;
  const scene4 = mainTrack.createScene({ duration: 4, startTime: scene4Start })
    .addBackground({ color: colors.darkBlue })

    // 光晕效果
    .addCircle({
      x: '50%', y: '50%', radius: 450,
      bgcolor: colors.primary, opacity: 0.12, duration: 4, startTime: 0,
      animations: ['zoomIn'],
      onFrame: withContext((el, ev, item) => {
        if (!item) return;
        item.rotation = ev.time * 15;
      }, {}),
    })

    // 主标语
    .addText({
      text: '开始你的 Agent 之旅',
      x: '50%', y: '38%',
      fontSize: 88, color: colors.light,
      fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5],
      duration: 4, startTime: 0.5,
      animations: ['bigIn'],
      textShadow: true, textShadowColor: colors.primary, textShadowBlur: 50,
    })

    // 网址
    .addText({
      text: 'foliko.com',
      x: '50%', y: '58%',
      fontSize: 72, color: colors.cyan,
      fontFamily: 'Arial', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5],
      duration: 4, startTime: 1.2,
      animations: ['fadeInUp'],
    });

  // 结尾粒子
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    const size = 2 + Math.random() * 5;
    const c = [colors.primary, colors.secondary, colors.accent, colors.cyan, colors.pink][Math.floor(Math.random() * 5)];

    scene4.addCircle({
      x, y, radius: size, bgcolor: c, opacity: 0.4,
      duration: 4, startTime: i * 0.03,
      animations: ['zoomIn'],
      onFrame: withContext((el, ev, item) => {
        if (!item) return;
        item.opacity = 0.2 + Math.sin(ev.time * 4 + i) * 0.3;
      }, { i }),
    });
  }

  // 版权信息
  scene4.addText({
    text: '© 2024 Foliko. All rights reserved.',
    x: '50%', y: '90%', fontSize: 24, color: colors.light,
    fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
    opacity: 0.4, duration: 4, startTime: 2,
    animations: ['fadeInUp'],
  });

  // ========== 转场 ==========
  mainTrack.addTransition({ name: 'CrossZoom', duration: 1.0 });
  mainTrack.addTransition({ name: 'Dreamy', duration: 1.0 });
  mainTrack.addTransition({ name: 'GridFlip', duration: 1.0 });
  mainTrack.addTransition({ name: 'CrossZoom', duration: 1.0 });

  // ========== 音频 ==========
  if (await fs.pathExists(audioFile)) {
    const audioTrack = builder.createTrack({ zIndex: 0 });
    audioTrack.createScene({ duration: totalDuration })
      .addAudio({
        src: audioFile, startTime: 0,
        duration: totalDuration, volume: 0.6,
      });
  }

  // ========== 导出 ==========
  try {
    console.log(`场景时长: ${totalDuration.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(totalDuration * fps)} 帧\n`);

    const resultPath = await builder.render(outputPath);

    console.log(`\n✅ 视频导出成功: ${resultPath}`);
    console.log('\n✨ Foliko.com 酷炫宣传视频制作完成！');

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
    throw error;
  }
}

createCoolFolikoVideo().catch(console.error);

import { VideoBuilder, getAudioDuration } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案 - 科技感渐变风格
const colors = {
  primary: '#6366f1',      // 靛蓝色
  secondary: '#8b5cf6',    // 紫色
  accent: '#06b6d4',       // 青色
  pink: '#ec4899',         // 粉红色
  dark: '#0f172a',         // 深蓝黑
  light: '#f8fafc',        // 浅灰白
  gradient1: '#6366f1',   // 渐变起点
  gradient2: '#8b5cf6',    // 渐变中点
  gradient3: '#d946ef',    // 渐变终点
};

/**
 * Foliko.com 宣传视频
 * 主题：简约的插件化 Agent 框架
 */
async function createFolikoPromoVideo() {
  console.log('🎬 Foliko.com 宣传视频生成...\n');

  const name = "foliko-promo";
  const audioFile = path.join(__dirname, `../assets/cotton-clouds.mp3`);
  const outputPath = path.join(__dirname, `../output/${name}.mp4`);

  // 检查音频是否存在，不强求
  let audioDuration = 20; // 默认视频时长
  if (await fs.pathExists(audioFile)) {
    try {
      audioDuration = Number(await getAudioDuration(audioFile)) || 20;
      console.log(`✅ 音频时长: ${audioDuration.toFixed(2)} 秒`);
    } catch (e) {
      console.log('⚠️ 无法获取音频时长，使用默认时长');
    }
  }

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  // ========== 主轨道 ==========
  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 视频总时长
  const totalDuration = Math.min(audioDuration, 20); // 最多20秒
  const fps = 30;

  // ========== 场景1：开场 Logo 展示 ==========
  const scene1 = mainTrack.createScene({ duration: 4, startTime: 0 })
    .addBackground({ color: colors.dark })

    // 装饰性圆形光晕
    .addCircle({
      x: '50%',
      y: '50%',
      radius: 200,
      bgcolor: colors.primary,
      opacity: 0.15,
      duration: 4,
      startTime: 0,
      animations: ['zoomIn'],
    })

    // 主标题
    .addText({
      text: 'FOLIKO',
      x: '50%',
      y: '45%',
      fontSize: 160,
      color: colors.light,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0,
      animations: ['zoomIn'],
      textShadow: true,
      textShadowColor: colors.primary,
      textShadowBlur: 40,
    })

    // 副标题
    .addText({
      text: '.com',
      x: '58%',
      y: '45%',
      fontSize: 60,
      color: colors.accent,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'left',
      anchor: [0, 0.5],
      duration: 4,
      startTime: 0.3,
      animations: ['fadeInUp'],
    })

    // 底部标语
    .addText({
      text: '简约的插件化 Agent 框架',
      x: '50%',
      y: '70%',
      fontSize: 36,
      color: colors.light,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.6,
      duration: 4,
      startTime: 0.8,
      animations: ['fadeInUp'],
    });

  // 添加装饰性粒子
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 350;
    const x = 960 + Math.cos(angle) * radius;
    const y = 540 + Math.sin(angle) * radius;
    const particleSize = 4 + Math.random() * 6;

    scene1.addCircle({
      x: x,
      y: y,
      radius: particleSize,
      bgcolor: i % 2 === 0 ? colors.primary : colors.accent,
      opacity: 0.4,
      duration: 4,
      startTime: i * 0.05,
      animations: ['zoomIn'],
    });
  }

  // ========== 场景2：核心特性展示 ==========
  const scene2Start = 4;
  const scene2 = mainTrack.createScene({ duration: 5, startTime: scene2Start })
    .addBackground({ color: colors.dark })

    // 标题
    .addText({
      text: '为什么选择 Foliko?',
      x: '50%',
      y: '15%',
      fontSize: 72,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0,
      animations: ['fadeInUp'],
    });

  // 四个核心特性卡片
  const features = [
    { icon: '🔌', title: '插件系统', desc: '轻松扩展功能\n模块化设计', color: colors.primary },
    { icon: '🤖', title: '多 AI 支持', desc: '集成多种大模型\n灵活切换', color: colors.secondary },
    { icon: '⚡', title: '流式输出', desc: '实时交互体验\n流畅响应', color: colors.accent },
    { icon: '🌐', title: '子 Agent', desc: '并行任务处理\n效率倍增', color: colors.pink },
  ];

  features.forEach((f, i) => {
    const x = 15 + i * 23;

    // 卡片背景
    scene2.addRect({
      x: `${x}%`,
      y: '50%',
      width: 380,
      height: 300,
      bgcolor: '#1e293b',
      borderRadius: 24,
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.2 + i * 0.15,
      animations: ['fadeInUp'],
      borderWidth: 2,
      borderColor: f.color,
      shadowBlur: 30,
      shadowColor: f.color,
      shadowOffsetY: 0,
      shadowOffsetX: 0,
      opacity: 0.95,
    });

    // 图标
    scene2.addText({
      text: f.icon,
      x: `${x}%`,
      y: '38%',
      fontSize: 64,
      color: f.color,
      fontFamily: 'Arial',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.4 + i * 0.15,
      animations: ['zoomIn'],
    });

    // 标题
    scene2.addText({
      text: f.title,
      x: `${x}%`,
      y: '52%',
      fontSize: 40,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.5 + i * 0.15,
      animations: ['fadeInUp'],
    });

    // 描述
    scene2.addText({
      text: f.desc,
      x: `${x}%`,
      y: '65%',
      fontSize: 26,
      color: colors.light,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.7,
      duration: 5,
      startTime: 0.6 + i * 0.15,
      animations: ['fadeInUp'],
    });
  });

  // ========== 场景3： Ambient Agent & 记忆系统 ==========
  const scene3Start = scene2Start + 5;
  const scene3 = mainTrack.createScene({ duration: 5, startTime: scene3Start })
    .addBackground({ color: colors.dark })

    // 装饰性背景圆形
    .addCircle({
      x: '80%',
      y: '20%',
      radius: 300,
      bgcolor: colors.secondary,
      opacity: 0.08,
      duration: 5,
      startTime: 0,
      animations: ['zoomIn'],
    })

    // 标题
    .addText({
      text: '智能 Agent 能力',
      x: '50%',
      y: '18%',
      fontSize: 64,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0,
      animations: ['fadeInUp'],
    });

  // 功能列表
  const capabilities = [
    { text: 'Ambient Agent - 持续运行的环境智能', color: colors.primary },
    { text: '记忆系统 - 跨会话上下文保持', color: colors.accent },
    { text: '流式输出 - 实时可见的思考过程', color: colors.pink },
    { text: '多模型协同 - 发挥各模型特长', color: colors.secondary },
  ];

  capabilities.forEach((f, i) => {
    const y = 35 + i * 14;

    // 功能文字
    scene3.addText({
      text: f.text,
      x: '50%',
      y: `${y}%`,
      fontSize: 44,
      color: f.color,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.3 + i * 0.1,
      animations: ['fadeInUp'],
    });

    // 装饰点
    scene3.addCircle({
      x: '28%',
      y: `${y}%`,
      radius: 8,
      bgcolor: f.color,
      opacity: 0.8,
      duration: 5,
      startTime: 0.4 + i * 0.1,
      animations: ['zoomIn'],
    });

    scene3.addCircle({
      x: '72%',
      y: `${y}%`,
      radius: 8,
      bgcolor: f.color,
      opacity: 0.8,
      duration: 5,
      startTime: 0.4 + i * 0.1,
      animations: ['zoomIn'],
    });
  });

  // ========== 场景4：插件生态系统 ==========
  const scene4Start = scene3Start + 5;
  const scene4 = mainTrack.createScene({ duration: 4, startTime: scene4Start })
    .addBackground({ color: colors.dark })

    // 主标语
    .addText({
      text: '40+ 插件生态',
      x: '50%',
      y: '35%',
      fontSize: 80,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.5,
      animations: ['zoomIn'],
      textShadow: true,
      textShadowColor: colors.accent,
      textShadowBlur: 30,
    })

    // 副标语
    .addText({
      text: '开箱即用 · 自由扩展',
      x: '50%',
      y: '55%',
      fontSize: 48,
      color: colors.accent,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 1,
      animations: ['fadeInUp'],
    });

  // 装饰粒子
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    const size = 2 + Math.random() * 4;

    scene4.addCircle({
      x: x,
      y: y,
      radius: size,
      bgcolor: i % 3 === 0 ? colors.primary : (i % 3 === 1 ? colors.secondary : colors.accent),
      opacity: 0.3 + Math.random() * 0.4,
      duration: 4,
      startTime: i * 0.05,
      animations: ['zoomIn'],
    });
  }

  // ========== 场景5：结束语 ==========
  const scene5Start = scene4Start + 4;
  const scene5 = mainTrack.createScene({ duration: 3, startTime: scene5Start })
    .addBackground({ color: colors.dark })

    // 装饰性大圆形
    .addCircle({
      x: '50%',
      y: '50%',
      radius: 400,
      bgcolor: colors.primary,
      opacity: 0.1,
      duration: 3,
      startTime: 0,
      animations: ['zoomIn'],
    })

    // 主标语
    .addText({
      text: '开始你的 Agent 之旅',
      x: '50%',
      y: '40%',
      fontSize: 72,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 0.5,
      animations: ['zoomIn'],
      textShadow: true,
      textShadowColor: colors.accent,
      textShadowBlur: 30,
    })

    // 网址
    .addText({
      text: 'foliko.com',
      x: '50%',
      y: '58%',
      fontSize: 56,
      color: colors.accent,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 1,
      animations: ['fadeInUp'],
    })

    // 底部版权
    .addText({
      text: '© 2024 Foliko. All rights reserved.',
      x: '50%',
      y: '90%',
      fontSize: 24,
      color: colors.light,
      fontFamily: 'Arial',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.4,
      duration: 3,
      startTime: 1.5,
      animations: ['fadeInUp'],
    });

  // 添加转场效果
  mainTrack.addTransition({ name: 'CrossZoom', duration: 0.8 });
  mainTrack.addTransition({ name: 'Dreamy', duration: 0.8 });
  mainTrack.addTransition({ name: 'GridFlip', duration: 0.8 });
  mainTrack.addTransition({ name: 'CrossZoom', duration: 0.8 });

  // 添加音频（如果存在）
  if (await fs.pathExists(audioFile)) {
    const audioTrack = builder.createTrack({ zIndex: 0 });
    audioTrack.createScene({ duration: totalDuration })
      .addAudio({
        src: audioFile,
        startTime: 0,
        duration: totalDuration,
        volume: 0.7,
      });
  }

  // 构建并导出
  try {
    console.log(`场景时长: ${totalDuration.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(totalDuration * fps)} 帧\n`);

    const resultPath = await builder.render(outputPath);

    console.log(`\n✅ 视频导出成功: ${resultPath}`);
    console.log('\n✨ Foliko.com 宣传视频制作完成！');

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
    throw error;
  }
}

createFolikoPromoVideo().catch(console.error);

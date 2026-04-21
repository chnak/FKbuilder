import { VideoBuilder, getAudioDuration, withContext } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from 'paper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案 - 现代渐变风格
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
 * 主题：现代、简洁、科技感
 */
async function createFolikoPromoVideo() {
  console.log('🎬 Foliko.com 宣传视频生成...\n');

  const name = "foliko-promo";
  const audioFile = path.join(__dirname, `../assets/cotton-clouds.mp3`);
  const outputPath = path.join(__dirname, `../output/${name}.mp4`);

  // 检查音频是否存在，不强求
  let audioDuration = 15; // 默认视频时长
  if (await fs.pathExists(audioFile)) {
    try {
      audioDuration = Number(await getAudioDuration(audioFile)) || 15;
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
  const scene1 = mainTrack.createScene({ duration: 3, startTime: 0 })
    .addBackground({ color: colors.dark })

    // 装饰性圆形光晕
    .addCircle({
      x: '50%',
      y: '50%',
      radius: 200,
      bgcolor: colors.primary,
      opacity: 0.15,
      duration: 3,
      startTime: 0,
      animations: [
        { type: 'scale', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.5, toScaleY: 1.5, duration: 3, easing: 'easeOut' },
        { type: 'fade', fromOpacity: 0, toOpacity: 0.15, duration: 1 },
      ],
      onFrame: withContext((element, event, paperItem) => {
        if (!paperItem) return;
        const time = event.time;
        paperItem.rotation = time * 15;
      }, {}),
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
      duration: 3,
      startTime: 0,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
        { type: 'scale', fromScaleX: 0.8, fromScaleY: 0.8, toScaleX: 1, toScaleY: 1, duration: 1, easing: 'easeOut' },
      ],
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
      duration: 3,
      startTime: 0.3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 1 },
      ],
    })

    // 底部标语
    .addText({
      text: 'Create • Connect • Inspire',
      x: '50%',
      y: '70%',
      fontSize: 36,
      color: colors.light,
      fontFamily: 'Arial',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.6,
      duration: 3,
      startTime: 0.8,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.6, duration: 1.5 },
      ],
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
      duration: 3,
      startTime: i * 0.05,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 0.5 },
        { type: 'scale', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.5, delay: i * 0.05 },
      ],
      onFrame: withContext((element, event, paperItem) => {
        if (!paperItem) return;
        const time = event.time;
        const index = i;
        paperItem.rotation = time * (10 + index * 2);
        const flicker = 0.3 + Math.sin(time * 2 + index) * 0.2;
        paperItem.opacity = flicker;
      }, { i }),
    });
  }

  // ========== 场景2：核心价值展示 ==========
  const scene2Start = 3;
  const scene2 = mainTrack.createScene({ duration: 4, startTime: scene2Start })
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
      duration: 4,
      startTime: 0,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
      ],
    });

  // 三个核心价值卡片
  const values = [
    { icon: '✦', title: '简单高效', desc: '直观的界面设计\n让创作更轻松', color: colors.primary },
    { icon: '◈', title: '创意无限', desc: '丰富的模板和素材\n激发无限灵感', color: colors.secondary },
    { icon: '◇', title: '全球连接', desc: '与世界分享你的作品\n连接每一位创作者', color: colors.accent },
  ];

  values.forEach((v, i) => {
    const x = 25 + i * 25;

    // 卡片背景
    scene2.addRect({
      x: `${x}%`,
      y: '50%',
      width: 420,
      height: 320,
      bgcolor: '#1e293b',
      borderRadius: 24,
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.2 + i * 0.15,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
        { type: 'slide', fromX: 0, fromY: 50, toX: 0, toY: 0, duration: 1, delay: 0.2 + i * 0.15, easing: 'easeOut' },
      ],
      borderWidth: 2,
      borderColor: v.color,
      shadowBlur: 30,
      shadowColor: v.color,
      shadowOffsetY: 0,
      shadowOffsetX: 0,
      opacity: 0.95,
    });

    // 图标
    scene2.addText({
      text: v.icon,
      x: `${x}%`,
      y: '38%',
      fontSize: 80,
      color: v.color,
      fontFamily: 'Arial',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.4 + i * 0.15,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
        { type: 'scale', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.8, delay: 0.4 + i * 0.15, easing: 'easeOut' },
      ],
    });

    // 标题
    scene2.addText({
      text: v.title,
      x: `${x}%`,
      y: '52%',
      fontSize: 44,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.5 + i * 0.15,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8, delay: 0.3 },
      ],
    });

    // 描述
    scene2.addText({
      text: v.desc,
      x: `${x}%`,
      y: '65%',
      fontSize: 28,
      color: colors.light,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.7,
      duration: 4,
      startTime: 0.6 + i * 0.15,
      lineHeight: 1.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.7, duration: 0.8, delay: 0.4 },
      ],
    });
  });

  // ========== 场景3：功能展示 ==========
  const scene3Start = scene2Start + 4;
  const scene3 = mainTrack.createScene({ duration: 4, startTime: scene3Start })
    .addBackground({ color: colors.dark })

    // 装饰性背景圆形
    .addCircle({
      x: '80%',
      y: '20%',
      radius: 300,
      bgcolor: colors.secondary,
      opacity: 0.08,
      duration: 4,
      startTime: 0,
      animations: [
        { type: 'scale', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.2, toScaleY: 1.2, duration: 4, easing: 'easeInOut' },
      ],
    })

    // 标题
    .addText({
      text: '强大功能 · 轻松驾驭',
      x: '50%',
      y: '18%',
      fontSize: 64,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
      ],
    });

  // 功能列表
  const features = [
    { text: '智能模板库', color: colors.primary },
    { text: '实时协作编辑', color: colors.accent },
    { text: '一键发布分享', color: colors.pink },
    { text: '数据分析洞察', color: colors.secondary },
  ];

  features.forEach((f, i) => {
    const y = 35 + i * 15;

    // 功能文字
    scene3.addText({
      text: f.text,
      x: '50%',
      y: `${y}%`,
      fontSize: 48,
      color: f.color,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.3 + i * 0.1,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
        { type: 'slide', fromX: -100, fromY: 0, toX: 0, toY: 0, duration: 0.8, delay: 0.3 + i * 0.1, easing: 'easeOut' },
      ],
    });

    // 装饰点
    scene3.addCircle({
      x: '30%',
      y: `${y}%`,
      radius: 8,
      bgcolor: f.color,
      opacity: 0.8,
      duration: 4,
      startTime: 0.4 + i * 0.1,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
        { type: 'scale', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.5, delay: 0.4 + i * 0.1 },
      ],
    });

    scene3.addCircle({
      x: '70%',
      y: `${y}%`,
      radius: 8,
      bgcolor: f.color,
      opacity: 0.8,
      duration: 4,
      startTime: 0.4 + i * 0.1,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.8, duration: 0.5 },
        { type: 'scale', fromScaleX: 0, fromScaleY: 0, toScaleX: 1, toScaleY: 1, duration: 0.5, delay: 0.4 + i * 0.1 },
      ],
    });
  });

  // ========== 场景4：结束语 ==========
  const scene4Start = scene3Start + 4;
  const scene4 = mainTrack.createScene({ duration: 3, startTime: scene4Start })
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
      animations: [
        { type: 'scale', fromScaleX: 0.3, fromScaleY: 0.3, toScaleX: 1, toScaleY: 1, duration: 2, easing: 'easeOut' },
        { type: 'fade', fromOpacity: 0, toOpacity: 0.1, duration: 1 },
      ],
      onFrame: withContext((element, event, paperItem) => {
        if (!paperItem) return;
        const time = event.time;
        paperItem.rotation = time * 5;
      }, {}),
    })

    // 主标语
    .addText({
      text: '开始你的创意之旅',
      x: '50%',
      y: '40%',
      fontSize: 80,
      color: colors.light,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 3,
      startTime: 0.5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1.5 },
      ],
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
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
      ],
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
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 1 },
      ],
    });

  // 添加转场效果
  mainTrack.addTransition({ name: 'CrossZoom', duration: 0.8 });
  mainTrack.addTransition({ name: 'Dreamy', duration: 0.8 });
  mainTrack.addTransition({ name: 'GridFlip', duration: 0.8 });

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
    const videoMaker = builder.build();

    console.log(`场景时长: ${totalDuration.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(totalDuration * fps)} 帧\n`);

    await videoMaker.export(outputPath, {
      parallel: true,
      usePipe: true,
      maxWorkers: 4,
    });

    console.log(`\n✅ 视频导出成功: ${outputPath}`);
    console.log('\n✨ Foliko.com 宣传视频制作完成！');

    builder.destroy();
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
    builder.destroy();
  }
}

createFolikoPromoVideo().catch(console.error);

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
  orange: '#ff6b35',        // 橙色
  green: '#39ff14',        // 荧光绿
};

/**
 * Foliko.com 超酷炫宣传视频
 */
async function createSuperCoolFolikoVideo() {
  console.log('🎬 Foliko.com 超酷炫宣传视频生成...\n');

  const name = "foliko-super-cool";
  const audioFile = path.join(__dirname, `../assets/cotton-clouds.mp3`);
  const outputPath = path.join(__dirname, `../output/${name}.mp4`);

  let audioDuration = 40;
  if (await fs.pathExists(audioFile)) {
    try {
      audioDuration = Number(await getAudioDuration(audioFile)) || 40;
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
  const totalDuration = Math.min(audioDuration, 40);
  const fps = 30;

  // ========== 场景1：震撼开场 ==========
  const scene1 = mainTrack.createScene({ duration: 5, startTime: 0 })
    .addBackground({ color: colors.dark })

    // 多层光晕背景
    .addCircle({ x: '30%', y: '30%', radius: 350, bgcolor: colors.primary, opacity: 0.08, duration: 5, startTime: 0, animations: ['zoomIn'] })
    .addCircle({ x: '70%', y: '60%', radius: 400, bgcolor: colors.secondary, opacity: 0.06, duration: 5, startTime: 0.2, animations: ['zoomIn'] })
    .addCircle({ x: '50%', y: '50%', radius: 300, bgcolor: colors.purple, opacity: 0.1, duration: 5, startTime: 0.4, animations: ['zoomIn'] })

    // 主标题
    .addText({
      text: 'FOLIKO', x: '50%', y: '40%',
      fontSize: 220, color: colors.light, fontFamily: 'Arial', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 5, startTime: 0,
      animations: ['bigIn'], textShadow: true, textShadowColor: colors.primary, textShadowBlur: 80,
    })

    // .com 特效
    .addText({
      text: '.com', x: '58%', y: '40%', fontSize: 90, color: colors.secondary,
      fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', anchor: [0, 0.5],
      duration: 5, startTime: 0.3, animations: ['fadeInUp'],
    })

    // 底部标语
    .addText({
      text: '简约的插件化 Agent 框架', x: '50%', y: '68%',
      fontSize: 44, color: colors.light, fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      opacity: 0.7, duration: 5, startTime: 0.8, animations: ['fadeInUp'],
    });

  // 粒子圆环
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const radius = 350 + Math.sin(i * 0.3) * 40;
    const x = 960 + Math.cos(angle) * radius;
    const y = 540 + Math.sin(angle) * radius;
    const c = [colors.primary, colors.secondary, colors.accent, colors.purple, colors.cyan][i % 5];

    scene1.addCircle({
      x, y, radius: 2 + Math.random() * 4, bgcolor: c, opacity: 0.5,
      duration: 5, startTime: i * 0.03,
      animations: ['zoomIn'],
      onFrame: withContext((el, ev, item) => {
        if (!item) return;
        item.opacity = 0.2 + Math.sin(ev.time * 4 + i * 0.2) * 0.4;
        item.rotation = ev.time * (15 + i * 2);
      }, { i }),
    });
  }

  // ========== 场景2：为什么选择 ==========
  const scene2Start = 5;
  const scene2 = mainTrack.createScene({ duration: 6, startTime: scene2Start })
    .addBackground({ color: colors.darkBlue })

    // 背景装饰
    .addCircle({ x: '20%', y: '20%', radius: 250, bgcolor: colors.accent, opacity: 0.05, duration: 6, startTime: 0, animations: ['zoomIn'] })
    .addCircle({ x: '80%', y: '80%', radius: 300, bgcolor: colors.pink, opacity: 0.05, duration: 6, startTime: 0.3, animations: ['zoomIn'] })

    // 标题
    .addText({
      text: '为什么选择 Foliko?', x: '50%', y: '10%',
      fontSize: 72, color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 6, startTime: 0, animations: ['fadeInUp'],
    });

  // 四个价值卡片
  const values = [
    { icon: '✨', title: '简单高效', desc: '直观的接口\n让创作更轻松', color: colors.primary, x: 18 },
    { icon: '🚀', title: '创意无限', desc: '丰富的插件\n激发无限灵感', color: colors.secondary, x: 42 },
    { icon: '🌐', title: '全球连接', desc: '与世界分享\n连接每位创作者', color: colors.cyan, x: 66 },
    { icon: '🔓', title: '开放生态', desc: '开源可扩展\n共建未来', color: colors.green, x: 82 },
  ];

  values.forEach((v, i) => {
    // 卡片背景
    scene2.addRect({
      x: `${v.x}%`, y: '52%', width: 340, height: 280,
      bgcolor: '#1a1a2e', borderRadius: 24, anchor: [0.5, 0.5],
      duration: 6, startTime: 0.2 + i * 0.12, animations: ['fadeInUp'],
      borderWidth: 2, borderColor: v.color, shadowBlur: 30, shadowColor: v.color,
      shadowOffsetX: 0, shadowOffsetY: 0, opacity: 0.9,
    });

    // 顶部装饰线
    scene2.addRect({
      x: `${v.x}%`, y: '37%', width: 80, height: 4,
      bgcolor: v.color, borderRadius: 2, anchor: [0.5, 0.5],
      duration: 6, startTime: 0.3 + i * 0.12, animations: ['zoomIn'],
    });

    // 图标
    scene2.addText({
      text: v.icon, x: `${v.x}%`, y: '44%',
      fontSize: 70, color: v.color, fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.35 + i * 0.12, animations: ['zoomIn'],
    });

    // 标题
    scene2.addText({
      text: v.title, x: `${v.x}%`, y: '58%', fontSize: 40,
      color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 6, startTime: 0.45 + i * 0.12, animations: ['fadeInUp'],
    });

    // 描述
    scene2.addText({
      text: v.desc, x: `${v.x}%`, y: '70%', fontSize: 26,
      color: colors.light, fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      opacity: 0.65, duration: 6, startTime: 0.55 + i * 0.12, animations: ['fadeInUp'],
    });
  });

  // ========== 场景3：核心特性 ==========
  const scene3Start = scene2Start + 6;
  const scene3 = mainTrack.createScene({ duration: 7, startTime: scene3Start })
    .addBackground({ color: colors.dark })

    // 多层背景圆
    .addCircle({ x: '50%', y: '50%', radius: 450, bgcolor: colors.purple, opacity: 0.07, duration: 7, startTime: 0, animations: ['zoomIn'] })
    .addCircle({ x: '30%', y: '50%', radius: 200, bgcolor: colors.primary, opacity: 0.05, duration: 7, startTime: 0.2, animations: ['zoomIn'] })
    .addCircle({ x: '70%', y: '50%', radius: 200, bgcolor: colors.secondary, opacity: 0.05, duration: 7, startTime: 0.4, animations: ['zoomIn'] })

    // 标题
    .addText({
      text: '核心特性', x: '50%', y: '10%',
      fontSize: 80, color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 7, startTime: 0, animations: ['fadeInUp'],
    });

  // 八个特性 - 双行布局
  const features = [
    { icon: '🔌', title: '插件系统', desc: '模块化架构，灵活扩展', color: colors.primary },
    { icon: '🤖', title: '多 AI 支持', desc: 'OpenAI / Anthropic / 本地模型', color: colors.secondary },
    { icon: '⚡', title: '流式输出', desc: '实时可见的思考过程', color: colors.accent },
    { icon: '🌐', title: '子 Agent', desc: '并行处理，效率倍增', color: colors.cyan },
    { icon: '📝', title: '记忆系统', desc: '跨会话上下文保持', color: colors.purple },
    { icon: '🔄', title: '多模型协同', desc: '发挥各模型特长', color: colors.pink },
    { icon: '💬', title: '对话管理', desc: '灵活对话流程控制', color: colors.orange },
    { icon: '🔧', title: '工具调用', desc: '无缝接入外部工具', color: colors.green },
  ];

  features.forEach((f, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 12 + col * 24;
    const y = 28 + row * 38;

    // 特性卡片
    scene3.addRect({
      x: `${x}%`, y: `${y}%`, width: 280, height: 120,
      bgcolor: '#151520', borderRadius: 16, anchor: [0.5, 0.5],
      duration: 7, startTime: 0.15 + i * 0.08, animations: ['fadeInUp'],
      borderWidth: 1, borderColor: f.color, opacity: 0.85,
    });

    // 图标
    scene3.addText({
      text: f.icon, x: `${x - 4}%`, y: `${y}%`,
      fontSize: 44, color: f.color, fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 7, startTime: 0.25 + i * 0.08, animations: ['zoomIn'],
    });

    // 标题
    scene3.addText({
      text: f.title, x: `${x + 4}%`, y: `${y - 5}%`, fontSize: 32,
      color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 7, startTime: 0.35 + i * 0.08, animations: ['fadeInUp'],
    });

    // 描述
    scene3.addText({
      text: f.desc, x: `${x + 4}%`, y: `${y + 8}%`, fontSize: 20,
      color: colors.light, fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      opacity: 0.55, duration: 7, startTime: 0.45 + i * 0.08, animations: ['fadeInUp'],
    });
  });

  // ========== 场景4：Ambient Agent ==========
  const scene4Start = scene3Start + 7;
  const scene4 = mainTrack.createScene({ duration: 6, startTime: scene4Start })
    .addBackground({ color: colors.darkBlue })

    // 背景装饰 - 模拟脑神经网络的圆点
    .addCircle({ x: '50%', y: '50%', radius: 400, bgcolor: colors.cyan, opacity: 0.04, duration: 6, startTime: 0, animations: ['zoomIn'] })
    .addCircle({ x: '50%', y: '50%', radius: 550, bgcolor: colors.purple, opacity: 0.03, duration: 6, startTime: 0.3, animations: ['zoomIn'] })

    // 标题
    .addText({
      text: 'Ambient Agent', x: '50%', y: '12%',
      fontSize: 72, color: colors.cyan, fontFamily: 'Arial', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 6, startTime: 0, animations: ['fadeInUp'],
      textShadow: true, textShadowColor: colors.cyan, textShadowBlur: 40,
    })

    // 副标题
    .addText({
      text: '持续运行的环境智能', x: '50%', y: '22%',
      fontSize: 36, color: colors.light, fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      opacity: 0.7, duration: 6, startTime: 0.3, animations: ['fadeInUp'],
    });

  // Ambient Agent 示意图 - 中心 Agent
  scene4.addCircle({
    x: '50%', y: '55%', radius: 80,
    bgcolor: colors.cyan, opacity: 0.2, duration: 6, startTime: 0.5, animations: ['zoomIn'],
    onFrame: withContext((el, ev, item) => {
      if (!item) return;
      item.opacity = 0.15 + Math.sin(ev.time * 2) * 0.1;
    }, {}),
  });
  scene4.addText({
    text: '🤖', x: '50%', y: '55%', fontSize: 64, color: colors.light,
    fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5], duration: 6, startTime: 0.6, animations: ['zoomIn'],
  });

  // 周围的交互节点
  const nodes = [
    { icon: '💻', label: '代码', angle: 0, color: colors.primary },
    { icon: '📄', label: '文档', angle: 60, color: colors.secondary },
    { icon: '🌐', label: '网络', angle: 120, color: colors.accent },
    { icon: '📊', label: '数据', angle: 180, color: colors.pink },
    { icon: '🔧', label: '工具', angle: 240, color: colors.orange },
    { icon: '💬', label: '对话', angle: 300, color: colors.green },
  ];

  nodes.forEach((n, i) => {
    const angleRad = (n.angle * Math.PI) / 180;
    const radius = 220;
    const x = 960 + Math.cos(angleRad) * radius;
    const y = 540 + Math.sin(angleRad) * radius;

    // 连接线
    scene4.addCircle({
      x, y, radius: 45, bgcolor: n.color, opacity: 0.1,
      duration: 6, startTime: 0.7 + i * 0.1, animations: ['zoomIn'],
    });
    scene4.addText({
      text: n.icon, x, y, fontSize: 40, color: n.color,
      fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.8 + i * 0.1, animations: ['zoomIn'],
    });
    scene4.addText({
      text: n.label, x, y: y + 65, fontSize: 22, color: colors.light,
      fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5], opacity: 0.6,
      duration: 6, startTime: 0.9 + i * 0.1, animations: ['fadeInUp'],
    });
  });

  // ========== 场景5：记忆系统 ==========
  const scene5Start = scene4Start + 6;
  const scene5 = mainTrack.createScene({ duration: 5, startTime: scene5Start })
    .addBackground({ color: colors.dark })

    // 背景
    .addCircle({ x: '50%', y: '50%', radius: 400, bgcolor: colors.purple, opacity: 0.08, duration: 5, startTime: 0, animations: ['zoomIn'] })

    // 标题
    .addText({
      text: '智能记忆系统', x: '50%', y: '15%',
      fontSize: 72, color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 5, startTime: 0, animations: ['fadeInUp'],
      textShadow: true, textShadowColor: colors.purple, textShadowBlur: 40,
    });

  // 记忆层级图示
  const memLevels = [
    { icon: '🔥', title: '短期记忆', desc: '当前会话上下文', color: colors.secondary, y: 35 },
    { icon: '💾', title: '长期记忆', desc: '跨会话知识积累', color: colors.primary, y: 52 },
    { icon: '🧠', title: '向量记忆', desc: '语义相似性检索', color: colors.cyan, y: 69 },
  ];

  memLevels.forEach((m, i) => {
    // 记忆卡片
    scene5.addRect({
      x: '50%', y: `${m.y}%`, width: 500, height: 100,
      bgcolor: '#1a1a2e', borderRadius: 20, anchor: [0.5, 0.5],
      duration: 5, startTime: 0.3 + i * 0.15, animations: ['fadeInUp'],
      borderWidth: 2, borderColor: m.color, shadowBlur: 20, shadowColor: m.color,
    });

    // 图标
    scene5.addText({
      text: m.icon, x: '30%', y: `${m.y}%`, fontSize: 50, color: m.color,
      fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 5, startTime: 0.4 + i * 0.15, animations: ['zoomIn'],
    });

    // 标题
    scene5.addText({
      text: m.title, x: '50%', y: `${m.y - 3}%`, fontSize: 36, color: colors.light,
      fontFamily: '微软雅黑', fontWeight: 'bold', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 5, startTime: 0.5 + i * 0.15, animations: ['fadeInUp'],
    });

    // 描述
    scene5.addText({
      text: m.desc, x: '50%', y: `${m.y + 8}%`, fontSize: 24, color: colors.light,
      fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5], opacity: 0.6,
      duration: 5, startTime: 0.6 + i * 0.15, animations: ['fadeInUp'],
    });
  });

  // ========== 场景6：插件生态 ==========
  const scene6Start = scene5Start + 5;
  const scene6 = mainTrack.createScene({ duration: 6, startTime: scene6Start })
    .addBackground({ color: colors.darkBlue })

    // 多层背景
    .addCircle({ x: '50%', y: '50%', radius: 450, bgcolor: colors.pink, opacity: 0.06, duration: 6, startTime: 0, animations: ['zoomIn'] })
    .addCircle({ x: '30%', y: '30%', radius: 200, bgcolor: colors.accent, opacity: 0.04, duration: 6, startTime: 0.2, animations: ['zoomIn'] })
    .addCircle({ x: '70%', y: '70%', radius: 200, bgcolor: colors.primary, opacity: 0.04, duration: 6, startTime: 0.4, animations: ['zoomIn'] })

    // 大数字
    .addText({
      text: '40+', x: '50%', y: '28%',
      fontSize: 300, color: colors.primary, fontFamily: 'Arial', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 6, startTime: 0.2, animations: ['bigIn'],
      textShadow: true, textShadowColor: colors.secondary, textShadowBlur: 100,
    })

    // 副标题
    .addText({
      text: '插件生态', x: '50%', y: '52%',
      fontSize: 100, color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 6, startTime: 0.8, animations: ['fadeInUp'],
    })

    // 标签
    .addText({
      text: '开箱即用 · 自由扩展 · 持续更新', x: '50%', y: '68%',
      fontSize: 36, color: colors.accent, fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 1.2, animations: ['fadeInUp'],
    });

  // 插件图标展示
  const pluginIcons = ['📦', '🎨', '🌐', '🔍', '📊', '🔐', '📱', '🤝', '⚙️', '📈', '🛠️', '🔮', '📝', '🎭', '💾', '🌟'];
  pluginIcons.forEach((icon, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);
    const x = 18 + col * 10;
    const y = 78 + row * 12;

    scene6.addText({
      text: icon, x: `${x}%`, y: `${y}%`, fontSize: 40, color: colors.light,
      fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 6, startTime: 0.4 + i * 0.05, animations: ['zoomIn'],
    });
  });

  // ========== 场景7：多 AI 支持 ==========
  const scene7Start = scene6Start + 6;
  const scene7 = mainTrack.createScene({ duration: 5, startTime: scene7Start })
    .addBackground({ color: colors.dark })

    // 标题
    .addText({
      text: '多 AI 模型支持', x: '50%', y: '12%',
      fontSize: 72, color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 5, startTime: 0, animations: ['fadeInUp'],
    });

  // AI 模型展示
  const aiModels = [
    { icon: '🤖', name: 'OpenAI', sub: 'GPT-4 / GPT-3.5', color: colors.primary },
    { icon: '🧠', name: 'Anthropic', sub: 'Claude 3 / Claude 2', color: colors.secondary },
    { icon: '🔥', name: '本地模型', sub: 'LLaMA / Qwen / GLM', color: colors.accent },
    { icon: '🌐', name: '开源模型', sub: '开源可自部署', color: colors.cyan },
  ];

  aiModels.forEach((m, i) => {
    const x = 14 + i * 23;

    // 模型卡片
    scene7.addRect({
      x: `${x}%`, y: '50%', width: 320, height: 260,
      bgcolor: '#1a1a2e', borderRadius: 24, anchor: [0.5, 0.5],
      duration: 5, startTime: 0.2 + i * 0.12, animations: ['fadeInUp'],
      borderWidth: 2, borderColor: m.color, shadowBlur: 25, shadowColor: m.color,
    });

    // 顶部光效
    scene7.addRect({
      x: `${x}%`, y: '36%', width: 100, height: 4,
      bgcolor: m.color, borderRadius: 2, anchor: [0.5, 0.5],
      duration: 5, startTime: 0.3 + i * 0.12, animations: ['zoomIn'],
    });

    // 图标
    scene7.addText({
      text: m.icon, x: `${x}%`, y: '42%', fontSize: 70, color: m.color,
      fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 5, startTime: 0.35 + i * 0.12, animations: ['zoomIn'],
    });

    // 名称
    scene7.addText({
      text: m.name, x: `${x}%`, y: '58%', fontSize: 38, color: colors.light,
      fontFamily: '微软雅黑', fontWeight: 'bold', textAlign: 'center', anchor: [0.5, 0.5],
      duration: 5, startTime: 0.45 + i * 0.12, animations: ['fadeInUp'],
    });

    // 副标题
    scene7.addText({
      text: m.sub, x: `${x}%`, y: '68%', fontSize: 22, color: colors.light,
      fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5], opacity: 0.6,
      duration: 5, startTime: 0.55 + i * 0.12, animations: ['fadeInUp'],
    });
  });

  // ========== 场景8：结尾 ==========
  const scene8Start = scene7Start + 5;
  const scene8 = mainTrack.createScene({ duration: 5, startTime: scene8Start })
    .addBackground({ color: colors.darkBlue })

    // 背景光晕
    .addCircle({ x: '50%', y: '50%', radius: 500, bgcolor: colors.primary, opacity: 0.1, duration: 5, startTime: 0, animations: ['zoomIn'] })
    .addCircle({ x: '50%', y: '50%', radius: 350, bgcolor: colors.secondary, opacity: 0.08, duration: 5, startTime: 0.3, animations: ['zoomIn'] })

    // 主标语
    .addText({
      text: '开始你的 Agent 之旅', x: '50%', y: '32%',
      fontSize: 88, color: colors.light, fontFamily: '微软雅黑', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 5, startTime: 0.5, animations: ['bigIn'],
      textShadow: true, textShadowColor: colors.primary, textShadowBlur: 60,
    })

    // 网址
    .addText({
      text: 'foliko.com', x: '50%', y: '52%',
      fontSize: 80, color: colors.cyan, fontFamily: 'Arial', fontWeight: 'bold',
      textAlign: 'center', anchor: [0.5, 0.5], duration: 5, startTime: 1.2, animations: ['fadeInUp'],
      textShadow: true, textShadowColor: colors.cyan, textShadowBlur: 30,
    })

    // 底部标语
    .addText({
      text: '简约 · 强大 · 可扩展', x: '50%', y: '70%',
      fontSize: 36, color: colors.light, fontFamily: '微软雅黑', textAlign: 'center', anchor: [0.5, 0.5],
      opacity: 0.6, duration: 5, startTime: 1.8, animations: ['fadeInUp'],
    })

    // 版权
    .addText({
      text: '© 2024 Foliko. All rights reserved.', x: '50%', y: '90%', fontSize: 24, color: colors.light,
      fontFamily: 'Arial', textAlign: 'center', anchor: [0.5, 0.5], opacity: 0.4,
      duration: 5, startTime: 2.5, animations: ['fadeInUp'],
    });

  // 结尾粒子雨
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    const size = 1 + Math.random() * 4;
    const c = [colors.primary, colors.secondary, colors.accent, colors.purple, colors.cyan, colors.pink][Math.floor(Math.random() * 6)];

    scene8.addCircle({
      x, y, radius: size, bgcolor: c, opacity: 0.3 + Math.random() * 0.4,
      duration: 5, startTime: i * 0.02,
      animations: ['zoomIn'],
      onFrame: withContext((el, ev, item) => {
        if (!item) return;
        item.opacity = 0.2 + Math.sin(ev.time * 5 + i * 0.3) * 0.3;
      }, { i }),
    });
  }

  // ========== 转场 ==========
  mainTrack.addTransition({ name: 'CrossZoom', duration: 1.0 });
  mainTrack.addTransition({ name: 'Dreamy', duration: 1.0 });
  mainTrack.addTransition({ name: 'GridFlip', duration: 1.0 });
  mainTrack.addTransition({ name: 'CircleOpen', duration: 1.0 });
  mainTrack.addTransition({ name: 'CrossZoom', duration: 1.0 });
  mainTrack.addTransition({ name: 'Dreamy', duration: 1.0 });
  mainTrack.addTransition({ name: 'CrossZoom', duration: 1.0 });

  // ========== 音频 ==========
  if (await fs.pathExists(audioFile)) {
    const audioTrack = builder.createTrack({ zIndex: 0 });
    audioTrack.createScene({ duration: totalDuration })
      .addAudio({ src: audioFile, startTime: 0, duration: totalDuration, volume: 0.5 });
  }

  // ========== 导出 ==========
  try {
    console.log(`场景时长: ${totalDuration.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(totalDuration * fps)} 帧\n`);

    const resultPath = await builder.render(outputPath);

    console.log(`\n✅ 视频导出成功: ${resultPath}`);
    console.log('\n✨ Foliko.com 超酷炫宣传视频制作完成！');

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
    throw error;
  }
}

createSuperCoolFolikoVideo().catch(console.error);

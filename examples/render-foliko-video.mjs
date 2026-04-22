import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFolikoVideo() {
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const transitionDuration = 1;

  // ========== 场景 1: 开场动画 (0s - 4s) ==========
  const scene1 = track.createScene({
    duration: 4,
    startTime: 0,
  })
    .addBackground({ color: '#0a0a0f' })
    .addCircle({ x: '50%', y: '50%', radius: 350, bgcolor: '#6366f1', opacity: 0.08, animations: ['zoomIn'] })
    .addCircle({ x: '50%', y: '50%', radius: 200, bgcolor: '#8b5cf6', opacity: 0.12, animations: ['zoomIn'] })
    .addText({
      text: 'FOLIKO',
      x: '50%', y: '45%',
      fontSize: 180, fontFamily: '微软雅黑', fontWeight: 'bold',
      color: '#ffffff', textAlign: 'center', textBaseline: 'middle',
      animations: ['bigIn'],
      textShadow: true, textShadowColor: '#6366f1', textShadowBlur: 80,
      gradient: true, gradientColors: ['#6366f1', '#8b5cf6', '#a78bfa'], gradientDirection: 'horizontal'
    })
    .addText({
      text: 'v2.0 发布 · 全新 Ambient Agent',
      x: '50%', y: '60%', fontSize: 36, fontFamily: '微软雅黑', color: '#a78bfa',
      textAlign: 'center', animations: ['fadeInUp'], duration: 2, startTime: 1.5
    });

  currentTime += 4;

  // ========== 场景 2: 主标语 (4s - 9s) ==========
  const scene2Start = currentTime;
  const scene2 = track.createScene({
    duration: 5,
    startTime: scene2Start,
  })
    .addBackground({ color: '#0a0a0f' })
    .addRect({
      x: '50%', y: '50%', width: 1100, height: 520,
      bgcolor: '#1a1a2e', borderRadius: 30, borderWidth: 2, borderColor: '#6366f1',
      opacity: 0.85, animations: ['fadeIn'], shadowBlur: 30, shadowColor: '#6366f1'
    })
    .addText({ text: '轻松构建智能 Agent', x: '50%', y: '22%', fontSize: 64, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeInUp'] })
    .addText({ text: '纯 JavaScript 开发的简约插件化 Agent 框架', x: '50%', y: '35%', fontSize: 28, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeInUp'], duration: 2, startTime: 0.5 })
    .addText({ text: '支持多 AI · 流式输出 · 子 Agent 系统', x: '50%', y: '48%', fontSize: 26, fontFamily: '微软雅黑', color: '#8b5cf6', textAlign: 'center', animations: ['fadeInUp'], duration: 2, startTime: 1 })
    .addText({ text: '40+ 内置插件 · 开箱即用', x: '50%', y: '58%', fontSize: 26, fontFamily: '微软雅黑', color: '#a78bfa', textAlign: 'center', animations: ['fadeInUp'], duration: 2, startTime: 1.3 })
    .addRect({ x: '38%', y: '75%', width: 240, height: 55, bgcolor: '#6366f1', borderRadius: 27, animations: ['fadeInUp'], duration: 2, startTime: 1.8 })
    .addText({ text: 'Windows', x: '38%', y: '75%', fontSize: 20, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', textBaseline: 'middle', animations: ['fadeInUp'], duration: 2, startTime: 1.8 })
    .addRect({ x: '50%', y: '75%', width: 240, height: 55, bgcolor: '#1e1b4b', borderRadius: 27, borderWidth: 1, borderColor: '#8b5cf6', animations: ['fadeInUp'], duration: 2, startTime: 2 })
    .addText({ text: 'Mac / Linux', x: '50%', y: '75%', fontSize: 20, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', textBaseline: 'middle', animations: ['fadeInUp'], duration: 2, startTime: 2 })
    .addRect({ x: '62%', y: '75%', width: 240, height: 55, bgcolor: '#1e1b4b', borderRadius: 27, borderWidth: 1, borderColor: '#8b5cf6', animations: ['fadeInUp'], duration: 2, startTime: 2.2 })
    .addText({ text: 'npm', x: '62%', y: '75%', fontSize: 20, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', textBaseline: 'middle', animations: ['fadeInUp'], duration: 2, startTime: 2.2 });

  // 添加转场 1 (CrossZoom)
  track.addTransition({ name: 'CrossZoom', duration: transitionDuration, startTime: scene2Start });

  currentTime += 5;

  // ========== 场景 3: 数据展示 (8s - 12s) ==========
  const scene3Start = currentTime;
  const scene3 = track.createScene({
    duration: 4,
    startTime: scene3Start,
  })
    .addBackground({ color: '#0a0a0f' })
    .addRect({ x: '14%', y: '25%', width: 280, height: 160, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 2, borderColor: '#6366f1', opacity: 0.9, animations: ['zoomIn'], startTime: 0.3, shadowBlur: 20, shadowColor: '#6366f1' })
    .addText({ text: '40+', x: '14%', y: '33%', fontSize: 64, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#8b5cf6', textAlign: 'center', animations: ['fadeIn'], startTime: 0.5 })
    .addText({ text: '插件', x: '14%', y: '45%', fontSize: 24, fontFamily: '微软雅黑', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 0.6 })
    .addRect({ x: '38%', y: '25%', width: 280, height: 160, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 2, borderColor: '#8b5cf6', opacity: 0.9, animations: ['zoomIn'], startTime: 0.5, shadowBlur: 20, shadowColor: '#8b5cf6' })
    .addText({ text: '5+', x: '38%', y: '33%', fontSize: 64, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#a78bfa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.7 })
    .addText({ text: 'AI 提供商', x: '38%', y: '45%', fontSize: 24, fontFamily: '微软雅黑', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 0.8 })
    .addRect({ x: '62%', y: '25%', width: 280, height: 160, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 2, borderColor: '#a78bfa', opacity: 0.9, animations: ['zoomIn'], startTime: 0.7, shadowBlur: 20, shadowColor: '#a78bfa' })
    .addText({ text: '100%', x: '62%', y: '33%', fontSize: 64, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#c4b5fd', textAlign: 'center', animations: ['fadeIn'], startTime: 0.9 })
    .addText({ text: '纯 JavaScript', x: '62%', y: '45%', fontSize: 24, fontFamily: '微软雅黑', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 1 })
    .addRect({ x: '86%', y: '25%', width: 280, height: 160, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 2, borderColor: '#c4b5fd', opacity: 0.9, animations: ['zoomIn'], startTime: 0.9, shadowBlur: 20, shadowColor: '#c4b5fd' })
    .addText({ text: 'MIT', x: '86%', y: '33%', fontSize: 64, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#e0e7ff', textAlign: 'center', animations: ['fadeIn'], startTime: 1.1 })
    .addText({ text: '开源协议', x: '86%', y: '45%', fontSize: 24, fontFamily: '微软雅黑', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 1.2 });

  track.addTransition({ name: 'fade', duration: transitionDuration, startTime: scene3Start });

  currentTime += 4;

  // ========== 场景 4: 核心特性上 (12s - 16s) ==========
  const scene4Start = currentTime;
  const scene4 = track.createScene({
    duration: 4,
    startTime: scene4Start,
  })
    .addBackground({ color: '#0a0a0f' })
    .addText({ text: '核心特性', x: '50%', y: '10%', fontSize: 48, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeInDown'] })
    .addRect({ x: '18%', y: '28%', width: 380, height: 200, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 1, borderColor: '#6366f1', opacity: 0.9, animations: ['zoomIn'], startTime: 0.3 })
    .addText({ text: '插件系统', x: '18%', y: '36%', fontSize: 28, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 0.5 })
    .addText({ text: '可扩展的插件架构\n40+ 内置插件', x: '18%', y: '48%', fontSize: 16, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.7 })
    .addRect({ x: '50%', y: '28%', width: 380, height: 200, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 1, borderColor: '#8b5cf6', opacity: 0.9, animations: ['zoomIn'], startTime: 0.6 })
    .addText({ text: '多 AI 支持', x: '50%', y: '36%', fontSize: 28, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 0.8 })
    .addText({ text: 'Anthropic · DeepSeek\nMiniMax · OpenAI', x: '50%', y: '48%', fontSize: 16, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 1 })
    .addRect({ x: '82%', y: '28%', width: 380, height: 200, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 1, borderColor: '#a78bfa', opacity: 0.9, animations: ['zoomIn'], startTime: 0.9 })
    .addText({ text: '流式输出', x: '82%', y: '36%', fontSize: 28, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 1.1 })
    .addText({ text: '实时流式响应\n即时反馈', x: '82%', y: '48%', fontSize: 16, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 1.3 });

  track.addTransition({ name: 'fade', duration: transitionDuration, startTime: scene4Start });

  currentTime += 4;

  // ========== 场景 5: 核心特性下 (16s - 20s) ==========
  const scene5Start = currentTime;
  const scene5 = track.createScene({
    duration: 4,
    startTime: scene5Start,
  })
    .addBackground({ color: '#0a0a0f' })
    .addRect({ x: '18%', y: '25%', width: 380, height: 180, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 1, borderColor: '#a78bfa', opacity: 0.9, animations: ['zoomIn'], startTime: 0.3 })
    .addText({ text: '子 Agent 系统', x: '18%', y: '33%', fontSize: 28, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 0.5 })
    .addText({ text: '创建层级式 Agent 结构', x: '18%', y: '45%', fontSize: 16, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.7 })
    .addRect({ x: '50%', y: '25%', width: 380, height: 180, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 1, borderColor: '#c4b5fd', opacity: 0.9, animations: ['zoomIn'], startTime: 0.6 })
    .addText({ text: 'Ambient Agent', x: '50%', y: '33%', fontSize: 28, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 0.8 })
    .addText({ text: '持续后台运行的 Agent', x: '50%', y: '45%', fontSize: 16, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 1 })
    .addRect({ x: '82%', y: '25%', width: 380, height: 180, bgcolor: '#1e1b4b', borderRadius: 20, borderWidth: 1, borderColor: '#e0e7ff', opacity: 0.9, animations: ['zoomIn'], startTime: 0.9 })
    .addText({ text: '记忆系统', x: '82%', y: '33%', fontSize: 28, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeIn'], startTime: 1.1 })
    .addText({ text: '持久化对话历史', x: '82%', y: '45%', fontSize: 16, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 1.3 });

  track.addTransition({ name: 'fade', duration: transitionDuration, startTime: scene5Start });

  currentTime += 4;

  // ========== 场景 6: 快速开始 (20s - 25s) ==========
  const scene6Start = currentTime;
  const scene6 = track.createScene({
    duration: 5,
    startTime: scene6Start,
  })
    .addBackground({ color: '#0a0a0f' })
    .addText({ text: '快速开始', x: '50%', y: '10%', fontSize: 48, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeInDown'] })
    .addRect({ x: '50%', y: '28%', width: 850, height: 80, bgcolor: '#1e1b4b', borderRadius: 15, borderWidth: 2, borderColor: '#6366f1', opacity: 0.9, animations: ['fadeIn'], startTime: 0.3, shadowBlur: 15, shadowColor: '#6366f1' })
    .addText({ text: 'npm install -g foliko', x: '50%', y: '28%', fontSize: 28, fontFamily: 'Consolas', color: '#22c55e', textAlign: 'center', textBaseline: 'middle', animations: ['fadeIn'], startTime: 0.5 })
    .addRect({ x: '50%', y: '48%', width: 850, height: 140, bgcolor: '#1e1b4b', borderRadius: 15, borderWidth: 2, borderColor: '#8b5cf6', opacity: 0.9, animations: ['fadeIn'], startTime: 0.8, shadowBlur: 15, shadowColor: '#8b5cf6' })
    .addCode({
      code: "const { Framework } = require('foliko')\nconst framework = new Framework()\nframework.loadPlugin('ai')\nconst agent = framework.createAgent()\nconst result = await agent.chat('你好')",
      language: 'javascript', theme: 'dark',
      x: '50%', y: '48%', width: 750, height: 120, fontSize: 20,
      showLineNumbers: false, showBorder: false, bgcolor: 'transparent',
      animations: ['fadeIn'], startTime: 1
    })
    .addText({ text: '几分钟内快速上手', x: '50%', y: '78%', fontSize: 28, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeInUp'], startTime: 1.5 });

  track.addTransition({ name: 'fade', duration: transitionDuration, startTime: scene6Start });

  currentTime += 5;

  // ========== 场景 7: 40+ 插件生态 (25s - 29s) ==========
  const scene7Start = currentTime;
  const scene7 = track.createScene({
    duration: 4,
    startTime: scene7Start,
  })
    .addBackground({ color: '#0a0a0f' })
    .addText({ text: '40+ 插件生态', x: '50%', y: '8%', fontSize: 44, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeInDown'] })
    .addRect({ x: '12%', y: '25%', width: 240, height: 130, bgcolor: '#1e1b4b', borderRadius: 15, borderWidth: 1, borderColor: '#6366f1', opacity: 0.85, animations: ['zoomIn'], startTime: 0.3 })
    .addText({ text: '核心系统', x: '12%', y: '32%', fontSize: 20, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#8b5cf6', textAlign: 'center', animations: ['fadeIn'], startTime: 0.5 })
    .addText({ text: 'ai · session\nstorage · scheduler', x: '12%', y: '45%', fontSize: 14, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.6 })
    .addRect({ x: '33%', y: '25%', width: 240, height: 130, bgcolor: '#1e1b4b', borderRadius: 15, borderWidth: 1, borderColor: '#8b5cf6', opacity: 0.85, animations: ['zoomIn'], startTime: 0.4 })
    .addText({ text: '执行工具', x: '33%', y: '32%', fontSize: 20, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#a78bfa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.6 })
    .addText({ text: 'shell · python\nmcp · file-system', x: '33%', y: '45%', fontSize: 14, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.7 })
    .addRect({ x: '54%', y: '25%', width: 240, height: 130, bgcolor: '#1e1b4b', borderRadius: 15, borderWidth: 1, borderColor: '#a78bfa', opacity: 0.85, animations: ['zoomIn'], startTime: 0.5 })
    .addText({ text: '即时通讯', x: '54%', y: '32%', fontSize: 20, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#c4b5fd', textAlign: 'center', animations: ['fadeIn'], startTime: 0.7 })
    .addText({ text: 'telegram · feishu\nweixin · email', x: '54%', y: '45%', fontSize: 14, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.8 })
    .addRect({ x: '75%', y: '25%', width: 240, height: 130, bgcolor: '#1e1b4b', borderRadius: 15, borderWidth: 1, borderColor: '#c4b5fd', opacity: 0.85, animations: ['zoomIn'], startTime: 0.6 })
    .addText({ text: '智能代理', x: '75%', y: '32%', fontSize: 20, fontFamily: '微软雅黑', fontWeight: 'bold', color: '#e0e7ff', textAlign: 'center', animations: ['fadeIn'], startTime: 0.8 })
    .addText({ text: 'subagent · ambient\nthink · memory', x: '75%', y: '45%', fontSize: 14, fontFamily: '微软雅黑', color: '#a1a1aa', textAlign: 'center', animations: ['fadeIn'], startTime: 0.9 });

  // 最后一个场景不需要转场

  // ========== 音频轨道 ==========
  const audioTrack = builder.createTrack({ zIndex: 0 });
  const audioPath = path.resolve(__dirname, '../assets/background-music.mp3');
  audioTrack.createScene({ duration: currentTime })
    .addAudio({
      src: audioPath,
      startTime: 0,
      duration: currentTime,
      volume: 0.4,
      fadeIn: 1,
      fadeOut: 2,
    });

  console.log(`\n📹 渲染配置:`);
  console.log(`   分辨率: 1920 x 1080`);
  console.log(`   时长: ${currentTime}s`);
  console.log(`   场景数: 7`);
  console.log(`   转场数: 6\n`);

  const outputPath = path.resolve(__dirname, '../output/foliko-intro.mp4');
  const result = await builder.render(outputPath, {
    parallel: false,  // 串行模式
    usePipe: true,
  });

  console.log(`\n✅ 渲染完成: ${result}`);
}

createFolikoVideo().catch(console.error);

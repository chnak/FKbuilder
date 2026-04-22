/**
 * Foliko 宣传视频 - 简洁版
 * 使用 foliko-promo-video.js 的转场方式（不指定 startTime）
 */

import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFolikoVideo() {
  const builder = new VideoBuilder({
    width: 1280,
    height: 720,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // ========== 场景 1: 标题 (0s - 3s) ==========
  const scene1 = track.createScene({ duration: 3, startTime: 0 });
  scene1
    .addBackground({ color: '#0f0f23' })
    .addText({
      text: 'FOLIKO',
      x: '50%', y: '40%',
      fontSize: 120, fontFamily: 'Arial Black', fontWeight: 'bold',
      color: '#ffffff', textAlign: 'center', textBaseline: 'middle',
      duration: 3,
      animations: ['zoomIn'],
      textShadow: true, textShadowColor: '#6366f1', textShadowBlur: 30,
    })
    .addText({
      text: '智能 Agent 开发框架',
      x: '50%', y: '60%',
      fontSize: 32, fontFamily: 'Microsoft YaHei',
      color: '#a78bfa', textAlign: 'center',
      duration: 2,
      startTime: 1,
    });

  // ========== 场景 2: 特性展示 (3s - 6s) ==========
  const scene2 = track.createScene({ duration: 3, startTime: 3 });
  scene2
    .addBackground({ color: '#1a1a2e' })
    .addText({ text: '40+ 插件', x: '50%', y: '30%', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', color: '#8b5cf6', textAlign: 'center', animations: ['fadeInUp'], duration: 3 })
    .addText({ text: '5+ AI 提供商', x: '50%', y: '50%', fontSize: 36, fontFamily: 'Arial', color: '#a78bfa', textAlign: 'center', animations: ['fadeInUp'], duration: 3, startTime: 0.5 })
    .addText({ text: '纯 JavaScript', x: '50%', y: '70%', fontSize: 36, fontFamily: 'Arial', color: '#c4b5fd', textAlign: 'center', animations: ['fadeInUp'], duration: 3, startTime: 1 });

  // ========== 场景 3: 快速开始 (6s - 9s) ==========
  const scene3 = track.createScene({ duration: 3, startTime: 6 });
  scene3
    .addBackground({ color: '#0f0f23' })
    .addText({ text: '快速开始', x: '50%', y: '25%', fontSize: 48, fontFamily: 'Microsoft YaHei', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['fadeInDown'], duration: 3 })
    .addRect({ x: '50%', y: '50%', width: 600, height: 60, bgcolor: '#1e1b4b', borderRadius: 10, borderWidth: 2, borderColor: '#22c55e', animations: ['fadeIn'], duration: 3, startTime: 0.5 })
    .addText({ text: 'npm install -g foliko', x: '50%', y: '50%', fontSize: 24, fontFamily: 'Consolas', color: '#22c55e', textAlign: 'center', textBaseline: 'middle', animations: ['fadeIn'], duration: 3, startTime: 0.5 })
    .addText({ text: '几分钟内快速上手', x: '50%', y: '75%', fontSize: 28, fontFamily: 'Microsoft YaHei', color: '#a1a1aa', textAlign: 'center', animations: ['fadeInUp'], duration: 3, startTime: 1.5 });

  // ========== 场景 4: 开源 (9s - 12s) ==========
  const scene4 = track.createScene({ duration: 3, startTime: 9 });
  scene4
    .addBackground({ color: '#1a1a2e' })
    .addText({ text: 'MIT 开源协议', x: '50%', y: '40%', fontSize: 56, fontFamily: 'Arial', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', animations: ['bigIn'], duration: 3 })
    .addText({ text: '完全免费，可商用', x: '50%', y: '60%', fontSize: 32, fontFamily: 'Microsoft YaHei', color: '#a78bfa', textAlign: 'center', animations: ['fadeInUp'], duration: 3, startTime: 1 });

  // 添加转场（不指定 startTime，让系统自动推断）
  track.addTransition({ name: 'CrossZoom', duration: 0.5 });
  track.addTransition({ name: 'Dreamy', duration: 0.5 });
  track.addTransition({ name: 'fade', duration: 0.5 });

  console.log(`\n📹 渲染配置:`);
  console.log(`   分辨率: 1280 x 720`);
  console.log(`   时长: 12s`);
  console.log(`   场景数: 4\n`);

  const outputPath = path.resolve(__dirname, '../output/foliko-simple.mp4');
  const result = await builder.render(outputPath, {
    parallel: false,
    usePipe: true,
  });

  console.log(`\n✅ 渲染完成: ${result}`);
}

createFolikoVideo().catch(console.error);

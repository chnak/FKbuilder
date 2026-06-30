/**
 * HTMLElement keyframe 动画示例
 * 演示: 在节点内使用 CSS @keyframes,FKbuilder 通过 timeMs 注入驱动时间
 *
 * 这种方式适合:
 * - 复杂的 CSS 动画(spin / pulse / bounce / 复杂多步动画)
 * - 减少 JS 端动画计算
 * - 直接复用网页 CSS 动画代码
 */
import { VideoBuilder } from '../src/index.js';
import path from 'path';
import fs from 'fs-extra';

const scene1Html = `
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    @keyframes bar {
      0% { width: 0%; }
      100% { width: 100%; }
    }
    .spinner {
      width: 120px; height: 120px;
      border: 8px solid rgba(255,255,255,0.1);
      border-top-color: #a78bfa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .title {
      font-family: system-ui;
      color: white;
      font-size: 64px;
      font-weight: 800;
      margin-top: 48px;
      animation: pulse 2s ease-in-out infinite;
    }
    .bar-track {
      width: 600px; height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      margin-top: 48px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
      border-radius: 4px;
      animation: bar 4s ease-in-out forwards;
    }
  </style>
  <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at top,#312e81,#1e1b4b);">
    <div class="spinner"></div>
    <div class="title">Loading</div>
    <div class="bar-track"><div class="bar-fill"></div></div>
  </div>
`;

const scene2Html = `
  <style>
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    @keyframes glow {
      0%, 100% { text-shadow: 0 0 20px rgba(168,85,247,0.5); }
      50% { text-shadow: 0 0 60px rgba(168,85,247,1), 0 0 100px rgba(168,85,247,0.5); }
    }
    .a { animation: float 3s ease-in-out infinite; }
    .b { animation: float 3s ease-in-out infinite 0.5s; }
    .c { animation: float 3s ease-in-out infinite 1s; }
    .title {
      font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
      font-size: 96px;
      font-weight: 900;
      color: white;
      animation: glow 2s ease-in-out infinite;
    }
  </style>
  <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 50%,#1c1917,#0c0a09);">
    <div class="title">CSS @keyframes</div>
    <div style="display:flex;gap:24px;margin-top:64px;">
      <div class="a" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f43f5e,#fb7185);"></div>
      <div class="b" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#8b5cf6);"></div>
      <div class="c" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#22d3ee,#06b6d4);"></div>
    </div>
  </div>
`;

async function main() {
  const outDir = path.join(process.cwd(), 'output', 'html-element');
  await fs.ensureDir(outDir);

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

  // 场景 1: 加载动画 (CSS spinner + 进度条)
  builder.createTrack()
    .createScene({ duration: 4 })
      .addBackground({ color: '#1e1b4b' })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: scene1Html,
        duration: 4,
      });

  // 场景 2: 多重文字动画(复杂 keyframe)
  builder.createTrack()
    .createScene({ duration: 4, startTime: 4 })
      .addBackground({ color: '#0c0a09' })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: scene2Html,
        duration: 4,
        fonts: [
          { path: 'C:/Windows/Fonts/msyh.ttc', family: 'Microsoft YaHei' },
          { path: 'C:/Windows/Fonts/simhei.ttf', family: 'SimHei' },
        ],
      });

  const outputPath = path.join(outDir, 'html-keyframes.mp4');
  console.log(`[html-keyframes] 渲染到: ${outputPath}`);
  const t0 = Date.now();
  // 先 build 看下结构
  const vm = builder.build();
  console.log('[html-keyframes] layers:');
  for (const l of vm.layers) {
    console.log('  zIndex:', l.zIndex, 'time:', l.startTime, '->', l.endTime, 'elements:', l.elements.length);
    for (const e of l.elements) {
      console.log('    ', e.constructor.name, 'type:', e.type, 'time:', e.startTime, '->', e.endTime, 'isActive(5):', e.isActiveAtTime?.(5), 'isActive(6):', e.isActiveAtTime?.(6));
    }
  }
  await builder.render(outputPath, { parallel: true });
  console.log(`[html-keyframes] 完成! 耗时 ${((Date.now()-t0)/1000).toFixed(1)}s`);

  builder.destroy();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
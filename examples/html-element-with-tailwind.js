/**
 * HTMLElement + Tailwind CSS 集成示例
 *
 * 演示如何使用预编译的 Tailwind CSS + 自定义 @keyframes 动画
 *
 * 步骤:
 *   1. 安装: npm install -D tailwindcss @tailwindcss/cli
 *   2. 创建 tailwind-input.css:
 *        @import "tailwindcss";
 *   3. 编译: npx tailwindcss build -i tailwind-input.css -o output/tailwind/tailwind.css --minify
 *   4. 运行: node examples/html-element-with-tailwind.js
 */
import { VideoBuilder } from '../src/index.js';
import path from 'path';
import fs from 'fs-extra';

// 读取预编译的 Tailwind CSS（运行前先执行 npx tailwindcss 编译）
// 如果文件不存在，程序会提示并退出
const tailwindCssPath = path.join(process.cwd(), 'output', 'tailwind', 'tailwind.css');
const tailwindCss = fs.existsSync(tailwindCssPath)
  ? fs.readFileSync(tailwindCssPath, 'utf8')
  : '/* 请先运行: npx tailwindcss -i input.css -o output/tailwind/tailwind.css --minify */';

async function main() {
  const outDir = path.join(process.cwd(), 'output', 'html-tailwind');
  await fs.ensureDir(outDir);

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

  // ============ Scene 1: Tailwind 基础样式 ============
  const scene1Html = `
<style>${tailwindCss}</style>
<style>
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }
  .fade-in-up { animation: fadeInUp 1s ease-out forwards; }
  .scale-in { animation: scaleIn 0.6s ease-out forwards; }
</style>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
  <div class="text-center space-y-8 px-8">
    <div class="inline-block px-4 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm font-semibold scale-in">
      ✨ FKbuilder + Tailwind
    </div>
    <h1 class="text-8xl font-black text-white fade-in-up">
      <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
        渐变文字
      </span>
    </h1>
    <p class="text-xl text-slate-300 max-w-2xl mx-auto fade-in-up" style="animation-delay: 0.3s;">
      完整的 Tailwind 工具类 + 自定义 @keyframes 动画，所有样式在视频中完美呈现
    </p>
    <div class="flex gap-4 justify-center fade-in-up" style="animation-delay: 0.6s;">
      <button class="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold shadow-lg">
        主要按钮
      </button>
      <button class="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold border border-white/20">
        次要按钮
      </button>
    </div>
  </div>
</div>
`;

  builder.createTrack()
    .createScene({ duration: 4 })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: scene1Html,
        duration: 4,
      });

  // ============ Scene 2: Tailwind + 复杂动画 ============
  const scene2Html = `
<style>${tailwindCss}</style>
<style>
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-30px); }
  }
  @keyframes glow {
    0%, 100% { text-shadow: 0 0 20px rgba(168,85,247,0.5); }
    50% { text-shadow: 0 0 60px rgba(168,85,247,1), 0 0 100px rgba(168,85,247,0.5); }
  }
  @keyframes slideRight {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .float { animation: float 3s ease-in-out infinite; }
  .glow-text { animation: glow 2s ease-in-out infinite; }
  .slide-right { animation: slideRight 0.8s ease-out forwards; }
</style>

<div class="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex flex-col items-center justify-center p-12">
  <!-- 顶部标题 -->
  <h1 class="text-7xl font-black text-white glow-text mb-16 slide-right">
    CSS 动画 + Tailwind
  </h1>

  <!-- 中间三个动画圆球 -->
  <div class="flex gap-12 mb-16">
    <div class="w-40 h-40 rounded-full bg-gradient-to-br from-red-400 to-pink-600 shadow-2xl flex items-center justify-center float">
      <span class="text-4xl">🚀</span>
    </div>
    <div class="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 shadow-2xl flex items-center justify-center float" style="animation-delay: 0.5s;">
      <span class="text-4xl">⭐</span>
    </div>
    <div class="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl flex items-center justify-center float" style="animation-delay: 1s;">
      <span class="text-4xl">💎</span>
    </div>
  </div>

  <!-- 底部信息卡片 -->
  <div class="grid grid-cols-3 gap-6 w-full max-w-4xl">
    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div class="text-3xl font-bold text-white mb-2">120fps</div>
      <div class="text-sm text-slate-300">流畅动画</div>
    </div>
    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div class="text-3xl font-bold text-white mb-2">100%</div>
      <div class="text-sm text-slate-300">离线渲染</div>
    </div>
    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div class="text-3xl font-bold text-white mb-2">∞</div>
      <div class="text-sm text-slate-300">自由组合</div>
    </div>
  </div>
</div>
`;

  builder.createTrack()
    .createScene({ duration: 4, startTime: 4 })
      .addHtml({
        x: '50%', y: '50%', width: '100%', height: '100%', anchor: [0.5, 0.5],
        html: scene2Html,
        duration: 4,
      });

  const outputPath = path.join(outDir, 'html-tailwind.mp4');
  console.log(`[html-tailwind] 渲染到: ${outputPath}`);
  console.log(`[html-tailwind] 使用 Tailwind CSS: ${tailwindCss.length > 100 ? '✓ (' + Math.round(tailwindCss.length / 1024) + 'KB)' : '✗ 未找到 tailwind.css'}`);
  await builder.render(outputPath, { parallel: true });
  console.log(`[html-tailwind] 完成!`);

  builder.destroy();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
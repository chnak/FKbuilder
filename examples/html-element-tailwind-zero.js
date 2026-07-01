/**
 * 零配置 Tailwind 测试
 *
 * 不依赖:
 *   - tailwindcss (本地未装)
 *   - tailwind-input.css (项目根没有)
 *
 * 只要 addHtml({ html, tailwind: true }) 就能用通用 Tailwind utility
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'html-tailwind-zero');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

// ============ Scene 1: 通用 utility 直接生效 ============
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 3 })
    .addBackground({ color: '#0f172a' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <div class="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-12">
          <div class="text-center space-y-6">
            <div class="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-semibold">
              🚀 零配置 Tailwind
            </div>
            <h1 class="text-6xl font-black text-white drop-shadow-lg">
              无需任何 setup
            </h1>
            <p class="text-xl text-white/90">
              直接 addHtml({ tailwind: true })
            </p>
            <div class="flex gap-4 justify-center mt-8">
              <button class="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold shadow-lg">
                按钮
              </button>
              <button class="px-6 py-3 bg-white/10 text-white rounded-lg font-bold border border-white/30">
                次按钮
              </button>
            </div>
          </div>
        </div>
      `,
      tailwind: true,         // ← 关键:零配置
      duration: 3,
    });

// ============ Scene 2: 验证变体 utility ============
builder.createTrack({ zIndex: 1 })
  .createScene({ duration: 3, startTime: 3 })
    .addBackground({ color: '#1e293b' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-12">
          <h1 class="text-5xl font-bold text-white mb-12 hover:text-yellow-400 transition-colors">
            悬停变色
          </h1>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div class="bg-slate-800 hover:bg-blue-600 transition rounded-xl p-6 cursor-pointer">
              <div class="text-2xl font-bold text-white">120fps</div>
              <div class="text-sm text-slate-300">流畅</div>
            </div>
            <div class="bg-slate-800 hover:bg-purple-600 transition rounded-xl p-6 cursor-pointer">
              <div class="text-2xl font-bold text-white">100%</div>
              <div class="text-sm text-slate-300">离线</div>
            </div>
            <div class="bg-slate-800 hover:bg-pink-600 transition rounded-xl p-6 cursor-pointer">
              <div class="text-2xl font-bold text-white">∞</div>
              <div class="text-sm text-slate-300">组合</div>
            </div>
          </div>
        </div>
      `,
      tailwind: true,
      duration: 3,
    });

const t0 = Date.now();
const outputPath = path.join(outDir, 'tailwind-zero.mp4');
console.log(`[zero-config] 渲染到: ${outputPath}`);
console.log(`[zero-config] 应无需 CLI 调用,直接用打包的通用 CSS`);

await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();

console.log(`[zero-config] 完成! 总耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);

await new Promise((resolve) => {
  spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,30)+eq(n,120)'",
    '-vsync', '0',
    path.join(outDir, 'frame_%02d.png'),
  ], { stdio: 'inherit' }).on('exit', resolve);
});

console.log('\n=== 验证清单 ===');
console.log('  ✓ 无 tailwind-input.css');
console.log('  ✓ 无需调 tailwindcss CLI');
console.log('  ✓ 应该看到: gradient/pill/buttons/grid/hover 全部生效');
process.exit(0);
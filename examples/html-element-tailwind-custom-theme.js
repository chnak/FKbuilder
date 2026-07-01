/**
 * HTMLElement 自定义 Tailwind 主题示例
 *
 * 场景:零配置通用 CSS 不够用(想要自定义色 / 自定义 token)
 * 做法:自己 npx tailwindcss 预编译,然后通过 tailwind: { css: '...' } 传进来
 *
 * 步骤:
 *   1. 写 tailwind-input.css (下面有示例)
 *   2. 编译: npx tailwindcss --input tailwind-input.css --output ./my-tailwind.css --minify
 *   3. 把编译产物传给 tailwind: { css: '...' } 或 { input: './my-tailwind.css' }
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'html-tailwind-custom');
await fs.ensureDir(outDir);

// ============ Step 1: 准备自定义主题的输入 CSS ============
const tailwindInput = `
@import "tailwindcss";

/* 自定义主题 token */
@theme {
  --color-brand: #FF6B6B;
  --color-accent: #06b6d4;
  --font-display: "Inter", "Microsoft YaHei", sans-serif;
}
`;
const inputCssPath = path.join(outDir, 'tailwind-input.css');
const outputCssPath = path.join(outDir, 'my-tailwind.css');
await fs.writeFile(inputCssPath, tailwindInput, 'utf8');

// ============ Step 2: 编译 ============
console.log('[custom-theme] 编译 Tailwind...');
await new Promise((resolve, reject) => {
  const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const proc = spawn(
    bin,
    ['tailwindcss', '--input', inputCssPath, '--output', outputCssPath, '--minify'],
    { stdio: 'inherit', shell: process.platform === 'win32' }
  );
  proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`tailwindcss exited with ${code}`)));
});
const customCss = await fs.readFile(outputCssPath, 'utf8');
console.log(`[custom-theme] 编译产物 ${(customCss.length / 1024).toFixed(1)}KB`);

// ============ Step 3: 渲染 ============
const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 4 })
    .addBackground({ color: '#0f172a' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900
                    flex items-center justify-center p-12">
          <div class="text-center space-y-6">
            <div class="inline-block px-4 py-2 bg-brand/20 border border-brand/40 rounded-full text-brand text-sm font-semibold">
              自定义主题
            </div>
            <h1 class="text-7xl font-black text-white">
              <span class="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                brand 色
              </span>
              直接可用
            </h1>
            <p class="text-xl text-slate-300">
              通过 tailwind: { css: '...' } 传入预编译的 CSS
            </p>
            <button class="px-8 py-3 bg-brand hover:bg-brand/80 text-white rounded-lg font-bold shadow-lg">
              bg-brand
            </button>
          </div>
        </div>
      `,
      tailwind: { css: customCss },     // ← 传预编译的 CSS
      duration: 4,
    });

const outputPath = path.join(outDir, 'tailwind-custom.mp4');
console.log(`[custom-theme] 渲染到: ${outputPath}`);
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();

console.log('[custom-theme] 完成!');
await new Promise((resolve) => {
  spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,60)'",
    '-vsync', '0',
    path.join(outDir, 'frame_01.png'),
  ], { stdio: 'inherit' }).on('exit', resolve);
});

console.log('\n=== 关键步骤 ===');
console.log('1. 自己写 tailwind-input.css,定义 @theme { --color-brand: ... }');
console.log('2. npx tailwindcss --input ... --output ... --minify');
console.log('3. 读编译产物,通过 tailwind: { css: fs.readFileSync(...) } 传入');
process.exit(0);
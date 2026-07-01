/**
 * 测试 keyframes 三种写法,看哪种能让 .badge 真的动起来
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'keyframes-test');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

// ============ 方式 A: 只用 keyframes Map (当前方式) ============
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 3 })
    .addBackground({ color: '#0f172a' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <div class="w-full h-full flex items-center justify-center">
          <div class="badge-a bg-red-500 text-white text-3xl px-8 py-4 rounded-xl">
            A
          </div>
        </div>
      `,
      tailwind: true,
      keyframes: {
        '.badge-a': {
          '0%':   { transform: 'translateY(0)' },
          '50%':  { transform: 'translateY(-50px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      duration: 3,
    });

// ============ 方式 B: HTML 内写 @keyframes + animation 属性 ============
builder.createTrack({ zIndex: 1 })
  .createScene({ duration: 3, startTime: 3 })
    .addBackground({ color: '#1e293b' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <style>
          @keyframes bounceB {
            0%   { transform: translateY(0); }
            50%  { transform: translateY(-50px); }
            100% { transform: translateY(0); }
          }
          .badge-b {
            animation: bounceB 1s ease-in-out infinite;
            background: #10b981;
            color: white;
            font-size: 30px;
            padding: 16px 32px;
            border-radius: 12px;
          }
        </style>
        <div class="w-full h-full flex items-center justify-center">
          <div class="badge-b">B</div>
        </div>
      `,
      duration: 3,
    });

// ============ 方式 C: keyframes Map + 在 HTML 加 animation 属性 ============
builder.createTrack({ zIndex: 2 })
  .createScene({ duration: 3, startTime: 6 })
    .addBackground({ color: '#312e81' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <style>
          .badge-c {
            animation: bounce-c 1s ease-in-out infinite;
          }
        </style>
        <div class="w-full h-full flex items-center justify-center">
          <div class="badge-c bg-purple-500 text-white text-3xl px-8 py-4 rounded-xl">
            C
          </div>
        </div>
      `,
      tailwind: true,
      keyframes: {
        // 注: 此处 key 名需与 .badge-c 的 animation 引用一致
        // 但 keyframes Map 模式下名字是自动生成的(根据 selector)
        // 试试两种命名方式
        'bounce-c': {
          '0%':   { transform: 'translateY(0)' },
          '50%':  { transform: 'translateY(-50px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      duration: 3,
    });

const outputPath = path.join(outDir, 'kf-test.mp4');
console.log('[kf-test] 渲染...');
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();

console.log('[kf-test] 抽帧...');
await new Promise((resolve) => {
  spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,15)+eq(n,30)+eq(n,45)+eq(n,105)+eq(n,120)+eq(n,135)+eq(n,195)+eq(n,210)+eq(n,225)'",
    '-vsync', '0',
    path.join(outDir, 'f_%02d.png'),
  ], { stdio: 'inherit' }).on('exit', resolve);
});

console.log('\n=== 三种方式对比 ===');
console.log('A: addHtml({ keyframes: { \'.badge-a\': {...} } })  ← 只配 keyframes Map');
console.log('B: HTML 内 <style>@keyframes bounceB</style> + animation 属性');
console.log('C: keyframes Map 用名字 \'bounce-c\' + HTML 内 animation: bounce-c ...');
process.exit(0);
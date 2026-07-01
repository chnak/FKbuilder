/**
 * 测试 tailwind + 结构性 keyframes 同时使用
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'tw-keyframes-test');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 3 })
    .addBackground({ color: '#0f172a' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      tailwind: true,
      keyframes: {
        '.badge': {
          '0%':   { transform: 'translateY(0)' },
          '50%':  { transform: 'translateY(-30px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      html: `
        <div class="w-full h-full flex items-center justify-center">
          <div class="badge bg-blue-500 text-white text-5xl font-black rounded-2xl shadow-lg px-12 py-6">
            弹跳 Badge
          </div>
        </div>
      `,
      duration: 3,
    });

const outputPath = path.join(outDir, 'tw-keyframes.mp4');
console.log('[test] 渲染中...');
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();

console.log('[test] 完成! 抽帧...');
await new Promise((resolve) => {
  spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,15)+eq(n,45)+eq(n,75)'",
    '-vsync', '0',
    path.join(outDir, 'f_%02d.png'),
  ], { stdio: 'inherit' }).on('exit', resolve);
});
process.exit(0);
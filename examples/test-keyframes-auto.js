/**
 * 测 KeyframesRuleList 格式(显式 name + animation)
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'kf-auto');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

// KeyframesRuleList 格式 - 用 name 显式
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 3 })
    .addBackground({ color: '#0f172a' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <div class="w-full h-full flex items-center justify-center">
          <div class="ruleList bg-emerald-500 text-white text-3xl px-8 py-4 rounded-xl">
            RuleList
          </div>
        </div>
      `,
      tailwind: true,
      keyframes: [
        {
          name: 'ruleList-bounce',
          keyframes: [
            { offsets: [0],   declarations: { transform: 'translateY(0)' } },
            { offsets: [0.5], declarations: { transform: 'translateY(-50px)' } },
            { offsets: [1],   declarations: { transform: 'translateY(0)' } },
          ],
        },
      ],
      duration: 3,
    });

const outputPath = path.join(outDir, 'kf-rule.mp4');
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();

await new Promise((resolve) => {
  spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,15)+eq(n,30)+eq(n,45)+eq(n,60)'",
    '-vsync', '0',
    path.join(outDir, 'r_%02d.png'),
  ], { stdio: 'inherit' }).on('exit', resolve);
});
process.exit(0);
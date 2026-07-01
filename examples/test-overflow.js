/**
 * 测 overflow-y-auto 是否还报错
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';

const outDir = path.join(process.cwd(), 'output', 'overflow-test');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 1 })
    .addBackground({ color: '#0f172a' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: `
        <div class="w-full h-full flex items-center justify-center">
          <div class="w-96 h-48 overflow-y-auto bg-blue-500 text-white p-4 rounded-xl">
            <h1 class="text-2xl">scroll 测试</h1>
            <p>这是内容...</p>
          </div>
        </div>
      `,
      tailwind: true,
      duration: 1,
    });

const outputPath = path.join(outDir, 'overflow.mp4');
console.log('[overflow] 渲染(应无 Takumi 报错)...');
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();
console.log('[overflow] 完成');
process.exit(0);
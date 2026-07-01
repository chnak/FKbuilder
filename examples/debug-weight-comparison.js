/**
 * font-weight 对比：证明 900 是 fake-bold 合成
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'weight-comparison');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

const text = '微软雅黑粗体';
const weights = [
  { w: 400, label: 'weight 400 (Regular)' },
  { w: 700, label: 'weight 700 (Bold - 雅黑真实粗体)' },
  { w: 900, label: 'weight 900 (fake-bold 合成)' },
];

weights.forEach(({ w, label }, idx) => {
  builder.createTrack({ zIndex: idx })
    .createScene({ duration: 1, startTime: idx })
      .addBackground({ color: '#0f172a' })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: `
          <style>h1 { font-family: 'Microsoft YaHei'; }</style>
          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <h1 style="color:white;font-size:120px;font-weight:${w};margin:0;">${text}</h1>
            <p style="color:#94a3b8;font-size:24px;margin-top:32px;">${label}</p>
          </div>
        `,
        duration: 1,
      });
});

const outputPath = path.join(outDir, 'weight-compare.mp4');
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();

await new Promise((resolve) => {
  spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,10)+eq(n,40)+eq(n,70)'",
    '-vsync', '0',
    path.join(outDir, 'w_%02d.png'),
  ], { stdio: 'inherit' }).on('exit', resolve);
});
console.log('\n输出 w_01.png (400), w_02.png (700), w_03.png (900)');
process.exit(0);
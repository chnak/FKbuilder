/**
 * 字体控制变量测试 - 4 个场景各渲一张 PNG,直接对比字形
 *
 * 场景 1: 显式 font-family: 'Microsoft YaHei' (font-weight: 400)
 * 场景 2: 显式 font-family: 'Microsoft YaHei' (font-weight: 900)
 * 场景 3: 显式 font-family: 'SimHei'
 * 场景 4: 不指定 font-family (走我的自动注入,字重 400)
 * 场景 5: 不指定 font-family (走我的自动注入,字重 900) ← 复现 chinese-default
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'font-comparison');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

const wrap = (text, weight = 400) => `
<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f172a;">
  <h1 style="color:white;font-size:120px;font-weight:${weight};margin:0;">${text}</h1>
</div>
`;

const cssBlock = (extra) => `<style>${extra}</style>`;

// Scene 1: 显式 YaHei, weight 400
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 1 })
    .addBackground({ color: '#000' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: cssBlock(`h1 { font-family: 'Microsoft YaHei', sans-serif; }`) + wrap('微软雅黑'),
      duration: 1,
    });

// Scene 2: 显式 YaHei, weight 900
builder.createTrack({ zIndex: 1 })
  .createScene({ duration: 1, startTime: 1 })
    .addBackground({ color: '#000' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: cssBlock(`h1 { font-family: 'Microsoft YaHei', sans-serif; font-weight: 900; }`) + wrap('雅黑粗'),
      duration: 1,
    });

// Scene 3: 显式 SimHei
builder.createTrack({ zIndex: 2 })
  .createScene({ duration: 1, startTime: 2 })
    .addBackground({ color: '#000' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: cssBlock(`h1 { font-family: 'SimHei', sans-serif; }`) + wrap('黑体测试'),
      duration: 1,
    });

// Scene 4: 不指定 font-family, weight 400 (走自动注入)
builder.createTrack({ zIndex: 3 })
    .createScene({ duration: 1, startTime: 3 })
    .addBackground({ color: '#000' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: wrap('自动注入'),
      duration: 1,
    });

// Scene 5: 不指定 font-family, weight 900 (复现 chinese-default)
builder.createTrack({ zIndex: 4 })
    .createScene({ duration: 1, startTime: 4 })
    .addBackground({ color: '#000' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: wrap('默认粗体', 900),
      duration: 1,
    });

const outputPath = path.join(outDir, 'font-comparison.mp4');
console.log(`渲染中... → ${outputPath}`);
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();
console.log('渲染完成,开始抽帧...');

await new Promise((resolve) => {
  const ff = spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,15)+eq(n,45)+eq(n,75)+eq(n,105)+eq(n,135)'",
    '-vsync', '0',
    path.join(outDir, 'frame_%02d.png'),
  ], { stdio: 'inherit' });
  ff.on('exit', resolve);
});

console.log('\n=== 帧对比说明 ===');
console.log('frame_01: 显式 Microsoft YaHei (weight 400)');
console.log('frame_02: 显式 Microsoft YaHei (weight 900)');
console.log('frame_03: 显式 SimHei (黑体)');
console.log('frame_04: 自动注入 (weight 400)');
console.log('frame_05: 自动注入 (weight 900) ← 对比 chinese-default frame_01');
process.exit(0);
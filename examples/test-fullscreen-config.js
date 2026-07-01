/**
 * 测试 x/y/width/height 全 100%/50% 的全屏配置
 *
 * 关键:默认 anchor=[0.5, 0.5](元素中心点)
 *   x:50%, y:50%        → 元素中心点在画布中心
 *   width:100%, height:100% → 元素从 -50% 延伸到 +150%
 *   即 元素正好填满画布 (0% 到 100%)
 */
import { VideoBuilder } from '../src/index.js';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const outDir = path.join(process.cwd(), 'output', 'fullscreen-config-test');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

// ============ 场景 A: x/y 50% + w/h 100%, 默认 anchor [0.5, 0.5] ============
// 期望:完美填满 1280×720 画布
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 1 })
    .addBackground({ color: '#1e293b' })  // 用半透明画布判断元素位置
    .addHtml({
      x: '50%', y: '50%',
      width: '100%', height: '100%',
      // anchor 默认 [0.5, 0.5]
      html: `
        <div style="width:100%;height:100%;background:rgba(59,130,246,0.7);
                    display:flex;align-items:center;justify-content:center;
                    color:white;font-size:48px;font-weight:bold;
                    border:8px solid yellow;">
          A: x=50%, y=50%, w/h=100%<br/>
             默认 anchor
        </div>
      `,
      duration: 1,
    });

// ============ 场景 B: 同一配置,但 anchor 改成 [0, 0] ============
// 期望:元素向左上偏移 -50%,会溢出画布左/上各 50%
builder.createTrack({ zIndex: 1 })
  .createScene({ duration: 1, startTime: 1 })
    .addBackground({ color: '#1e293b' })
    .addHtml({
      x: '50%', y: '50%',
      width: '100%', height: '100%',
      anchor: [0, 0],   // ← 锚点改左上
      html: `
        <div style="width:100%;height:100%;background:rgba(239,68,68,0.7);
                    display:flex;align-items:center;justify-content:center;
                    color:white;font-size:32px;font-weight:bold;
                    border:8px solid yellow;">
          B: anchor=[0,0] → 溢出!
        </div>
      `,
      duration: 1,
    });

// ============ 场景 C: 推荐的"全屏"配置 x/y=0, anchor=[0,0] ============
// 期望:完美填满
builder.createTrack({ zIndex: 2 })
  .createScene({ duration: 1, startTime: 2 })
    .addBackground({ color: '#1e293b' })
    .addHtml({
      x: 0, y: 0,
      width: '100%', height: '100%',
      anchor: [0, 0],
      html: `
        <div style="width:100%;height:100%;background:rgba(34,197,94,0.7);
                    display:flex;align-items:center;justify-content:center;
                    color:white;font-size:48px;font-weight:bold;
                    border:8px solid yellow;">
          C: x=y=0, anchor=[0,0] ✅
        </div>
      `,
      duration: 1,
    });

const outputPath = path.join(outDir, 'fullscreen.mp4');
console.log('[fullscreen] 渲染三个场景...');
await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();
console.log('[fullscreen] 完成');

await new Promise((resolve) => {
  spawn('ffmpeg', [
    '-y', '-i', outputPath,
    '-vf', "select='eq(n,15)+eq(n,45)+eq(n,75)'",
    '-vsync', '0',
    path.join(outDir, 'f_%02d.png'),
  ], { stdio: 'inherit' }).on('exit', resolve);
});

console.log('\n=== 结果对比 ===');
console.log('f_01.png (场景 A): x=50%/y=50%/w=100%/h=100% + 默认 anchor [0.5,0.5]');
console.log('                   → 期望: 完美填满 1280×720');
console.log('f_02.png (场景 B): 同样 + anchor [0,0]');
console.log('                   → 期望: 元素向左上溢出 50%');
console.log('f_03.png (场景 C): x=0/y=0/w=100%/h=100% + anchor [0,0]');
console.log('                   → 期望: 完美填满 1280×720');
process.exit(0);
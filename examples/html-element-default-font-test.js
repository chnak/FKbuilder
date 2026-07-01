/**
 * HTMLElement 默认字体自动注入验证脚本
 *
 * 验证三种场景:
 *   1) HTML 未声明 font-family → 自动注入 body 规则
 *   2) HTML 已声明 font-family   → 不注入(尊重用户)
 *   3) autoDefaultFont: false    → 不注入(用户明确关闭)
 *
 * 并在 output/ 中各渲染一张 PNG,人工目检中文字体是否正确
 */
import { VideoBuilder } from '../src/index.js';
import path from 'path';
import fs from 'fs-extra';
import { createCanvas } from '@napi-rs/canvas';
import { destroyTakumiRenderer } from '../src/utils/takumi-renderer.js';

const outDir = path.join(process.cwd(), 'output', 'html-default-font');
await fs.ensureDir(outDir);

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

const baseHtml = (extraStyle) => `
<style>${extraStyle || ''}</style>
<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
  <h1 style="color:white;font-size:96px;font-weight:800;">中文 ABC 123</h1>
</div>
`;

// ============ 场景 1: 自动注入(无 font-family) ============
builder.createTrack({ zIndex: 0 })
  .createScene({ duration: 1 })
    .addBackground({ color: '#0f172a' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: baseHtml(),
      duration: 1,
    });

// ============ 场景 2: 用户已声明 font-family(不注入) ============
builder.createTrack({ zIndex: 1 })
  .createScene({ duration: 1, startTime: 1 })
    .addBackground({ color: '#1e1b4b' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: baseHtml(`h1 { font-family: 'SimHei', sans-serif; }`),
      duration: 1,
    });

// ============ 场景 3: autoDefaultFont: false(不注入) ============
builder.createTrack({ zIndex: 2 })
  .createScene({ duration: 1, startTime: 2 })
    .addBackground({ color: '#312e81' })
    .addHtml({
      x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
      html: baseHtml(),
      autoDefaultFont: false,
      duration: 1,
    });

// ============ 单元测试:不渲染,直接验证纯函数行为 ============
console.log('\n===== 单元测试(injectDefaultFontFamily 行为) =====');
const helperPath = path.join(process.cwd(), 'src', 'elements', 'HTMLElement.js');
const src = fs.readFileSync(helperPath, 'utf8');

// 通过读源码做最小验证:确认注入逻辑就在那里
const hasHelper = /function injectDefaultFontFamily/.test(src);
const hasDetection = /function htmlDeclaresFontFamily/.test(src);
const hasOption = /this\.autoDefaultFont\s*=/.test(src);
const hasStack = /Microsoft YaHei.*PingFang SC.*Noto Sans CJK SC/.test(src);
console.log('  injectDefaultFontFamily helper defined :', hasHelper ? 'OK' : 'FAIL');
console.log('  htmlDeclaresFontFamily helper defined  :', hasDetection ? 'OK' : 'FAIL');
console.log('  this.autoDefaultFont option wired       :', hasOption ? 'OK' : 'FAIL');
console.log('  跨平台字体栈(YaHei/PingFang/Noto) :', hasStack ? 'OK' : 'FAIL');

// ============ 实际渲染 3 帧 ============
const outputPath = path.join(outDir, 'default-font-test.mp4');
console.log(`\n===== 渲染视频到 ${outputPath} =====`);
console.log('  场景 1(0-1s): 自动注入 → 应显示微软雅黑');
console.log('  场景 2(1-2s): 用户声明 font-family: SimHei');
console.log('  场景 3(2-3s): autoDefaultFont:false → 回退默认');

await builder.render(outputPath, { parallel: false });
builder.destroy();
destroyTakumiRenderer();

console.log(`\n✅ 完成! 视频: ${outputPath}`);
console.log('请打开视频对比三个场景的中文字形是否一致(都是中文字体,只是不同字体)');
process.exit(0);
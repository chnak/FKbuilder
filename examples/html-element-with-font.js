/**
 * HTMLElement 字体加载示例
 *
 * Takumi 不会自动读取系统字体。需要显式注册字体:
 * - 通过 fonts 字段传入: { path: 'C:/Windows/Fonts/xxx.ttf' } 或 { data: Buffer }
 * - 通过 googleFonts() helper 拉 Google Fonts
 *
 * 此示例展示如何用本地中文字体。
 */
import { VideoBuilder } from '../src/index.js';
import { getTakumiRenderer, registerFontsToTakumi } from '../src/utils/takumi-renderer.js';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

async function findChineseFont() {
  // 跨平台查找中文字体
  const candidates = [];
  if (process.platform === 'win32') {
    candidates.push('C:/Windows/Fonts/NotoSansSC-VF.ttf');
    candidates.push('C:/Windows/Fonts/msyh.ttc');
  } else if (process.platform === 'darwin') {
    candidates.push('/System/Library/Fonts/PingFang.ttc');
  } else {
    candidates.push('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
    candidates.push('/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc');
  }
  for (const p of candidates) {
    if (await fs.pathExists(p)) return p;
  }
  return null;
}

async function main() {
  const fontPath = await findChineseFont();
  if (!fontPath) {
    console.warn('[html-font] 未找到系统中文字体,中文将显示为豆腐。可安装 Noto Sans CJK 后重试。');
  } else {
    console.log('[html-font] 使用字体:', fontPath);
    // 预注册到 Takumi(全局生效)
    const renderer = getTakumiRenderer();
    await registerFontsToTakumi(renderer, [{ path: fontPath }]);
  }

  const outDir = path.join(process.cwd(), 'output', 'html-element');
  await fs.ensureDir(outDir);

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

  builder.createTrack({ zIndex: 0 })
    .createScene({ duration: 5 })
      .addBackground({ color: '#0c0a09' })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: `
          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at top,#1c1917,#0c0a09);color:white;font-family:SimHei;">
            <div style="font-size:96px;font-weight:900;background:linear-gradient(90deg,#fbbf24,#f97316,#ef4444);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-2px;">
              你好,世界
            </div>
            <div style="margin-top:24px;font-size:36px;color:#d6d3d1;font-weight:300;font-family:system-ui;">
              Hello, World
            </div>
            <div style="margin-top:64px;font-size:18px;color:#78716c;font-family:system-ui;">
              ${fontPath ? 'SimHei loaded ✓' : 'no Chinese font found'}
            </div>
          </div>
        `,
        animations: ['fadeIn'],
        duration: 5,
      });

  const outputPath = path.join(outDir, 'html-with-font.mp4');
  console.log(`[html-font] 渲染到: ${outputPath}`);
  const t0 = Date.now();
  // 先 build 看下结构
  const vm = builder.build();
  console.log('[html-font] layers:');
  for (const l of vm.layers) {
    console.log('  zIndex:', l.zIndex, 'time:', l.startTime, '->', l.endTime, 'elements:', l.elements.length);
    for (const e of l.elements) {
      console.log('    ', e.constructor.name, 'type:', e.type, 'time:', e.startTime, '->', e.endTime, 'visible:', e.visible, 'isActiveAtTime(0):', e.isActiveAtTime?.(0));
    }
  }
  await builder.render(outputPath, { parallel: true });
  console.log(`[html-font] 完成! 耗时 ${((Date.now()-t0)/1000).toFixed(1)}s`);

  builder.destroy();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

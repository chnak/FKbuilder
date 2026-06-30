/**
 * HTMLElement 基础示例
 * 演示: 用 HTML/CSS 字符串渲染漂亮的视频帧
 */
import { VideoBuilder } from '../src/index.js';
import path from 'path';
import fs from 'fs-extra';

async function main() {
  const outDir = path.join(process.cwd(), 'output', 'html-element');
  await fs.ensureDir(outDir);

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

  // 场景 1: 渐变 + 文字 + 简单形状
  builder.createTrack({ zIndex: 0 })
    .createScene({ duration: 4 })
      .addBackground({ color: '#0f172a' })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: `
          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;color:white;background:radial-gradient(ellipse at center,#1e293b 0%,#0f172a 80%);">
            <div style="font-size:120px;font-weight:800;background:linear-gradient(90deg,#22d3ee,#a78bfa,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-4px;">
              FK + Takumi
            </div>
            <div style="margin-top:24px;font-size:32px;color:#94a3b8;font-weight:300;">
              用 HTML/CSS 制作漂亮视频
            </div>
            <div style="margin-top:48px;display:flex;gap:24px;">
              <div style="width:120px;height:120px;border-radius:24px;background:linear-gradient(135deg,#22d3ee,#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:48px;">🎨</div>
              <div style="width:120px;height:120px;border-radius:24px;background:linear-gradient(135deg,#a78bfa,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:48px;">⚡</div>
              <div style="width:120px;height:120px;border-radius:24px;background:linear-gradient(135deg,#f472b6,#db2777);display:flex;align-items:center;justify-content:center;font-size:48px;">🚀</div>
            </div>
          </div>
        `,
        animations: ['fadeIn'],
        duration: 4,
      });

  // 场景 2: 信息卡片样式
  builder.createTrack({ zIndex: 1 })
    .createScene({ duration: 4, startTime: 4 })
      .addBackground({ color: '#f8fafc' })
      .addHtml({
        x: 160, y: 120, width: 960, height: 480, anchor: [0, 0],
        html: `
          <div style="width:100%;height:100%;background:white;border-radius:32px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);padding:48px;display:flex;flex-direction:column;justify-content:space-between;font-family:system-ui;">
            <div>
              <div style="display:inline-block;padding:8px 16px;background:#dbeafe;color:#1e40af;border-radius:999px;font-size:18px;font-weight:600;">
                NEW
              </div>
              <div style="margin-top:24px;font-size:56px;font-weight:800;color:#0f172a;line-height:1.1;">
                漂亮视频<br/>只需几行 HTML
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:20px;color:#64748b;">
                Powered by Takumi + Paper.js
              </div>
              <div style="padding:16px 32px;background:#0f172a;color:white;border-radius:16px;font-size:20px;font-weight:600;">
                开始创作 →
              </div>
            </div>
          </div>
        `,
        animations: ['slideInRight'],
        duration: 4,
      });

  const outputPath = path.join(outDir, 'html-basic.mp4');
  console.log(`[html-basic] 渲染到: ${outputPath}`);
  const t0 = Date.now();
  await builder.render(outputPath, { parallel: true });
  console.log(`[html-basic] builder.render returned, exit in 1s`);
  console.log(`[html-basic] 完成! 耗时 ${((Date.now()-t0)/1000).toFixed(1)}s`);

  builder.destroy();
  // 主动退出,Takumi 原生绑定可能持有事件循环
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

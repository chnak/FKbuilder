/**
 * HTMLElement 默认中文支持示例
 *
 * 演示: HTMLElement 默认开启中文字体支持，无需手动指定 fonts
 * - Windows: 微软雅黑 / 黑体 / 宋体
 * - macOS: 苹方 / 华文黑体
 * - Linux: 文泉驿 / Noto Sans CJK
 */
import { VideoBuilder } from '../src/index.js';
import path from 'path';
import fs from 'fs-extra';

async function main() {
  const outDir = path.join(process.cwd(), 'output', 'html-chinese-default');
  await fs.ensureDir(outDir);

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

  // ============ Scene 1: 标题（无需 fonts） ============
  builder.createTrack()
    .createScene({ duration: 4 })
      .addBackground({ color: '#0f172a' })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: `
          <style>
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .title { animation: fadeInUp 1s ease-out forwards; }
            .subtitle { animation: fadeInUp 1s ease-out 0.3s forwards; opacity: 0; }
          </style>

          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e293b);">
            <h1 class="title" style="color:white;font-size:96px;font-weight:900;letter-spacing:8px;">默认中文支持</h1>
            <p class="subtitle" style="color:#94a3b8;font-size:36px;margin-top:32px;letter-spacing:4px;">无需手动指定字体文件</p>
          </div>
        `,
        duration: 4,
      });

  // ============ Scene 2: 列表（多种中文元素） ============
  builder.createTrack()
    .createScene({ duration: 4, startTime: 4 })
      .addBackground({ color: '#1e293b' })
      .addHtml({
        x: 0, y: 0, width: 1280, height: 720, anchor: [0, 0],
        html: `
          <style>
            @keyframes slideIn {
              from { transform: translateX(-50px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .item { animation: slideIn 0.6s ease-out forwards; opacity: 0; }
            .item:nth-child(1) { animation-delay: 0.1s; }
            .item:nth-child(2) { animation-delay: 0.3s; }
            .item:nth-child(3) { animation-delay: 0.5s; }
            .item:nth-child(4) { animation-delay: 0.7s; }
          </style>

          <div style="width:100%;height:100%;padding:80px;display:flex;flex-direction:column;justify-content:center;">
            <h2 style="color:#06b6d4;font-size:64px;font-weight:bold;margin-bottom:48px;">技术特性</h2>
            <div class="item" style="background:rgba(255,255,255,0.05);border-left:4px solid #06b6d4;padding:24px 32px;margin-bottom:24px;border-radius:8px;">
              <h3 style="color:white;font-size:32px;margin:0;">🚀 自动加载中文字体</h3>
              <p style="color:#94a3b8;font-size:20px;margin-top:8px;">无需任何配置，开箱即用</p>
            </div>
            <div class="item" style="background:rgba(255,255,255,0.05);border-left:4px solid #8b5cf6;padding:24px 32px;margin-bottom:24px;border-radius:8px;">
              <h3 style="color:white;font-size:32px;margin:0;">⚡ 跨平台支持</h3>
              <p style="color:#94a3b8;font-size:20px;margin-top:8px;">Windows、macOS、Linux 通用</p>
            </div>
            <div class="item" style="background:rgba(255,255,255,0.05);border-left:4px solid #ec4899;padding:24px 32px;margin-bottom:24px;border-radius:8px;">
              <h3 style="color:white;font-size:32px;margin:0;">🎨 CSS 动画完美同步</h3>
              <p style="color:#94a3b8;font-size:20px;margin-top:8px;">通过 timeMs 注入，自动与视频时间轴同步</p>
            </div>
            <div class="item" style="background:rgba(255,255,255,0.05);border-left:4px solid #f59e0b;padding:24px 32px;border-radius:8px;">
              <h3 style="color:white;font-size:32px;margin:0;">📦 完整的 Tailwind 支持</h3>
              <p style="color:#94a3b8;font-size:20px;margin-top:8px;">预编译 CSS 内联，所有工具类都生效</p>
            </div>
          </div>
        `,
        duration: 4,
      });

  const outputPath = path.join(outDir, 'html-chinese-default.mp4');
  console.log(`[chinese-default] 渲染到: ${outputPath}`);
  await builder.render(outputPath, { parallel: true });
  console.log(`[chinese-default] 完成!`);

  builder.destroy();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
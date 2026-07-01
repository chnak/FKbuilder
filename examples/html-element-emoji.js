/**
 * HTMLElement + Emoji 集成示例
 *
 * 演示: 默认支持中文 + 彩色 emoji
 *
 * - 中文：通过默认中文字体自动支持（微软雅黑等）
 * - Emoji：通过 Takumi extractEmojis 自动替换为 Twemoji SVG（彩色）
 * - 网络：emoji SVG 需要从 CDN 加载（首次运行需要网络）
 *
 * emoji 样式：'twemoji' | 'noto' | 'openmoji' | 'blobmoji' | 'fluent' | 'fluentFlat'
 */
import { VideoBuilder } from '../src/index.js';
import path from 'path';
import fs from 'fs-extra';

async function main() {
  const outDir = path.join(process.cwd(), 'output', 'html-emoji');
  await fs.ensureDir(outDir);

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });

  // ============ Scene 1: 中文标题 + Emoji 装饰 ============
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
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-30px); }
            }
            .title { animation: fadeInUp 1s ease-out forwards; }
            .emoji-bounce { animation: bounce 2s ease-in-out infinite; }
          </style>

          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e3a8a,#7c3aed);">
            <div class="title emoji-bounce" style="font-size:160px;line-height:1;">🚀</div>
            <h1 class="title" style="color:white;font-size:96px;font-weight:900;margin-top:32px;letter-spacing:8px;">立即开始</h1>
            <p class="title" style="color:#bfdbfe;font-size:36px;margin-top:24px;letter-spacing:4px;">FKbuilder 视频创作 🎬</p>
          </div>
        `,
        duration: 4,
      });

  // ============ Scene 2: Emoji 列表 ============
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
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            .item { animation: slideIn 0.6s ease-out forwards; opacity: 0; }
            .item:nth-child(1) { animation-delay: 0.1s; }
            .item:nth-child(2) { animation-delay: 0.3s; }
            .item:nth-child(3) { animation-delay: 0.5s; }
            .item:nth-child(4) { animation-delay: 0.7s; }
            .item:nth-child(5) { animation-delay: 0.9s; }
            .icon { animation: pulse 2s ease-in-out infinite; display: inline-block; }
          </style>

          <div style="width:100%;height:100%;padding:60px;display:flex;flex-direction:column;justify-content:center;">
            <h2 style="color:#06b6d4;font-size:56px;font-weight:bold;margin-bottom:48px;display:flex;align-items:center;gap:24px;">
              <span class="icon" style="font-size:64px;">⚡</span>
              <span>核心特性</span>
            </h2>

            <div class="item" style="display:flex;align-items:center;gap:24px;background:rgba(255,255,255,0.05);padding:20px 32px;margin-bottom:16px;border-radius:12px;border-left:4px solid #06b6d4;">
              <span class="icon" style="font-size:48px;">🎨</span>
              <span style="color:white;font-size:28px;font-weight:500;">自动加载中文字体</span>
            </div>

            <div class="item" style="display:flex;align-items:center;gap:24px;background:rgba(255,255,255,0.05);padding:20px 32px;margin-bottom:16px;border-radius:12px;border-left:4px solid #8b5cf6;">
              <span class="icon" style="font-size:48px;">🌈</span>
              <span style="color:white;font-size:28px;font-weight:500;">彩色 Emoji 自动渲染</span>
            </div>

            <div class="item" style="display:flex;align-items:center;gap:24px;background:rgba(255,255,255,0.05);padding:20px 32px;margin-bottom:16px;border-radius:12px;border-left:4px solid #ec4899;">
              <span class="icon" style="font-size:48px;">⚙️</span>
              <span style="color:white;font-size:28px;font-weight:500;">CSS @keyframes 完美同步</span>
            </div>

            <div class="item" style="display:flex;align-items:center;gap:24px;background:rgba(255,255,255,0.05);padding:20px 32px;margin-bottom:16px;border-radius:12px;border-left:4px solid #f59e0b;">
              <span class="icon" style="font-size:48px;">📦</span>
              <span style="color:white;font-size:28px;font-weight:500;">Tailwind CSS 完整支持</span>
            </div>

            <div class="item" style="display:flex;align-items:center;gap:24px;background:rgba(255,255,255,0.05);padding:20px 32px;border-radius:12px;border-left:4px solid #10b981;">
              <span class="icon" style="font-size:48px;">🎯</span>
              <span style="color:white;font-size:28px;font-weight:500;">高精度 60fps 渲染</span>
            </div>
          </div>
        `,
        duration: 4,
      });

  const outputPath = path.join(outDir, 'html-emoji.mp4');
  console.log(`[emoji] 渲染到: ${outputPath}`);
  console.log(`[emoji] 注意：首次运行会下载 emoji SVG（需联网）`);
  await builder.render(outputPath, { parallel: false });
  console.log(`[emoji] 完成!`);

  builder.destroy();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
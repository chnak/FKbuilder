import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const builder = new VideoBuilder({ width: 720, height: 720, fps: 30 });

  const track = builder.createTrack({ zIndex: 1 });
  // 选择精灵图资源，如果指定文件不存在则回退到 assets 中首个图片
  let sheetPath = path.join(__dirname, '../assets/sprites_23149190.png');
  const assetsDir = path.join(__dirname, '../assets');
  try {
    const exists = await fs.pathExists(sheetPath);
    if (!exists && await fs.pathExists(assetsDir)) {
      const files = await fs.readdir(assetsDir);
      const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
      if (imageFiles.length > 0) {
        sheetPath = path.join(assetsDir, imageFiles[0]);
        console.log('⚠️ 指定的 spritesheet 未找到，回退为:', imageFiles[0]);
      }
    }
  } catch (_) {}

  track
    .createScene({ duration: 3, startTime: 0 })
    .addBackground({ color: '#222222', duration: 3 })
    .addSprite({
      spriteType:'Sprite',
      // 位置（支持 %/px 等单位）
      x: '50%', // 水平居中
      y: '50%', // 垂直居中
      // 显示尺寸（目标显示大小）
      width: '50%', // 显示宽度
      height: '50%', // 显示高度
      // 精灵图资源（spritesheet 路径）
      src: sheetPath,
      // 图集布局（列数/行数）
      columns: 6, // 每行帧数
      rows: 2, // 总行数
      // 单帧原始尺寸（应与图集中每帧像素大小一致）
      frameWidth: 826, // 单帧宽度（像素）
      frameHeight: 1353, // 单帧高度（像素）
      // 播放控制
      frameRate: 12, // 每秒播放帧数
      loop: true, // 循环播放
      autoplay: true, // 自动播放（为 false 时停留首帧）
      playMode: 'forward', // 播放模式：forward/reverse/ping-pong
      // 适配模式（图像如何适配显示尺寸）
      fit: 'contain', // contain/cover/fill/scale-down/none
      animations: [
        {
          type: 'keyframe',
          duration: 1,
          easing: 'linear',
          keyframes: [
            { time: 0, translateX: -200, translateY: 0 },
            { time: 1, translateX: 200, translateY: 0 },
          ],
        },
      ],
    });

  await fs.ensureDir(path.join(__dirname, '../output'));
  await builder.export(path.join(__dirname, '../output/test-sprite.mp4'));
}

main().catch(console.error);

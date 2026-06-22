import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 对比测试 fit: cover vs fit: fill
 * 使用同一张图，左半边用 cover，右半边用 fill，肉眼应该能看出区别
 */
async function testCoverVsFill() {
  const assetsDir = path.join(__dirname, '../assets');
  const imageFiles = [];
  if (await fs.pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir);
    imageFiles.push(...files.filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
  }
  if (imageFiles.length === 0) {
    console.log('未找到图片，请放入 assets/');
    return;
  }
  const imagePath = path.join(assetsDir, imageFiles[0]);
  console.log(`使用图片: ${imageFiles[0]}`);

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });

  // 场景1：cover - 容器宽720，高240（横向矩形容器）
  // 用一张非 3:1 的图，cover 应该裁剪
  track.createScene({ duration: 3, startTime: 0 })
    .addBackground({ color: '#222222' })
    .addText({
      text: 'fit: cover',
      color: '#FFFFFF', fontSize: 40,
      x: '50%', y: '15%', anchor: [0.5, 0.5],
      duration: 3,
    })
    .addImage({
      src: imagePath,
      x: '50%', y: '55%',
      width: '80%', height: '40%',  // 容器比例 16:5 ≈ 3.2:1
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'cover',
    });

  // 场景2：fill - 同一图同一容器，应该被拉伸
  track.createScene({ duration: 3, startTime: 3 })
    .addBackground({ color: '#222222' })
    .addText({
      text: 'fit: fill (stretched)',
      color: '#FFFFFF', fontSize: 40,
      x: '50%', y: '15%', anchor: [0.5, 0.5],
      duration: 3,
    })
    .addImage({
      src: imagePath,
      x: '50%', y: '55%',
      width: '80%', height: '40%',
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'fill',
    });

  // 场景3：contain - 保持比例完整显示
  track.createScene({ duration: 3, startTime: 6 })
    .addBackground({ color: '#222222' })
    .addText({
      text: 'fit: contain',
      color: '#FFFFFF', fontSize: 40,
      x: '50%', y: '15%', anchor: [0.5, 0.5],
      duration: 3,
    })
    .addImage({
      src: imagePath,
      x: '50%', y: '55%',
      width: '80%', height: '40%',
      anchor: [0.5, 0.5],
      duration: 3,
      fit: 'contain',
    });

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-cover-vs-fill.mp4');

  try {
    console.log('开始渲染...');
    const vm = builder.build();
    await vm.export(outputPath);
    console.log(`完成: ${outputPath}`);
    vm.destroy();
    builder.destroy();
  } catch (e) {
    console.error('失败:', e);
    console.error(e.stack);
  }
}

testCoverVsFill().catch(console.error);
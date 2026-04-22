/**
 * 转场效果测试示例
 * 3个场景，每个场景颜色和形状不同，便于观察转场效果
 */

import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTransitionTest() {
  const builder = new VideoBuilder({
    width: 1280,
    height: 720,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // ========== 场景 1: 红色背景 + 圆形 (0s - 2s) ==========
  const scene1 = track.createScene({ duration: 2, startTime: 0 });
  scene1.addBackground({ color: '#dc2626' }); // 红色
  scene1.addCircle({
    x: 640, y: 360, radius: 100,
    color: '#ffffff', fill: true,
    duration: 2,
  });
  scene1.addText({
    text: '场景 1',
    x: '50%', y: '80%',
    fontSize: 48, fontFamily: 'Arial', color: '#ffffff',
    textAlign: 'center', textBaseline: 'middle',
    duration: 2,
  });

  // ========== 场景 2: 绿色背景 + 方形 (2s - 4s) ==========
  const scene2 = track.createScene({ duration: 2, startTime: 2 });
  scene2.addBackground({ color: '#16a34a' }); // 绿色
  scene2.addRect({
    x: 540, y: 260, width: 200, height: 200,
    color: '#ffffff', fill: true,
    duration: 2,
  });
  scene2.addText({
    text: '场景 2',
    x: '50%', y: '80%',
    fontSize: 48, fontFamily: 'Arial', color: '#ffffff',
    textAlign: 'center', textBaseline: 'middle',
    duration: 2,
  });

  // ========== 场景 3: 蓝色背景 + 菱形 (4s - 6s) ==========
  const scene3 = track.createScene({ duration: 2, startTime: 4 });
  scene3.addBackground({ color: '#2563eb' }); // 蓝色
  scene3.addRect({
    x: 590, y: 310, width: 100, height: 100,
    color: '#ffffff', fill: true, rotation: 45,
    duration: 2,
  });
  scene3.addText({
    text: '场景 3',
    x: '50%', y: '80%',
    fontSize: 48, fontFamily: 'Arial', color: '#ffffff',
    textAlign: 'center', textBaseline: 'middle',
    duration: 2,
  });

  // 添加转场（每个场景之间）
  track.addTransition({ name: 'CrossZoom', duration: 0.5 });
  track.addTransition({ name: 'Dreamy', duration: 0.5 });

  console.log(`\n📹 转场测试配置:`);
  console.log(`   分辨率: 1280 x 720`);
  console.log(`   时长: 6s`);
  console.log(`   场景1: 红色背景 + 圆形 (0-2s)`);
  console.log(`   场景2: 绿色背景 + 方形 (2-4s)`);
  console.log(`   场景3: 蓝色背景 + 三角形 (4-6s)`);
  console.log(`   转场1: CrossZoom (1.75-2.25s)`);
  console.log(`   转场2: Dreamy (3.75-4.25s)\n`);

  const outputPath = path.resolve(__dirname, '../output/transition-test.mp4');
  const result = await builder.render(outputPath, {
    parallel: false,
    usePipe: true,
  });

  console.log(`\n✅ 渲染完成: ${result}`);
}

createTransitionTest().catch(console.error);

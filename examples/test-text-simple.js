import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简单测试文本显示
 */
async function testTextSimple() {
  console.log('=== 测试文本显示 ===\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 测试1：普通文本（不分割）
  const scene1 = track.createScene({ duration: 5 })
    .addBackground({ color: "#000000" })
    .addText({
      text: "测试文本",
      color: "#FFFFFF",
      fontSize: 80,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
      zIndex: 10,
    });

  // 测试2：分割文本
  const scene2 = track.createScene({ duration: 5 })
    .addBackground({ color: "#000000" })
    .addText({
      text: "分割文本",
      color: "#FF0000",
      fontSize: 80,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 5,
      zIndex: 10,
      split: 'letter',
      splitDelay: 0.1,
      splitDuration: 0.3,
    });

  const videoMaker = builder.build();
  const outputPath = path.join(__dirname, '../output/test-text-simple.mp4');
  
  console.log('开始渲染...');
  await videoMaker.export(outputPath);
  
  console.log(`✅ 完成: ${outputPath}`);
  
  videoMaker.destroy();
  builder.destroy();
}

testTextSimple().catch(console.error);


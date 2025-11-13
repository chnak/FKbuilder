import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 调试文本显示问题
 */
async function testTextDebug() {
  console.log('=== 调试文本显示 ===\n');

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  const scene = track.createScene({ duration: 5 })
    .addBackground({ color: "#000000" })
    .addText({
      text: "测试",
      color: "#FFFFFF",
      fontSize: 80,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
      zIndex: 10,
      split: 'letter',
      splitDelay: 0.1,
      splitDuration: 0.3,
    });

  const videoMaker = builder.build();
  
  // 调试：检查元素
  console.log('=== 元素信息 ===');
  for (const layer of videoMaker.getLayers()) {
    console.log(`\nLayer zIndex: ${layer.zIndex}`);
    for (const element of layer.getElements()) {
      console.log(`  Element: ${element.type}, text: ${element.config?.text || element.text}, startTime: ${element.startTime}, endTime: ${element.endTime}`);
      if (element.type === 'text' && element.split && element.segments) {
        console.log(`    分割文本，子元素数: ${element.segments.length}`);
        for (let i = 0; i < Math.min(3, element.segments.length); i++) {
          const seg = element.segments[i];
          console.log(`      子元素 ${i}: text="${seg.config?.text || seg.text}", startTime=${seg.startTime}, endTime=${seg.endTime}, opacity=${seg.config?.opacity !== undefined ? seg.config.opacity : seg.opacity}`);
        }
      }
    }
  }

  const outputPath = path.join(__dirname, '../output/test-text-debug.mp4');
  
  console.log('\n开始渲染...');
  await videoMaker.export(outputPath);
  
  console.log(`✅ 完成: ${outputPath}`);
  
  videoMaker.destroy();
  builder.destroy();
}

testTextDebug().catch(console.error);


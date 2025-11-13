import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 调试分割文本渲染问题
 */
async function testSplitRenderDebug() {
  console.log('=== 调试分割文本渲染 ===\n');

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
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.3 },
      ],
    });

  const videoMaker = builder.build();
  
  // 调试：检查分割文本的子元素
  console.log('=== 检查分割文本 ===');
  for (const layer of videoMaker.getLayers()) {
    for (const element of layer.getElements()) {
      if (element.type === 'text' && element.split && element.segments) {
        console.log(`\n父元素: text="${element.config?.text || element.text}"`);
        console.log(`  可见性: ${element.visible}`);
        console.log(`  时间范围: ${element.startTime} - ${element.endTime}`);
        console.log(`  子元素数: ${element.segments.length}`);
        
        // 测试在时间 0.5 秒时的状态
        const testTime = 0.5;
        console.log(`\n  在时间 ${testTime} 秒时：`);
        for (let i = 0; i < element.segments.length; i++) {
          const seg = element.segments[i];
          const isActive = seg.isActiveAtTime(testTime);
          const state = seg.getStateAtTime(testTime, { width: 720, height: 1280 });
          console.log(`    子元素 ${i} (${seg.config?.text || seg.text}):`);
          console.log(`      可见性: ${seg.visible}`);
          console.log(`      激活: ${isActive}`);
          console.log(`      时间范围: ${seg.startTime} - ${seg.endTime}`);
          console.log(`      opacity: ${state.opacity}`);
          console.log(`      x: ${state.x}, y: ${state.y}`);
          console.log(`      segmentOffsetX: ${seg.config?.segmentOffsetX}, segmentOffsetY: ${seg.config?.segmentOffsetY}`);
          console.log(`      parentX: ${seg.config?.parentX}, parentY: ${seg.config?.parentY}`);
          console.log(`      totalWidth: ${seg.config?.totalTextWidth}, totalHeight: ${seg.config?.totalTextHeight}`);
          
          // 检查 TextSplitter 的字符位置
          if (element.splitter) {
            const chars = element.splitter.getCharacters();
            console.log(`      TextSplitter 字符位置:`);
            for (let j = 0; j < Math.min(3, chars.length); j++) {
              console.log(`        字符 ${j}: "${chars[j].text}", x=${chars[j].x}, y=${chars[j].y}, width=${chars[j].width}`);
            }
          }
        }
      }
    }
  }

  const outputPath = path.join(__dirname, '../output/test-split-render-debug.mp4');
  
  console.log('\n开始渲染...');
  await videoMaker.export(outputPath);
  
  console.log(`✅ 完成: ${outputPath}`);
  
  videoMaker.destroy();
  builder.destroy();
}

testSplitRenderDebug().catch(console.error);


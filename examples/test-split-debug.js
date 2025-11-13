import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 调试分割文本问题
 */
async function testSplitDebug() {
  console.log('=== 调试分割文本 ===\n');

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
        console.log(`  原始动画配置数: ${element.originalAnimations?.length || 0}`);
        if (element.originalAnimations) {
          element.originalAnimations.forEach((anim, i) => {
            console.log(`    动画 ${i}:`, JSON.stringify(anim, null, 2));
          });
        }
        console.log(`  子元素数: ${element.segments.length}`);
        for (let i = 0; i < element.segments.length; i++) {
          const seg = element.segments[i];
          console.log(`\n  子元素 ${i}: text="${seg.config?.text || seg.text}"`);
          console.log(`    startTime: ${seg.startTime}, endTime: ${seg.endTime}`);
          console.log(`    opacity: ${seg.config?.opacity !== undefined ? seg.config.opacity : seg.opacity}`);
          console.log(`    动画实例数: ${seg.animations?.length || 0}`);
          if (seg.animations) {
            seg.animations.forEach((anim, j) => {
              console.log(`      动画 ${j}: type=${anim.type}, fromOpacity=${anim.fromOpacity}, toOpacity=${anim.toOpacity}, duration=${anim.config?.duration || anim.duration}, startTime=${anim.startTime}, endTime=${anim.endTime}`);
            });
          }
          console.log(`    原始动画配置数: ${seg.originalAnimations?.length || 0}`);
          if (seg.originalAnimations) {
            seg.originalAnimations.forEach((anim, j) => {
              console.log(`      原始动画配置 ${j}:`, JSON.stringify(anim, null, 2));
            });
          }
        }
      }
    }
  }

  const outputPath = path.join(__dirname, '../output/test-split-debug.mp4');
  
  console.log('\n开始渲染...');
  await videoMaker.export(outputPath);
  
  console.log(`✅ 完成: ${outputPath}`);
  
  videoMaker.destroy();
  builder.destroy();
}

testSplitDebug().catch(console.error);


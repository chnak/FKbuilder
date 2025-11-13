import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 测试多轨道多场景功能
 * 
 * 测试场景：
 * - 3个轨道（背景、标题、字幕）
 * - 每个轨道3个场景
 * - 验证每个场景在不同时间段正确显示
 */
async function testMultiTrackScene() {
  console.log('=== 测试多轨道多场景功能 ===\n');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  // ========== 轨道1：背景轨道（zIndex: 0）==========
  const track1 = builder.createTrack({ zIndex: 0, name: '背景轨道' });
  
  // 场景1：蓝色背景（0-10秒）
  track1.createScene({ duration: 10, name: '场景1-蓝色' })
    .addBackground({ color: '#4a90e2' });
  
  // 场景2：绿色背景（10-20秒）
  track1.createScene({ duration: 10, name: '场景2-绿色' })
    .addBackground({ color: '#2ecc71' });
  
  // 场景3：红色背景（20-30秒）
  track1.createScene({ duration: 10, name: '场景3-红色' })
    .addBackground({ color: '#e74c3c' });

  // ========== 轨道2：标题轨道（zIndex: 1）==========
  const track2 = builder.createTrack({ zIndex: 1, name: '标题轨道' });
  
  // 场景1：标题1（0-10秒）
  track2.createScene({ duration: 10, name: '场景1-标题' })
    .addText({
      text: "场景 1：蓝色背景",
      color: "#ffffff",
      fontSize: 80,
      x: "50%",
      y: "20%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 1,
    });
  
  // 场景2：标题2（10-20秒）
  track2.createScene({ duration: 10, name: '场景2-标题' })
    .addText({
      text: "场景 2：绿色背景",
      color: "#ffffff",
      fontSize: 80,
      x: "50%",
      y: "20%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 1,
    });
  
  // 场景3：标题3（20-30秒）
  track2.createScene({ duration: 10, name: '场景3-标题' })
    .addText({
      text: "场景 3：红色背景",
      color: "#ffffff",
      fontSize: 80,
      x: "50%",
      y: "20%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 1,
    });

  // ========== 轨道3：字幕轨道（zIndex: 2）==========
  const track3 = builder.createTrack({ zIndex: 2, name: '字幕轨道' });
  
  // 场景1：字幕1（0-10秒）
  track3.createScene({ duration: 10, name: '场景1-字幕' })
    .addText({
      text: "这是第一个场景的字幕内容",
      color: "#ffffff",
      fontSize: 48,
      x: "50%",
      y: "80%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 2,
    });
  
  // 场景2：字幕2（10-20秒）
  track3.createScene({ duration: 10, name: '场景2-字幕' })
    .addText({
      text: "这是第二个场景的字幕内容",
      color: "#ffffff",
      fontSize: 48,
      x: "50%",
      y: "80%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 2,
    });
  
  // 场景3：字幕3（20-30秒）
  track3.createScene({ duration: 10, name: '场景3-字幕' })
    .addText({
      text: "这是第三个场景的字幕内容",
      color: "#ffffff",
      fontSize: 48,
      x: "50%",
      y: "80%",
      textAlign: "center",
      duration: 10,
      startTime: 0,
      zIndex: 2,
    });

  // 构建 VideoMaker
  const videoMaker = builder.build();
  
  // 打印详细信息
  console.log('=== 构建信息 ===');
  console.log(`总时长: ${builder.getTotalDuration()} 秒`);
  console.log(`轨道数: ${builder.getTracks().length}`);
  console.log(`图层数: ${videoMaker.getLayers().length}`);
  console.log(`总元素数: ${videoMaker.getLayers().reduce((sum, layer) => sum + layer.getElements().length, 0)}`);
  
  console.log('\n=== 轨道信息 ===');
  for (const track of builder.getTracks()) {
    console.log(`\n轨道: ${track.name} (zIndex: ${track.zIndex})`);
    console.log(`  场景数: ${track.getScenes().length}`);
    for (const scene of track.getScenes()) {
      console.log(`  - ${scene.name}: ${scene.duration}秒`);
    }
  }
  
  console.log('\n=== 元素时间信息 ===');
  for (const layer of videoMaker.getLayers()) {
    console.log(`\nLayer zIndex: ${layer.zIndex}`);
    for (const element of layer.getElements()) {
      const info = {
        type: element.type,
        startTime: element.startTime,
        endTime: element.endTime,
        duration: element.duration,
      };
      if (element.type === 'rect' && element.config) {
        info.bgcolor = element.config.bgcolor;
      } else if (element.type === 'text' && element.config) {
        info.text = element.config.text?.substring(0, 20) + '...';
      }
      console.log(`  ${JSON.stringify(info)}`);
    }
  }
  
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, 'test-multi-track-scene.mp4');
  
  console.log('\n开始渲染视频...');
  const startTime = Date.now();
  await videoMaker.export(outputPath);
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ 视频导出完成: ${outputPath}`);
  console.log(`⏱️  总耗时: ${duration} 秒`);
  console.log(`📊 平均每帧: ${(duration / 900 * 1000).toFixed(2)} ms (900帧)`);
  
  videoMaker.destroy();
  builder.destroy();
}

testMultiTrackScene().catch(console.error);


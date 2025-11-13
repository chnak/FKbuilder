import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzePerformance() {
  console.log('=== 性能分析 ===\n');
  
  // 检查音频文件
  let audioPath = path.join(__dirname, '../assets/winxp.mp3');
  if (!await fs.pathExists(audioPath)) {
    console.log('音频文件不存在，跳过音频测试');
    audioPath = null;
  }
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  
  // 创建一个简单的场景
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground({ color: '#4a90e2', duration: 5 })
    .addText({
      text: "性能测试",
      color: "#ffffff",
      fontSize: 80,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
      zIndex: 1,
    });
  
  if (audioPath) {
    scene.addAudio({
      src: audioPath,
      startTime: 0,
      duration: 5,
      cutFrom: 0,
      cutTo: 5,
      volume: 1.0,
    });
  }

  const videoMaker = builder.build();
  
  // 分析渲染性能
  console.log('开始性能分析...\n');
  
  // 测试单帧渲染时间
  const testFrames = [0, 1, 2.5, 4.9]; // 测试不同时间点的帧
  const frameTimes = [];
  
  await videoMaker.renderer.init();
  
  for (const time of testFrames) {
    const start = performance.now();
    await videoMaker.renderer.renderFrame(
      videoMaker.timeline.getLayers(),
      time,
      videoMaker.backgroundColor
    );
    const end = performance.now();
    const duration = end - start;
    frameTimes.push({ time, duration });
    console.log(`帧渲染时间 (t=${time}s): ${duration.toFixed(2)}ms`);
  }
  
  const avgFrameTime = frameTimes.reduce((sum, f) => sum + f.duration, 0) / frameTimes.length;
  const totalFrames = 5 * 30; // 5秒 * 30fps
  const estimatedTotalTime = (avgFrameTime * totalFrames) / 1000; // 转换为秒
  
  console.log(`\n平均单帧渲染时间: ${avgFrameTime.toFixed(2)}ms`);
  console.log(`预计总渲染时间 (${totalFrames}帧): ${estimatedTotalTime.toFixed(2)}秒`);
  console.log(`预计渲染速度: ${(totalFrames / estimatedTotalTime).toFixed(2)} 帧/秒`);
  
  // 分析 Composition 嵌套层级
  console.log('\n=== Composition 嵌套分析 ===');
  const analyzeComposition = (comp, depth = 0) => {
    const indent = '  '.repeat(depth);
    if (comp && comp.type === 'composition') {
      const childCount = (comp.elementsConfig || comp.elements || []).length;
      console.log(`${indent}Composition (depth=${depth}): ${childCount} 个子元素`);
      if (comp.elementsConfig) {
        for (const child of comp.elementsConfig) {
          if (child && child.type === 'composition') {
            analyzeComposition(child, depth + 1);
          }
        }
      }
    }
  };
  
  for (const layer of videoMaker.timeline.getLayers()) {
    if (layer.elements) {
      for (const element of layer.elements) {
        if (element && element.type === 'composition') {
          analyzeComposition(element, 0);
        }
      }
    }
  }
  
  videoMaker.destroy();
}

analyzePerformance().catch(console.error);




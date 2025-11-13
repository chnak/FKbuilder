import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 并行渲染测试 - 评估帧级并行渲染的性能提升
 */
async function testParallelRendering() {
  console.log('=== 并行渲染性能测试 ===\n');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground({ color: '#4a90e2', duration: 5 })
    .addText({
      text: "并行渲染测试",
      color: "#ffffff",
      fontSize: 80,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
      zIndex: 1,
    });

  const videoMaker = builder.build();
  
  // 测试参数
  const fps = 30;
  const duration = 5;
  const totalFrames = Math.ceil(duration * fps);
  const concurrency = Math.min(os.cpus().length, 8); // 并发数：CPU核心数，最多8个
  
  console.log(`总帧数: ${totalFrames}`);
  console.log(`CPU核心数: ${os.cpus().length}`);
  console.log(`并发数: ${concurrency}\n`);
  
  // 测试串行渲染
  console.log('=== 测试串行渲染 ===');
  await videoMaker.renderer.init();
  
  const serialStart = performance.now();
  for (let frame = 0; frame < Math.min(10, totalFrames); frame++) {
    const time = frame / fps;
    await videoMaker.renderer.renderFrame(
      videoMaker.timeline.getLayers(),
      time,
      videoMaker.backgroundColor
    );
  }
  const serialEnd = performance.now();
  const serialTime = serialEnd - serialStart;
  const avgSerialTime = serialTime / Math.min(10, totalFrames);
  
  console.log(`串行渲染 10 帧耗时: ${serialTime.toFixed(2)}ms`);
  console.log(`平均每帧: ${avgSerialTime.toFixed(2)}ms`);
  console.log(`预计总时间: ${(avgSerialTime * totalFrames / 1000).toFixed(2)}秒\n`);
  
  // 测试并行渲染（模拟）
  console.log('=== 测试并行渲染（模拟） ===');
  console.log('注意：这只是模拟，实际需要为每帧创建独立的 Renderer');
  
  const parallelStart = performance.now();
  const testFrames = Array.from({ length: Math.min(10, totalFrames) }, (_, i) => i);
  
  // 分批并行渲染
  const batchSize = concurrency;
  for (let i = 0; i < testFrames.length; i += batchSize) {
    const batch = testFrames.slice(i, i + batchSize);
    await Promise.all(batch.map(async (frame) => {
      const time = frame / fps;
      // 注意：这里需要为每帧创建独立的 Renderer
      // 当前只是模拟，实际实现需要创建新的 Renderer 实例
      await videoMaker.renderer.renderFrame(
        videoMaker.timeline.getLayers(),
        time,
        videoMaker.backgroundColor
      );
    }));
  }
  
  const parallelEnd = performance.now();
  const parallelTime = parallelEnd - parallelStart;
  const avgParallelTime = parallelTime / Math.min(10, totalFrames);
  
  console.log(`并行渲染 10 帧耗时: ${parallelTime.toFixed(2)}ms`);
  console.log(`平均每帧: ${avgParallelTime.toFixed(2)}ms`);
  console.log(`预计总时间: ${(avgParallelTime * totalFrames / 1000).toFixed(2)}秒`);
  console.log(`性能提升: ${(serialTime / parallelTime).toFixed(2)}倍\n`);
  
  // 分析 Composition 结构
  console.log('=== Composition 结构分析 ===');
  let compositionCount = 0;
  let maxDepth = 0;
  
  const analyzeComposition = (comp, depth = 0) => {
    if (comp && comp.type === 'composition') {
      compositionCount++;
      maxDepth = Math.max(maxDepth, depth);
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
  
  console.log(`Composition 总数: ${compositionCount}`);
  console.log(`最大嵌套深度: ${maxDepth}`);
  console.log(`\n并行渲染可行性:`);
  console.log(`- 帧级并行: ✅ 可行（需要为每帧创建独立 Renderer）`);
  console.log(`- Composition 级并行: ${compositionCount > 1 ? '✅ 可行' : '⚠️ 需要多个 Composition'}`);
  console.log(`- 嵌套 Composition 并行: ${maxDepth > 1 ? '⚠️ 需要处理嵌套关系' : '✅ 可行'}`);
  
  videoMaker.destroy();
}

testParallelRendering().catch(console.error);




import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testParallelPerformance() {
  console.log('=== 并行渲染性能对比测试 ===\n');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground({ color: '#4a90e2', duration: 5 })
    .addText({
      text: "并行渲染性能测试",
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
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  
  // 测试串行渲染
  console.log('=== 测试串行渲染 ===');
  const serialStart = performance.now();
  const serialOutput = path.join(outputDir, 'test-parallel-serial.mp4');
  await videoMaker.export(serialOutput, {
    parallel: false,
  });
  const serialEnd = performance.now();
  const serialTime = (serialEnd - serialStart) / 1000;
  
  console.log(`\n串行渲染总耗时: ${serialTime.toFixed(2)} 秒\n`);
  
  // 测试并行渲染
  console.log('=== 测试并行渲染 ===');
  const parallelStart = performance.now();
  const parallelOutput = path.join(outputDir, 'test-parallel-parallel.mp4');
  await videoMaker.export(parallelOutput, {
    parallel: true,
    maxConcurrency: 8,
  });
  const parallelEnd = performance.now();
  const parallelTime = (parallelEnd - parallelStart) / 1000;
  
  console.log(`\n并行渲染总耗时: ${parallelTime.toFixed(2)} 秒\n`);
  
  // 性能对比
  console.log('=== 性能对比 ===');
  console.log(`串行渲染: ${serialTime.toFixed(2)} 秒`);
  console.log(`并行渲染: ${parallelTime.toFixed(2)} 秒`);
  console.log(`性能提升: ${(serialTime / parallelTime).toFixed(2)} 倍`);
  console.log(`时间节省: ${(serialTime - parallelTime).toFixed(2)} 秒 (${((serialTime - parallelTime) / serialTime * 100).toFixed(1)}%)`);
  
  videoMaker.destroy();
}

testParallelPerformance().catch(console.error);


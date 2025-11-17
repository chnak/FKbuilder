import { VideoBuilder } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('测试 SVG 动画时间和频率...');
  
  // SVG 文件路径
  const svgPath = path.join(__dirname, '../assets/BirdFlapClosed.svg');
  
  // 创建视频构建器
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });
  
  // 创建主轨道
  const mainTrack = builder.createTrack({ zIndex: 1 });
  
  // 创建场景 - 只显示3秒，方便观察动画频率
  const scene = mainTrack.createScene({
    startTime: 0,
    duration: 3, // 3秒，应该能看到约4-5次翅膀扇动（0.667秒一次）
  });
  
  // 添加背景
  scene.addBackground({ color: '#1a1a2e' });
  
  // 添加 SVG 元素（启用 SVG 原生动画支持）
  scene.addSVG({
    src: svgPath,
    x: '50%',
    y: '50%',
    width: '60%',
    height: '60%',
    anchor: [0.5, 0.5],
    fit: 'contain',
    preserveAspectRatio: true,
    enableSVGAnimations: true, // 启用 SVG 原生动画
    startTime: 0,
    duration: 3,
  });
  
  // 添加说明文本
  scene.addElement(new TextElement({
    text: '翅膀扇动频率测试（应该每0.667秒一次）',
    x: '50%',
    y: '10%',
    fontSize: 36,
    color: '#ffffff',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 3,
  }));
  
  // 构建并导出视频
  console.log('开始构建视频...');
  const outputPath = path.join(__dirname, '../output/test-svg-animation-timing.mp4');
  
  await builder.render(outputPath, {
    parallel: true,
    usePipe: true,
    maxWorkers: 2,
    onProgress: (progress) => {
      if (Math.floor(progress * 100) % 10 === 0) {
        console.log(`渲染进度: ${(progress * 100).toFixed(0)}%`);
      }
    },
  });
  
  console.log(`视频已导出到: ${outputPath}`);
  console.log('测试完成！请查看视频确认翅膀扇动频率是否正确（每0.667秒一次）。');
}

main().catch(console.error);


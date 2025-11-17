import { VideoBuilder } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('开始测试 BirdFlapClosed.svg 文件...');
  
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
  
  // 创建场景
  const scene = mainTrack.createScene({
    startTime: 0,
    duration: 10, // 显示 10 秒，足够看到动画效果
  });
  
  // 添加背景
  scene.addBackground({ color: '#1a1a2e' });
  
  // 添加 SVG 元素（启用 SVG 原生动画支持）
  scene.addSVG({
    src: svgPath,
    x: '50%',
    y: '50%',
    width: '80%',
    height: '80%',
    anchor: [0.5, 0.5],
    fit: 'contain',
    preserveAspectRatio: true,
    enableSVGAnimations: true, // 启用 SVG 原生动画
    startTime: 0,
    duration: 10,
    animations: [
      {
        type: 'fade',
        fromOpacity: 0,
        toOpacity: 1,
        duration: 0.5,
        delay: 0,
      },
    ],
  });
  
  // 添加标题文本
  scene.addElement(new TextElement({
    text: 'BirdFlapClosed.svg - SVG 原生动画测试',
    x: '50%',
    y: '10%',
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 10,
    animations: [
      {
        type: 'fade',
        fromOpacity: 0,
        toOpacity: 1,
        duration: 1,
        delay: 0,
      },
    ],
  }));
  
  // 添加说明文本
  scene.addElement(new TextElement({
    text: '如果看到翅膀扇动动画，说明 SVG 原生动画已生效',
    x: '50%',
    y: '90%',
    fontSize: 32,
    color: '#ffffff',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    opacity: 0.8,
    startTime: 0,
    duration: 10,
    animations: [
      {
        type: 'fade',
        fromOpacity: 0,
        toOpacity: 0.8,
        duration: 1,
        delay: 0,
      },
    ],
  }));
  
  // 构建并导出视频
  console.log('开始构建视频...');
  const outputPath = path.join(__dirname, '../output/test-bird-svg.mp4');
  
  await builder.render(outputPath, {
    parallel: true,
    usePipe: true,
    maxWorkers: 4,
    onProgress: (progress) => {
      console.log(`渲染进度: ${(progress * 100).toFixed(1)}%`);
    },
  });
  
  console.log(`视频已导出到: ${outputPath}`);
  console.log('测试完成！请查看视频确认 SVG 原生动画是否正常工作。');
}

main().catch(console.error);


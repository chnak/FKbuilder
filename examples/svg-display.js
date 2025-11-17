import { VideoBuilder } from '../src/index.js';
import { SVGElement } from '../src/elements/SVGElement.js';
import { TextElement } from '../src/elements/TextElement.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('开始加载 SVG 文件...');
  
  // SVG 文件路径
  const svgPath1 = path.join(__dirname, '../assets/10342971.svg');
  const svgPath2 = path.join(__dirname, '../assets/BirdFlapClosed.svg');
  
  // 读取 SVG 文件信息
  const svgContent1 = await fs.readFile(svgPath1, 'utf-8');
  const svgContent2 = await fs.readFile(svgPath2, 'utf-8');
  
  console.log('SVG 文件1大小:', svgContent1.length, '字符');
  console.log('SVG 文件2大小:', svgContent2.length, '字符');
  
  // 创建视频构建器
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });
  
  // 创建主轨道
  const mainTrack = builder.createTrack({ zIndex: 1 });
  
  // 场景1：显示第一个 SVG
  const scene1 = mainTrack.createScene({
    startTime: 0,
    duration: 5, // 显示 5 秒
  });
  
  scene1.addBackground({ color: '#1a1a2e' });
  
  scene1.addSVG({
    src: svgPath1,
    x: '50%',
    y: '50%',
    width: '100%',
    height: '100%',
    anchor: [0.5, 0.5],
    fit: 'contain',
    preserveAspectRatio: true,
    startTime: 0,
    duration: 5,
    animations: [
      {
        type: 'fade',
        fromOpacity: 0,
        toOpacity: 1,
        duration: 1,
        delay: 0,
      },
    ],
  });
  
  scene1.addElement(new TextElement({
    text: '10342971.svg',
    x: '50%',
    y: '10%',
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 5,
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
  
  // 场景2：显示第二个 SVG
  const scene2 = mainTrack.createScene({
    startTime: 5,
    duration: 5, // 显示 5 秒
  });
  
  scene2.addBackground({ color: '#1a1a2e' });
  
  // 创建 SVG 元素并添加动画
  // 注意：SVG 文件中的原生 <animate> 标签可能不被 Paper.js 支持
  // 但可以通过 animations 配置为整个 SVG 添加动画
  scene2.addSVG({
    src: svgPath2,
    x: '50%',
    y: '50%',
    width: '100%',
    height: '100%',
    anchor: [0.5, 0.5],
    fit: 'contain',
    preserveAspectRatio: true,
    startTime: 0,
    duration: 5,
    animations: [
      {
        type: 'fade',
        fromOpacity: 0,
        toOpacity: 1,
        duration: 1,
        delay: 0,
      },
      {
        type: 'transform',
        fromRotation: 0,
        toRotation: 360,
        duration: 4,
        delay: 1,
        easing: 'linear',
      },
      {
        type: 'scale',
        fromScaleX: 0.8,
        fromScaleY: 0.8,
        toScaleX: 1.2,
        toScaleY: 1.2,
        duration: 2,
        delay: 1,
        easing: 'easeInOut',
      },
    ],
    // 使用 onLoaded 回调为 SVG 内部元素添加动画
    onLoaded: function(element, time, paperItem, paperInstance) {
      // 为 SVG 内部元素添加动画
      // 例如：如果 SVG 中有 id="path225" 的元素
      // element.animateElement('#path225', (relativeTime, el, svgElement, context) => ({
      //   rotation: relativeTime * 30, // 每秒旋转 30 度
      //   scaleX: 1 + Math.sin(relativeTime * 2) * 0.2, // 缩放动画
      //   scaleY: 1 + Math.sin(relativeTime * 2) * 0.2,
      // }));
      
      // 或者使用对象形式的动画配置
      // element.animateElement('#path225', {
      //   rotation: 45,
      //   scaleX: 1.5,
      //   scaleY: 1.5,
      // });
    },
  });
  
  scene2.addElement(new TextElement({
    text: 'BirdFlapClosed.svg',
    x: '50%',
    y: '10%',
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 5,
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
  
  // 构建并导出视频
  console.log('开始构建视频...');
  const outputPath = path.join(__dirname, '../output/svg-display.mp4');
  
  await builder.render(outputPath, {
    parallel: true,
    usePipe: true,
    maxWorkers: 4,
    onProgress: (progress) => {
      console.log(`渲染进度: ${(progress * 100).toFixed(1)}%`);
    },
  });
  
  console.log(`视频已导出到: ${outputPath}`);
}

main().catch(console.error);


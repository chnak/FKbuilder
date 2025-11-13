import { VideoMaker } from '../src/core/VideoMaker.js';
import { CompositionElement } from '../src/elements/CompositionElement.js';
import { TextElement } from '../src/elements/TextElement.js';
import { RectElement } from '../src/elements/RectElement.js';
import fs from 'fs-extra';

/**
 * 测试类似 FKVideo 的 Composition 功能
 */
async function testComposition() {
  console.log('测试 Composition 功能...');
  
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 5,
    backgroundColor: '#1a1a1a',
  });
  
  const layer = videoMaker.createElementLayer();
  
  // 创建 Composition 元素（包含多个子元素）
  const composition = new CompositionElement({
    x: '50%',
    y: '50%',
    width: 800,
    height: 600,
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 5,
    zIndex: 1,
    // Composition 本身的动画
    animations: [
      {
        type: 'fadeIn',
        duration: 1,
        startTime: 0,
      },
      {
        property: 'scaleX',
        from: 0.8,
        to: 1,
        duration: 1,
        startTime: 0,
      },
      {
        property: 'scaleY',
        from: 0.8,
        to: 1,
        duration: 1,
        startTime: 0,
      },
    ],
    // 子元素配置（类似 FKVideo 的 elements）
    elements: [
      // 背景矩形
      {
        type: 'rect',
        x: '50%', // 使用百分比，相对于 Composition 的中心
        y: '50%',
        width: 800,
        height: 600,
        fillColor: 'rgba(52, 152, 219, 0.2)',
        strokeColor: '#3498db',
        strokeWidth: 2,
        anchor: [0.5, 0.5], // 中心对齐
        startTime: 0,
        duration: 5,
        zIndex: 0,
      },
      // 主标题（使用相对时间）
      {
        type: 'text',
        text: '主标题',
        fontSize: 48,
        color: '#ffffff',
        x: '50%',
        y: '40%',
        textAlign: 'center',
        startTime: 0.5, // 相对于 Composition 的 startTime
        duration: 4,
        zIndex: 1,
        animations: ['fadeIn'],
      },
      // 副标题
      {
        type: 'text',
        text: '副标题',
        fontSize: 32,
        color: '#4ecdc4',
        x: '50%',
        y: '50%',
        textAlign: 'center',
        startTime: 1, // 相对于 Composition 的 startTime
        duration: 3,
        zIndex: 1,
        animations: ['slideInLeft'],
      },
      // 描述文本
      {
        type: 'text',
        text: '这是一个组合元素',
        fontSize: 24,
        color: '#bdc3c7',
        x: '50%',
        y: '60%',
        textAlign: 'center',
        startTime: 2, // 相对于 Composition 的 startTime
        duration: 2,
        zIndex: 1,
        animations: ['slideInRight'],
      },
    ],
  });
  
  layer.addElement(composition);
  
  console.log('导出视频...');
  await fs.ensureDir('output');
  await videoMaker.export('output/test-composition-fkvideo.mp4');
  console.log('完成');
  
  videoMaker.destroy();
}

testComposition().catch(console.error);


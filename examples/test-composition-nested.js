import { VideoMaker } from '../src/core/VideoMaker.js';
import { CompositionElement } from '../src/elements/CompositionElement.js';
import fs from 'fs-extra';

/**
 * 测试多个嵌套的 Composition
 */
async function testNestedComposition() {
  console.log('=== 测试嵌套 Composition ===');
  
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 5,
    backgroundColor: '#1a1a1a',
  });
  
  const layer = videoMaker.createElementLayer();
  
  // 外层 Composition（包含内层 Composition 和文本）
  const outerComposition = new CompositionElement({
    x: '50%',
    y: '50%',
    width: 1200,
    height: 800,
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 5,
    zIndex: 1,
    // 外层 Composition 的动画
    animations: [
      {
        type: 'fadeIn',
        duration: 1,
        startTime: 0,
      },
    ],
    elements: [
      // 外层背景
      {
        type: 'rect',
        x: '50%',
        y: '50%',
        width: 1200,
        height: 800,
        fillColor: 'rgba(52, 152, 219, 0.3)',
        strokeColor: '#3498db',
        strokeWidth: 3,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 5,
        zIndex: 0,
      },
      // 外层标题
      {
        type: 'text',
        text: '外层 Composition',
        fontSize: 48,
        color: '#ffffff',
        x: '50%',
        y: '15%',
        textAlign: 'center',
        startTime: 0.5,
        duration: 4,
        zIndex: 2,
        animations: ['fadeIn'],
      },
      // 内层 Composition（嵌套）
      {
        type: 'composition',
        x: '50%',
        y: '50%',
        width: 800,
        height: 500,
        anchor: [0.5, 0.5],
        startTime: 1,
        duration: 3,
        zIndex: 1,
        // 内层 Composition 的动画
        animations: [
          {
            property: 'scaleX',
            from: 0.8,
            to: 1,
            duration: 0.5,
            startTime: 0,
          },
          {
            property: 'scaleY',
            from: 0.8,
            to: 1,
            duration: 0.5,
            startTime: 0,
          },
        ],
        elements: [
          // 内层背景
          {
            type: 'rect',
            x: '50%',
            y: '50%',
            width: 800,
            height: 500,
            fillColor: 'rgba(231, 76, 60, 0.3)',
            strokeColor: '#e74c3c',
            strokeWidth: 2,
            anchor: [0.5, 0.5],
            startTime: 0,
            duration: 3,
            zIndex: 0,
          },
          // 内层标题
          {
            type: 'text',
            text: '内层 Composition',
            fontSize: 36,
            color: '#ffffff',
            x: '50%',
            y: '30%',
            textAlign: 'center',
            startTime: 0.5,
            duration: 2,
            zIndex: 1,
            animations: ['fadeIn'],
          },
          // 内层文本1
          {
            type: 'text',
            text: '这是内层的内容',
            fontSize: 24,
            color: '#e74c3c',
            x: '50%',
            y: '50%',
            textAlign: 'center',
            startTime: 1,
            duration: 1.5,
            zIndex: 1,
            animations: ['slideInLeft'],
          },
          // 内层文本2
          {
            type: 'text',
            text: '支持多层嵌套',
            fontSize: 24,
            color: '#e74c3c',
            x: '50%',
            y: '65%',
            textAlign: 'center',
            startTime: 1.5,
            duration: 1,
            zIndex: 1,
            animations: ['slideInRight'],
          },
        ],
      },
      // 外层底部文本
      {
        type: 'text',
        text: '外层底部文本',
        fontSize: 32,
        color: '#3498db',
        x: '50%',
        y: '85%',
        textAlign: 'center',
        startTime: 3,
        duration: 2,
        zIndex: 2,
        animations: ['fadeIn'],
      },
    ],
  });
  
  layer.addElement(outerComposition);
  
  console.log('导出视频...');
  await fs.ensureDir('output');
  await videoMaker.export('output/test-composition-nested.mp4');
  console.log('完成');
  
  videoMaker.destroy();
}

testNestedComposition().catch(console.error);


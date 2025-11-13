import { VideoMaker } from '../src/core/VideoMaker.js';
import { CompositionElement } from '../src/elements/CompositionElement.js';
import fs from 'fs-extra';

/**
 * 测试三层嵌套的 Composition
 */
async function testTripleNestedComposition() {
  console.log('=== 测试三层嵌套 Composition ===');
  
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 6,
    backgroundColor: '#1a1a1a',
  });
  
  const layer = videoMaker.createElementLayer();
  
  // 第一层 Composition（最外层）
  const level1Composition = new CompositionElement({
    x: '50%',
    y: '50%',
    width: 1600,
    height: 900,
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 6,
    zIndex: 1,
    animations: [
      {
        type: 'fadeIn',
        duration: 1,
        startTime: 0,
      },
    ],
    elements: [
      // 第一层背景
      {
        type: 'rect',
        x: '50%',
        y: '50%',
        width: 1600,
        height: 900,
        fillColor: 'rgba(52, 152, 219, 0.2)',
        strokeColor: '#3498db',
        strokeWidth: 4,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 6,
        zIndex: 0,
      },
      // 第一层标题
      {
        type: 'text',
        text: '第一层 Composition',
        fontSize: 56,
        color: '#3498db',
        x: '50%',
        y: '10%',
        textAlign: 'center',
        startTime: 0.5,
        duration: 5,
        zIndex: 3,
        animations: ['fadeIn'],
      },
      // 第二层 Composition（中间层）
      {
        type: 'composition',
        x: '50%',
        y: '50%',
        width: 1200,
        height: 700,
        anchor: [0.5, 0.5],
        startTime: 1,
        duration: 4,
        zIndex: 1,
        animations: [
          {
            property: 'scaleX',
            from: 0.9,
            to: 1,
            duration: 0.5,
            startTime: 0,
          },
          {
            property: 'scaleY',
            from: 0.9,
            to: 1,
            duration: 0.5,
            startTime: 0,
          },
        ],
        elements: [
          // 第二层背景
          {
            type: 'rect',
            x: '50%',
            y: '50%',
            width: 1200,
            height: 700,
            fillColor: 'rgba(46, 204, 113, 0.2)',
            strokeColor: '#2ecc71',
            strokeWidth: 3,
            anchor: [0.5, 0.5],
            startTime: 0,
            duration: 4,
            zIndex: 0,
          },
          // 第二层标题
          {
            type: 'text',
            text: '第二层 Composition',
            fontSize: 44,
            color: '#2ecc71',
            x: '50%',
            y: '15%',
            textAlign: 'center',
            startTime: 0.5,
            duration: 3,
            zIndex: 2,
            animations: ['fadeIn'],
          },
          // 第三层 Composition（最内层）
          {
            type: 'composition',
            x: '50%',
            y: '55%',
            width: 800,
            height: 400,
            anchor: [0.5, 0.5],
            startTime: 1.5,
            duration: 2.5,
            zIndex: 1,
            animations: [
              {
                property: 'rotation',
                from: -5,
                to: 5,
                duration: 1,
                startTime: 0,
                easing: 'easeInOut',
              },
              {
                property: 'rotation',
                from: 5,
                to: -5,
                duration: 1,
                startTime: 1,
                easing: 'easeInOut',
              },
              {
                property: 'rotation',
                from: -5,
                to: 0,
                duration: 0.5,
                startTime: 2,
                easing: 'easeOut',
              },
            ],
            elements: [
              // 第三层背景
              {
                type: 'rect',
                x: '50%',
                y: '50%',
                width: 800,
                height: 400,
                fillColor: 'rgba(231, 76, 60, 0.3)',
                strokeColor: '#e74c3c',
                strokeWidth: 2,
                anchor: [0.5, 0.5],
                startTime: 0,
                duration: 2.5,
                zIndex: 0,
              },
              // 第三层标题
              {
                type: 'text',
                text: '第三层 Composition',
                fontSize: 32,
                color: '#e74c3c',
                x: '50%',
                y: '30%',
                textAlign: 'center',
                startTime: 0.5,
                duration: 1.5,
                zIndex: 1,
                animations: ['fadeIn'],
              },
              // 第三层文本1
              {
                type: 'text',
                text: '最内层内容',
                fontSize: 24,
                color: '#ffffff',
                x: '50%',
                y: '50%',
                textAlign: 'center',
                startTime: 1,
                duration: 1,
                zIndex: 1,
                animations: ['slideInLeft'],
              },
              // 第三层文本2
              {
                type: 'text',
                text: '三层嵌套测试',
                fontSize: 24,
                color: '#ffffff',
                x: '50%',
                y: '65%',
                textAlign: 'center',
                startTime: 1.5,
                duration: 0.5,
                zIndex: 1,
                animations: ['slideInRight'],
              },
            ],
          },
          // 第二层底部文本
          {
            type: 'text',
            text: '第二层底部文本',
            fontSize: 28,
            color: '#2ecc71',
            x: '50%',
            y: '85%',
            textAlign: 'center',
            startTime: 3,
            duration: 1,
            zIndex: 2,
            animations: ['fadeIn'],
          },
        ],
      },
      // 第一层底部文本
      {
        type: 'text',
        text: '第一层底部文本',
        fontSize: 36,
        color: '#3498db',
        x: '50%',
        y: '90%',
        textAlign: 'center',
        startTime: 4.5,
        duration: 1.5,
        zIndex: 3,
        animations: ['fadeIn'],
      },
    ],
  });
  
  layer.addElement(level1Composition);
  
  console.log('导出视频...');
  await fs.ensureDir('output');
  await videoMaker.export('output/test-composition-triple-nested.mp4');
  console.log('完成');
  
  videoMaker.destroy();
}

testTripleNestedComposition().catch(console.error);


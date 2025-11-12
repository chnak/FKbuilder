/**
 * 测试滑入动画效果
 */
import { VideoMaker } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSlideAnimation() {
  console.log('创建滑入动画测试...\n');

  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 8,
    backgroundColor: '#1a1a1a',
  });

  const layer = videoMaker.createElementLayer();

  // 测试 1: 从左侧滑入
  const text1 = new TextElement({
    text: '从左侧滑入',
    x: '50%',
    y: '20%',
    fontSize: 64,
    fontFamily: 'PatuaOne',
    color: '#ffffff',
    textAlign: 'center',
    duration: 3,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.3,
    startTime: 0,
    animations: ['slideInLeft'],
  });
  layer.addElement(text1);

  // 测试 2: 从右侧滑入
  const text2 = new TextElement({
    text: '从右侧滑入',
    x: '50%',
    y: '40%',
    fontSize: 64,
    fontFamily: 'PatuaOne',
    color: '#4ecdc4',
    textAlign: 'center',
    duration: 3,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.3,
    startTime: 1,
    animations: ['slideInRight'],
  });
  layer.addElement(text2);

  // 测试 3: 从上方滑入
  const text3 = new TextElement({
    text: '从上方滑入',
    x: '50%',
    y: '60%',
    fontSize: 64,
    fontFamily: 'PatuaOne',
    color: '#f39c12',
    textAlign: 'center',
    duration: 3,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.3,
    startTime: 2,
    animations: ['slideInTop'],
  });
  layer.addElement(text3);

  // 测试 4: 从下方滑入
  const text4 = new TextElement({
    text: '从下方滑入',
    x: '50%',
    y: '80%',
    fontSize: 64,
    fontFamily: 'PatuaOne',
    color: '#e74c3c',
    textAlign: 'center',
    duration: 3,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.3,
    startTime: 3,
    animations: ['slideInBottom'],
  });
  layer.addElement(text4);

  // 测试 5: 滑入后滑出
  const text5 = new TextElement({
    text: '滑入后滑出',
    x: '50%',
    y: '50%',
    fontSize: 64,
    fontFamily: 'PatuaOne',
    color: '#9b59b6',
    textAlign: 'center',
    duration: 4,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.3,
    startTime: 4,
    animations: [
      'slideInLeft',
      'slideOutRight',
    ],
  });
  layer.addElement(text5);

  const outputPath = path.join(__dirname, '../output/test-slide-animation.mp4');
  console.log('开始导出视频...');
  console.log(`总时长: ${videoMaker.duration} 秒`);
  
  await videoMaker.export(outputPath);
  console.log(`✅ 视频导出完成: ${outputPath}`);

  videoMaker.destroy();
}

testSlideAnimation().catch(console.error);


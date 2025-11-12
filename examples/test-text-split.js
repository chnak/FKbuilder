/**
 * 测试文本分割功能
 */
import { VideoMaker } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 添加全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未捕获的 Promise rejection:', reason);
  if (reason && reason.stack) {
    console.error('错误堆栈:', reason.stack);
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
});

async function testTextSplit() {
  console.log('创建文本分割测试...\n');

  // 创建视频制作器
  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 8,
    backgroundColor: '#1a1a1a',
  });

  const layer = videoMaker.createElementLayer();

  // 测试 1: 按字符分割 (letter)
  const text1 = new TextElement({
    text: '逐字显示',
    x: '50%',
    y: '25%',
    fontSize: 72,
    fontFamily: 'PatuaOne',
    color: '#ffffff',
    textAlign: 'center',
    duration: 5,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.3,
    animations: [
      {
        type: 'fade',
        startTime: 0,
        duration: 0.3,
        fromOpacity: 0,
        toOpacity: 1,
        easing: 'easeOutQuad',
      },
    ],
  });
  layer.addElement(text1);

  // 测试 2: 按单词分割 (word)
  const text2 = new TextElement({
    text: 'Hello World 你好世界',
    x: '50%',
    y: '50%',
    fontSize: 64,
    fontFamily: 'PatuaOne',
    color: '#4ecdc4',
    textAlign: 'center',
    duration: 5,
    startTime: 1,
    split: 'word',
    splitDelay: 0.15,
    splitDuration: 0.4,
    animations: [
      {
        type: 'fade',
        startTime: 0,
        duration: 0.4,
        fromOpacity: 0,
        toOpacity: 1,
        easing: 'easeOutQuad',
      },
      {
        type: 'move',
        startTime: 0,
        duration: 0.4,
        fromX: 0,
        fromY: -50,
        toX: 0,
        toY: 0,
        easing: 'easeOutBack',
      },
    ],
  });
  layer.addElement(text2);

  // 测试 3: 按行分割 (line)
  const text3 = new TextElement({
    text: '第一行文本\n第二行文本\n第三行文本',
    x: '50%',
    y: '75%',
    fontSize: 56,
    fontFamily: 'PatuaOne',
    color: '#f39c12',
    textAlign: 'center',
    duration: 5,
    startTime: 2,
    split: 'line',
    splitDelay: 0.2,
    splitDuration: 0.5,
    animations: [
      {
        type: 'fade',
        startTime: 0,
        duration: 0.5,
        fromOpacity: 0,
        toOpacity: 1,
        easing: 'easeInOutQuad',
      },
      {
        type: 'transform',
        startTime: 0,
        duration: 0.5,
        from: { scaleX: 0.5, scaleY: 0.5 },
        to: { scaleX: 1, scaleY: 1 },
        easing: 'easeOutBack',
      },
    ],
  });
  layer.addElement(text3);

  // 测试 4: 无分割（对比）
  const text4 = new TextElement({
    text: '无分割文本',
    x: '50%',
    y: '90%',
    fontSize: 48,
    fontFamily: 'PatuaOne',
    color: '#95a5a6',
    textAlign: 'center',
    duration: 3,
    startTime: 4,
    animations: [
      {
        type: 'fade',
        startTime: 0,
        duration: 1,
        fromOpacity: 0,
        toOpacity: 1,
        easing: 'easeOutQuad',
      },
    ],
  });
  layer.addElement(text4);

  const outputPath = path.join(__dirname, '../output/test-text-split.mp4');
  console.log('开始导出视频...');
  console.log(`总时长: ${videoMaker.duration} 秒`);
  
  await videoMaker.export(outputPath);
  console.log(`✅ 视频导出完成: ${outputPath}`);

  videoMaker.destroy();
}

testTextSplit().catch(console.error);


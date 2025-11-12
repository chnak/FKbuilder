/**
 * 简单的文本分割测试
 */
import { VideoMaker } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSimpleSplit() {
  console.log('创建简单文本分割测试...\n');

  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 5,
    backgroundColor: '#000000',
  });

  const layer = videoMaker.createElementLayer();

  // 简单的淡入动画测试
  const text = new TextElement({
    text: '测试',
    x: '50%',
    y: '50%',
    fontSize: 100,
    fontFamily: 'PatuaOne',
    color: '#ffffff',
    textAlign: 'center',
    duration: 5,
    split: 'letter',
    splitDelay: 0.2,
    splitDuration: 0.5,
    animations: [
      {
        type: 'fade',
        startTime: 0,
        duration: 0.5,
        fromOpacity: 0,
        toOpacity: 1,
        easing: 'easeOutQuad',
      },
    ],
  });
  
  // 调试：打印分割后的片段信息
  console.log('分割后的片段数量:', text.segments.length);
  console.log('原始动画配置:', text.originalAnimations);
  if (text.segments.length > 0) {
    console.log('第一个片段:', {
      text: text.segments[0].config.text,
      startTime: text.segments[0].startTime,
      endTime: text.segments[0].endTime,
      animations: text.segments[0].animations.length,
      originalAnimations: text.segments[0].originalAnimations,
    });
    if (text.segments[0].animations.length > 0) {
      console.log('第一个片段的动画:', {
        startTime: text.segments[0].animations[0].startTime,
        endTime: text.segments[0].animations[0].endTime,
        duration: text.segments[0].animations[0].config.duration,
      });
    }
  }
  layer.addElement(text);

  const outputPath = path.join(__dirname, '../output/test-simple-split.mp4');
  console.log('开始导出视频...');
  
  await videoMaker.export(outputPath);
  console.log(`✅ 视频导出完成: ${outputPath}`);

  videoMaker.destroy();
}

testSimpleSplit().catch(console.error);


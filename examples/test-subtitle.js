/**
 * 测试字幕元素功能
 */
import { VideoMaker } from '../src/index.js';
import { SubtitleElement } from '../src/elements/SubtitleElement.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSubtitle() {
  console.log('创建字幕测试...\n');

  const videoMaker = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 15,
    backgroundColor: '#1a1a1a',
  });

  const layer = videoMaker.createElementLayer();

  // 测试字幕元素：根据时长自动分割文本
  const subtitle = new SubtitleElement({
    text: '这是第一段字幕。这是第二段字幕！这是第三段字幕？',
    fontSize: 64,
    fontFamily: 'PatuaOne',
    color: '#ffffff',
    position: 'center',
    textAlign: 'center',
    duration: 10, // 总时长 10 秒
    startTime: 1, // 从第 1 秒开始
    // 可以启用分割效果
    split: 'letter', // 按字符分割
    splitDelay: 0.05,
    splitDuration: 0.2,
    animations: [
      {
        type: 'fade',
        startTime: 0,
        duration: 0.2,
        fromOpacity: 0,
        toOpacity: 1,
        easing: 'easeOutQuad',
      },
    ],
  });
  layer.addElement(subtitle);

  const outputPath = path.join(__dirname, '../output/test-subtitle.mp4');
  console.log('开始导出视频...');
  console.log(`总时长: ${videoMaker.duration} 秒`);
  
  await videoMaker.export(outputPath);
  console.log(`✅ 视频导出完成: ${outputPath}`);

  videoMaker.destroy();
}

testSubtitle().catch(console.error);


// 测试导出 MP4 视频（使用 Paper.js）
import { VideoMaker } from './src/core/VideoMaker.js';
import { TextElement } from './src/elements/TextElement.js';
import { RectElement } from './src/elements/RectElement.js';
import { CircleElement } from './src/elements/CircleElement.js';

async function testExportMP4() {
  try {
    console.log('开始测试导出 MP4 视频...');

    // 创建合成
    const video = new VideoMaker({
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5, // 5秒
      backgroundColor: '#1a1a1a',
    });

    // 创建元素图层
    const layer = video.createElementLayer({ zIndex: 1 });

    // 添加文本元素（带动画）
    const textElement = new TextElement({
      text: 'Hello Paper.js!',
      x: '50%',
      y: '40%',
      fontSize: 80,
      color: '#ffffff',
      fontFamily: 'PatuaOne',
      textAlign: 'center',
      duration: 5,
      animations: [
        {
          type: 'fadeIn',
          duration: 1,
          delay: 0,
        },
        {
          type: 'fadeOut',
          duration: 1,
          delay: -1, // 在结束前1秒开始
        },
      ],
    });
    layer.addElement(textElement);

    // 添加矩形元素（带动画）
    const rectElement = new RectElement({
      x: '50%',
      y: '60%',
      width: 400,
      height: 100,
      bgcolor: '#ff6b6b',
      borderRadius: 10,
      duration: 5,
      animations: [
        {
          type: 'slideInLeft',
          duration: 1.5,
          delay: 0.5,
        },
      ],
    });
    layer.addElement(rectElement);

    // 添加圆形元素（带动画）
    const circleElement = new CircleElement({
      x: '50%',
      y: '80%',
      radius: 50,
      bgcolor: '#4ecdc4',
      duration: 5,
      animations: [
        {
          type: 'bounceIn',
          duration: 2,
          delay: 1,
        },
      ],
    });
    layer.addElement(circleElement);

    // 导出视频
    const outputPath = './output/test-paper-video.mp4';
    console.log('开始导出视频到:', outputPath);
    
    const startTime = Date.now();
    await video.export(outputPath, {
      fps: 30,
      format: 'mp4',
    });
    const endTime = Date.now();
    
    console.log(`视频导出完成: ${outputPath}`);
    console.log(`导出耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);

  } catch (error) {
    console.error('导出失败:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testExportMP4();


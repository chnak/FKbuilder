// 测试 Paper.js 渲染
import { VideoMaker } from './src/core/VideoMaker.js';
import { TextElement } from './src/elements/TextElement.js';
import { RectElement } from './src/elements/RectElement.js';
import { CircleElement } from './src/elements/CircleElement.js';

async function testPaperRendering() {
  try {
    console.log('开始测试 Paper.js 渲染...');

    // 创建合成
    const video = new VideoMaker({
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 3,
      backgroundColor: '#1a1a1a',
    });

    // 创建元素图层
    const layer = video.createElementLayer({ zIndex: 1 });

    // 添加文本元素
    const textElement = new TextElement({
      text: 'Hello Paper.js!',
      x: '50%',
      y: '40%',
      fontSize: 80,
      color: '#ffffff',
      fontFamily: 'PatuaOne',
      textAlign: 'center',
      duration: 3,
    });
    layer.addElement(textElement);

    // 添加矩形元素
    const rectElement = new RectElement({
      x: '50%',
      y: '60%',
      width: 400,
      height: 100,
      bgcolor: '#ff6b6b',
      borderRadius: 10,
      duration: 3,
    });
    layer.addElement(rectElement);

    // 添加圆形元素
    const circleElement = new CircleElement({
      x: '50%',
      y: '80%',
      radius: 50,
      bgcolor: '#4ecdc4',
      duration: 3,
    });
    layer.addElement(circleElement);

    // 导出第一帧测试
    console.log('渲染第一帧...');
    await video.renderer.init();
    const canvas = await video.renderer.renderFrame(
      video.timeline.getLayers(),
      0,
      video.backgroundColor
    );

    // 保存测试图片
    const fs = (await import('fs-extra')).default;
    await fs.ensureDir('output');
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile('output/test-paper-frame.png', buffer);
    console.log('测试图片已保存: output/test-paper-frame.png');

    // 测试导出帧序列
    console.log('测试导出帧序列...');
    const framePaths = await video.exportFrames({
      amount: 30, // 1秒
      directory: './output/test-frames',
      onProgress: (current, total) => {
        if (current % 10 === 0 || current === total) {
          console.log(`导出进度: ${current}/${total}`);
        }
      },
    });

    console.log(`成功导出 ${framePaths.length} 帧`);
    console.log('Paper.js 渲染测试完成！');

  } catch (error) {
    console.error('测试失败:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testPaperRendering();


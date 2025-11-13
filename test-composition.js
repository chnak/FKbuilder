// 测试嵌套合成（CompositionElement）
import { VideoMaker } from './src/core/VideoMaker.js';
import { CompositionElement } from './src/elements/CompositionElement.js';
import { TextElement } from './src/elements/TextElement.js';
import { RectElement } from './src/elements/RectElement.js';
import { CircleElement } from './src/elements/CircleElement.js';

async function testComposition() {
  try {
    console.log('开始测试嵌套合成...');

    // 创建主合成
    const mainVideo = new VideoMaker({
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      backgroundColor: '#1a1a1a',
    });

    // 创建嵌套合成
    const nestedVideo = new VideoMaker({
      width: 800,
      height: 600,
      fps: 30,
      duration: 5,
      backgroundColor: '#2a2a2a',
    });

    // 在嵌套合成中添加元素
    const nestedLayer = nestedVideo.createElementLayer({ zIndex: 1 });
    
    const nestedText = new TextElement({
      text: 'Nested Composition',
      x: '50%',
      y: '50%',
      fontSize: 60,
      color: '#ffffff',
      textAlign: 'center',
      duration: 5,
    });
    nestedLayer.addElement(nestedText);

    const nestedRect = new RectElement({
      x: '50%',
      y: '70%',
      width: 300,
      height: 80,
      bgcolor: '#4ecdc4',
      borderRadius: 10,
      duration: 5,
    });
    nestedLayer.addElement(nestedRect);

    // 在主合成中创建图层
    const mainLayer = mainVideo.createElementLayer({ zIndex: 1 });

    // 添加嵌套合成元素（先添加，确保在底层）
    const compositionElement = new CompositionElement({
      composition: nestedVideo,
      x: '50%',
      y: '60%',
      width: 800,
      height: 600,
      duration: 5,
      startTime: 0,
      zIndex: 0, // 确保在文本下方
    });
    mainLayer.addElement(compositionElement);

    // 添加主合成的文本（后添加，确保在上层）
    const mainText = new TextElement({
      text: 'Main Composition',
      x: '50%',
      y: '20%',
      fontSize: 80,
      color: '#ffffff',
      textAlign: 'center',
      duration: 5,
      zIndex: 1, // 确保在嵌套合成上方
    });
    mainLayer.addElement(mainText);

    // 测试渲染第一帧
    console.log('测试渲染第一帧...');
    await mainVideo.renderer.init();
    
    // 先渲染嵌套合成
    console.log('渲染嵌套合成...');
    await nestedVideo.renderer.init();
    const nestedCanvas = await nestedVideo.renderer.renderFrame(
      nestedVideo.timeline.getLayers(),
      0,
      nestedVideo.backgroundColor
    );
    console.log('嵌套合成渲染完成');

    // 渲染主合成
    console.log('渲染主合成...');
    const mainCanvas = await mainVideo.renderer.renderFrame(
      mainVideo.timeline.getLayers(),
      0,
      mainVideo.backgroundColor
    );
    console.log('主合成渲染完成');

    // 保存测试图片
    const fs = (await import('fs-extra')).default;
    await fs.ensureDir('output');
    
    // 保存嵌套合成图片
    const nestedBuffer = nestedCanvas.toBuffer('image/png');
    await fs.writeFile('output/test-nested-composition.png', nestedBuffer);
    console.log('嵌套合成图片已保存: output/test-nested-composition.png');

    // 保存主合成图片
    const mainBuffer = mainCanvas.toBuffer('image/png');
    await fs.writeFile('output/test-main-composition.png', mainBuffer);
    console.log('主合成图片已保存: output/test-main-composition.png');

    // 测试导出视频
    console.log('\n开始导出视频...');
    const outputPath = './output/test-composition-video.mp4';
    await mainVideo.export(outputPath, {
      fps: 30,
      format: 'mp4',
    });
    console.log(`视频导出完成: ${outputPath}`);

    console.log('\n嵌套合成测试完成！');

  } catch (error) {
    console.error('测试失败:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testComposition();


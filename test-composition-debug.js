// 调试嵌套合成显示问题
import { VideoMaker } from './src/core/VideoMaker.js';
import { CompositionElement } from './src/elements/CompositionElement.js';
import { TextElement } from './src/elements/TextElement.js';
import { RectElement } from './src/elements/RectElement.js';

async function testCompositionDebug() {
  try {
    console.log('开始调试嵌套合成...');

    // 创建主合成
    const mainVideo = new VideoMaker({
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 3,
      backgroundColor: '#1a1a1a',
    });

    // 创建嵌套合成
    const nestedVideo = new VideoMaker({
      width: 400,
      height: 300,
      fps: 30,
      duration: 3,
      backgroundColor: '#ff0000', // 红色背景，更容易看到
    });

    // 在嵌套合成中添加元素
    const nestedLayer = nestedVideo.createElementLayer({ zIndex: 1 });
    
    const nestedText = new TextElement({
      text: 'NESTED',
      x: '50%',
      y: '50%',
      fontSize: 60,
      color: '#ffffff',
      textAlign: 'center',
      duration: 3,
    });
    nestedLayer.addElement(nestedText);

    // 在主合成中创建图层
    const mainLayer = mainVideo.createElementLayer({ zIndex: 1 });

    // 添加主合成的文本
    const mainText = new TextElement({
      text: 'Main Composition',
      x: '50%',
      y: '20%',
      fontSize: 80,
      color: '#ffffff',
      textAlign: 'center',
      duration: 3,
    });
    mainLayer.addElement(mainText);

    // 添加嵌套合成元素
    const compositionElement = new CompositionElement({
      composition: nestedVideo,
      x: '50%',
      y: '60%',
      width: 400,
      height: 300,
      duration: 3,
      startTime: 0,
    });
    mainLayer.addElement(compositionElement);

    // 渲染第一帧
    console.log('渲染第一帧...');
    await mainVideo.renderer.init();
    
    // 先单独渲染嵌套合成看看
    console.log('单独渲染嵌套合成...');
    await nestedVideo.renderer.init();
    const nestedCanvas = await nestedVideo.renderer.renderFrame(
      nestedVideo.timeline.getLayers(),
      0,
      nestedVideo.backgroundColor
    );
    
    // 检查嵌套合成 canvas 是否有内容
    const nestedCtx = nestedCanvas.getContext('2d');
    const nestedImageData = nestedCtx.getImageData(0, 0, nestedCanvas.width, nestedCanvas.height);
    let hasContent = false;
    for (let i = 3; i < nestedImageData.data.length; i += 4) {
      if (nestedImageData.data[i] > 0) { // alpha > 0
        hasContent = true;
        break;
      }
    }
    console.log('嵌套合成 canvas 有内容:', hasContent);
    
    // 渲染主合成
    console.log('渲染主合成...');
    const mainCanvas = await mainVideo.renderer.renderFrame(
      mainVideo.timeline.getLayers(),
      0,
      mainVideo.backgroundColor
    );
    
    // 检查主合成 canvas 是否有嵌套合成内容
    const mainCtx = mainCanvas.getContext('2d');
    const mainImageData = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    let hasNestedContent = false;
    // 检查中心区域（嵌套合成应该在中心）
    const centerX = 960;
    const centerY = 648; // 60% of 1080
    const checkSize = 200;
    for (let y = centerY - checkSize; y < centerY + checkSize; y++) {
      for (let x = centerX - checkSize; x < centerX + checkSize; x++) {
        if (x >= 0 && x < mainCanvas.width && y >= 0 && y < mainCanvas.height) {
          const idx = (y * mainCanvas.width + x) * 4;
          if (mainImageData.data[idx + 0] > 200 || mainImageData.data[idx + 1] < 50) { // 红色或非黑色
            hasNestedContent = true;
            break;
          }
        }
      }
      if (hasNestedContent) break;
    }
    console.log('主合成 canvas 中心区域有嵌套合成内容:', hasNestedContent);

    // 保存测试图片
    const fs = (await import('fs-extra')).default;
    await fs.ensureDir('output');
    
    const nestedBuffer = nestedCanvas.toBuffer('image/png');
    await fs.writeFile('output/test-nested-debug.png', nestedBuffer);
    console.log('嵌套合成图片已保存: output/test-nested-debug.png');

    const mainBuffer = mainCanvas.toBuffer('image/png');
    await fs.writeFile('output/test-main-debug.png', mainBuffer);
    console.log('主合成图片已保存: output/test-main-debug.png');

    console.log('\n调试完成！');

  } catch (error) {
    console.error('调试失败:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testCompositionDebug();


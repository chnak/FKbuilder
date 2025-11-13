// 测试 Composition 位置计算
import { VideoMaker } from './src/core/VideoMaker.js';
import { CompositionElement } from './src/elements/CompositionElement.js';
import { TextElement } from './src/elements/TextElement.js';
import { RectElement } from './src/elements/RectElement.js';

async function testCompositionPosition() {
  try {
    console.log('开始测试 Composition 位置...');

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
      backgroundColor: '#2a2a2a',
    });

    // 在嵌套合成中添加元素
    const nestedLayer = nestedVideo.createElementLayer({ zIndex: 1 });
    
    const nestedText = new TextElement({
      text: 'Nested',
      x: '50%',
      y: '50%',
      fontSize: 40,
      color: '#ffffff',
      textAlign: 'center',
      duration: 3,
    });
    nestedLayer.addElement(nestedText);

    // 在主合成中创建图层
    const mainLayer = mainVideo.createElementLayer({ zIndex: 1 });

    // 添加主合成的参考文本（左上角）
    const mainText1 = new TextElement({
      text: 'Top-Left Reference',
      x: 100,
      y: 100,
      fontSize: 30,
      color: '#ffffff',
      duration: 3,
    });
    mainLayer.addElement(mainText1);

    // 添加主合成的参考文本（中心）
    const mainText2 = new TextElement({
      text: 'Center Reference',
      x: '50%',
      y: '50%',
      fontSize: 30,
      color: '#ffffff',
      textAlign: 'center',
      duration: 3,
    });
    mainLayer.addElement(mainText2);

    // 测试1: 使用绝对位置（左上角）
    console.log('测试1: 绝对位置 (100, 100)');
    const comp1 = new CompositionElement({
      composition: nestedVideo,
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      anchor: [0, 0], // 左上角锚点
      duration: 3,
    });
    mainLayer.addElement(comp1);

    // 测试2: 使用相对位置（中心）
    console.log('测试2: 相对位置 (50%, 50%)');
    const comp2 = new CompositionElement({
      composition: nestedVideo,
      x: '50%',
      y: '50%',
      width: 400,
      height: 300,
      anchor: [0.5, 0.5], // 中心锚点
      duration: 3,
    });
    mainLayer.addElement(comp2);

    // 测试3: 使用相对位置（右下角）
    console.log('测试3: 相对位置 (90%, 90%)');
    const comp3 = new CompositionElement({
      composition: nestedVideo,
      x: '90%',
      y: '90%',
      width: 400,
      height: 300,
      anchor: [1, 1], // 右下角锚点
      duration: 3,
    });
    mainLayer.addElement(comp3);

    // 渲染第一帧
    console.log('\n渲染第一帧...');
    await mainVideo.renderer.init();
    const canvas = await mainVideo.renderer.renderFrame(
      mainVideo.timeline.getLayers(),
      0,
      mainVideo.backgroundColor
    );

    // 保存测试图片
    const fs = (await import('fs-extra')).default;
    await fs.ensureDir('output');
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile('output/test-composition-position.png', buffer);
    console.log('测试图片已保存: output/test-composition-position.png');

    console.log('\n位置测试完成！');

  } catch (error) {
    console.error('测试失败:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testCompositionPosition();


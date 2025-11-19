/**
 * 组件功能测试 (CommonJS 版本)
 * 运行方式: node examples/test-component-commonjs.cjs
 */
const fkbuilder = require('../dist/cjs/index.cjs');
const { VideoBuilder, Component } = fkbuilder;
const path = require('path');
const fs = require('fs');

async function testComponent() {
  console.log('🎬 组件功能测试 (CommonJS)\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  // 创建一个可复用的标题组件（使用百分比单位）
  const headerComponent = new Component({
    name: 'Header',
    width: '100%',  // 使用百分比，相对于父容器宽度
    height: '18.5vh', // 使用 vh 单位，相对于父容器高度
    x: '50%',      // 相对于父容器居中
    y: 100,        // 距离顶部 100px
    anchor: [0.5, 0], // 锚点在顶部中心
    startTime: 0,
    duration: 5,
    zIndex: 10,
  });

  // 在组件内添加元素（使用相对坐标）
  headerComponent
    .addBackground({ color: '#2e3b3c' })
    .addText({
      text: '组件标题',
      x: '50%',    // 相对于组件居中
      y: '50%',    // 相对于组件居中
      fontSize: 60,
      color: '#5acbed',
      textAlign: 'center',
      startTime: 0,
      duration: 5,
      animations: ['fadeIn'],
    });

  // 创建一个可复用的卡片组件（使用 vw 和 vh 单位）
  const cardComponent = new Component({
    name: 'Card',
    width: '20.8vw',  // 使用 vw 单位，约等于 400px (400/1920*100)
    height: '27.8vh', // 使用 vh 单位，约等于 300px (300/1080*100)
    x: '50%',
    y: '50%',
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 5,
    zIndex: 5,
  });

  // 在卡片组件内添加元素
  cardComponent
    .addBackground({ color: '#e6e9e6' })
    .addRect({
      x: '50%',
      y: '50%',
      width: '80%',
      height: '40%',
      fillColor: '#cbe7e8',
      strokeColor: '#208ab7',
      strokeWidth: 3,
      startTime: 0,
      duration: 5,
      animations: ['zoomIn'],
    })
    .addText({
      text: '卡片内容',
      x: '50%',
      y: '50%',
      fontSize: 36,
      color: '#0d659d',
      textAlign: 'center',
      startTime: 0.5,
      duration: 4.5,
      animations: ['fadeIn'],
    });

  // 创建主轨道
  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 场景1：使用标题组件
  const scene1 = mainTrack.createScene({
    duration: 5,
    startTime: 0,
  });
  scene1.addBackground({ color: '#1a1a2e' });
  scene1.addComponent(headerComponent); // 添加组件到场景

  // 场景2：使用卡片组件（复用）
  const scene2 = mainTrack.createScene({
    duration: 5,
    startTime: 5,
  });
  scene2.addBackground({ color: '#1a1a2e' });
  scene2.addComponent(cardComponent);

  // 场景3：同时使用多个组件（展示组件复用）
  const scene3 = mainTrack.createScene({
    duration: 5,
    startTime: 10,
  });
  scene3.addBackground({ color: '#1a1a2e' });
  
  // 复用标题组件，但位置不同（创建新实例，复制配置）
  const headerComponent2 = new Component({
    name: 'Header2',
    width: headerComponent.width,
    height: headerComponent.height,
    x: '50%',
    y: 50,  // 不同的位置
    anchor: headerComponent.anchor,
    startTime: 0,
    duration: 5,
    zIndex: 10,
  });
  headerComponent2.addBackground({ color: '#2e3b3c' });
  headerComponent2.addText({
    text: '组件标题（复用）',
    x: '50%',
    y: '50%',
    fontSize: 60,
    color: '#5acbed',
    textAlign: 'center',
    startTime: 0,
    duration: 5,
    animations: ['fadeIn'],
  });
  scene3.addComponent(headerComponent2);
  
  // 复用卡片组件，但位置和时间不同（创建新实例）
  const cardComponent2 = new Component({
    name: 'Card2',
    width: cardComponent.width,
    height: cardComponent.height,
    x: '25%',  // 左侧
    y: '60%',
    anchor: cardComponent.anchor,
    startTime: 1,
    duration: 4,
    zIndex: 5,
  });
  cardComponent2.addBackground({ color: '#e6e9e6' });
  cardComponent2.addRect({
    x: '50%',
    y: 50,
    width: 350,
    height: 200,
    fillColor: '#cbe7e8',
    strokeColor: '#208ab7',
    strokeWidth: 3,
    startTime: 0,
    duration: 4,
    animations: ['zoomIn'],
  });
  cardComponent2.addText({
    text: '左侧卡片',
    x: '50%',
    y: '50%',
    fontSize: 36,
    color: '#0d659d',
    textAlign: 'center',
    startTime: 0.5,
    duration: 3.5,
    animations: ['fadeIn'],
  });
  scene3.addComponent(cardComponent2);
  
  // 再次复用卡片组件，位置在右侧（创建新实例）
  const cardComponent3 = new Component({
    name: 'Card3',
    width: cardComponent.width,
    height: cardComponent.height,
    x: '75%',  // 右侧
    y: '60%',
    anchor: cardComponent.anchor,
    startTime: 2,
    duration: 3,
    zIndex: 5,
  });
  cardComponent3.addBackground({ color: '#e6e9e6' });
  cardComponent3.addRect({
    x: '50%',
    y: 50,
    width: 350,
    height: 200,
    fillColor: '#cbe7e8',
    strokeColor: '#208ab7',
    strokeWidth: 3,
    startTime: 0,
    duration: 3,
    animations: ['zoomIn'],
  });
  cardComponent3.addText({
    text: '右侧卡片',
    x: '50%',
    y: '50%',
    fontSize: 36,
    color: '#0d659d',
    textAlign: 'center',
    startTime: 0.5,
    duration: 2.5,
    animations: ['fadeIn'],
  });
  scene3.addComponent(cardComponent3);

  // 场景4：直接在轨道中添加组件（不通过场景）
  const trackComponent = new Component({
    name: 'TrackComponent',
    width: 300,
    height: 150,
    x: '50%',
    y: 900,
    anchor: [0.5, 0.5],
    startTime: 15,  // 在轨道中的绝对时间
    duration: 3,
    zIndex: 20,
  });
  trackComponent
    .addBackground({ color: '#208ab7' })
    .addText({
      text: '轨道组件',
      x: '50%',
      y: '50%',
      fontSize: 40,
      color: '#ffffff',
      textAlign: 'center',
      startTime: 0,
      duration: 3,
      animations: ['fadeIn', 'fadeOut'],
    });
  mainTrack.addComponent(trackComponent);

  // 场景5：测试组件内元素的相对位置
  const scene5 = mainTrack.createScene({
    duration: 5,
    startTime: 18,
  });
  scene5.addBackground({ color: '#1a1a2e' });
  
  // 创建一个包含多个元素的组件（使用百分比单位）
  const multiElementComponent = new Component({
    name: 'MultiElement',
    width: '41.7%',  // 使用百分比，约等于 800px (800/1920*100)
    height: '55.6%', // 使用百分比，约等于 600px (600/1080*100)
    x: '50%',
    y: '50%',
    anchor: [0.5, 0.5],
    startTime: 0,
    duration: 5,
  });
  
  multiElementComponent
    .addBackground({ color: '#2e3b3c' })
    .addRect({
      x: '25%',  // 相对于组件左侧
      y: '25%',
      width: 150,
      height: 150,
      fillColor: '#5acbed',
      startTime: 0,
      duration: 5,
      animations: ['fadeIn'],
    })
    .addRect({
      x: '75%',  // 相对于组件右侧
      y: '25%',
      width: 150,
      height: 150,
      fillColor: '#208ab7',
      startTime: 0.5,
      duration: 4.5,
      animations: ['fadeIn'],
    })
    .addText({
      text: '左上',
      x: '25%',
      y: '25%',
      fontSize: 32,
      color: '#ffffff',
      textAlign: 'center',
      startTime: 1,
      duration: 4,
    })
    .addText({
      text: '右上',
      x: '75%',
      y: '25%',
      fontSize: 32,
      color: '#ffffff',
      textAlign: 'center',
      startTime: 1.5,
      duration: 3.5,
    })
    .addText({
      text: '组件中心',
      x: '50%',
      y: '50%',
      fontSize: 48,
      color: '#5acbed',
      textAlign: 'center',
      startTime: 2,
      duration: 3,
      animations: ['zoomIn'],
    });
  
  scene5.addComponent(multiElementComponent);

  // 导出视频
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'test-component-commonjs.mp4');

  console.log('开始渲染视频...\n');
  const startTime = Date.now();

  try {
    await builder.render(outputPath, {
      parallel: false, // CommonJS 模式下使用串行渲染
      usePipe: true,
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ 视频渲染完成！`);
    console.log(`输出文件: ${outputPath}`);
    console.log(`渲染耗时: ${duration} 秒`);
  } catch (error) {
    console.error('\n❌ 渲染失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

// 运行测试
testComponent().catch(error => {
  console.error('❌ 测试失败:', error.message);
  if (error.stack) {
    console.error('错误堆栈:', error.stack);
  }
  process.exit(1);
});


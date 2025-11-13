import { VideoBuilder } from '../src/index.js';

/**
 * 测试 Scene 的元素
 */
async function testSceneElements() {
  console.log('=== 测试 Scene 的元素 ===');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground({color: '#cccccc'})
    .addText({
      text: "测试文本",
      color: "#000000",
      fontSize: 48,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
      zIndex: 1,
    });

  console.log('Scene 的元素数:', scene.elements.length);
  for (const { type, element } of scene.elements) {
    console.log(`  元素类型: ${type}, 元素实例类型: ${element.type}, zIndex: ${element.zIndex}`);
    if (element.type === 'text') {
      console.log(`    文本: ${element.text}, 颜色: ${element.color}`);
    }
  }

  // 构建 Scene
  const sceneConfig = scene.build();
  console.log('\nScene 配置:');
  console.log(`  类型: ${sceneConfig.type}`);
  console.log(`  子元素数: ${sceneConfig.elements ? sceneConfig.elements.length : 0}`);
  if (sceneConfig.elements) {
    for (const elementConfig of sceneConfig.elements) {
      console.log(`    子元素: ${elementConfig.type}, zIndex: ${elementConfig.zIndex}`);
      if (elementConfig.type === 'text') {
        console.log(`      文本: ${elementConfig.text}, 颜色: ${elementConfig.color}`);
      }
    }
  }
}

testSceneElements().catch(console.error);


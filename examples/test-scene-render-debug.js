import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';

/**
 * 测试 Scene 的渲染逻辑
 */
async function testSceneRenderDebug() {
  console.log('=== 测试 Scene 渲染逻辑 ===');
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: '#000000',
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  const scene = mainTrack.createScene({ duration: 5 })
    .addBackground()
    .addText({
      text: "测试文本",
      color: "#ffffff",
      fontSize: 48,
      x: "50%",
      y: "50%",
      textAlign: "center",
      duration: 5,
      startTime: 0,
    });

  // 构建 Scene
  scene.build();
  
  console.log('检查 Scene 结构:');
  console.log(`  Scene 图层数: ${scene.timeline.getLayers().length}`);
  for (const layer of scene.timeline.getLayers()) {
    console.log(`    图层: ${layer.type}, zIndex: ${layer.zIndex}`);
    if (layer.elements) {
      console.log(`      元素数: ${layer.elements.length}`);
      for (const element of layer.elements) {
        console.log(`        元素: ${element.type}, startTime: ${element.startTime}, endTime: ${element.endTime}, visible: ${element.visible}`);
        if (element.isActiveAtTime) {
          console.log(`          isActiveAtTime(1): ${element.isActiveAtTime(1)}`);
        }
      }
    }
  }
  
  // 测试 Scene 单独渲染
  console.log('\n渲染 Scene 第一帧...');
  if (!scene.renderer) {
    const { Renderer } = await import('../src/core/Renderer.js');
    scene.renderer = new Renderer({
      width: scene.width,
      height: scene.height,
      fps: scene.fps,
    });
  }
  await scene.renderer.init();
  
  const sceneCanvas = await scene.renderer.renderFrame(
    scene.timeline.getLayers(),
    1, // 渲染第1秒
    scene.backgroundColor || 'transparent'
  );
  
  // 检查 Scene canvas 内容
  const sceneCtx = sceneCanvas.getContext('2d');
  const sceneImageData = sceneCtx.getImageData(0, 0, sceneCanvas.width, sceneCanvas.height);
  let sceneHasContent = false;
  let scenePixelCount = 0;
  for (let i = 0; i < sceneImageData.data.length; i += 4) {
    if (sceneImageData.data[i + 3] > 0 && 
        (sceneImageData.data[i] > 10 || sceneImageData.data[i + 1] > 10 || sceneImageData.data[i + 2] > 10)) {
      sceneHasContent = true;
      scenePixelCount++;
    }
  }
  
  console.log(`Scene Canvas 有内容: ${sceneHasContent}, 像素数: ${scenePixelCount}`);
  
  // 保存 Scene canvas
  await fs.ensureDir('output');
  const sceneBuffer = sceneCanvas.toBuffer('image/png');
  await fs.writeFile('output/test-scene-render-debug.png', sceneBuffer);
  console.log('Scene canvas 已保存: output/test-scene-render-debug.png');
  
  scene.destroy();
}

testSceneRenderDebug().catch(console.error);


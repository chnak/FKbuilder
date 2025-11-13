import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';

/**
 * 测试 Track -> Scene 的渲染
 */
async function testTrackSceneDebug() {
  console.log('=== 测试 Track -> Scene 渲染 ===');
  
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
  
  // 构建 Track
  mainTrack.build();
  
  console.log('检查 Track 结构:');
  console.log(`  Track 图层数: ${mainTrack.timeline.getLayers().length}`);
  for (const layer of mainTrack.timeline.getLayers()) {
    console.log(`    图层: ${layer.type}, zIndex: ${layer.zIndex}, startTime: ${layer.startTime}, endTime: ${layer.endTime}`);
    if (layer.type === 'composition' && layer.composition) {
      console.log(`      嵌套合成（Scene）图层数: ${layer.composition.timeline.getLayers().length}`);
      for (const sceneLayer of layer.composition.timeline.getLayers()) {
        console.log(`        场景图层: ${sceneLayer.type}, zIndex: ${sceneLayer.zIndex}`);
        if (sceneLayer.elements) {
          console.log(`          场景图层元素数: ${sceneLayer.elements.length}`);
        }
      }
    }
  }
  
  // 测试 Track 单独渲染
  console.log('\n渲染 Track 第一帧...');
  if (!mainTrack.renderer) {
    const { Renderer } = await import('../src/core/Renderer.js');
    mainTrack.renderer = new Renderer({
      width: mainTrack.width,
      height: mainTrack.height,
      fps: mainTrack.fps,
    });
  }
  await mainTrack.renderer.init();
  
  const trackCanvas = await mainTrack.renderer.renderFrame(
    mainTrack.timeline.getLayers(),
    1, // 渲染第1秒
    mainTrack.backgroundColor || 'transparent'
  );
  
  // 检查 Track canvas 内容
  const trackCtx = trackCanvas.getContext('2d');
  const trackImageData = trackCtx.getImageData(0, 0, trackCanvas.width, trackCanvas.height);
  let trackHasContent = false;
  let trackPixelCount = 0;
  for (let i = 0; i < trackImageData.data.length; i += 4) {
    if (trackImageData.data[i + 3] > 0 && 
        (trackImageData.data[i] > 10 || trackImageData.data[i + 1] > 10 || trackImageData.data[i + 2] > 10)) {
      trackHasContent = true;
      trackPixelCount++;
    }
  }
  
  console.log(`Track Canvas 有内容: ${trackHasContent}, 像素数: ${trackPixelCount}`);
  
  // 保存 Track canvas
  await fs.ensureDir('output');
  const trackBuffer = trackCanvas.toBuffer('image/png');
  await fs.writeFile('output/test-track-scene-debug.png', trackBuffer);
  console.log('Track canvas 已保存: output/test-track-scene-debug.png');
  
  mainTrack.destroy();
}

testTrackSceneDebug().catch(console.error);


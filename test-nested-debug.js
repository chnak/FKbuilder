// 详细调试嵌套合成渲染（使用 CompositionLayer）
import { VideoMaker } from './src/core/VideoMaker.js';
import { CompositionLayer } from './src/layers/CompositionLayer.js';
import { TextElement } from './src/elements/TextElement.js';
import fs from 'fs-extra';

async function test() {
  // 创建最内层合成（Scene）
  const sceneVideo = new VideoMaker({
    width: 800,
    height: 600,
    fps: 30,
    duration: 3,
    backgroundColor: '#333333',
  });

  const sceneElementLayer = sceneVideo.createElementLayer({ zIndex: 1 });
  const sceneText = new TextElement({
    text: "Scene文本",
    color: "#ffffff",
    fontSize: 64,
    x: "50%",
    y: "50%",
    textAlign: "center",
    duration: 3,
    startTime: 0,
  });
  sceneElementLayer.addElement(sceneText);

  // 测试 Scene 单独渲染
  console.log('1. 测试 Scene 单独渲染...');
  await sceneVideo.renderer.init();
  const sceneCanvas = await sceneVideo.renderer.renderFrame(
    sceneVideo.timeline.getLayers(),
    0,
    sceneVideo.backgroundColor
  );
  
  const sceneCtx = sceneCanvas.getContext('2d');
  const sceneImageData = sceneCtx.getImageData(0, 0, 100, 100);
  let sceneHasContent = false;
  for (let i = 0; i < sceneImageData.data.length; i += 4) {
    if (sceneImageData.data[i + 3] > 0 && 
        (sceneImageData.data[i] > 50 || sceneImageData.data[i + 1] > 50 || sceneImageData.data[i + 2] > 50)) {
      sceneHasContent = true;
      break;
    }
  }
  console.log('   Scene Canvas 有内容:', sceneHasContent);
  await fs.writeFile('output/test-scene.png', sceneCanvas.toBuffer('image/png'));

  // 创建 Track 合成（包含 Scene）
  const trackVideo = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 3,
    backgroundColor: 'transparent',
  });

  // 使用 CompositionLayer 而不是 CompositionElement
  const sceneLayer = new CompositionLayer({
    composition: sceneVideo,
    x: 1920 / 2,
    y: 1080 / 2,
    width: 800,
    height: 600,
    anchor: [0.5, 0.5],
    zIndex: 1,
    startTime: 0,
    endTime: 3,
  });
  trackVideo.timeline.addLayer(sceneLayer);

  // 测试 Track 渲染
  console.log('2. 测试 Track 渲染（包含 Scene）...');
  await trackVideo.renderer.init();
  const trackCanvas = await trackVideo.renderer.renderFrame(
    trackVideo.timeline.getLayers(),
    0,
    trackVideo.backgroundColor
  );
  
  const trackCtx = trackCanvas.getContext('2d');
  const trackImageData = trackCtx.getImageData(0, 0, 100, 100);
  let trackHasContent = false;
  for (let i = 0; i < trackImageData.data.length; i += 4) {
    if (trackImageData.data[i + 3] > 0 && 
        (trackImageData.data[i] > 50 || trackImageData.data[i + 1] > 50 || trackImageData.data[i + 2] > 50)) {
      trackHasContent = true;
      break;
    }
  }
  console.log('   Track Canvas 有内容:', trackHasContent);
  await fs.writeFile('output/test-track.png', trackCanvas.toBuffer('image/png'));

  // 创建主合成（包含 Track）
  const mainVideo = new VideoMaker({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 3,
    backgroundColor: '#000000',
  });

  // 使用 CompositionLayer 而不是 CompositionElement
  const trackLayer = new CompositionLayer({
    composition: trackVideo,
    x: 1920 / 2,
    y: 1080 / 2,
    width: 1920,
    height: 1080,
    anchor: [0.5, 0.5],
    zIndex: 1,
    startTime: 0,
    endTime: 3,
  });
  mainVideo.timeline.addLayer(trackLayer);

  // 测试主合成渲染
  console.log('3. 测试主合成渲染（包含 Track）...');
  await mainVideo.renderer.init();
  const mainCanvas = await mainVideo.renderer.renderFrame(
    mainVideo.timeline.getLayers(),
    0,
    mainVideo.backgroundColor
  );
  
  const mainCtx = mainCanvas.getContext('2d');
  const mainImageData = mainCtx.getImageData(0, 0, 100, 100);
  let mainHasContent = false;
  for (let i = 0; i < mainImageData.data.length; i += 4) {
    if (mainImageData.data[i + 3] > 0 && 
        (mainImageData.data[i] > 50 || mainImageData.data[i + 1] > 50 || mainImageData.data[i + 2] > 50)) {
      mainHasContent = true;
      break;
    }
  }
  console.log('   主 Canvas 有内容:', mainHasContent);
  await fs.writeFile('output/test-main.png', mainCanvas.toBuffer('image/png'));

  console.log('\n总结:');
  console.log('  Scene 单独渲染:', sceneHasContent ? '✓' : '✗');
  console.log('  Track 渲染:', trackHasContent ? '✓' : '✗');
  console.log('  主合成渲染:', mainHasContent ? '✓' : '✗');
}

test().catch(console.error);


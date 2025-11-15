import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎬 测试元素回调函数 (onLoaded, onRender)');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 场景1: 测试文本元素的回调
  const scene1 = track.createScene({ duration: 3, startTime: 0 });
  scene1.addBackground({ color: '#16213e' });
  
  scene1.addText({
    text: 'Hello World',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: '#ffffff',
    fontFamily: 'Arial',
    duration: 3,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
      { type: 'move', fromY: -100, toY: 0, duration: 1 },
    ],
    onRender: function(element, time) {
      if (time < 0.1) {
        console.log('✅ [TextElement] onRender 回调被调用', {
          elementType: element.type,
          time: time.toFixed(3),
        });
      }
      // 可以动态修改文本颜色
      if (time > 1 && time < 1.1) {
        element.config.color = '#ff6b6b';
      }
    },
  });

  // 场景2: 测试路径元素的回调
  const scene2 = track.createScene({ duration: 2, startTime: 3 });
  scene2.addBackground({ color: '#0f3460' });
  
  scene2.addPath({
    points: [
      [100, 100],
      [200, 150],
      [300, 100],
      [400, 200],
      [500, 150],
    ],
    closed: false,
    strokeColor: '#00ff00',
    strokeWidth: 5,
    duration: 2,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
    onRender: function(element, time) {
      // 场景2 的 startTime 是 3，所以这里 time 是相对于场景的
      const sceneTime = time - 3;
      if (sceneTime >= 0 && sceneTime < 0.1) {
        console.log('✅ [PathElement] onRender 回调被调用', {
          elementType: element.type,
          absoluteTime: time.toFixed(3),
          sceneTime: sceneTime.toFixed(3),
        });
      }
    },
  });

  // 场景3: 测试圆形和矩形元素的回调
  const scene3 = track.createScene({ duration: 2, startTime: 5 });
  scene3.addBackground({ color: '#533483' });
  
  scene3.addCircle({
    x: '30%',
    y: '50%',
    radius: 100,
    bgcolor: '#ff6b6b',
    duration: 2,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
    onRender: function(element, time) {
      // 场景3 的 startTime 是 5，所以这里 time 是相对于场景的
      const sceneTime = time - 5;
      if (sceneTime >= 0 && sceneTime < 0.1) {
        console.log('✅ [CircleElement] onRender 回调被调用', {
          elementType: element.type,
          absoluteTime: time.toFixed(3),
          sceneTime: sceneTime.toFixed(3),
        });
      }
    },
  });

  scene3.addRect({
    x: '70%',
    y: '50%',
    width: 200,
    height: 200,
    bgcolor: '#4ecdc4',
    borderRadius: 20,
    duration: 2,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
    onRender: function(element, time) {
      // 场景3 的 startTime 是 5，所以这里 time 是相对于场景的
      const sceneTime = time - 5;
      if (sceneTime >= 0 && sceneTime < 0.1) {
        console.log('✅ [RectElement] onRender 回调被调用', {
          elementType: element.type,
          absoluteTime: time.toFixed(3),
          sceneTime: sceneTime.toFixed(3),
        });
      }
    },
  });

  // 导出视频
  const outputPath = path.join(__dirname, '../output/test-callbacks.mp4');
  console.log('\n开始导出视频...');
  
  try {
    const videoMaker = builder.build();
    await videoMaker.export(outputPath);
    builder.destroy();
    console.log(`\n✅ 视频导出成功: ${outputPath}`);
  } catch (error) {
    console.error('\n❌ 视频导出失败:', error);
    throw error;
  }
}

main().catch(console.error);


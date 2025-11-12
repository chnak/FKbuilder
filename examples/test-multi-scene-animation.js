/**
 * 测试多场景元素的动画
 */
import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 添加全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未捕获的 Promise rejection:', reason);
  console.error('Promise:', promise);
  if (reason && reason.stack) {
    console.error('错误堆栈:', reason.stack);
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
});

async function testMultiSceneAnimation() {
  console.log('创建多场景动画测试...\n');

  // 创建视频构建器
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: '#1a1a1a',
  });

  // 创建轨道1
  const track1 = builder.createTrack({ zIndex: 1 });

  // 场景1：淡入动画 + 移动动画
  const scene1 = track1.createScene({ duration: 5 });
  scene1
    .addBackground({ color: '#2c3e50' })
    .addText({
      text: '场景 1 - 淡入 + 移动',
      x: '50%',
      y: '30%',
      fontSize: 64,
      fontFamily: 'PatuaOne',
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      opacity: 0, // 初始透明
      animations: [
        {
          type: 'fade',
          startTime: 0,
          duration: 1,
          fromOpacity: 0,
          toOpacity: 1,
          easing: 'easeOutQuad',
        },
        {
          type: 'move',
          startTime: 0,
          duration: 1,
          fromX: 0,
          fromY: -100,
          toX: 0,
          toY: 0,
          easing: 'easeOutQuad',
        },
      ],
    })
    .addRect({
      x: '50%',
      y: '60%',
      width: 300,
      height: 100,
      bgcolor: '#3498db',
      borderRadius: 10,
      anchor: [0.5, 0.5],
      opacity: 0, // 初始透明
      animations: [
        {
          type: 'fade',
          startTime: 0.5,
          duration: 1,
          fromOpacity: 0,
          toOpacity: 1,
          easing: 'easeOutQuad',
        },
        {
          type: 'move',
          startTime: 0.5,
          duration: 1,
          fromX: 0,
          fromY: 100,
          toX: 0,
          toY: 0,
          easing: 'easeOutQuad',
        },
      ],
    });

  // 场景2：缩放动画 + 旋转动画
  const scene2 = track1.createScene({ duration: 5 });
  scene2
    .addBackground({ color: '#34495e' })
    .addText({
      text: '场景 2 - 缩放 + 旋转',
      x: '50%',
      y: '40%',
      fontSize: 64,
      fontFamily: 'PatuaOne',
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      animations: [
        {
          type: 'transform',
          startTime: 0,
          duration: 1,
          from: { scaleX: 0, scaleY: 0 },
          to: { scaleX: 1, scaleY: 1 },
          easing: 'easeOutBack',
        },
      ],
    })
    .addCircle({
      x: '50%',
      y: '60%',
      radius: 80,
      bgcolor: '#e74c3c',
      anchor: [0.5, 0.5],
      animations: [
        {
          type: 'transform',
          startTime: 0.5,
          duration: 2,
          from: { rotation: 0 },
          to: { rotation: 360 },
          easing: 'linear',
        },
      ],
    });

  // 场景3：组合动画
  const scene3 = track1.createScene({ duration: 5 });
  scene3
    .addBackground({ color: '#27ae60' })
    .addText({
      text: '场景 3 - 组合动画',
      x: '50%',
      y: '40%',
      fontSize: 64,
      fontFamily: 'PatuaOne',
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      opacity: 0,
      animations: [
        {
          type: 'fade',
          startTime: 0,
          duration: 1,
          fromOpacity: 0,
          toOpacity: 1,
          easing: 'easeInOutQuad',
        },
      ],
    })
    .addRect({
      x: '30%',
      y: '60%',
      width: 200,
      height: 200,
      bgcolor: '#f39c12',
      borderRadius: 20,
      anchor: [0.5, 0.5],
      opacity: 0,
      animations: [
        {
          type: 'fade',
          startTime: 0,
          duration: 0.8,
          fromOpacity: 0,
          toOpacity: 1,
          easing: 'easeOutQuad',
        },
        {
          type: 'transform',
          startTime: 0,
          duration: 0.8,
          from: { scaleX: 0, scaleY: 0 },
          to: { scaleX: 1, scaleY: 1 },
          easing: 'easeOutBack',
        },
      ],
    })
    .addRect({
      x: '50%',
      y: '60%',
      width: 200,
      height: 200,
      bgcolor: '#9b59b6',
      borderRadius: 20,
      anchor: [0.5, 0.5],
      opacity: 0,
      animations: [
        {
          type: 'fade',
          startTime: 0.3,
          duration: 0.8,
          fromOpacity: 0,
          toOpacity: 1,
          easing: 'easeOutQuad',
        },
        {
          type: 'transform',
          startTime: 0.3,
          duration: 0.8,
          from: { scaleX: 0, scaleY: 0 },
          to: { scaleX: 1, scaleY: 1 },
          easing: 'easeOutBack',
        },
      ],
    })
    .addRect({
      x: '70%',
      y: '60%',
      width: 200,
      height: 200,
      bgcolor: '#1abc9c',
      borderRadius: 20,
      anchor: [0.5, 0.5],
      opacity: 0,
      animations: [
        {
          type: 'fade',
          startTime: 0.6,
          duration: 0.8,
          fromOpacity: 0,
          toOpacity: 1,
          easing: 'easeOutQuad',
        },
        {
          type: 'transform',
          startTime: 0.6,
          duration: 0.8,
          from: { scaleX: 0, scaleY: 0 },
          to: { scaleX: 1, scaleY: 1 },
          easing: 'easeOutBack',
        },
      ],
    });

  // 添加转场效果
  track1.addTransition({
    name: 'fade',
    duration: 1,
    fromSceneIndex: 0,
    toSceneIndex: 1,
    easing: 'easeInOutQuad',
  });

  track1.addTransition({
    name: 'crosswarp', // 使用 crosswarp 转场（类似缩放效果）
    duration: 1,
    fromSceneIndex: 1,
    toSceneIndex: 2,
    easing: 'easeInOutQuad',
  });

  // 创建轨道2（叠加层）- 持续动画
  const track2 = builder.createTrack({ zIndex: 2 });

  const track2Scene = track2.createScene({ duration: 15 }); // 覆盖所有场景
  track2Scene
    .addText({
      text: '持续动画',
      x: '90%',
      y: '10%',
      fontSize: 36,
      fontFamily: 'PatuaOne',
      color: '#f39c12',
      textAlign: 'center',
      animations: [
        {
          type: 'fade',
          startTime: 0,
          duration: 2,
          fromOpacity: 0.3,
          toOpacity: 1,
          easing: 'easeInOutSine',
        },
        {
          type: 'fade',
          startTime: 2,
          duration: 2,
          fromOpacity: 1,
          toOpacity: 0.3,
          easing: 'easeInOutSine',
        },
      ],
    })
    .addCircle({
      x: '10%',
      y: '90%',
      radius: 30,
      bgcolor: '#e74c3c',
      anchor: [0.5, 0.5],
      animations: [
        {
          type: 'transform',
          startTime: 0,
          duration: 3,
          from: { rotation: 0 },
          to: { rotation: 360 },
          easing: 'linear',
        },
      ],
    });

  // 导出视频
  const outputPath = path.join(__dirname, '../output/test-multi-scene-animation.mp4');
  console.log('开始导出视频...');
  console.log(`总时长: ${builder.getTotalDuration()} 秒`);
  console.log(`轨道数: ${builder.getTracks().length}`);
  
  await builder.export(outputPath);
  console.log(`✅ 视频导出完成: ${outputPath}`);

  builder.destroy();
}

testMultiSceneAnimation().catch(console.error);


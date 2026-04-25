import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from '@chnak/paper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎬 演示 onFrame 与 onRender 的区别');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 场景1: 只使用 onRender
  const scene1 = track.createScene({ duration: 3, startTime: 0 });
  scene1.addBackground({ color: '#1a1a2e' });
  
  scene1.addCircle({
    x: '30%',
    y: '50%',
    radius: 100,
    bgcolor: '#ff6b6b',
    duration: 3,
    startTime: 0,
    onRender: function(element, time) {
      // onRender: 在元素渲染时调用
      // 特点：修改 element.config，影响元素的渲染
      // 执行时机：在创建 Paper.js 项目之后，添加到图层之前
      
      // 修改配置，会在下一帧生效
      element.config.rotation = time * 60; // 每秒旋转60度
      element.config.scaleX = 1 + Math.sin(time * Math.PI * 2) * 0.3;
      element.config.scaleY = 1 + Math.sin(time * Math.PI * 2) * 0.3;
      
      // 修改颜色（通过配置）
      const hue = (time * 60) % 360;
      element.config.bgcolor = `hsl(${hue}, 70%, 60%)`;
    },
  });

  // 场景2: 只使用 onFrame
  const scene2 = track.createScene({ duration: 3, startTime: 3 });
  scene2.addBackground({ color: '#16213e' });
  
  scene2.addCircle({
    x: '70%',
    y: '50%',
    radius: 100,
    bgcolor: '#4ecdc4',
    duration: 3,
    startTime: 0,
    onFrame: function(element, event, paperItem) {
      // onFrame: 在所有元素渲染完成后调用
      // 特点：直接操作 paperItem，立即生效
      // 执行时机：在所有元素渲染完成后，view.update() 之前
      
      if (paperItem) {
        // 直接操作 Paper.js 项目，立即生效
        paperItem.rotation = event.time * 60; // 每秒旋转60度
        
        const scale = 1 + Math.sin(event.time * Math.PI * 2) * 0.3;
        paperItem.scaling = new paper.Point(scale, scale);
        
        // 直接修改 Paper.js Color 对象的属性
        paperItem.fillColor.hue = (event.time * 60) % 360;
      }
    },
  });

  // 场景3: 同时使用 onRender 和 onFrame（演示执行顺序）
  const scene3 = track.createScene({ duration: 3, startTime: 6 });
  scene3.addBackground({ color: '#0f3460' });
  
  scene3.addCircle({
    x: '50%',
    y: '50%',
    radius: 100,
    bgcolor: '#ffd93d',
    duration: 3,
    startTime: 0,
    onRender: function(element, time) {
      // onRender 先执行
      // 修改配置，影响渲染
      element.config.rotation = time * 30; // 每秒旋转30度（较慢）
      console.log(`[onRender] 时间: ${time.toFixed(3)}, 设置旋转: ${time * 30}度`);
    },
    onFrame: function(element, event, paperItem) {
      // onFrame 后执行
      // 直接操作 Paper.js 项目，会覆盖 onRender 中的设置
      if (paperItem) {
        paperItem.rotation = event.time * 60; // 每秒旋转60度（较快，会覆盖 onRender 的设置）
        console.log(`[onFrame] 时间: ${event.time.toFixed(3)}, 设置旋转: ${event.time * 60}度`);
      }
    },
  });

  // 场景4: 演示 onRender 和 onFrame 的不同用途
  const scene4 = track.createScene({ duration: 3, startTime: 9 });
  scene4.addBackground({ color: '#533483' });
  
  // 使用 onRender 修改配置
  scene4.addRect({
    x: '30%',
    y: '50%',
    width: 150,
    height: 150,
    bgcolor: '#ff6b6b',
    borderRadius: 10,
    duration: 3,
    startTime: 0,
    onRender: function(element, time) {
      // 使用 onRender 修改配置
      // 特点：修改配置，会在下一帧重新渲染
      element.config.rotation = time * 45;
      
      // 根据时间条件修改颜色
      if (time > 1.5) {
        element.config.bgcolor = '#00ff00';
      }
    },
  });
  
  // 使用 onFrame 直接操作 Paper.js 项目
  scene4.addRect({
    x: '70%',
    y: '50%',
    width: 150,
    height: 150,
    bgcolor: '#4ecdc4',
    borderRadius: 10,
    duration: 3,
    startTime: 0,
    onFrame: function(element, event, paperItem) {
      // 使用 onFrame 直接操作 Paper.js 项目
      // 特点：直接修改属性，立即生效，性能更好
      if (paperItem) {
        paperItem.rotation = event.time * 45;
        
        // 直接修改 Paper.js Color 对象
        if (event.time > 1.5) {
          paperItem.fillColor = new paper.Color('#00ff00');
        }
      }
    },
  });

  // 场景5: 演示基于帧数的动画（onFrame 的优势）
  const scene5 = track.createScene({ duration: 3, startTime: 12 });
  scene5.addBackground({ color: '#2d1b69' });
  
  scene5.addCircle({
    x: '50%',
    y: '50%',
    radius: 80,
    bgcolor: '#ffd93d',
    duration: 3,
    startTime: 0,
    onFrame: function(element, event, paperItem) {
      if (paperItem) {
        // 使用 event.count 实现基于帧数的动画
        // 每10帧改变一次颜色
        if (event.count % 10 === 0) {
          const hue = (event.count / 10 * 30) % 360;
          paperItem.fillColor = new paper.Color(`hsl(${hue}, 70%, 60%)`);
        }
        
        // 使用 event.delta 实现基于帧间隔的动画
        const speed = 50; // 每秒移动50像素
        const moveX = event.delta * speed;
        paperItem.position = new paper.Point(
          paperItem.position.x + moveX,
          paperItem.position.y
        );
      }
    },
  });

  // 导出视频
  const outputPath = path.join(__dirname, '../output/test-onframe-vs-onrender.mp4');
  console.log('\n开始导出视频...');
  console.log('总时长:', builder.getTotalDuration().toFixed(2), '秒\n');
  
  try {
    const videoMaker = builder.build();
    await videoMaker.export(outputPath, {
      quality: 'high',
      bitrate: '10M',
      usePipe: true,
    });
    builder.destroy();
    console.log(`\n✅ 视频导出成功: ${outputPath}`);
    console.log('\n✨ onFrame vs onRender 对比演示完成！');
    console.log('\n📝 主要区别：');
    console.log('  1. 调用时机：');
    console.log('     - onRender: 在元素渲染时调用（先执行）');
    console.log('     - onFrame: 在所有元素渲染完成后调用（后执行）');
    console.log('  2. 参数：');
    console.log('     - onRender: (element, time)');
    console.log('     - onFrame: (element, event, paperItem)');
    console.log('  3. 修改方式：');
    console.log('     - onRender: 通过 element.config 修改配置');
    console.log('     - onFrame: 直接操作 paperItem 属性');
    console.log('  4. 性能：');
    console.log('     - onRender: 修改配置后需要重新渲染');
    console.log('     - onFrame: 直接修改属性，性能更好');
  } catch (error) {
    console.error('\n❌ 视频导出失败:', error);
    throw error;
  }
}

main().catch(console.error);


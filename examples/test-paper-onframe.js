import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from 'paper-jsdom-canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎬 测试 Paper.js onFrame 事件在回调函数中的使用');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 场景1: 使用 onFrame 实现动画
  const scene1 = track.createScene({ duration: 5, startTime: 0 });
  scene1.addBackground({ color: '#1a1a2e' });
  
  scene1.addCircle({
    x: '50%',
    y: '50%',
    radius: 100,
    bgcolor: '#ff6b6b',
    duration: 5,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
    // onLoaded: function(element, time) {
    //   console.log('✅ [CircleElement] onLoaded - 元素已加载');
    // },
    // 使用元素配置中的 onFrame 回调
    onFrame: function(element, event, paperItem) {
      // event: { count, time, delta }
      // paperItem: Paper.js 项目引用
      if (paperItem) {
        // 在 onFrame 中实现动画
        // 使用 event.time 来实现基于时间的动画
        const rotation = event.time * 60; // 每秒旋转60度
        paperItem.rotation = rotation;
        
        // 实现缩放动画
        const scale = 1 + Math.sin(event.time * Math.PI * 2) * 0.3;
        paperItem.scaling = new paper.Point(scale, scale);
        
        // 也可以使用 event.count 来实现基于帧数的动画
        // const rotation = event.count * 2; // 每帧旋转2度
      }
    },
    // onRender: function(element, time) {
    //   // 注意：onFrame 会在 Renderer 中自动触发
    //   // 但为了确保动画正常工作，我们也可以在 onRender 中设置配置
    //   // 这样即使 onFrame 没有触发，动画也能正常工作
      
    //   // 备用方案：在 onRender 中实现动画（如果 onFrame 没有正确触发）
    //   const rotation = time * 60; // 每秒旋转60度
    //   element.config.rotation = rotation;
      
    //   const scale = 1 + Math.sin(time * Math.PI * 2) * 0.3;
    //   element.config.scaleX = scale;
    //   element.config.scaleY = scale;
      
    //   // 尝试获取 Paper.js 项目引用（在元素渲染后）
    //   // 这样 onFrame 就可以直接操作 Paper.js 项目
    //   // 注意：这需要在元素渲染完成后才能获取
    // },
  });

  // 场景2: 使用 onFrame 实现多个元素的协同动画
  const scene2 = track.createScene({ duration: 5, startTime: 5 });
  scene2.addBackground({ color: '#16213e' });
  
  // 创建一个全局的 onFrame 处理器来管理多个元素
  let globalFrameCount = 0;
  const animatedItems = [];
  
  for (let i = 0; i < 5; i++) {
    (function(index) {
      scene2.addCircle({
        x: `${20 + index * 15}%`,
        y: '50%',
        radius: 50,
        bgcolor: `hsl(${index * 60}, 70%, 60%)`,
        duration: 5,
        startTime: 0,
        animations: [
          { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
        ],
        // onLoaded: function(element, time) {
        //   // 将元素添加到动画列表
        //   animatedItems.push({
        //     element: element,
        //     index: index,
        //     phase: index * 0.5, // 每个元素有不同的相位
        //   });
        // },
        onRender: function(element, time) {
          // 在 onRender 中实现类似 onFrame 的动画
          // 使用全局帧计数或时间来实现协同动画
          const phase = index * 0.5;
          const wave = Math.sin((time * Math.PI * 2) + phase) * 100;
          const canvasHeight = 1080;
          const yPercent = 50 - (wave / canvasHeight * 100);
          element.config.y = `${yPercent}%`;
          
          // 旋转动画
          element.config.rotation = time * 90 + index * 45;
        },
      });
    })(i);
  }

  // 场景3: 演示如何在 onLoaded 中设置 Paper.js 项目级别的 onFrame
  const scene3 = track.createScene({ duration: 5, startTime: 10 });
  scene3.addBackground({ color: '#0f3460' });
  
  scene3.addRect({
    x: '50%',
    y: '50%',
    width: 200,
    height: 200,
    bgcolor: '#4ecdc4',
    borderRadius: 20,
    duration: 5,
    startTime: 0,
    // onLoaded: function(element, time) {
    //   console.log('✅ [RectElement] onLoaded - 尝试设置 Paper.js onFrame');
      
    //   // 尝试访问 Paper.js 的 view
    //   if (paper.view) {
    //     // 保存原始的 onFrame（如果有）
    //     const originalOnFrame = paper.view.onFrame;
        
    //     // 设置新的 onFrame
    //     paper.view.onFrame = function(event) {
    //       // 调用原始的 onFrame（如果有）
    //       if (originalOnFrame) {
    //         originalOnFrame(event);
    //       }
          
    //       // 实现自定义动画逻辑
    //       // 注意：在 Node.js 环境中，onFrame 可能不会自动触发
    //       // 需要手动调用或使用其他方式
    //     };
        
    //     console.log('Paper.js view.onFrame 已设置（但可能在 Node.js 中不会自动触发）');
    //   }
    // },
    // onRender: function(element, time) {
    //   // 在 onRender 中实现动画（这是更可靠的方式）
    //   element.config.rotation = time * 180; // 每秒旋转180度
      
    //   const scale = 1 + Math.sin(time * Math.PI * 3) * 0.2;
    //   element.config.scaleX = scale;
    //   element.config.scaleY = scale;
    // },
  });

  // 导出视频
  const outputPath = path.join(__dirname, '../output/test-paper-onframe.mp4');
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
    console.log('\n✨ Paper.js onFrame 测试完成！');
    console.log('\n📝 说明：');
    console.log('  - 现在可以在元素配置中直接使用 onFrame 回调');
    console.log('  - onFrame 回调会在每帧渲染时自动触发');
    console.log('  - onFrame 回调参数: (element, event, paperItem)');
    console.log('    - element: 元素实例');
    console.log('    - event: { count, time, delta } - 帧信息');
    console.log('    - paperItem: Paper.js 项目引用，可直接操作');
    console.log('  - 使用 onFrame 可以直接操作 Paper.js 项目，实现更复杂的动画');
  } catch (error) {
    console.error('\n❌ 视频导出失败:', error);
    throw error;
  }
}

main().catch(console.error);


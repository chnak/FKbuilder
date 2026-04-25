import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from '@chnak/paper';

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
      // ========== 参数说明 ==========
      // element: 元素实例，可以访问元素配置、状态和方法
      //   - element.config: 元素配置对象（x, y, width, height, color 等）
      //   - element.type: 元素类型（'circle', 'text', 'rect' 等）
      //   - element.getProgressAtTime(time): 获取元素进度（0-1）
      //   - element.isActiveAtTime(time): 判断元素是否激活
      //
      // event: 帧事件对象，包含当前帧的信息
      //   - event.count: 帧计数（从0开始，每帧递增1）
      //   - event.time: 当前时间（秒，相对于视频开始）
      //   - event.delta: 帧间隔（秒，如30fps时约为0.033秒）
      //
      // paperItem: Paper.js 项目引用，可以直接操作 Paper.js 原生属性
      //   - paperItem.position: 位置（paper.Point）
      //   - paperItem.rotation: 旋转角度（度）
      //   - paperItem.scaling: 缩放（paper.Point）
      //   - paperItem.fillColor: 填充颜色（paper.Color）
      //   - paperItem.fillColor.hue: 色相（0-360）
      //   - paperItem.opacity: 透明度（0-1）
      
      if (paperItem) {
        // 使用 event.time 实现基于时间的旋转动画
        const rotation = event.time * 60; // 每秒旋转60度
        paperItem.rotation = rotation;
        
        // 使用 event.time 实现缩放动画（呼吸效果）
        const scale = 1 + Math.sin(event.time * Math.PI * 2) * 0.3;
        paperItem.scaling = new paper.Point(scale, scale);
        
        // 使用 event.time 修改颜色色相（颜色循环）
        // 注意：直接修改 hue 会导致颜色累积变化，建议使用 event.time 计算
        paperItem.fillColor.hue = (event.time * 60) % 360;
        
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


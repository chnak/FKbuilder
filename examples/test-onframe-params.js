import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from 'paper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎬 演示 onFrame 回调函数参数的含义');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 场景1: 详细演示三个参数的含义
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
    onFrame: function(element, event, paperItem) {
      // ========== 参数1: element (元素实例) ==========
      // element 是当前元素的实例，继承自 BaseElement
      // 可以访问元素的所有属性和方法
      
      // 访问元素配置
      // element.config - 元素的配置对象（包含 x, y, width, height, color 等）
      // element.type - 元素类型（如 'circle', 'text', 'rect' 等）
      // element.id - 元素的唯一标识符
      // element.startTime - 元素的开始时间
      // element.endTime - 元素的结束时间
      // element.duration - 元素的持续时间
      
      // 访问元素方法
      // element.getStateAtTime(time) - 获取元素在指定时间的状态
      // element.isActiveAtTime(time) - 判断元素在指定时间是否激活
      // element.getProgressAtTime(time) - 获取元素在指定时间的进度（0-1）
      
      // 示例：通过 element 访问配置
      const elementX = element.config.x; // '50%' 或像素值
      const elementY = element.config.y; // '50%' 或像素值
      const elementColor = element.config.bgcolor; // '#ff6b6b'
      
      // ========== 参数2: event (帧事件对象) ==========
      // event 包含当前帧的信息，用于实现基于时间或帧数的动画
      
      // event.count - 帧计数（从0开始，每帧递增1）
      // 例如：第1帧 count=0, 第2帧 count=1, 第3帧 count=2...
      // 用途：实现基于帧数的动画（如每帧旋转2度）
      const frameNumber = event.count;
      
      // event.time - 当前时间（秒，相对于视频开始）
      // 例如：0.033秒（第1帧），0.067秒（第2帧），1.0秒（第30帧）...
      // 用途：实现基于时间的动画（如每秒旋转60度）
      const currentTime = event.time;
      
      // event.delta - 帧间隔（秒）
      // 例如：30fps 时 delta ≈ 0.033秒，60fps 时 delta ≈ 0.017秒
      // 用途：实现基于帧间隔的动画（如每帧移动 delta * speed）
      const frameDelta = event.delta;
      
      // ========== 参数3: paperItem (Paper.js 项目引用) ==========
      // paperItem 是 Paper.js 的项目对象（如 paper.Path.Circle, paper.PointText 等）
      // 可以直接操作 Paper.js 的原生属性和方法
      
      if (paperItem) {
        // 直接操作 Paper.js 项目的属性
        // paperItem.position - 位置（paper.Point）
        // paperItem.rotation - 旋转角度（度）
        // paperItem.scaling - 缩放（paper.Point）
        // paperItem.opacity - 透明度（0-1）
        // paperItem.fillColor - 填充颜色（paper.Color）
        // paperItem.strokeColor - 描边颜色（paper.Color）
        // paperItem.strokeWidth - 描边宽度
        
        // 示例1: 使用 event.time 实现基于时间的旋转
        paperItem.rotation = event.time * 60; // 每秒旋转60度
        
        // 示例2: 使用 event.count 实现基于帧数的动画
        // paperItem.rotation = event.count * 2; // 每帧旋转2度
        
        // 示例3: 使用 event.time 实现缩放动画
        const scale = 1 + Math.sin(event.time * Math.PI * 2) * 0.3;
        paperItem.scaling = new paper.Point(scale, scale);
        
        // 示例4: 修改颜色（Paper.js Color 对象）
        if (paperItem.fillColor) {
          // 方法1: 修改色相（HSL）
          paperItem.fillColor.hue = (event.time * 60) % 360;
          
          // 方法2: 修改亮度
          // paperItem.fillColor.brightness = 0.5 + Math.sin(event.time * Math.PI) * 0.3;
          
          // 方法3: 修改饱和度
          // paperItem.fillColor.saturation = 0.7 + Math.sin(event.time * Math.PI * 2) * 0.2;
        }
        
        // 示例5: 修改位置
        const offsetX = Math.sin(event.time * Math.PI * 2) * 50;
        const offsetY = Math.cos(event.time * Math.PI * 2) * 50;
        paperItem.position = new paper.Point(
          paperItem.position.x + offsetX,
          paperItem.position.y + offsetY
        );
      }
      
      // ========== 三个参数的配合使用 ==========
      // 1. 使用 element 获取元素配置和状态
      // 2. 使用 event 获取时间和帧信息
      // 3. 使用 paperItem 直接操作 Paper.js 项目
      
      // 示例：结合使用三个参数
      if (paperItem && event.time > 2) {
        // 在2秒后，根据元素的配置和当前时间修改 Paper.js 项目
        const baseColor = element.config.bgcolor;
        const timeOffset = event.time - 2;
        paperItem.fillColor = new paper.Color(baseColor);
        paperItem.fillColor.hue = (timeOffset * 30) % 360;
      }
    },
  });

  // 场景2: 演示如何通过 element 访问元素状态
  const scene2 = track.createScene({ duration: 3, startTime: 5 });
  scene2.addBackground({ color: '#16213e' });
  
  scene2.addText({
    text: '参数演示',
    x: '50%',
    y: '40%',
    fontSize: 80,
    color: '#ffffff',
    duration: 3,
    startTime: 0,
    onFrame: function(element, event, paperItem) {
      // 通过 element 获取元素进度
      const progress = element.getProgressAtTime(event.time);
      
      // 通过 element 判断元素是否激活
      const isActive = element.isActiveAtTime(event.time);
      
      // 通过 element 获取元素状态
      const state = element.getStateAtTime(event.time, { width: 1920, height: 1080 });
      
      if (paperItem) {
        // 根据进度修改透明度
        paperItem.opacity = progress;
        
        // 根据进度修改位置
        const startY = 400;
        const endY = 600;
        paperItem.position = new paper.Point(
          paperItem.position.x,
          startY + (endY - startY) * progress
        );
      }
    },
  });

  // 场景3: 演示 event 参数的使用
  const scene3 = track.createScene({ duration: 3, startTime: 8 });
  scene3.addBackground({ color: '#0f3460' });
  
  scene3.addRect({
    x: '50%',
    y: '50%',
    width: 200,
    height: 200,
    bgcolor: '#4ecdc4',
    borderRadius: 20,
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
        
        // 使用 event.time 实现基于时间的动画
        paperItem.rotation = event.time * 180; // 每秒旋转180度
        
        // 使用 event.delta 实现基于帧间隔的动画
        // 每帧移动 delta * speed 的距离
        const speed = 100; // 每秒移动100像素
        const moveX = event.delta * speed;
        paperItem.position = new paper.Point(
          paperItem.position.x + moveX,
          paperItem.position.y
        );
      }
    },
  });

  // 导出视频
  const outputPath = path.join(__dirname, '../output/test-onframe-params.mp4');
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
    console.log('\n✨ onFrame 参数演示完成！');
    console.log('\n📝 参数说明：');
    console.log('  1. element - 元素实例，可以访问元素配置、状态和方法');
    console.log('  2. event - 帧事件对象，包含 count（帧数）、time（时间）、delta（帧间隔）');
    console.log('  3. paperItem - Paper.js 项目引用，可以直接操作 Paper.js 原生属性');
  } catch (error) {
    console.error('\n❌ 视频导出失败:', error);
    throw error;
  }
}

main().catch(console.error);


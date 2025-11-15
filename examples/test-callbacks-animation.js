import { VideoBuilder } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎬 测试在回调函数中实现动画效果');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 场景1: 文本元素 - 在 onRender 中实现旋转和缩放动画
  const scene1 = track.createScene({ duration: 5, startTime: 0 });
  scene1.addBackground({ color: '#1a1a2e' });
  
  const textElement1 = scene1.addText({
    text: '旋转缩放',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: '#ffffff',
    fontFamily: 'Arial',
    duration: 5,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
    onLoaded: function(element, time) {
      console.log('✅ [TextElement] onLoaded - 初始化动画状态');
      // 初始化一些状态
      element._initialX = element.config.x;
      element._initialY = element.config.y;
      element._rotationSpeed = 2; // 每秒旋转2度
      element._scaleSpeed = 0.5; // 缩放速度
    },
    onRender: function(element, time) {
      // 实现旋转动画
      const rotation = time * element._rotationSpeed * 360; // 每秒旋转360度
      element.config.rotation = rotation;
      
      // 实现缩放动画（呼吸效果）
      const scale = 1 + Math.sin(time * Math.PI * 2 * element._scaleSpeed) * 0.2;
      element.config.scaleX = scale;
      element.config.scaleY = scale;
      
      // 实现颜色变化
      const hue = (time * 60) % 360; // 颜色循环
      element.config.color = `hsl(${hue}, 70%, 60%)`;
    },
  });

  // 场景2: 圆形元素 - 在 onRender 中实现弹跳和移动动画
  const scene2 = track.createScene({ duration: 5, startTime: 5 });
  scene2.addBackground({ color: '#16213e' });
  
  scene2.addCircle({
    x: '20%',
    y: '50%',
    radius: 80,
    bgcolor: '#ff6b6b',
    duration: 5,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
    onLoaded: function(element, time) {
      console.log('✅ [CircleElement] onLoaded - 初始化弹跳动画');
      element._initialY = '50%';
      element._bounceHeight = 200; // 弹跳高度
      element._bounceSpeed = 2; // 弹跳速度
    },
    onRender: function(element, time) {
      // 实现弹跳动画
      // 画布高度是1080，所以1% = 10.8像素
      // 弹跳高度200像素 = 200/10.8 ≈ 18.5%
      const bounce = Math.abs(Math.sin(time * Math.PI * element._bounceSpeed)) * element._bounceHeight;
      const canvasHeight = 1080;
      const yPercent = 50 - (bounce / canvasHeight * 100);
      element.config.y = `${yPercent}%`;
      
      // 实现水平移动（从20%移动到80%，循环）
      const xPercent = 20 + (time * 12) % 60; // 每秒移动12%，5秒完成一个循环
      element.config.x = `${xPercent}%`;
      
      // 实现颜色渐变
      const red = Math.floor(255 * (0.5 + 0.5 * Math.sin(time * Math.PI)));
      const green = Math.floor(255 * (0.5 + 0.5 * Math.sin(time * Math.PI + Math.PI / 3)));
      const blue = Math.floor(255 * (0.5 + 0.5 * Math.sin(time * Math.PI + 2 * Math.PI / 3)));
      element.config.bgcolor = `rgb(${red}, ${green}, ${blue})`;
    },
  });

  // 场景3: 矩形元素 - 在 onRender 中实现波浪和旋转动画
  const scene3 = track.createScene({ duration: 5, startTime: 10 });
  scene3.addBackground({ color: '#0f3460' });
  
  // 创建多个矩形，形成波浪效果
  for (let i = 0; i < 5; i++) {
    (function(index) {
      scene3.addRect({
        x: `${20 + index * 15}%`,
        y: '50%',
        width: 100,
        height: 100,
        bgcolor: `hsl(${index * 60}, 70%, 60%)`,
        borderRadius: 10,
        duration: 5,
        startTime: 0,
        animations: [
          { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
        ],
        onLoaded: function(element, time) {
          element._index = index;
          element._initialY = '50%';
          element._waveAmplitude = 150;
          element._waveSpeed = 1.5;
        },
        onRender: function(element, time) {
          // 确保 _index 已设置
          if (element._index === undefined) {
            element._index = index;
          }
          
          // 实现波浪效果（每个矩形有不同的相位）
          const phase = element._index * 0.5;
          const wave = Math.sin((time * Math.PI * 2 * element._waveSpeed) + phase) * element._waveAmplitude;
          const canvasHeight = 1080;
          const yPercent = 50 - (wave / canvasHeight * 100);
          element.config.y = `${yPercent}%`;
          
          // 实现旋转
          element.config.rotation = time * 90; // 每秒旋转90度
          
          // 实现缩放（跟随波浪）
          const scale = 0.8 + Math.abs(Math.sin((time * Math.PI * 2 * element._waveSpeed) + phase)) * 0.4;
          element.config.scaleX = scale;
          element.config.scaleY = scale;
        },
      });
    })(i);
  }

  // 场景4: 路径元素 - 在 onRender 中实现路径变形动画
  const scene4 = track.createScene({ duration: 5, startTime: 15 });
  scene4.addBackground({ color: '#533483' });
  
  scene4.addPath({
    points: [
      [200, 300],
      [400, 200],
      [600, 300],
      [800, 200],
      [1000, 300],
    ],
    closed: false,
    strokeColor: '#00ff00',
    strokeWidth: 5,
    duration: 5,
    startTime: 0,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.5 },
    ],
    onLoaded: function(element, time) {
      console.log('✅ [PathElement] onLoaded - 初始化路径动画');
      // 深拷贝基础点
      if (element.points && Array.isArray(element.points)) {
        element._basePoints = JSON.parse(JSON.stringify(element.points));
      } else {
        element._basePoints = [];
      }
      element._waveAmplitude = 100;
      element._waveSpeed = 2;
    },
    onRender: function(element, time) {
      // 确保 _basePoints 已初始化
      if (!element._basePoints || element._basePoints.length === 0) {
        if (element.points && Array.isArray(element.points)) {
          element._basePoints = JSON.parse(JSON.stringify(element.points));
        } else {
          return; // 如果没有基础点，跳过
        }
      }
      
      // 实现路径波浪变形
      element.points = element._basePoints.map((point, index) => {
        const wave = Math.sin((time * Math.PI * 2 * element._waveSpeed) + index * 0.5) * element._waveAmplitude;
        return [point[0], point[1] + wave];
      });
      
      // 实现颜色变化
      const hue = (time * 60 + 120) % 360;
      element.strokeColor = `hsl(${hue}, 100%, 50%)`;
      
      // 实现线条宽度变化
      element.strokeWidth = 3 + Math.sin(time * Math.PI * 4) * 2;
    },
  });

  // 场景5: 组合动画 - 多个元素协同动画
  const scene5 = track.createScene({ duration: 5, startTime: 20 });
  scene5.addBackground({ color: '#2d1b69' });
  
  // 中心圆形
  scene5.addCircle({
    x: '50%',
    y: '50%',
    radius: 100,
    bgcolor: '#ffd93d',
    duration: 5,
    startTime: 0,
    onLoaded: function(element, time) {
      element._rotationSpeed = 1;
    },
    onRender: function(element, time) {
      element.config.rotation = time * 360 * element._rotationSpeed;
      const scale = 1 + Math.sin(time * Math.PI * 3) * 0.3;
      element.config.scaleX = scale;
      element.config.scaleY = scale;
    },
  });
  
  // 围绕中心旋转的小圆形
  for (let i = 0; i < 8; i++) {
    (function(index) {
      scene5.addCircle({
        x: '50%',
        y: '50%',
        radius: 30,
        bgcolor: `hsl(${index * 45}, 70%, 60%)`,
        duration: 5,
        startTime: 0,
        onLoaded: function(element, time) {
          element._index = index;
          element._radius = 250; // 旋转半径
          element._rotationSpeed = 0.5; // 旋转速度
        },
        onRender: function(element, time) {
          // 确保 _index 已设置
          if (element._index === undefined) {
            element._index = index;
          }
          
          const angle = (time * 360 * element._rotationSpeed + element._index * 45) * Math.PI / 180;
          const canvasWidth = 1920;
          const canvasHeight = 1080;
          const centerX = canvasWidth / 2; // 50% of 1920
          const centerY = canvasHeight / 2; // 50% of 1080
          const x = centerX + Math.cos(angle) * element._radius;
          const y = centerY + Math.sin(angle) * element._radius;
          
          // 使用百分比字符串，确保位置正确
          element.config.x = `${(x / canvasWidth) * 100}%`;
          element.config.y = `${(y / canvasHeight) * 100}%`;
          
          // 小圆形也自转
          element.config.rotation = time * 360 * 2;
        },
      });
    })(i);
  }

  // 导出视频
  const outputPath = path.join(__dirname, '../output/test-callbacks-animation.mp4');
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
    console.log('\n✨ 回调函数动画测试完成！');
    console.log('包含的动画效果：');
    console.log('  - 场景1: 文本旋转、缩放、颜色变化');
    console.log('  - 场景2: 圆形弹跳、移动、颜色渐变');
    console.log('  - 场景3: 矩形波浪、旋转、缩放');
    console.log('  - 场景4: 路径波浪变形、颜色变化');
    console.log('  - 场景5: 多元素协同旋转动画');
  } catch (error) {
    console.error('\n❌ 视频导出失败:', error);
    throw error;
  }
}

main().catch(console.error);


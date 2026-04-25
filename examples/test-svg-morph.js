import { VideoBuilder } from '../src/index.js';
import paper from '@chnak/paper';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案
const colors = {
  midnightBlue: '#153c64',
  mistyBlue: '#bed5eb',
  royalBlue: '#0070e0',
  blueGrotto: '#4a90a4',
  red: '#ff4444',
  orange: '#ff8844',
  yellow: '#ffcc44',
  green: '#44ff88',
};

/**
 * 测试 SVG 变形动画
 */
async function testSVGMorph() {
  console.log('🎨 测试 SVG 变形动画...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 6;
  const transitionDuration = 0.5;

  // ========== 场景1：圆形变形为星形 ==========
  console.log('创建场景1: 圆形变形为星形...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: 'SVG 变形动画 - 圆形 → 星形',
      color: colors.mistyBlue,
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 创建一个圆形，通过动画变形为星形
  const circleToStarSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- 圆形 -->
      <circle id="morph-circle" cx="400" cy="300" r="100" fill="#0070e0" />
      
      <!-- 星形路径（隐藏，用于参考） -->
      <path id="star-path" d="M 400 200 L 420 280 L 500 280 L 440 330 L 460 410 L 400 360 L 340 410 L 360 330 L 300 280 L 380 280 Z" 
            fill="none" stroke="none" opacity="0" />
    </svg>
  `;

  scene1.addSVG({
    svgString: circleToStarSVG,
    x: '50%',
    y: '50%',
    width: 800,
    height: 600,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
    ],
    onLoaded: function(svgElement, time) {
      const circle = svgElement.findElement('#morph-circle');
      
      // 圆形变形动画：通过缩放和旋转创建星形效果
      svgElement.animateElement('#morph-circle', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        
        // 使用缓动函数
        const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const eased = easeInOut(progress);
        
        // 变形：从圆形到星形（通过缩放和旋转）
        const scaleX = 1 + Math.sin(eased * Math.PI) * 0.5;
        const scaleY = 1 - Math.sin(eased * Math.PI) * 0.3;
        const rotation = eased * 180;
        
        return {
          scaleX: scaleX,
          scaleY: scaleY,
          rotation: rotation,
          fillColor: {
            hue: 200 + eased * 60, // 从蓝色到青色
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
    },
  });

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：路径变形 ==========
  console.log('创建场景2: 路径变形...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '路径变形动画',
      color: colors.mistyBlue,
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 波浪路径变形
  const waveSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600">
      <!-- 波浪路径 -->
      <path id="wave-path" d="M 0 300 Q 250 200 500 300 T 1000 300" 
            stroke="#bed5eb" stroke-width="8" fill="none" />
      
      <!-- 多个小圆点沿着路径移动 -->
      <circle id="dot1" cx="0" cy="300" r="15" fill="#ff4444" />
      <circle id="dot2" cx="0" cy="300" r="12" fill="#ff8844" />
      <circle id="dot3" cx="0" cy="300" r="10" fill="#ffcc44" />
    </svg>
  `;

  scene2.addSVG({
    svgString: waveSVG,
    x: '50%',
    y: '50%',
    width: 1000,
    height: 600,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    onLoaded: function(svgElement, time) {
      // 波浪路径变形
      svgElement.animateElement('#wave-path', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const t = progress * Math.PI * 4; // 多个周期
        
        // 动态修改路径的 d 属性（通过 Paper.js 操作）
        // 注意：这里我们通过移动路径点来模拟变形
        return {
          y: Math.sin(t) * 50, // 上下移动
          strokeWidth: 8 + Math.sin(progress * Math.PI * 2) * 4,
        };
      });
      
      // 圆点1沿着路径移动
      svgElement.animateElement('#dot1', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const t = progress * Math.PI * 2;
        
        return {
          x: progress * 1000, // 从左到右移动
          y: 300 + Math.sin(t) * 100, // 上下波动
          scale: 1 + Math.sin(progress * Math.PI * 4) * 0.5,
          fillColor: {
            hue: progress * 360,
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
      
      // 圆点2（延迟）
      svgElement.animateElement('#dot2', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const t = (progress + 0.2) * Math.PI * 2;
        
        return {
          x: progress * 1000,
          y: 300 + Math.sin(t) * 100,
          scale: 1 + Math.sin((progress + 0.2) * Math.PI * 4) * 0.5,
          fillColor: {
            hue: (progress + 0.2) * 360,
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
      
      // 圆点3（延迟）
      svgElement.animateElement('#dot3', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const t = (progress + 0.4) * Math.PI * 2;
        
        return {
          x: progress * 1000,
          y: 300 + Math.sin(t) * 100,
          scale: 1 + Math.sin((progress + 0.4) * Math.PI * 4) * 0.5,
          fillColor: {
            hue: (progress + 0.4) * 360,
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
    },
  });

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：矩形变形为圆形 ==========
  console.log('创建场景3: 矩形变形为圆形...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '矩形 → 圆形变形',
      color: colors.mistyBlue,
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 矩形变形为圆形
  const rectToCircleSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- 矩形 -->
      <rect id="morph-rect" x="300" y="200" width="200" height="200" rx="0" ry="0" fill="#44ff88" />
    </svg>
  `;

  scene3.addSVG({
    svgString: rectToCircleSVG,
    x: '50%',
    y: '50%',
    width: 800,
    height: 600,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    loaded: function(svgItem, svgElement) {
      const rect = svgElement.findElement('#morph-rect');
      
      // 矩形变形为圆形：通过缩放和圆角
      svgElement.animateElement('#morph-rect', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        
        // 使用缓动函数
        const easeInOutCubic = (t) => t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const eased = easeInOutCubic(progress);
        
        // 从矩形到圆形：通过缩放
        const scale = 1 + Math.sin(eased * Math.PI) * 0.3;
        const rotation = eased * 360;
        
        // 尝试修改圆角（如果 Paper.js 支持）
        // 注意：Paper.js 可能不支持直接修改 rx/ry，所以我们通过缩放来模拟
        
        return {
          scale: scale,
          rotation: rotation,
          fillColor: {
            hue: 120 + eased * 120, // 从绿色到红色
            saturation: 0.8,
            brightness: 0.9,
          },
          opacity: 0.7 + Math.sin(eased * Math.PI * 2) * 0.3,
        };
      });
      
      // 使用 render 回调来更精确地控制变形
      // 注意：这里我们通过直接操作 Paper.js 对象来实现更复杂的变形
    },
    onRender: function(svgElement, time) {
      const svgItem = svgElement.svgItem;
      const rect = svgElement.findElement('#morph-rect');
      if (rect && rect.segments) {
        // 如果是路径，可以修改路径点来实现变形
        const relativeTime = time - 0.5;
        const progress = Math.max(0, Math.min(1, relativeTime / sceneDuration));
        const eased = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // 将矩形变形为圆形（通过修改路径点）
        if (rect.segments && rect.segments.length >= 4) {
          const centerX = 400;
          const centerY = 300;
          const radius = 100;
          
          // 计算圆形的点
          const angleStep = Math.PI * 2 / rect.segments.length;
          rect.segments.forEach((segment, index) => {
            const angle = index * angleStep;
            const targetX = centerX + Math.cos(angle) * radius;
            const targetY = centerY + Math.sin(angle) * radius;
            
            // 从矩形位置插值到圆形位置
            const originalX = segment.point.x;
            const originalY = segment.point.y;
            segment.point.x = originalX + (targetX - originalX) * eased;
            segment.point.y = originalY + (targetY - originalY) * eased;
          });
        }
      }
    },
  });

  currentTime = scene3StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景4：复杂变形 - 多个形状同时变形 ==========
  console.log('创建场景4: 复杂变形...');
  const scene4StartTime = currentTime - transitionDuration;
  const scene4 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene4StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: '复杂变形动画',
      color: colors.mistyBlue,
      fontSize: 60,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 多个形状同时变形
  const complexSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600">
      <!-- 中心大圆 -->
      <circle id="center-circle" cx="500" cy="300" r="80" fill="#0070e0" />
      
      <!-- 周围的小圆 -->
      <circle id="orbit1" cx="500" cy="200" r="30" fill="#ff4444" />
      <circle id="orbit2" cx="600" cy="300" r="30" fill="#ff8844" />
      <circle id="orbit3" cx="500" cy="400" r="30" fill="#ffcc44" />
      <circle id="orbit4" cx="400" cy="300" r="30" fill="#44ff88" />
      
      <!-- 连接线 -->
      <line id="line1" x1="500" y1="300" x2="500" y2="200" stroke="#bed5eb" stroke-width="3" />
      <line id="line2" x1="500" y1="300" x2="600" y2="300" stroke="#bed5eb" stroke-width="3" />
      <line id="line3" x1="500" y1="300" x2="500" y2="400" stroke="#bed5eb" stroke-width="3" />
      <line id="line4" x1="500" y1="300" x2="400" y2="300" stroke="#bed5eb" stroke-width="3" />
    </svg>
  `;

  scene4.addSVG({
    svgString: complexSVG,
    x: '50%',
    y: '50%',
    width: 1000,
    height: 600,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    loaded: function(svgItem, svgElement) {
      // 中心圆：呼吸效果
      svgElement.animateElement('#center-circle', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const t = progress * Math.PI * 4;
        
        return {
          scale: 1 + Math.sin(t) * 0.3,
          fillColor: {
            hue: 200 + Math.sin(progress * Math.PI * 2) * 60,
            saturation: 0.8,
            brightness: 0.7 + Math.sin(t) * 0.3,
          },
        };
      });
      
      // 轨道圆1：围绕中心旋转
      svgElement.animateElement('#orbit1', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const angle = progress * Math.PI * 2;
        const radius = 100;
        
        return {
          x: Math.sin(angle) * radius,
          y: -Math.cos(angle) * radius,
          scale: 1 + Math.sin(progress * Math.PI * 4) * 0.5,
          fillColor: {
            hue: progress * 360,
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
      
      // 轨道圆2
      svgElement.animateElement('#orbit2', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const angle = progress * Math.PI * 2 + Math.PI / 2;
        const radius = 100;
        
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          scale: 1 + Math.sin((progress + 0.25) * Math.PI * 4) * 0.5,
          fillColor: {
            hue: (progress + 0.25) * 360,
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
      
      // 轨道圆3
      svgElement.animateElement('#orbit3', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const angle = progress * Math.PI * 2 + Math.PI;
        const radius = 100;
        
        return {
          x: Math.sin(angle) * radius,
          y: -Math.cos(angle) * radius,
          scale: 1 + Math.sin((progress + 0.5) * Math.PI * 4) * 0.5,
          fillColor: {
            hue: (progress + 0.5) * 360,
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
      
      // 轨道圆4
      svgElement.animateElement('#orbit4', (relativeTime, element, svgElement, info) => {
        const progress = info.progress;
        const angle = progress * Math.PI * 2 + Math.PI * 1.5;
        const radius = 100;
        
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          scale: 1 + Math.sin((progress + 0.75) * Math.PI * 4) * 0.5,
          fillColor: {
            hue: (progress + 0.75) * 360,
            saturation: 0.8,
            brightness: 0.9,
          },
        };
      });
    },
    onRender: function(svgElement, time) {
      const svgItem = svgElement.svgItem;
      // 更新连接线的位置
      const centerCircle = svgElement.findElement('#center-circle');
      const orbit1 = svgElement.findElement('#orbit1');
      const orbit2 = svgElement.findElement('#orbit2');
      const orbit3 = svgElement.findElement('#orbit3');
      const orbit4 = svgElement.findElement('#orbit4');
      
      if (centerCircle && orbit1 && orbit2 && orbit3 && orbit4) {
        const centerPos = centerCircle.position;
        const orbit1Pos = orbit1.position;
        const orbit2Pos = orbit2.position;
        const orbit3Pos = orbit3.position;
        const orbit4Pos = orbit4.position;
        
        // 更新连接线（如果 Paper.js 支持）
        const line1 = svgElement.findElement('#line1');
        const line2 = svgElement.findElement('#line2');
        const line3 = svgElement.findElement('#line3');
        const line4 = svgElement.findElement('#line4');
        
        if (line1 && line1.segments && line1.segments.length >= 2) {
          line1.segments[0].point = centerPos;
          line1.segments[1].point = orbit1Pos;
        }
        if (line2 && line2.segments && line2.segments.length >= 2) {
          line2.segments[0].point = centerPos;
          line2.segments[1].point = orbit2Pos;
        }
        if (line3 && line3.segments && line3.segments.length >= 2) {
          line3.segments[0].point = centerPos;
          line3.segments[1].point = orbit3Pos;
        }
        if (line4 && line4.segments && line4.segments.length >= 2) {
          line4.segments[0].point = centerPos;
          line4.segments[1].point = orbit4Pos;
        }
      }
    },
  });

  currentTime = scene4StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-svg-morph.mp4');

  try {
    console.log('\n🚀 开始导出视频...');
    console.log(`输出路径: ${outputPath}\n`);
    console.log(`总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
    console.log(`场景数: ${mainTrack.scenes.length}`);
    console.log(`转场数: ${mainTrack.transitions.length}\n`);

    await builder.export(outputPath, {
      quality: 'high',
      bitrate: '10M',
      usePipe: true,
    });

    console.log('✅ 视频导出成功！');
    console.log(`📁 文件位置: ${outputPath}`);
    console.log(`⏱️  总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
    console.log('\n✨ SVG 变形动画测试完成！');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testSVGMorph().catch(console.error);


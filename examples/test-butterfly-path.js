import { VideoBuilder } from '../src/index.js';
import paper from 'paper-jsdom-canvas';
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
  pink: '#ff6b9d',
  orange: '#ff8844',
  yellow: '#ffcc44',
  green: '#44ff88',
  purple: '#9b59b6',
};

/**
 * 蝴蝶路径动画 - 30秒视频
 */
async function testButterflyPath() {
  console.log('🦋 创建蝴蝶路径动画视频（30秒）...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  const videoDuration = 30; // 30秒
  const butterflySVGPath = path.join(__dirname, '../assets/1437245.svg');

  // 创建单个场景，30秒
  const scene = mainTrack.createScene({
    duration: videoDuration,
    startTime: 0,
  })
    .addBackground({ 
      color: colors.midnightBlue,
      // 渐变背景
    })
    .addText({
      text: '蝴蝶飞舞',
      color: colors.mistyBlue,
      fontSize: 80,
      x: '50%',
      y: '8%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: videoDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
        { type: 'fade', fromOpacity: 1, toOpacity: 0.3, duration: 2, delay: 1 },
      ],
    });

  // 添加蝴蝶 SVG
  scene.addSVG({
    src: butterflySVGPath,
    x: '50%',
    y: '50%',
    width: 500,
    height: 500,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: videoDuration,
    startTime: 0.5,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1 },
    ],
    onLoaded: function(svgElement, time) {
      console.log('蝴蝶 SVG 加载完成');
      
      // 查找蝴蝶路径元素并填充颜色
      const butterflyPath = svgElement.findElement('path');
      if (butterflyPath) {
        console.log('找到蝴蝶路径元素，设置初始颜色');
        // 设置初始颜色 - 渐变色
        butterflyPath.fillColor = {
          hue: 200, // 蓝色
          saturation: 0.8,
          brightness: 0.9,
        };
      } else {
        // 如果找不到，尝试通过 Paper.js 直接查找
        try {
          // 查找所有路径元素
          const allPaths = svgElement.findElements('path');
          if (allPaths.length > 0) {
            console.log(`找到 ${allPaths.length} 个路径元素`);
            allPaths.forEach((p, index) => {
              p.fillColor = {
                hue: 200 + index * 30,
                saturation: 0.8,
                brightness: 0.9,
              };
            });
          }
        } catch (e) {
          console.warn('查找路径元素失败:', e);
        }
      }
    },
    onRender: function(svgElement, time) {
      const svgItem = svgElement.svgItem;
      if (!svgItem) return;
      
      const relativeTime = time - 0.5;
      const duration = videoDuration;
      const progress = Math.max(0, Math.min(1, relativeTime / duration));
      
      // ========== 路径移动 ==========
      // 创建复杂的飞行路径（8字形路径）
      const centerX = 960; // 画布中心
      const centerY = 540;
      const radiusX = 400; // X轴半径
      const radiusY = 250; // Y轴半径
      
      // 8字形路径参数方程
      const t = progress * Math.PI * 4; // 两个完整的8字形循环
      const x = centerX + radiusX * Math.sin(t);
      const y = centerY + radiusY * Math.sin(t) * Math.cos(t);
      
      // 计算路径方向（用于旋转蝴蝶）
      const dt = 0.01; // 小增量用于计算导数
      const dx = radiusX * Math.cos(t);
      const dy = radiusY * (Math.cos(t) * Math.cos(t) - Math.sin(t) * Math.sin(t));
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      // ========== 翅膀扇动 ==========
      const wingFlapSpeed = 15; // 翅膀扇动速度
      const wingFlap = Math.sin(progress * Math.PI * wingFlapSpeed) * 0.25;
      
      // ========== 应用变换 ==========
      svgItem.position = new paper.Point(x, y);
      svgItem.rotation = angle;
      svgItem.scaling = new paper.Point(1 + wingFlap, 1 - wingFlap * 0.4);
      
      // ========== 颜色变化 ==========
      const butterflyPath = svgElement.findElement('path');
      if (butterflyPath) {
        // 根据位置和进度改变颜色
        const hue = (progress * 360 + (x / 1920) * 60) % 360;
        const saturation = 0.7 + Math.sin(progress * Math.PI * 2) * 0.2;
        const brightness = 0.8 + Math.sin(progress * Math.PI * 3) * 0.15;
        
        butterflyPath.fillColor = {
          hue: hue,
          saturation: saturation,
          brightness: brightness,
        };
      } else {
        // 如果找不到单个路径，尝试查找所有路径
        try {
          const allPaths = svgElement.findElements('path');
          if (allPaths.length > 0) {
            const hue = (progress * 360) % 360;
            allPaths.forEach((p, index) => {
              p.fillColor = {
                hue: (hue + index * 30) % 360,
                saturation: 0.7 + Math.sin(progress * Math.PI * 2) * 0.2,
                brightness: 0.8 + Math.sin(progress * Math.PI * 3) * 0.15,
              };
            });
          }
        } catch (e) {
          // 忽略错误
        }
      }
    },
  });

  // 添加一些装饰性的圆形背景
  for (let i = 0; i < 5; i++) {
    scene.addCircle({
      x: 200 + i * 400,
      y: 200 + (i % 2) * 600,
      radius: 50 + i * 20,
      fillColor: colors.mistyBlue,
      opacity: 0.1,
      duration: videoDuration,
      startTime: 0,
      zIndex: 0,
      animations: [
        { 
          type: 'fade', 
          fromOpacity: 0, 
          toOpacity: 0.1, 
          duration: 2,
        },
        {
          type: 'scale',
          fromScale: 0.5,
          toScale: 1.2,
          duration: videoDuration,
        },
      ],
    });
  }

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'butterfly-path-30s.mp4');

  try {
    console.log('\n🚀 开始导出视频...');
    console.log(`输出路径: ${outputPath}\n`);
    console.log(`总时长: ${videoDuration} 秒`);
    console.log(`场景数: ${mainTrack.scenes.length}\n`);

    await builder.export(outputPath, {
      quality: 'high',
      bitrate: '10M',
      usePipe: true,
    });

    console.log('✅ 视频导出成功！');
    console.log(`📁 文件位置: ${outputPath}`);
    console.log(`⏱️  总时长: ${videoDuration} 秒`);
    console.log('\n✨ 蝴蝶路径动画完成！');
    console.log('\n动画特点：');
    console.log('  - 蝴蝶沿8字形路径飞行');
    console.log('  - 翅膀持续扇动');
    console.log('  - 颜色随位置和进度变化');
    console.log('  - 自动调整飞行方向');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testButterflyPath().catch(console.error);


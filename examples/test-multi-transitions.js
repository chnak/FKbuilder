/**
 * 多场景转场效果测试
 * 测试多个场景之间的不同转场效果
 */
import { VideoBuilder } from '../src/index.js';
import { registerFontFile } from '../src/utils/font-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 注册字体
const fontPath = 'D:/code/foliko-trade/public/fonts/MicrosoftYaHei-Bold-01.ttf';
try {
  registerFontFile(fontPath, 'MicrosoftYaHei');
} catch (error) {
  console.warn('字体注册失败，将使用默认字体:', error.message);
}

const builder = new VideoBuilder({
  width: 1920,
  height: 1080,
  fps: 30,
});

// 创建一个轨道
const mainTrack = builder.createTrack({ zIndex: 1, name: '主轨道' });

// 定义多个场景，每个场景有不同的颜色和转场效果
const scenes = [
  {
    name: '场景 1',
    color: '#e74c3c', // 红色
    text: '场景 1',
    duration: 2,
    startTime: 0,
  },
  {
    name: '场景 2',
    color: '#3498db', // 蓝色
    text: '场景 2',
    duration: 2,
    startTime: 2,
    transition: 'fade', // 淡入淡出
  },
  {
    name: '场景 3',
    color: '#2ecc71', // 绿色
    text: '场景 3',
    duration: 2,
    startTime: 4,
    transition: 'CrossZoom', // 交叉缩放
  },
  {
    name: '场景 4',
    color: '#f39c12', // 橙色
    text: '场景 4',
    duration: 2,
    startTime: 6,
    transition: 'CircleCrop', // 圆形裁剪
  },
  {
    name: '场景 5',
    color: '#9b59b6', // 紫色
    text: '场景 5',
    duration: 2,
    startTime: 8,
    transition: 'Swirl', // 漩涡
  },
  {
    name: '场景 6',
    color: '#1abc9c', // 青色
    text: '场景 6',
    duration: 2,
    startTime: 10,
    transition: 'Bounce', // 弹跳
  },
  {
    name: '场景 7',
    color: '#e67e22', // 深橙色
    text: '场景 7',
    duration: 2,
    startTime: 12,
    transition: 'Dreamy', // 梦幻
  },
  {
    name: '场景 8',
    color: '#34495e', // 深灰色
    text: '场景 8',
    duration: 2,
    startTime: 14,
    transition: 'LinearBlur', // 线性模糊
  },
];

// 创建所有场景
scenes.forEach((sceneConfig) => {
  const scene = mainTrack.createScene({
    duration: sceneConfig.duration,
    startTime: sceneConfig.startTime,
  })
    .addBackground({ color: sceneConfig.color })
    .addText({
      text: sceneConfig.text,
      color: '#ffffff',
      fontSize: '120rpx',
      x: '50vw',
      y: '50vh',
      textAlign: 'center',
      duration: sceneConfig.duration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
    })
    .addText({
      text: sceneConfig.transition ? `转场: ${sceneConfig.transition}` : '开始',
      color: '#ffffff',
      fontSize: '48rpx',
      x: '50vw',
      y: '65vh',
      textAlign: 'center',
      duration: sceneConfig.duration,
      startTime: 0.3,
      fontFamily: 'MicrosoftYaHei',
      opacity: 0.8,
    });

  // 添加转场效果（除了第一个场景）
  if (sceneConfig.transition) {
    mainTrack.addTransition({
      name: sceneConfig.transition,
      duration: 1, // 转场时长 1 秒
      startTime: sceneConfig.startTime, // 转场开始时间（当前场景的开始时间）
    });
  }
});

// 导出视频
async function main() {
  const outputPath = path.join(__dirname, '../output/test-multi-transitions.mp4');
  console.log('开始渲染多场景转场测试视频...');
  console.log('总时长:', builder.getTotalDuration(), '秒');
  console.log('场景数量:', mainTrack.scenes.length);
  console.log('转场数量:', mainTrack.transitions.length);
  console.log('\n场景和转场列表:');
  scenes.forEach((scene, i) => {
    console.log(`  ${i + 1}. ${scene.name} (${scene.color}) - ${scene.startTime}s - ${scene.startTime + scene.duration}s`);
    if (scene.transition) {
      console.log(`     └─ 转场: ${scene.transition} (${scene.startTime - 0.5}s - ${scene.startTime + 0.5}s)`);
    }
  });
  
  await builder.export(outputPath, {
    usePipe: true, // 使用管道模式加速
  });
  
  console.log(`\n✅ 视频已生成: ${outputPath}`);
  console.log(`\n视频包含 ${scenes.length} 个场景，${mainTrack.transitions.length} 个转场效果`);
  builder.destroy();
}

main().catch(console.error);


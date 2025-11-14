/**
 * 转场效果调试测试
 * 创建一个非常简单的转场测试，便于调试
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

// 场景 1：红色背景，显示2秒
const scene1 = mainTrack.createScene({ duration: 2, startTime: 0 })
  .addBackground({ color: '#e74c3c' }) // 红色
  .addText({
    text: '场景 1',
    color: '#ffffff',
    fontSize: '120rpx',
    x: '50vw',
    y: '50vh',
    textAlign: 'center',
    duration: 2,
    startTime: 0,
    fontFamily: 'MicrosoftYaHei',
  });

// 场景 2：蓝色背景，从第2秒开始，显示2秒
// 转场：从第1秒到第2秒（1秒转场）
const scene2 = mainTrack.createScene({ duration: 2, startTime: 2 })
  .addBackground({ color: '#3498db' }) // 蓝色
  .addText({
    text: '场景 2',
    color: '#ffffff',
    fontSize: '120rpx',
    x: '50vw',
    y: '50vh',
    textAlign: 'center',
    duration: 2,
    startTime: 0,
    fontFamily: 'MicrosoftYaHei',
  });

// 添加转场效果（从场景1到场景2）
// 可以尝试不同的转场效果，修改下面的 name 即可：
// - fade: 淡入淡出
// - CrossZoom: 交叉缩放
// - CircleCrop: 圆形裁剪
// - LinearBlur: 线性模糊
// - Swirl: 漩涡
// - Directional: 方向擦除
// - Bounce: 弹跳
// - Dreamy: 梦幻
// - Radial: 径向
// - GridFlip: 网格翻转
// - Mosaic: 马赛克
// - PolkaDotsCurtain: 圆点窗帘
const transitionName = process.argv[2] || 'CrossZoom'; // 可以通过命令行参数指定转场效果
mainTrack.addTransition({
  name: transitionName,
  duration: 1, // 转场时长 1 秒
  startTime: 2, // 转场开始时间（场景2的开始时间）
});

// 导出视频
async function main() {
  const outputPath = path.join(__dirname, '../output/test-transition-debug.mp4');
  console.log('开始渲染转场调试测试视频...');
  console.log('总时长:', builder.getTotalDuration(), '秒');
  console.log('场景数量:', mainTrack.scenes.length);
  console.log('转场数量:', mainTrack.transitions.length);
  console.log('\n转场列表:');
  mainTrack.transitions.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} - 开始时间: ${t.startTime}s, 时长: ${t.duration}s`);
    console.log(`     转场时间范围: ${t.startTime - t.duration}s 到 ${t.startTime}s`);
  });
  
  await builder.export(outputPath, {
    usePipe: true, // 使用管道模式加速
  });
  
  console.log(`\n✅ 视频已生成: ${outputPath}`);
  console.log(`\n使用的转场效果: ${transitionName}`);
  console.log('转场应该在 1.5-2.5 秒之间显示（场景1结束前0.5秒 + 场景2开始后0.5秒）');
  builder.destroy();
}

main().catch(console.error);


/**
 * 转场效果全量测试 - 测试多种转场效果
 */
import { VideoBuilder } from '../src/index.js';

async function testTransitionEffects() {
  console.log('=== 转场效果全量测试 ===\n');
  
  // 创建构建器
  const builder = new VideoBuilder({
    width: 1280,
    height: 720,
    fps: 30,
  });
  
  // 创建轨道
  const track = builder.createTrack({ name: '主轨道' });
  
  // 测试的转场效果列表
  const transitions = [
    'fade',              // 淡入淡出
    'wipeLeft',          // 左擦除
    'wipeRight',         // 右擦除
    'wipeUp',            // 上擦除
    'wipeDown',          // 下擦除
    'directional-left',  // 方向性左滑
    'directional-right', // 方向性右滑
    'CrossZoom',         // 交叉缩放
    'CircleCrop',        // 圆形裁剪
    'pixelize',          // 像素化
    'wind',              // 风吹效果
    'morph',             // 变形
  ];
  
  const colors = [
    '#FF6B6B',  // 红
    '#4ECDC4',  // 青
    '#95E1D3',  // 绿
    '#FFD93D',  // 黄
    '#6BCB77',  // 淡绿
    '#4D96FF',  // 蓝
    '#FF6B9D',  // 粉红
    '#C44569',  // 暗红
    '#FFA500',  // 橙
    '#9B59B6',  // 紫
    '#1ABC9C',  // 蓝绿
    '#E74C3C',  // 砖红
  ];
  
  const sceneDuration = 1.5; // 每个场景 1.5 秒
  const transitionDuration = 1; // 转场时长 0.4 秒
  
  // 创建场景和转场
  for (let i = 0; i < transitions.length; i++) {
    const transitionName = transitions[i];
    const color = colors[i % colors.length];
    
    console.log(`创建场景 ${i + 1}: 颜色=${color}, 转场=${transitionName}`);
    
    // 创建场景
    const scene = track.createScene({
      duration: sceneDuration,
      startTime: i * sceneDuration,
    })
      .addBackground({ color })
      .addText({
        text: `${i + 1}. ${transitionName}`,
        fontSize: 60,
        color: '#FFFFFF',
        x: '50%',
        y: '50%',
        textAlign: 'center',
        startTime: 0,
        duration: sceneDuration,
      });
    
    // 添加转场（除了最后一个场景）
    if (i < transitions.length - 1) {
      track.addTransition({
        name: transitionName,
        duration: transitionDuration,
      });
    }
  }
  
  console.log(`\n总共创建了 ${transitions.length} 个场景和 ${transitions.length - 1} 个转场\n`);
  
  // 初始化并构建
  await builder.initialize();
  const composition = builder.build();
  
  // 打印转场信息
  console.log('转场信息统计：');
  if (composition.transitions && composition.transitions.length > 0) {
    console.log(`检测到 ${composition.transitions.length} 个转场\n`);
    
    composition.transitions.forEach((t, idx) => {
      const fromSceneEndTime = (t.fromScene.startTime || 0) + t.fromScene.duration;
      console.log(`转场 ${idx + 1}: ${t.name.padEnd(15)} [${t.startTime.toFixed(2)}s - ${t.endTime.toFixed(2)}s] (${(t.duration * 1000).toFixed(0)}ms)`);
    });
  }
  
  // 导出视频
  console.log('\n正在导出视频...');
  const outputPath = './examples/output/transition-effects-test.mp4';
  
  try {
    await composition.export(outputPath, {
      parallel: true,
      maxWorkers: 4,
    });
    console.log(`\n✓ 转场效果测试视频已导出到: ${outputPath}`);
    console.log('\n视频包含以下转场效果：');
    transitions.forEach((t, idx) => {
      if (idx < transitions.length - 1) {
        console.log(`  ${idx + 1}. ${t}`);
      }
    });
  } catch (error) {
    console.error('导出失败:', error);
  }
  
  composition.destroy();
  builder.destroy();
}

testTransitionEffects().catch(console.error);

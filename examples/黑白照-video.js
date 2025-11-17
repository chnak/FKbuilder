import { VideoBuilder, getAudioDuration, withContext } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案
const colors = {
  softPink: '#f1e7e4',    // 浅粉色 - 温柔、回忆
  rose: '#f97184',        // 粉红色 - 情感、温暖
  lightBlue: '#b3cbd9',   // 淡蓝色 - 宁静、回忆
  brown: '#c47554',       // 棕色 - 怀旧、温暖
  darkBlue: '#324061',    // 深蓝灰色 - 深沉、悲伤
  white: '#ffffff',       // 白色 - 纯净、照片
  black: '#000000',       // 黑色 - 黑白照、深沉
};

/**
 * 黑白照 - 根据歌词意境制作视频
 * 主题：失去父爱、回忆、孤独、黑白照片
 */
async function createBlackWhitePhotoVideo() {
  console.log('📸 黑白照 - 视频生成...\n');

  const name = "黑白照";
  const audioFile = path.join(__dirname, `../assets/${name}.mp3`);
  const lrcFile = path.join(__dirname, `../assets/${name}.lrc`);

  // 检查文件是否存在
  if (!await fs.pathExists(audioFile)) {
    console.error(`音频文件不存在: ${audioFile}`);
    return;
  }

  if (!await fs.pathExists(lrcFile)) {
    console.error(`LRC 文件不存在: ${lrcFile}`);
    return;
  }

  // 获取音频时长
  console.log('📊 正在获取音频时长...');
  const audioDuration = await getAudioDuration(audioFile);
  const audioDurationNum = Number(audioDuration) || 0;
  
  if (audioDurationNum <= 0) {
    console.error('无法获取音频时长');
    return;
  }

  console.log(`✅ 音频时长: ${audioDurationNum.toFixed(2)} 秒\n`);

  const builder = new VideoBuilder({
    width: 720,
    height: 1280,
    fps: 30,
  });

  // ========== 主轨道：视觉元素 ==========
  const mainTrack = builder.createTrack({ zIndex: 1 });

  // 创建主场景，使用音频时长作为场景时长
  const scene = mainTrack.createScene({ duration: audioDurationNum })
    // 背景使用深蓝灰色，营造深沉、怀旧的氛围
    .addBackground({ color: colors.darkBlue })
    
    // ========== 标题：黑白照 ==========
    .addText({
      text: '黑白照',
      x: '50%',
      y: '12%',
      fontSize: 72,
      color: colors.white,
      fontFamily: '微软雅黑',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 10,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 1.5 },
        { type: 'fade', fromOpacity: 1, toOpacity: 0.7, duration: audioDurationNum - 1.5, delay: 1.5 },
      ],
      // 使用 onFrame 添加呼吸效果和闪烁
      onFrame: withContext((element, progress, time) => {
        // 轻微的呼吸效果
        const breath = 1 + Math.sin(time * 0.5) * 0.02;
        if (element.config) {
          element.config.scaleX = breath;
          element.config.scaleY = breath;
        }
        // 添加轻微的闪烁效果
        const flicker = 0.7 + Math.sin(time * 3) * 0.15; // 从 0.55 到 0.85 之间闪烁
        if (element.config) {
          element.config.opacity = flicker;
        }
      }, {}),
    })
    
    // ========== 装饰元素：象征照片的相框 ==========
    // 左上角装饰 - 象征旧照片的边角
    .addRect({
      x: '15%',
      y: '8%',
      width: 60,
      height: 60,
      bgcolor: colors.brown,
      opacity: 0.3,
      rotation: -15,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 2 },
      ],
    })
    
    // 右上角装饰
    .addRect({
      x: '85%',
      y: '8%',
      width: 60,
      height: 60,
      bgcolor: colors.brown,
      opacity: 0.3,
      rotation: 15,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 2 },
      ],
    })
    
    // ========== 示波器：使用 particles 样式，象征回忆的碎片 ==========
    .addOscilloscope({
      audioPath: audioFile,
      x: '50%',
      y: '50%',
      width: 650,
      height: 400,
      style: 'particles', // 粒子效果，象征回忆碎片
      waveColor: colors.rose, // 粉红色，象征温暖的情感
      backgroundColor: 'rgba(50, 64, 97, 0.3)', // 半透明深蓝灰色背景
      lineWidth: 2,
      sensitivity: 1.2,
      mirror: true,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 3,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 2 },
      ],
    })
    
    // ========== 装饰性圆形：象征照片的圆形元素 ==========
    // 左侧装饰圆形
    .addCircle({
      x: '20%',
      y: '35%',
      radius: 40,
      bgcolor: colors.softPink,
      opacity: 0.2,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.2, duration: 3 },
        { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.2, toScaleY: 1.2, duration: audioDurationNum, easing: 'easeInOut' },
      ],
      // 使用 onFrame 添加旋转、颜色变化和闪烁
      onFrame: withContext((element, progress, time) => {
        // 缓慢旋转
        element.rotation = time * 10;
        // 添加闪烁效果
        const flicker = 0.2 + Math.sin(time * 3) * 0.15; // 从 0.05 到 0.35 之间闪烁
        if (element.config) {
          element.config.opacity = flicker;
        }
      }, {}),
    })
    
    // 右侧装饰圆形
    .addCircle({
      x: '80%',
      y: '65%',
      radius: 50,
      bgcolor: colors.lightBlue,
      opacity: 0.15,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.15, duration: 3 },
        { type: 'transform', fromScaleX: 0.5, fromScaleY: 0.5, toScaleX: 1.3, toScaleY: 1.3, duration: audioDurationNum, easing: 'easeInOut' },
      ],
      // 使用 onFrame 添加反向旋转、呼吸效果和闪烁
      onFrame: withContext((element, progress, time) => {
        // 反向旋转
        element.rotation = -time * 8;
        // 呼吸效果
        const breath = 1 + Math.sin(time * 0.8) * 0.1;
        if (element.config) {
          element.config.scaleX = breath;
          element.config.scaleY = breath;
        }
        // 添加闪烁效果
        const flicker = 0.15 + Math.sin(time * 3.5) * 0.1; // 从 0.05 到 0.25 之间闪烁
        if (element.config) {
          element.config.opacity = flicker;
        }
      }, {}),
    })
    
    // ========== 装饰性路径：象征照片的边框线条 ==========
    // 顶部装饰线
    .addPath({
      points: [
        [100, 200],
        [200, 180],
        [300, 200],
        [400, 190],
        [500, 200],
        [600, 195],
      ],
      closed: false,
      strokeColor: colors.brown,
      strokeWidth: 2,
      opacity: 0.3,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 2 },
      ],
    })
    
    // 底部装饰线
    .addPath({
      points: [
        [100, 1000],
        [200, 1020],
        [300, 1000],
        [400, 1010],
        [500, 1000],
        [600, 1005],
      ],
      closed: false,
      strokeColor: colors.brown,
      strokeWidth: 2,
      opacity: 0.3,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.3, duration: 2 },
      ],
    })
    
    
    // ========== 装饰性矩形：象征照片的边框 ==========
    // 中心照片边框效果
    .addRect({
      x: '50%',
      y: '50%',
      width: 680,
      height: 420,
      bgcolor: 'transparent',
      borderColor: colors.brown,
      borderWidth: 3,
      borderRadius: 5,
      opacity: 0.4,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 4,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 2 },
      ],
    })
    
    // ========== 底部装饰文字：象征照片的日期或文字 ==========
    .addText({
      text: '回忆',
      x: '50%',
      y: '85%',
      fontSize: 48,
      color: colors.softPink,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      opacity: 0.4,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 5,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.4, duration: 3 },
      ],
      // 使用 onFrame 添加闪烁效果
      onFrame: withContext((element, progress, time) => {
        // 增强的闪烁效果：更快的频率和更大的变化范围
        const flicker = 0.3 + Math.sin(time * 4) * 0.3; // 从 0.0 到 0.6 之间闪烁
        if (element.config) {
          element.config.opacity = flicker;
        }
      }, {}),
    });

  // ========== 装饰性元素：象征回忆的碎片 ==========
  // 多个小圆形，象征照片中的光点或回忆
  const fragmentRadii = [10, 12, 8, 15, 9, 11, 13, 7]; // 预定义半径，避免随机数
  for (let i = 0; i < 8; i++) {
    const index = i; // 保存 index 用于上下文
    const angle = (index / 8) * Math.PI * 2;
    const radius = 250;
    const centerX = 360; // 50% of 720
    const centerY = 640; // 50% of 1280
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    // 使用 withContext 关联 index 上下文
    const onFrameFragment = withContext((element, progress, time) => {
      // 每个碎片以不同速度旋转
      element.rotation = time * (15 + index * 5);
      // 增强的闪烁效果：不同频率和更大的变化范围
      const flicker = 0.1 + Math.sin(time * (4 + index * 0.5) + index) * 0.15; // 从 0.0 到 0.25 之间闪烁
      if (element.config) {
        element.config.opacity = flicker;
      }
    }, { index });
    
    scene.addCircle({
      x: x,
      y: y,
      radius: fragmentRadii[index],
      bgcolor: colors.softPink,
      opacity: 0.15,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 0.15, duration: 2 + index * 0.3 },
        { type: 'fade', fromOpacity: 0.15, toOpacity: 0.05, duration: audioDurationNum - 2, delay: 2 },
        { 
          type: 'transform', 
          fromScaleX: 0.3, 
          fromScaleY: 0.3, 
          toScaleX: 1.5, 
          toScaleY: 1.5, 
          duration: audioDurationNum, 
          easing: 'easeInOut',
          delay: index * 0.2,
        },
      ],
      // 使用 onFrame 添加旋转和闪烁效果
      onFrame: onFrameFragment,
    });
  }

  // ========== 歌词轨道：单独轨道显示歌词 ==========
  const lyricTrack = builder.createTrack({ zIndex: 10 });
  const lyricScene = lyricTrack.createScene({ duration: audioDurationNum })
    .addLRC(lrcFile, {
      position: 'bottom',
      fontSize: 36,
      color: colors.white,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      maxLength: 20,
      duration: audioDurationNum,
      startTime: 0,
      zIndex: 10,
      // 文本分割：按字母分割
      split: 'letter',
      splitDelay: 0.08, // 每个字母延迟 0.08 秒出现
      splitDuration: 0.4, // 每个字母动画持续时间 0.4 秒
      // 动画效果：淡入和淡出
      animations: ['bigIn'],
      // 支持文本效果
      stroke: true,
      strokeColor: colors.darkBlue,
      strokeWidth: 1,
      // textShadow: true,
      // textShadowColor: colors.black,
      // textShadowBlur: 4,
      // textShadowOffsetX: 2,
      // textShadowOffsetY: 2,
    });

  // ========== 音频轨道：单独轨道添加音频 ==========
  const audioTrack = builder.createTrack({ zIndex: 0 });
  const audioScene = audioTrack.createScene({ duration: audioDurationNum })
    .addAudio({
      src: audioFile,
      startTime: 0,
      duration: audioDurationNum,
    });

  // 构建并导出
  try {
    const videoMaker = builder.build();
    
    const outputPath = path.join(__dirname, '../output/黑白照-video.mp4');
    console.log(`场景时长: ${audioDurationNum.toFixed(2)} 秒`);
    console.log(`总帧数: ${Math.ceil(audioDurationNum * 30)} 帧\n`);
    
    await videoMaker.export(outputPath, {
      parallel: true,
      usePipe: true,
      maxWorkers: 4,
    });
    
    console.log(`\n✅ 视频导出成功: ${outputPath}`);
    console.log('\n✨ 黑白照视频制作完成！');
    console.log('\n📝 设计说明：');
    console.log('  - 主题：失去父爱、回忆、孤独、黑白照片');
    console.log('  - 配色：使用温柔、怀旧的色调');
    console.log('  - 示波器：particles 样式，象征回忆碎片');
    console.log('  - 元素：照片边框、装饰圆形、路径线条等');
    
    builder.destroy();
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error('详细错误:', error);
    builder.destroy();
  }
}

createBlackWhitePhotoVideo().catch(console.error);


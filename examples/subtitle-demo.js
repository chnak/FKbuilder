/**
 * 字幕示例
 *
 * 演示内容：
 *  1. 基础字幕 + 阴影 / 发光
 *  2. 长文本自动按标点/长度分段（auto-split）
 *  3. 字符级逐字动画（split: 'letter'）
 *  4. 单词级逐词动画（split: 'word'）
 *  5. 描边 + 渐变 + 背景框三种文本效果组合
 *  6. 从 LRC 文件加载歌词字幕（addLRC）
 */
import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎬 字幕示例生成中...\n');

  const builder = new VideoBuilder({
    width: 1280,
    height: 720,
    fps: 30,
  });

  // 所有场景使用同一轨道，按 startTime 顺序播放
  const track = builder.createTrack({ zIndex: 1, name: '主轨道' });

  const SCENE1_DURATION = 5;
  const SCENE2_DURATION = 6;
  const SCENE3_DURATION = 5;
  const SCENE4_DURATION = 5;
  const SCENE5_DURATION = 6;

  const t0 = 0;
  const t1 = SCENE1_DURATION;
  const t2 = t1 + SCENE2_DURATION;
  const t3 = t2 + SCENE3_DURATION;
  const t4 = t3 + SCENE4_DURATION;
  const t5 = t4 + SCENE5_DURATION;

  // ============== 场景 1：基础字幕 + 阴影 / 发光 ==============
  track
    .createScene({ duration: SCENE1_DURATION, startTime: t0 })
    .addBackground({ color: '#0b132b' })
    .addText({
      text: '字幕基础样式',
      x: '50%',
      y: '18%',
      fontSize: 56,
      color: '#5acbed',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: SCENE1_DURATION,
      startTime: 0,
      gradient: true,
      gradientColors: ['#5acbed', '#208ab7'],
      gradientDirection: 'horizontal',
      textGlow: true,
      textGlowColor: '#5acbed',
      textGlowBlur: 18,
      animations: ['fadeIn'],
    })
    .addSubtitle({
      text: '这是基础字幕：白色文字配柔和阴影。',
      x: '50%',
      y: '55%',
      fontSize: 40,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.4,
      textShadow: true,
      textShadowColor: 'rgba(0, 0, 0, 0.85)',
      textShadowBlur: 8,
      textShadowOffsetY: 3,
      animations: [{ type: 'fade', duration: 0.5 }],
    })
    .addSubtitle({
      text: '这是发光字幕：金色文字配霓虹光晕。',
      x: '50%',
      y: '72%',
      fontSize: 36,
      color: '#ffd166',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.8,
      textGlow: true,
      textGlowColor: '#ffd166',
      textGlowBlur: 16,
      animations: [{ type: 'fade', duration: 0.5 }],
    });

  // ============== 场景 2：长文本自动分段 ==============
  track
    .createScene({ duration: SCENE2_DURATION, startTime: t1 })
    .addBackground({ color: '#14213d' })
    .addText({
      text: '自动按标点 / 长度分段',
      x: '50%',
      y: '18%',
      fontSize: 48,
      color: '#e6e9f0',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: SCENE2_DURATION,
      startTime: 0,
      animations: ['fadeIn'],
    })
    .addSubtitle({
      text: '字幕组件会自动按标点符号和最大长度将长文本拆分成多行，并按字数比例分配每段的显示时长，让阅读节奏更自然。',
      x: '50%',
      y: '55%',
      fontSize: 32,
      color: '#f1faee',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5.5,
      startTime: 0.3,
      maxLength: 18,
      textShadow: true,
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowBlur: 6,
      animations: [{ type: 'fade', duration: 0.5 }],
    });

  // ============== 场景 3：字符级逐字动画 ==============
  track
    .createScene({ duration: SCENE3_DURATION, startTime: t2 })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: '字符级逐字动画 (split: letter)',
      x: '50%',
      y: '20%',
      fontSize: 40,
      color: '#f72585',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: SCENE3_DURATION,
      startTime: 0,
      textGlow: true,
      textGlowColor: '#f72585',
      textGlowBlur: 14,
      animations: ['fadeIn'],
    })
    .addSubtitle({
      text: 'Hello World',
      x: '50%',
      y: '55%',
      fontSize: 80,
      color: '#4cc9f0',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4.5,
      startTime: 0.3,
      split: 'letter',
      splitDelay: 0.08,
      splitDuration: 0.4,
      textShadow: true,
      textShadowColor: 'rgba(76, 201, 240, 0.6)',
      textShadowBlur: 12,
    })
    .addSubtitle({
      text: '每个字符依次淡入',
      x: '50%',
      y: '78%',
      fontSize: 30,
      color: '#e6e9f0',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 1.2,
      textGlow: true,
      textGlowColor: '#4cc9f0',
      textGlowBlur: 10,
    });

  // ============== 场景 4：单词级逐词动画 ==============
  track
    .createScene({ duration: SCENE4_DURATION, startTime: t3 })
    .addBackground({ color: '#240046' })
    .addText({
      text: '单词级逐词动画 (split: word)',
      x: '50%',
      y: '20%',
      fontSize: 40,
      color: '#ffb703',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: SCENE4_DURATION,
      startTime: 0,
      textGlow: true,
      textGlowColor: '#ffb703',
      textGlowBlur: 14,
      animations: ['fadeIn'],
    })
    .addSubtitle({
      text: 'Make Video Creation Easier',
      x: '50%',
      y: '55%',
      fontSize: 60,
      color: '#fefae0',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 4.5,
      startTime: 0.3,
      split: 'word',
      splitDelay: 0.15,
      splitDuration: 0.4,
      stroke: true,
      strokeColor: '#ffb703',
      strokeWidth: 2,
    });

  // ============== 场景 5：描边 + 渐变 + 背景框 ==============
  track
    .createScene({ duration: SCENE5_DURATION, startTime: t4 })
    .addBackground({
      type: 'gradient',
      gradientColors: ['#3a0ca3', '#4361ee'],
      gradientDirection: 'diagonal',
    })
    .addText({
      text: '描边 + 渐变 + 背景框',
      x: '50%',
      y: '18%',
      fontSize: 48,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: SCENE5_DURATION,
      startTime: 0,
      animations: ['fadeIn'],
    })
    .addSubtitle({
      text: '带描边的字幕',
      x: '50%',
      y: '42%',
      fontSize: 44,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.3,
      stroke: true,
      strokeColor: '#f72585',
      strokeWidth: 4,
    })
    .addSubtitle({
      text: '渐变填充的字幕',
      x: '50%',
      y: '60%',
      fontSize: 44,
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.6,
      gradient: true,
      gradientColors: ['#ffb703', '#fb8500', '#ff006e'],
      gradientDirection: 'horizontal',
    })
    .addSubtitle({
      text: '带背景框的字幕',
      x: '50%',
      y: '80%',
      fontSize: 36,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.9,
      textBackground: true,
      textBackgroundColor: 'rgba(247, 37, 133, 0.85)',
      textBackgroundPadding: [12, 24],
      textBackgroundRadius: 8,
    });

  // ============== 场景 6：从 LRC 文件加载字幕 ==============
  const lrcPath = path.join(__dirname, '../assets/test.lrc');
  const hasLrc = await fs.pathExists(lrcPath);
  if (hasLrc) {
    // LRC 内的最大时间戳约 18.5s，再加 1.5s 收尾
    const SCENE6_DURATION = 20;
    track
      .createScene({ duration: SCENE6_DURATION, startTime: t5 })
      .addBackground({ color: '#0a0a23' })
      .addText({
        text: 'LRC 歌词字幕',
        x: '50%',
        y: '15%',
        fontSize: 40,
        color: '#80ed99',
        textAlign: 'center',
        anchor: [0.5, 0.5],
        duration: SCENE6_DURATION,
        startTime: 0,
        textGlow: true,
        textGlowColor: '#80ed99',
        textGlowBlur: 14,
        animations: ['fadeIn'],
      })
      .addLRC(lrcPath, {
        x: '50%',
        y: '75%',
        fontSize: 38,
        color: '#ffffff',
        textAlign: 'center',
        anchor: [0.5, 0.5],
        textShadow: true,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowBlur: 6,
        animations: [{ type: 'fade', duration: 0.3 }],
      });
  } else {
    console.warn(`⚠️  LRC 文件不存在: ${lrcPath}，跳过场景 6`);
  }

  // 输出
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'subtitle-demo.mp4');

  const exportOptions = {
    usePipe: true,
    parallel: true,
    maxWorkers: 4,
  };

  console.log(`\n📦 导出到: ${outputPath}`);
  await builder.export(outputPath, exportOptions);
  builder.destroy();
  console.log('✅ 完成');
}

main().catch((err) => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});

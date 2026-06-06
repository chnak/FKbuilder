/**
 * 示例 08 - 字幕顺序播放
 *
 * 演示新特性：同一场景内多次 addSubtitle 不传 startTime 时，
 * 会按调用顺序自动接续播放，场景 duration 也自动延长。
 *
 * 输出：output/08-subtitle-sequence.mp4
 */
import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const colors = {
  deepRed: '#8B0000',        // 深红色 - 碧血、殉葬
  bloodRed: '#DC143C',       // 血红色 - 血色、悲壮
  gold: '#FFD700',           // 金色 - 皇家、盛装
  darkGold: '#B8860B',       // 暗金色 - 古典、庄重
  lightGold: '#FFECB3',      // 浅金色 - 月光、温柔
  darkPurple: '#4B0082',     // 深紫色 - 悲壮、深沉
  darkNavy: '#1a1a2e',       // 深蓝黑 - 乱世、深沉
  white: '#ffffff',          // 白色 - 落花、纯洁
  palePink: '#FFE4E1',       // 淡粉色 - 落花、温柔
  lightYellow: '#FFFACD',    // 淡黄色 - 月光、温柔
  moonWhite: '#F0F8FF',      // 月白色 - 月光
  candleFlame: '#FFA500',    // 烛光橙 - 花烛
  wineRed: '#722F37',        // 酒红色 - 葡萄酿
  black: '#000000',          // 黑色 - 深沉、庄重
  starWhite: '#E6E6FA',      // 星白色 - 星星
};
async function main() {
  console.log('🎬 示例 08 - 字幕顺序播放\n');

  const builder = new VideoBuilder({
    width: 1280,
    height: 720,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1, name: '主轨道' });

  // ============== 场景 1：单场景多字幕自动接续 ==============
  // 初始 duration 只给 1s，字幕会自动把它延长到 13s
  track
    .createScene({ duration: 1 })
    .addBackground({
      type: 'gradient',
      gradientColors: ['#0f0c29', '#302b63', '#24243e'],
      gradientDirection: 'diagonal',
    })
    .addText({
      text: '字幕顺序播放',
      x: '50%',
      y: '15%',
      fontSize: 56,
      color: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 13,
      startTime: 0,
      gradient: true,
      gradientColors: ['#5acbed', '#f72585'],
      gradientDirection: 'horizontal',
      textGlow: true,
      textGlowColor: '#5acbed',
      textGlowBlur: 18,
      animations: ['fadeIn'],
    })
    .addText({
      text: 'addSubtitle · 无需 startTime · 自动接续',
      x: '50%',
      y: '25%',
      fontSize: 22,
      color: '#a0aec0',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 13,
      startTime: 0.3,
      animations: ['fadeIn'],
    })
    // 五条字幕，每条 2.5s，自动从 0 开始接续
    .addSubtitle({
      text: '第一句字幕：从 0 秒开始',
      position: 'bottom',
      fontSize: 44,
      color: colors.gold,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      maxLength: 20,
      duration: 3,
      startTime: 0,
      zIndex: 20,
      split: 'letter',
      splitDelay: 0.08,
      splitDuration: 0.4,
      animations: ['fadeIn'],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 18,
      stroke: true,
      strokeColor: colors.darkGold,
      strokeWidth: 2,
      textGlow: true,
      textGlowColor: colors.gold,
      textGlowBlur: 25,
    })
    .addSubtitle({
      text: '第二句字幕：自动接在第一句后面',
      x: '50%',
      y: '50%',
      fontSize: 42,
      color: '#5acbed',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 2.5,
      textGlow: true,
      textGlowColor: '#5acbed',
      textGlowBlur: 12,
      animations: [{ type: 'fade', duration: 0.3 }],
    })
    .addSubtitle({
      text: '第三句字幕：金色发光',
      fontSize: 44,
      color: colors.gold,
      fontFamily: '微软雅黑',
      textAlign: 'center',
      maxLength: 10,
      duration: 3,
      startTime: 0,
      zIndex: 20,
      split: 'letter',
      splitDelay: 0.08,
      splitDuration: 0.4,
      animations: ['fadeIn'],
      textShadow: true,
      textShadowColor: colors.deepRed,
      textShadowBlur: 18,
      stroke: true,
      strokeColor: colors.darkGold,
      strokeWidth: 2,
      textGlow: true,
      textGlowColor: colors.gold,
      textGlowBlur: 25,
    })
    .addSubtitle({
      text: '第四句字幕：渐变填充',
      x: '50%',
      y: '50%',
      fontSize: 42,
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 2.5,
      gradient: true,
      gradientColors: ['#ff006e', '#8338ec', '#3a86ff'],
      gradientDirection: 'horizontal',
      animations: [{ type: 'fade', duration: 0.3 }],
    })
    .addSubtitle({
      text: '第五句字幕：带背景框',
      x: '50%',
      y: '50%',
      fontSize: 42,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 2.5,
      textBackground: true,
      textBackgroundColor: 'rgba(67, 97, 238, 0.85)',
      textBackgroundPadding: [14, 28],
      textBackgroundRadius: 10,
      animations: [{ type: 'fade', duration: 0.3 }],
    });

  // ============== 场景 2：显式 startTime 跳跃 + 自动接续混合 ==============
  track
    .createScene({ duration: 1 })
    .addBackground({ color: '#1a1a2e' })
    .addText({
      text: '混合模式',
      x: '50%',
      y: '15%',
      fontSize: 48,
      color: '#80ed99',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 9,
      startTime: 0,
      textGlow: true,
      textGlowColor: '#80ed99',
      textGlowBlur: 14,
      animations: ['fadeIn'],
    })
    .addText({
      text: '显式 startTime 跳跃后，自动接续跟随',
      x: '50%',
      y: '25%',
      fontSize: 22,
      color: '#a0aec0',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 9,
      startTime: 0.3,
      animations: ['fadeIn'],
    })
    .addSubtitle({
      text: 'A · 自动',
      x: '50%',
      y: '50%',
      fontSize: 38,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 2,
      animations: [{ type: 'fade', duration: 0.3 }],
    })
    .addSubtitle({
      text: 'B · 自动接续',
      x: '50%',
      y: '50%',
      fontSize: 38,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 2,
      animations: [{ type: 'fade', duration: 0.3 }],
    })
    .addSubtitle({
      text: 'C · 显式 startTime=6 跳跃',
      x: '50%',
      y: '50%',
      fontSize: 38,
      color: '#ffd166',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 2,
      startTime: 6,
      textGlow: true,
      textGlowColor: '#ffd166',
      textGlowBlur: 12,
      animations: [{ type: 'fade', duration: 0.3 }],
    })
    .addSubtitle({
      text: 'D · 跳跃后自动接续',
      x: '50%',
      y: '50%',
      fontSize: 38,
      color: '#ffffff',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: 2,
      textBackground: true,
      textBackgroundColor: 'rgba(247, 37, 133, 0.85)',
      textBackgroundPadding: [10, 22],
      textBackgroundRadius: 6,
      animations: [{ type: 'fade', duration: 0.3 }],
    });

  // 输出
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, '08-subtitle-sequence.mp4');

  console.log(`📦 导出到: ${outputPath}`);
  await builder.export(outputPath, {
    usePipe: true,
    parallel: true,
    maxWorkers: 4,
  });
  builder.destroy();
  console.log('✅ 完成');
}

main().catch((err) => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});

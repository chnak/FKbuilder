/**
 * 验证响度归一化（loudnorm）是否生效
 *
 * 用 assets/music.wav（LRA 20 LU）做背景音，渲染 3 秒视频，
 * 对比输出 MP4 的 EBU R128 指标是否符合预期：
 *   - 不归一化（LRA 应该 ~20 LU，源文件特征）
 *   - 归一化（LRA 应该 ≤ 11 LU，shortvideo 预设）
 */
import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioPath = path.join(__dirname, '../assets/music.wav');
const outputDir = path.join(__dirname, '../output');

async function runOne({ name, loudnessNormalization }) {
  const out = path.join(outputDir, `loudness-${name}.mp4`);
  await fs.remove(out).catch(() => {});

  const builder = new VideoBuilder({ width: 640, height: 360, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  track.createScene({ duration: 3 })
    .addBackground({ color: '#222', duration: 3 })
    .addText({ text: name, color: '#fff', fontSize: 60, x: '50%', y: '50%', textAlign: 'center', duration: 3 })
    .addAudio({
      src: audioPath,
      startTime: 0,
      duration: 3,
      cutFrom: 0,
      cutTo: 3,
      volume: 1.0,
    });

  await builder.export(out, { usePipe: true, loudnessNormalization });
  return out;
}

async function measureLoudness(mp4Path) {
  // ebur128 summary 写到 stderr
  const result = await execa('ffmpeg', [
    '-hide_banner', '-i', mp4Path,
    '-af', 'ebur128=peak=true',
    '-f', 'null', '-',
  ], { reject: false });
  const text = (result.stderr || '') + (result.stdout || '');
  const m = text.match(/Integrated loudness:\s*\n\s*I:\s*(-?[\d.]+) LUFS[\s\S]*?Loudness range:\s*\n\s*LRA:\s*([\d.]+) LU[\s\S]*?Peak:\s*(-?[\d.]+) dBFS/);
  if (!m) return { error: '无法解析 EBU R128 输出' };
  return { I: parseFloat(m[1]), LRA: parseFloat(m[2]), TP: parseFloat(m[3]) };
}

async function main() {
  await fs.ensureDir(outputDir);
  console.log('📊 源文件 music.wav EBU R128:');
  const src = await measureLoudness(audioPath);
  console.log(`   I=${src.I} LUFS, LRA=${src.LRA} LU, TP=${src.TP} dBFS\n`);

  for (const [name, flag] of [['with-norm', true], ['no-norm', false]]) {
    console.log(`🎬 渲染: ${name} (loudnessNormalization=${flag})`);
    const out = await runOne({ name, loudnessNormalization: flag });
    const r = await measureLoudness(out);
    if (r.error) {
      console.log(`   ⚠️  ${r.error}\n`);
    } else {
      console.log(`   I=${r.I} LUFS, LRA=${r.LRA} LU, TP=${r.TP} dBFS`);
      console.log(`   输出: ${out}\n`);
    }
  }

  console.log('✅ 完成');
  console.log('   预期: no-norm 的 LRA 应接近源文件 (~20 LU)');
  console.log('         with-norm 的 LRA 应 ≤ 11 LU，I 接近 -16 LUFS');
}

main().catch(err => { console.error(err); process.exit(1); });

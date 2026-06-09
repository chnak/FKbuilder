/**
 * 用 TTS 音频测试响度归一化效果
 * 对比：源文件、归一化后、不归一化三种状态的 EBU R128 + 采样率
 */
import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import execa from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioPath = path.join(__dirname, '../assets/tts_1780889989503_ufrh67.mp3');
const outputDir = path.join(__dirname, '../output');

async function runOne({ name, loudnessNormalization, duration }) {
  const out = path.join(outputDir, `tts-${name}.mp4`);
  await fs.remove(out).catch(() => {});

  const builder = new VideoBuilder({ width: 640, height: 360, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  track.createScene({ duration })
    .addBackground({ color: '#1a1a2e', duration })
    .addText({ text: name, color: '#fff', fontSize: 50, x: '50%', y: '50%', textAlign: 'center', duration })
    .addAudio({
      src: audioPath,
      startTime: 0,
      duration,
      cutFrom: 0,
      cutTo: duration,
      volume: 1.0,
    });

  await builder.export(out, { usePipe: true, loudnessNormalization });
  return out;
}

async function measure(mp4Path) {
  const result = await execa('ffmpeg', [
    '-hide_banner', '-i', mp4Path,
    '-af', 'ebur128=peak=true',
    '-f', 'null', '-',
  ], { reject: false });
  const text = (result.stderr || '') + (result.stdout || '');
  const m = text.match(/Integrated loudness:\s*\n\s*I:\s*(-?[\d.]+) LUFS[\s\S]*?Loudness range:\s*\n\s*LRA:\s*([\d.]+) LU[\s\S]*?Peak:\s*(-?[\d.]+) dBFS/);
  if (!m) return { error: '无法解析' };
  return { I: parseFloat(m[1]), LRA: parseFloat(m[2]), TP: parseFloat(m[3]) };
}

async function sampleRate(p) {
  const r = await execa('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=sample_rate', '-of', 'default=noprint_wrappers=1:nokey=1', p]);
  return r.stdout.trim();
}

async function main() {
  await fs.ensureDir(outputDir);

  console.log('📊 源文件 tts_1780889989503_ufrh67.mp3:');
  console.log(`   ${await measure(audioPath)}`);
  console.log(`   采样率: ${await sampleRate(audioPath)} Hz\n`);

  for (const [name, flag] of [['with-norm', true], ['no-norm', false]]) {
    console.log(`🎬 渲染: ${name}`);
    const out = await runOne({ name, loudnessNormalization: flag, duration: 9.5 });
    const r = await measure(out);
    const sr = await sampleRate(out);
    console.log(`   I=${r.I} LUFS, LRA=${r.LRA} LU, TP=${r.TP} dBFS, 采样率=${sr} Hz`);
    console.log(`   文件: ${out}\n`);
  }

  console.log('✅ 预期:');
  console.log('   with-norm: I 接近 -16 LUFS，TP 安全');
  console.log('   no-norm:   保持源特征 (-22 LUFS, TP -5 dBFS)');
  console.log('   采样率两端都应保持 32000 Hz 不变');
}

main().catch(err => { console.error(err); process.exit(1); });

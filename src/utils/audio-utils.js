import { execa } from 'execa';
import fs from 'fs-extra';

/**
 * 获取音频文件时长
 * @param {string} audioFile - 音频文件路径
 * @returns {Promise<number>} 音频时长（秒）
 */
export async function getAudioDuration(audioFile) {
  if (!audioFile || !await fs.pathExists(audioFile)) {
    console.warn(`音频文件不存在: ${audioFile}`);
    return 0;
  }

  try {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioFile,
    ]);
    
    const duration = parseFloat(stdout.trim());
    return duration || 0;
  } catch (error) {
    console.warn(`无法获取音频时长: ${error.message}`);
    return 0;
  }
}

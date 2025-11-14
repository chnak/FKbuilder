import { execa } from 'execa';
import path from 'path';
import fs from 'fs-extra';
import { DEFAULT_FFMPEG_CONFIG } from '../types/constants.js';

/**
 * FFmpeg 工具类
 */
export class FFmpegUtil {
  constructor(config = {}) {
    this.config = { ...DEFAULT_FFMPEG_CONFIG, ...config };
  }

  /**
   * 检查 FFmpeg 是否可用
   */
  async checkFFmpeg() {
    try {
      const { stdout } = await execa('ffmpeg', ['-version']);
      return stdout.includes('ffmpeg version');
    } catch (error) {
      throw new Error('FFmpeg is not installed or not in PATH. Please install FFmpeg first.');
    }
  }

  /**
   * 将图片序列转换为视频
   * @param {string} inputPattern - 输入图片序列模式（如：frame_%04d.png）
   * @param {string} outputPath - 输出视频路径
   * @param {Object} options - 选项
   */
  async imagesToVideo(inputPattern, outputPath, options = {}) {
    await this.checkFFmpeg();

    const {
      fps = 30,
      width,
      height,
      codec = this.config.codec,
      preset = this.config.preset,
      crf = this.config.crf,
      pixelFormat = this.config.pixelFormat,
    } = options;

    const args = [
      '-y', // 覆盖输出文件
      '-hide_banner', // 隐藏版本信息横幅
      '-loglevel', 'error', // 只显示错误信息
      '-framerate', fps.toString(),
      '-i', inputPattern,
      '-c:v', codec,
      '-preset', preset,
      '-crf', crf.toString(),
      '-pix_fmt', pixelFormat,
    ];

    if (width && height) {
      args.push('-s', `${width}x${height}`);
    }

    args.push(outputPath);

    try {
      await execa('ffmpeg', args);
      return outputPath;
    } catch (error) {
      throw new Error(`FFmpeg encoding failed: ${error.message}`);
    }
  }

  /**
   * 添加音频到视频
   * @param {string} videoPath - 视频路径
   * @param {string} audioPath - 音频路径
   * @param {string} outputPath - 输出路径
   * @param {Object} options - 选项
   */
  async addAudioToVideo(videoPath, audioPath, outputPath, options = {}) {
    await this.checkFFmpeg();

    const {
      audioCodec = this.config.audioCodec,
      audioBitrate = this.config.audioBitrate,
      audioStartTime = 0,
    } = options;

    const args = [
      '-y',
      '-hide_banner', // 隐藏版本信息横幅
      '-loglevel', 'error', // 只显示错误信息
      '-i', videoPath,
      '-i', audioPath,
      '-c:v', 'copy', // 复制视频流，不重新编码
      '-c:a', audioCodec,
      '-b:a', audioBitrate,
      '-map', '0:v:0',
      '-map', '1:a:0',
    ];

    if (audioStartTime > 0) {
      args.push('-ss', audioStartTime.toString());
    }

    args.push('-shortest', outputPath);

    try {
      await execa('ffmpeg', args);
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to add audio to video: ${error.message}`);
    }
  }

  /**
   * 合并多个视频
   * @param {string[]} videoPaths - 视频路径数组
   * @param {string} outputPath - 输出路径
   */
  async concatVideos(videoPaths, outputPath) {
    await this.checkFFmpeg();

    // 创建临时文件列表
    const listFile = path.join(path.dirname(outputPath), 'concat_list.txt');
    const listContent = videoPaths.map(p => `file '${path.resolve(p)}'`).join('\n');
    await fs.writeFile(listFile, listContent);

    const args = [
      '-y',
      '-hide_banner', // 隐藏版本信息横幅
      '-loglevel', 'error', // 只显示错误信息
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-c', 'copy',
      outputPath,
    ];

    try {
      await execa('ffmpeg', args);
      await fs.remove(listFile); // 清理临时文件
      return outputPath;
    } catch (error) {
      await fs.remove(listFile).catch(() => {});
      throw new Error(`Failed to concat videos: ${error.message}`);
    }
  }

  /**
   * 获取视频信息
   * @param {string} videoPath - 视频路径
   */
  async getVideoInfo(videoPath) {
    await this.checkFFmpeg();

    const args = [
      '-i', videoPath,
      '-hide_banner', // 隐藏版本信息横幅
      '-loglevel', 'error', // 只显示错误信息
    ];

    try {
      const { stderr } = await execa('ffmpeg', args, { reject: false });
      // 解析 stderr 输出获取视频信息
      const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      const sizeMatch = stderr.match(/(\d+)x(\d+)/);
      const fpsMatch = stderr.match(/(\d+(?:\.\d+)?) fps/);

      return {
        duration: durationMatch ? this.parseDuration(durationMatch) : 0,
        width: sizeMatch ? parseInt(sizeMatch[1]) : 0,
        height: sizeMatch ? parseInt(sizeMatch[2]) : 0,
        fps: fpsMatch ? parseFloat(fpsMatch[1]) : 30,
      };
    } catch (error) {
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }

  /**
   * 解析时长字符串
   */
  parseDuration(match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 合并多个音频文件
   * @param {Array<Object>} audioConfigs - 音频配置数组 [{path, startTime, duration, volume, fadeIn, fadeOut, loop}, ...]
   * @param {Object} options - 选项
   * @returns {Promise<string>} 合并后的音频文件路径
   */
  async mergeAudios(audioConfigs, options = {}) {
    await this.checkFFmpeg();

    const {
      outputDir = './output',
      duration, // 总时长（秒）
    } = options;

    if (!audioConfigs || audioConfigs.length === 0) {
      return null;
    }

    // 如果只有一个音频，直接返回
    if (audioConfigs.length === 1) {
      const audio = audioConfigs[0];
      if (audio.fadeIn === 0 && audio.fadeOut === 0 && audio.volume === 1.0 && audio.startTime === 0) {
        return audio.path;
      }
    }

    // 创建临时目录
    const tempDir = path.join(outputDir, `temp_audio_${Date.now()}`);
    await fs.ensureDir(tempDir);

    try {
      // 处理每个音频文件（应用音量、淡入淡出等效果）
      const processedAudios = [];
      for (let i = 0; i < audioConfigs.length; i++) {
        const audio = audioConfigs[i];
        if (!await fs.pathExists(audio.path)) {
          console.warn(`音频文件不存在: ${audio.path}`);
          continue;
        }

        const processedPath = path.join(tempDir, `processed_${i}.wav`);
        const args = [
          '-y',
          '-hide_banner', // 隐藏版本信息横幅
          '-loglevel', 'error', // 只显示错误信息
          '-i', audio.path
        ];

        // 音频裁剪：从原始音频文件中裁剪指定时间段
        // 支持 cutFrom/cutTo（新方式）和 audioStartTime/audioEndTime（旧方式）
        const audioStartTime = audio.cutFrom !== undefined ? audio.cutFrom : (audio.audioStartTime !== undefined ? audio.audioStartTime : 0);
        const audioEndTime = audio.cutTo !== undefined ? audio.cutTo : audio.audioEndTime;
        
        if (audioStartTime > 0) {
          args.push('-ss', audioStartTime.toString());
        }

        // 计算裁剪后的音频时长
        let trimDuration = audio.duration; // 默认使用 duration
        if (audioEndTime !== undefined && audioStartTime !== undefined) {
          // 如果指定了 audioEndTime，计算裁剪时长
          trimDuration = audioEndTime - audioStartTime;
        } else if (audioEndTime !== undefined) {
          // 如果只指定了 audioEndTime，需要先获取音频总时长
          // 这里简化处理，使用 duration 或 audioEndTime
          trimDuration = audioEndTime - audioStartTime;
        }

        // 应用音量
        const audioFilters = [];
        if (audio.volume !== undefined && audio.volume !== 1.0) {
          audioFilters.push(`volume=${audio.volume}`);
        }

        // 应用淡入淡出
        if (audio.fadeIn > 0 || audio.fadeOut > 0) {
          const fadeIn = audio.fadeIn || 0;
          const fadeOut = audio.fadeOut || 0;
          const audioDuration = trimDuration || audio.duration || 0;
          
          if (fadeIn > 0 && fadeOut > 0) {
            audioFilters.push(`afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${Math.max(0, audioDuration - fadeOut)}:d=${fadeOut}`);
          } else if (fadeIn > 0) {
            audioFilters.push(`afade=t=in:st=0:d=${fadeIn}`);
          } else if (fadeOut > 0) {
            audioFilters.push(`afade=t=out:st=${Math.max(0, audioDuration - fadeOut)}:d=${fadeOut}`);
          }
        }

        if (audioFilters.length > 0) {
          args.push('-af', audioFilters.join(','));
        }

        // 如果指定了裁剪时长，截取音频
        if (trimDuration) {
          args.push('-t', trimDuration.toString());
        } else if (audio.audioEndTime !== undefined && audio.audioStartTime !== undefined) {
          // 如果指定了 audioEndTime，计算并应用时长
          const calculatedDuration = audio.audioEndTime - audio.audioStartTime;
          if (calculatedDuration > 0) {
            args.push('-t', calculatedDuration.toString());
          }
        }

        args.push(processedPath);

        try {
          await execa('ffmpeg', args);
          processedAudios.push({
            path: processedPath,
            startTime: audio.startTime || 0,
          });
        } catch (error) {
          console.warn(`处理音频失败: ${audio.path}`, error.message);
        }
      }

      if (processedAudios.length === 0) {
        return null;
      }

      // 如果只有一个处理后的音频，直接返回
      if (processedAudios.length === 1 && processedAudios[0].startTime === 0) {
        return processedAudios[0].path;
      }

      // 创建音频混合脚本
      const outputPath = path.join(tempDir, 'merged_audio.wav');
      
      // 使用 amix 或 amerge 混合音频
      // 首先需要将所有音频对齐到正确的时间位置
      const filterInputs = [];
      const filterComplex = [];
      
      for (let i = 0; i < processedAudios.length; i++) {
        const audio = processedAudios[i];
        filterInputs.push(`-i`, audio.path);
        
        // 如果音频有延迟，需要添加延迟
        if (audio.startTime > 0) {
          filterComplex.push(`[${i}]adelay=${Math.round(audio.startTime * 1000)}|${Math.round(audio.startTime * 1000)}[a${i}]`);
        } else {
          filterComplex.push(`[${i}]acopy[a${i}]`);
        }
      }

      // 混合所有音频
      const mixInputs = processedAudios.map((_, i) => `[a${i}]`).join('');
      filterComplex.push(`${mixInputs}amix=inputs=${processedAudios.length}:duration=longest:dropout_transition=0[out]`);

      const args = [
        '-y',
        '-hide_banner', // 隐藏版本信息横幅
        '-loglevel', 'error', // 只显示错误信息
        ...filterInputs,
        '-filter_complex', filterComplex.join(';'),
        '-map', '[out]',
        '-ac', '2', // 立体声
        '-ar', '44100', // 采样率
        outputPath,
      ];

      // 如果指定了总时长，限制输出时长
      if (duration) {
        args.splice(args.length - 1, 0, '-t', duration.toString());
      }

      try {
        await execa('ffmpeg', args);
        return outputPath;
      } catch (error) {
        console.warn('合并音频失败，尝试简单方式:', error.message);
        
        // 如果复杂方式失败，尝试简单方式：只使用第一个音频
        if (processedAudios.length > 0) {
          return processedAudios[0].path;
        }
        return null;
      }
    } catch (error) {
      console.error('合并音频失败:', error);
      return null;
    }
  }
}


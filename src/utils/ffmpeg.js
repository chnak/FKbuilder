import execa from 'execa';
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
   * 通过管道将图片数据直接写入 FFmpeg（不保存中间文件）
   * @param {string} outputPath - 输出视频路径
   * @param {Object} options - 选项
   * @param {boolean} options.useRaw - 是否使用原始视频数据格式（默认 false，使用 PNG）
   * @returns {Object} 返回 { process, writeFrame, addStream } 对象
   *   - process: FFmpeg 进程
   *   - writeFrame: 函数，用于写入一帧 buffer（PNG 或 raw）
   *   - addStream: 函数，用于添加 Stream 输入（用于流式渲染）
   *   - finish: Promise，等待编码完成
   */
  async imagesToVideoPipe(outputPath, options = {}) {
    await this.checkFFmpeg();

    const {
      fps = 30,
      width,
      height,
      codec = this.config.codec,
      preset = this.config.preset,
      crf = this.config.crf,
      pixelFormat = this.config.pixelFormat,
      useRaw = false, // 是否使用原始视频数据格式
    } = options;

    const args = [
      '-y', // 覆盖输出文件
      '-hide_banner', // 隐藏版本信息横幅
      '-loglevel', 'error', // 只显示错误信息
    ];

    if (useRaw) {
      // 使用原始视频数据格式（RGBA）
      // 注意：node-canvas 的 toBuffer('raw') 返回 RGBA 格式
      const size = `${width}x${height}`;
      args.push(
        '-f', 'rawvideo', // 原始视频格式
        '-vcodec', 'rawvideo', // 原始视频编码
        '-pixel_format', 'rgba', // RGBA 像素格式
        '-video_size', size, // 视频尺寸
        '-framerate', fps.toString(),
        '-i', '-' // 从 stdin 读取
      );
    } else {
      // 使用 PNG 图片格式（向后兼容）
      args.push(
        '-f', 'image2pipe', // 从管道读取图片
        '-vcodec', 'png', // 输入格式为 PNG
        '-framerate', fps.toString(),
        '-i', '-' // 从 stdin 读取
      );
    }

    args.push(
      '-c:v', codec,
      '-preset', preset,
      '-crf', crf.toString(),
      '-pix_fmt', pixelFormat,
    );

    if (width && height && !useRaw) {
      args.push('-s', `${width}x${height}`);
    }

    args.push(outputPath);

    // 启动 FFmpeg 进程，stdin 作为管道
    const ffmpegProcess = execa('ffmpeg', args, {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // 在 CommonJS 编译环境中，execa 可能返回一个代理对象
    // 需要等待 stdin 属性可用（最多等待 100ms）
    if (!ffmpegProcess.stdin) {
      let waited = 0;
      const maxWait = 100; // 100ms
      while (!ffmpegProcess.stdin && waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 10));
        waited += 10;
      }
    }

    // 检查 stdin 是否可用
    if (!ffmpegProcess || !ffmpegProcess.stdin) {
      throw new Error('FFmpeg process stdin is not available. execa may not support stdin pipe in this environment.');
    }

    // 监听进程错误（但不阻塞写入）
    let processError = null;
    let stderrOutput = '';
    
    // 监听 stderr 输出（用于调试）
    if (ffmpegProcess.stderr) {
      ffmpegProcess.stderr.on('data', (data) => {
        const text = data.toString();
        stderrOutput += text;
        // 如果输出包含错误信息，记录它
        if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
          console.warn(`[FFmpeg stderr] ${text.trim()}`);
        }
      });
    }
    
    ffmpegProcess.catch((error) => {
      processError = error;
      if (stderrOutput) {
        console.error(`[FFmpeg stderr 完整输出]:\n${stderrOutput}`);
      }
    });

    // 创建 Promise 来等待编码完成
    let finishPromise = null;
    let finishResolve = null;
    let finishReject = null;

    finishPromise = new Promise((resolve, reject) => {
      finishResolve = resolve;
      finishReject = reject;
    });

    // 监听进程完成
    ffmpegProcess.then((result) => {
      console.log('[FFmpeg] 进程正常退出');
      if (finishResolve) finishResolve(outputPath);
    }).catch((error) => {
      console.error('[FFmpeg] 进程异常退出:', error.message);
      if (stderrOutput) {
        console.error(`[FFmpeg stderr 完整输出]:\n${stderrOutput}`);
      }
      if (finishReject) finishReject(new Error(`FFmpeg encoding failed: ${error.message}`));
    });

    // 写入帧的函数
    let framesWrittenCount = 0;
    const writeFrame = async (buffer) => {
      if (processError) {
        throw new Error(`FFmpeg process error: ${processError.message}`);
      }
      if (!ffmpegProcess.stdin) {
        throw new Error('FFmpeg stdin is not available');
      }
      if (ffmpegProcess.stdin.destroyed) {
        throw new Error('FFmpeg stdin is closed');
      }
      
      // 检查 buffer 是否有效
      if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error(`Invalid buffer: expected Buffer, got ${typeof buffer}`);
      }
      if (buffer.length === 0) {
        throw new Error('Buffer is empty');
      }
      
      try {
        await new Promise((resolve, reject) => {
          // 再次检查是否已关闭
          if (ffmpegProcess.stdin.destroyed) {
            reject(new Error('FFmpeg stdin was closed during write'));
            return;
          }
          
          // 检查进程是否还在运行
          if (processError) {
            reject(new Error(`FFmpeg process error: ${processError.message}`));
            return;
          }
          
          const writeResult = ffmpegProcess.stdin.write(buffer, (error) => {
            if (error) {
              reject(new Error(`Failed to write frame to FFmpeg: ${error.message}`));
            } else {
              framesWrittenCount++;
              resolve();
            }
          });
          
          // 如果 write 返回 false，说明缓冲区已满，等待 drain 事件
          if (writeResult === false) {
            ffmpegProcess.stdin.once('drain', () => {
              framesWrittenCount++;
              resolve();
            });
          }
        });
      } catch (error) {
        // 如果错误信息已经包含详细信息，直接抛出
        if (error.message.includes('FFmpeg') || error.message.includes('stdin')) {
          throw error;
        }
        throw new Error(`Failed to write frame to FFmpeg (已写入 ${framesWrittenCount} 帧): ${error.message}`);
      }
    };

    // 添加 Stream 输入（用于流式渲染）
    const addStream = (stream) => {
      if (processError) {
        throw new Error(`FFmpeg process error: ${processError.message}`);
      }
      if (!ffmpegProcess.stdin) {
        throw new Error('FFmpeg stdin is not available');
      }
      if (ffmpegProcess.stdin.destroyed) {
        throw new Error('FFmpeg stdin is closed');
      }
      stream.pipe(ffmpegProcess.stdin);
    };

    // 结束写入的函数
    const end = () => {
      console.log(`[FFmpeg] 准备关闭 stdin 管道（已写入 ${framesWrittenCount} 帧）...`);
      if (ffmpegProcess.stdin && !ffmpegProcess.stdin.destroyed) {
        try {
          ffmpegProcess.stdin.end();
          console.log('[FFmpeg] stdin 管道已关闭');
        } catch (error) {
          console.error('[FFmpeg] 关闭 stdin 时出错:', error.message);
        }
      } else {
        console.warn('[FFmpeg] stdin 已关闭或不存在');
      }
    };

    // 强制终止 FFmpeg 进程（用于错误恢复）
    const kill = () => {
      console.log(`[FFmpeg] 终止进程（已写入 ${framesWrittenCount} 帧）`);
      if (ffmpegProcess && !ffmpegProcess.killed) {
        try {
          ffmpegProcess.kill('SIGTERM');
        } catch (_) {}
      }
    };

    return {
      process: ffmpegProcess,
      writeFrame,
      addStream,
      end,
      kill,
      finish: finishPromise,
    };
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
      shortest = false,
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

    if (shortest) {
      args.push('-shortest');
    }
    args.push(outputPath);

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
      audioMode = 'standard', // 混音模式：'standard' | 'fkvideo'
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
            mixVolume: audio.volume !== undefined ? audio.volume : 1.0,
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
      if (audioMode === 'fkvideo') {
        const weights = processedAudios.map(a => (a.mixVolume !== undefined ? a.mixVolume : 1)).join(' ');
        filterComplex.push(`${mixInputs}amix=inputs=${processedAudios.length}:duration=longest:dropout_transition=0:normalize=0:weights=${weights}[out]`);
      } else {
        // 使用 normalize=0 保持输入素材的原始能量，不因输入数量被等分
        filterComplex.push(`${mixInputs}amix=inputs=${processedAudios.length}:duration=longest:dropout_transition=0:normalize=0[out0]`);
        // 默认仅应用响度规范（EBU R128）
        filterComplex.push(`[out0]loudnorm=I=-23:LRA=7:TP=-2[out]`);
      }

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


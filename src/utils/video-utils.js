import { Transform } from "stream";
import { execa } from 'execa';

/**
 * 视频处理工具函数
 */

/**
 * 将原始视频流转换为单独的帧
 * @param {Object} options - 选项
 * @param {number} options.width - 帧宽度
 * @param {number} options.height - 帧高度
 * @param {number} options.channels - 通道数（通常为4，RGBA）
 * @returns {Transform} 转换流
 */
export function rawVideoToFrames({ width, height, channels, signal, ...options }) {
  const frameByteSize = width * height * channels;
  let buffer = new Uint8Array(frameByteSize);
  let bytesRead = 0;
  
  return new Transform({
    ...options,
    writableObjectMode: false,
    readableObjectMode: true,
    // 设置较大的 highWaterMark 以避免缓冲区溢出
    highWaterMark: frameByteSize * 10, // 缓冲 10 帧
    transform(chunk, _, callback) {
      try {
        let startAt = 0;
        // 在块中查找帧
        while (startAt < chunk.length) {
          const endAt = Math.min(startAt + frameByteSize - bytesRead, chunk.length);
          const bytesToRead = endAt - startAt;
          buffer.set(chunk.slice(startAt, endAt), bytesRead);
          bytesRead = (bytesRead + bytesToRead) % frameByteSize;
          
          if (bytesRead === 0) {
            // 发出帧
            const frame = Buffer.from(buffer);
            this.push(frame);
            // 重置数据缓冲区
            buffer = new Uint8Array(frameByteSize);
          }
          // 移动到下一帧
          startAt = endAt;
        }
        callback();
      } catch (err) {
        callback(err);
      }
    },
    flush(callback) {
      // 如果还有未完成的帧数据，忽略它（可能是最后一帧不完整）
      callback();
    },
  });
}

/**
 * 计算视频缩放参数
 * @param {Object} options - 选项
 * @param {number} options.inputWidth - 输入宽度
 * @param {number} options.inputHeight - 输入高度
 * @param {number} options.requestedWidth - 请求宽度
 * @param {number} options.requestedHeight - 请求高度
 * @param {string} options.resizeMode - 调整模式
 * @returns {Object} 缩放参数
 */
export function calculateVideoScale({ inputWidth, inputHeight, requestedWidth, requestedHeight, resizeMode = 'contain' }) {
  const inputAspectRatio = inputWidth / inputHeight;
  const canvasAspectRatio = requestedWidth / requestedHeight;
  
  let targetWidth = requestedWidth;
  let targetHeight = requestedHeight;
  let scaleFilter;
  
  switch (resizeMode) {
    case 'contain':
    case 'contain-blur':
      if (canvasAspectRatio > inputAspectRatio) {
        targetHeight = requestedHeight;
        targetWidth = Math.round(requestedHeight * inputAspectRatio);
      } else {
        targetWidth = requestedWidth;
        targetHeight = Math.round(requestedWidth / inputAspectRatio);
      }
      scaleFilter = `scale=${targetWidth}:${targetHeight}`;
      break;
      
    case 'cover':
      let scaledWidth, scaledHeight;
      if (canvasAspectRatio > inputAspectRatio) {
        scaledWidth = requestedWidth;
        scaledHeight = Math.round(requestedWidth / inputAspectRatio);
      } else {
        scaledHeight = requestedHeight;
        scaledWidth = Math.round(requestedHeight * inputAspectRatio);
      }
      scaleFilter = `scale=${scaledWidth}:${scaledHeight},crop=${requestedWidth}:${requestedHeight}`;
      break;
      
    case 'fill':
    case 'stretch':
      scaleFilter = `scale=${requestedWidth}:${requestedHeight}`;
      break;
      
    case 'scale-down':
      if (inputWidth > requestedWidth || inputHeight > requestedHeight) {
        if (canvasAspectRatio > inputAspectRatio) {
          targetHeight = requestedHeight;
          targetWidth = Math.round(requestedHeight * inputAspectRatio);
        } else {
          targetWidth = requestedWidth;
          targetHeight = Math.round(requestedWidth / inputAspectRatio);
        }
        scaleFilter = `scale=${targetWidth}:${targetHeight}`;
      } else {
        targetWidth = inputWidth;
        targetHeight = inputHeight;
        scaleFilter = `scale=${targetWidth}:${targetHeight}`;
      }
      break;
      
    default:
      scaleFilter = `scale=${requestedWidth}:${requestedHeight}`;
  }
  
  return {
    targetWidth,
    targetHeight,
    scaleFilter
  };
}

/**
 * 获取视频输入编解码器
 * @param {string} codecName - 编解码器名称
 * @returns {string|null} 输入编解码器
 */
export function getInputCodec(codecName) {
  switch (codecName) {
    case 'vp8':
      return 'libvpx';
    case 'vp9':
      return 'libvpx-vp9';
    default:
      return null;
  }
}

/**
 * 构建 FFmpeg 视频处理参数
 * @param {Object} options - 选项
 * @returns {Array} FFmpeg 参数数组
 */
export function buildVideoFFmpegArgs({
  inputPath,
  inputCodec,
  cutFrom,
  cutTo,
  speedFactor = 1,
  framerate,
  scaleFilter,
  outputFormat = 'rawvideo',
  mute = true,
  volume = 1
}) {
  const args = [
    '-nostdin',
    '-hide_banner', // 隐藏版本信息横幅
    '-loglevel', 'error', // 只显示错误信息
    ...(inputCodec ? ['-vcodec', inputCodec] : []),
    ...(cutFrom ? ['-ss', cutFrom.toString()] : []),
    '-i', inputPath,
    ...(cutTo ? ['-t', ((cutTo - (cutFrom || 0)) / speedFactor).toString()] : []),
    '-vf', `${speedFactor !== 1 ? `setpts=${1/speedFactor}*PTS,` : ''}fps=${framerate},${scaleFilter}`,
    '-map', 'v:0',
    '-vcodec', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-f', outputFormat,
    '-'
  ];
  
  return args;
}

/**
 * 读取文件流信息（使用 ffprobe）
 * @param {string} filePath - 文件路径
 * @returns {Promise<Array>} 流信息数组
 */
export async function readFileStreams(filePath) {
  try {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error',
      '-show_streams',
      '-of', 'json',
      filePath
    ]);
    
    const data = JSON.parse(stdout);
    return data.streams || [];
  } catch (error) {
    throw new Error(`Failed to read file streams: ${error.message}`);
  }
}

/**
 * 创建音频流处理器（从视频中提取音频）
 * @param {Object} config - 配置
 * @param {string} config.source - 视频文件路径
 * @param {number} config.cutFrom - 开始时间（秒）
 * @param {number} config.cutTo - 结束时间（秒）
 * @param {number} config.speedFactor - 播放速度倍数
 * @param {number} config.volume - 音量
 * @param {string} config.outputDir - 输出目录
 * @returns {Promise<Object|null>} 音频流处理器，如果没有音频流则返回 null
 */
export async function createAudioStream({
  source,
  cutFrom,
  cutTo,
  speedFactor = 1,
  volume = 1,
  outputDir = './output'
}) {
  // 首先检查输入文件是否有音频流
  const streams = await readFileStreams(source);
  const hasAudioStream = streams.some(s => s.codec_type === 'audio');
  
  // 如果没有音频流，返回 null
  if (!hasAudioStream) {
    return null;
  }
  
  const fs = await import('fs-extra');
  const path = await import('path');
  const { nanoid } = await import('nanoid');
  
  // 确保输出目录存在
  await fs.ensureDir(outputDir);
  
  // 生成临时音频文件路径
  const tempAudioPath = path.join(outputDir, `temp-video-audio-${nanoid()}.flac`);
  
  // 默认混合所有音频轨道
  let filterComplex = '[0:a]amix=inputs=1';
  if (volume !== 1) {
    filterComplex += `,volume=${volume}`;
  }
  filterComplex += '[aout]';
  
  // 计算实际裁剪时长
  let duration = undefined;
  if (cutFrom !== undefined && cutTo !== undefined) {
    duration = (cutTo - cutFrom) / speedFactor;
  } else if (cutTo !== undefined) {
    duration = cutTo / speedFactor;
  } else if (cutFrom !== undefined) {
    // 如果只指定了开始时间，需要获取视频总时长
    const videoStream = streams.find(s => s.codec_type === 'video');
    if (videoStream && videoStream.duration) {
      duration = (parseFloat(videoStream.duration) - cutFrom) / speedFactor;
    }
  }
  
  const args = [
    '-nostdin',
    '-hide_banner', // 隐藏版本信息横幅
    '-loglevel', 'error', // 只显示错误信息
    ...(cutFrom ? ['-ss', cutFrom.toString()] : []),
    '-i', source,
    ...(duration ? ['-t', duration.toString()] : []),
    '-filter_complex', filterComplex,
    '-map', '[aout]',
    '-c:a', 'flac',
    '-y', tempAudioPath
  ];
  
  const controller = new AbortController();
  
  try {
    const ps = execa('ffmpeg', args, {
      encoding: 'buffer',
      buffer: false,
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: process.stderr,
      cancelSignal: controller.signal
    });
    
    // 处理错误
    ps.catch((err) => {
      if (!err.isCanceled) {
        console.error('视频音频提取失败:', err);
      }
    });
    
    // 等待音频处理完成
    await ps;
    
    return {
      path: tempAudioPath,
      controller,
      async close() {
        if (!ps.exitCode) {
          controller.abort();
        }
        // 清理临时文件
        try {
          await fs.unlink(tempAudioPath);
        } catch (error) {
          // 忽略文件删除错误
        }
      }
    };
  } catch (error) {
    console.error('视频音频提取失败:', error);
    return null;
  }
}


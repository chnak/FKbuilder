import { BaseElement } from './BaseElement.js';
import { DEFAULT_IMAGE_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { Image, createCanvas } from 'canvas';
import { toPixels } from '../utils/unit-converter.js';
import { execa } from 'execa';
import { rawVideoToFrames, calculateVideoScale, getInputCodec, buildVideoFFmpegArgs, readFileStreams, createAudioStream } from '../utils/video-utils.js';
import paper from 'paper-jsdom-canvas';
import path from 'path';
import os from 'os';

/**
 * 视频元素
 */
export class VideoElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.VIDEO;
    // 重新合并配置，确保传入的config优先级最高
    this.config = deepMerge({}, DEFAULT_IMAGE_CONFIG, config);
    
    this.videoPath = config.src || config.source || config.videoPath || '';
    this.fit = config.fit || 'cover'; // cover, contain, fill, none
    this.cutFrom = config.cutFrom; // 开始时间（秒）
    this.cutTo = config.cutTo; // 结束时间（秒）
    this.speedFactor = config.speedFactor || 1; // 播放速度倍数
    this.loop = config.loop || false; // 是否循环播放
    this.mute = config.mute !== undefined ? config.mute : true; // 默认静音
    this.volume = config.volume !== undefined ? config.volume : 1.0; // 音量
    
    // 视频处理相关
    this.videoProcessor = null;
    this.frameIterator = null;
    this.frameBuffer = [];
    this.currentFrameIndex = 0;
    this.videoInfo = null;
    this.initialized = false;
    
    // 音频相关
    this.audioStream = null;
    this.audioPath = null; // 提取的音频文件路径
  }

  /**
   * 初始化方法 - 使用 FFmpeg 提取视频帧
   */
  async initialize() {
    if (this.initialized || !this.videoPath) {
      return;
    }

    try {
      // 获取视频流信息
      const streams = await readFileStreams(this.videoPath);
      const videoStream = streams.find(s => s.codec_type === 'video');
      
      if (!videoStream) {
        throw new Error(`无法找到视频流: ${this.videoPath}`);
      }

      // 解析帧率 (例如 "30/1" -> 30)
      let fps = 30;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        if (den && den > 0) {
          fps = num / den;
        }
      }

      this.videoInfo = {
        width: videoStream.width,
        height: videoStream.height,
        duration: parseFloat(videoStream.duration) || 0,
        fps: fps,
      };

      // 计算目标尺寸
      const viewSize = paper.view && paper.view.viewSize ? paper.view.viewSize : { width: 1920, height: 1080 };
      const context = { 
        width: this.canvasWidth || viewSize.width, 
        height: this.canvasHeight || viewSize.height 
      };

      let targetWidth = this.config.width;
      let targetHeight = this.config.height;

      if (typeof targetWidth === 'string') {
        targetWidth = toPixels(targetWidth, context, 'x');
      }
      if (typeof targetHeight === 'string') {
        targetHeight = toPixels(targetHeight, context, 'y');
      }

      if (!targetWidth) targetWidth = context.width;
      if (!targetHeight) targetHeight = context.height;

      // 计算缩放参数
      const scaleParams = calculateVideoScale({
        inputWidth: this.videoInfo.width,
        inputHeight: this.videoInfo.height,
        requestedWidth: targetWidth,
        requestedHeight: targetHeight,
        resizeMode: this.fit
      });

      const { targetWidth: finalWidth, targetHeight: finalHeight, scaleFilter } = scaleParams;

      // 获取输入编解码器
      const inputCodec = getInputCodec(videoStream.codec_name);

      // 构建 FFmpeg 参数
      const args = buildVideoFFmpegArgs({
        inputPath: this.videoPath,
        inputCodec,
        cutFrom: this.cutFrom,
        cutTo: this.cutTo,
        speedFactor: this.speedFactor,
        framerate: this.fps || 30,
        scaleFilter,
        mute: this.mute,
        volume: 1
      });

      // 创建转换流
      const controller = new AbortController();
      const transform = rawVideoToFrames({
        width: finalWidth,
        height: finalHeight,
        channels: 4, // RGBA
        signal: controller.signal
      });

      // 启动 FFmpeg 进程
      const ps = execa('ffmpeg', args, {
        encoding: 'buffer',
        buffer: false,
        stdin: 'ignore',
        stdout: 'pipe', // 使用 pipe，然后手动连接
        stderr: process.stderr,
        cancelSignal: controller.signal
      });

      // 处理流的错误
      transform.on('error', (err) => {
        console.error('Transform stream error:', err);
        if (!ps.killed) {
          controller.abort();
        }
      });

      ps.stdout.on('error', (err) => {
        console.error('FFmpeg stdout error:', err);
        transform.destroy(err);
      });

      // 将 FFmpeg 的 stdout 管道连接到 transform
      // 设置 highWaterMark 以避免缓冲区溢出
      ps.stdout.pipe(transform, { end: false });

      // 处理进程错误
      ps.catch((err) => {
        if (!err.isCanceled && err.exitCode !== 143) { // 143 是 SIGTERM，可能是正常的终止
          console.error('FFmpeg process error:', err);
        }
        transform.destroy();
      });

      // 当进程结束时，结束 transform 流
      ps.then(() => {
        transform.end();
      }).catch(() => {
        transform.destroy();
      });

      // 转换为迭代器 - 使用 transform 流的迭代器
      this.frameIterator = transform[Symbol.asyncIterator]();
      this.controller = controller;
      this.ps = ps;
      this.finalWidth = finalWidth;
      this.finalHeight = finalHeight;

      // 缓冲所有帧（无论是否循环），以便根据进度随机访问
      // 这样可以避免顺序读取导致的帧不匹配问题
      try {
        while (true) {
          const { value, done } = await this.frameIterator.next();
          if (done) break;
          if (value) {
            this.frameBuffer.push(Buffer.from(value));
          }
        }
        console.log(`[VideoElement] 已缓冲 ${this.frameBuffer.length} 帧`);
      } catch (err) {
        console.warn(`[VideoElement] 缓冲帧时出错: ${err.message}`);
        // 即使缓冲失败，也继续（可能视频较短或已结束）
      }

      // 如果不禁音，提取视频中的音频
      if (!this.mute) {
        try {
          const outputDir = path.join(os.tmpdir(), 'fknew-video-audio');
          await import('fs-extra').then(fs => fs.ensureDir(outputDir));
          
          this.audioStream = await createAudioStream({
            source: this.videoPath,
            cutFrom: this.cutFrom,
            cutTo: this.cutTo,
            speedFactor: this.speedFactor,
            volume: this.volume,
            outputDir: outputDir
          });
          
          if (this.audioStream && this.audioStream.path) {
            this.audioPath = this.audioStream.path;
            console.log(`[VideoElement] 视频音频已提取: ${this.audioPath}`);
          } else {
            console.log(`[VideoElement] 视频 ${this.videoPath} 没有音频轨道或音频提取失败`);
          }
        } catch (error) {
          console.warn(`[VideoElement] 提取视频音频失败: ${error.message}`);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error(`Failed to initialize video: ${this.videoPath}`, error);
      this.initialized = false;
    }
  }

  /**
   * 获取当前帧的 Image 对象
   * @param {number} progress - 进度 (0-1)
   * @returns {Promise<Image|null>} 当前帧的 Image 对象
   */
  async getFrameAtProgress(progress) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized || !this.frameIterator) {
      return null;
    }

    try {
      let rgba;

      // 如果已缓冲帧，从缓冲区获取
      if (this.frameBuffer.length > 0) {
        let frameIndex;
        if (this.loop) {
          // 循环模式：根据进度循环获取帧
          frameIndex = Math.floor(progress * this.frameBuffer.length) % this.frameBuffer.length;
        } else {
          // 正常模式：根据进度获取对应帧
          frameIndex = Math.floor(progress * this.frameBuffer.length);
          frameIndex = Math.min(frameIndex, this.frameBuffer.length - 1);
        }
        rgba = this.frameBuffer[frameIndex];
      } else {
        // 如果没有缓冲，尝试从迭代器获取（不推荐，可能导致帧不匹配）
        try {
          const { value, done } = await this.frameIterator.next();
          if (done) {
            return null;
          }
          rgba = value ? Buffer.from(value) : null;
        } catch (err) {
          console.warn('Frame iterator error:', err.message);
          return null;
        }
      }

      if (!rgba) {
        return null;
      }

      // 将 RGBA Buffer 转换为 canvas Image
      const canvas = createCanvas(this.finalWidth, this.finalHeight);
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(this.finalWidth, this.finalHeight);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      // 创建 Image 对象
      const image = new Image();
      image.src = canvas.toDataURL();

      return image;
    } catch (error) {
      console.error('Failed to get video frame:', error);
      return null;
    }
  }

  /**
   * 渲染视频元素（使用 Paper.js）
   */
  async render(layer, time) {
    if (!this.visible) {
      return null;
    }

    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return null;
    }

    // 计算进度
    const progress = this.getProgressAtTime(time);

    // 获取当前帧
    const frameImage = await this.getFrameAtProgress(progress);
    if (!frameImage) {
      return null;
    }

    // 获取场景尺寸用于单位转换
    const viewSize = paper.view && paper.view.viewSize ? paper.view.viewSize : { width: 1920, height: 1080 };
    const context = { 
      width: this.canvasWidth || viewSize.width, 
      height: this.canvasHeight || viewSize.height 
    };
    
    const state = this.getStateAtTime(time, context);

    // 转换位置和尺寸单位
    let x = state.x;
    let y = state.y;
    let width = state.width;
    let height = state.height;

    if (typeof x === 'string') {
      x = toPixels(x, context, 'x');
    }
    if (typeof y === 'string') {
      y = toPixels(y, context, 'y');
    }
    if (typeof width === 'string') {
      width = toPixels(width, context, 'x');
    }
    if (typeof height === 'string') {
      height = toPixels(height, context, 'y');
    }

    // 处理 anchor
    const anchor = state.anchor || [0.5, 0.5];
    const rectX = x - width * anchor[0];
    const rectY = y - height * anchor[1];

    // 使用 Paper.js 的 Raster 渲染视频帧
    const raster = new paper.Raster(frameImage);
    raster.position = new paper.Point(x, y);
    raster.size = new paper.Size(width, height);

    // 使用统一的变换方法应用动画
    this.applyTransform(raster, state, {
      applyPosition: false, // 位置已经通过 raster.position 设置了
    });

    // 添加到 layer
    layer.addChild(raster);
    return raster;
  }

  /**
   * 获取音频元素（如果视频不禁音）
   * @returns {Promise<Array>} 音频元素数组
   */
  async getAudioElements() {
    if (this.mute || !this.audioPath) {
      return [];
    }
    
    // 如果还没有初始化，先初始化
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 如果初始化后仍然没有音频路径，说明视频没有音频或提取失败
    if (!this.audioPath) {
      return [];
    }
    
    // 创建一个临时的音频元素来代表视频的音频
    const { AudioElement } = await import('./AudioElement.js');
    const audioElement = new AudioElement({
      type: 'audio',
      src: this.audioPath,
      startTime: this.startTime || 0,
      duration: this.duration || 0,
      volume: this.volume,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight
    });
    
    return [audioElement];
  }

  /**
   * 获取音频配置（用于音频合并）
   * @returns {Object|null} 音频配置对象
   */
  getAudioConfig() {
    if (this.mute || !this.audioPath) {
      return null;
    }
    
    return {
      path: this.audioPath,
      startTime: this.startTime || 0,
      duration: this.duration || 0,
      volume: this.volume,
      fadeIn: 0,
      fadeOut: 0,
      loop: false,
    };
  }

  /**
   * 关闭视频元素，清理资源
   */
  async close() {
    if (this.controller) {
      this.controller.abort();
    }
    
    // 关闭音频流
    if (this.audioStream && typeof this.audioStream.close === 'function') {
      await this.audioStream.close();
    }
    
    this.frameBuffer = [];
    this.frameIterator = null;
    this.audioStream = null;
    this.audioPath = null;
    this.initialized = false;
  }
}


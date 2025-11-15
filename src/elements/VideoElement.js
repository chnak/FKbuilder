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

      // 如果启用循环，先缓冲所有帧
      if (this.loop) {
        while (true) {
          const { value, done } = await this.frameIterator.next();
          if (done) break;
          if (value) {
            this.frameBuffer.push(Buffer.from(value));
          }
        }
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
      
      // 调用 onLoaded 回调
      this._callOnLoaded(this.startTime || 0);
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

      if (this.loop && this.frameBuffer.length > 0) {
        // 循环模式：从缓冲的帧中获取
        const frameIndex = Math.floor(progress * this.frameBuffer.length) % this.frameBuffer.length;
        rgba = this.frameBuffer[frameIndex];
      } else {
        // 正常模式：从迭代器获取
        try {
          const { value, done } = await this.frameIterator.next();
          if (done) {
            // 如果迭代器结束，尝试重新初始化（可能是视频较短）
            return null;
          }
          rgba = value ? Buffer.from(value) : null;
        } catch (err) {
          // 迭代器错误，可能是流已关闭
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
   * 应用视觉效果（滤镜、边框、阴影等）
   * @param {paper.Raster} raster - Paper.js Raster 对象
   * @param {Object} state - 元素状态
   * @param {number} width - 元素宽度
   * @param {number} height - 元素高度
   * @returns {paper.Group|paper.Raster} 应用效果后的对象
   */
  applyVisualEffects(raster, state, width, height) {
    // 检查是否有视觉效果
    const hasBorder = state.borderWidth > 0;
    const hasShadow = state.shadowBlur > 0;
    const hasFlip = state.flipX || state.flipY;
    const hasBlendMode = state.blendMode && state.blendMode !== 'normal';
    const hasGlassEffect = state.glassEffect;

    if (!hasBorder && !hasShadow && !hasFlip && !hasBlendMode && !hasGlassEffect) {
      return raster;
    }

    // 创建组来包含所有效果
    const group = new paper.Group();
    
    // 应用翻转
    if (hasFlip) {
      if (state.flipX) {
        raster.scale(-1, 1, raster.position);
      }
      if (state.flipY) {
        raster.scale(1, -1, raster.position);
      }
    }

    // 应用混合模式
    if (hasBlendMode) {
      raster.blendMode = state.blendMode;
    }

    // 应用阴影（通过创建阴影层）
    if (hasShadow) {
      const shadowRaster = raster.clone();
      shadowRaster.position = new paper.Point(
        raster.position.x + (state.shadowOffsetX || 0),
        raster.position.y + (state.shadowOffsetY || 0)
      );
      shadowRaster.opacity = 0.3; // 阴影透明度
      
      // 应用阴影颜色（通过 tint）
      if (state.shadowColor) {
        const shadowColor = new paper.Color(state.shadowColor);
        shadowRaster.tint = shadowColor;
      }
      
      // 应用模糊（通过降低分辨率模拟）
      if (state.shadowBlur > 0) {
        const blurFactor = Math.max(1, state.shadowBlur / 10);
        shadowRaster.size = new paper.Size(
          shadowRaster.size.width * (1 + blurFactor * 0.1),
          shadowRaster.size.height * (1 + blurFactor * 0.1)
        );
      }
      
      group.addChild(shadowRaster);
    }

    // 添加主视频帧
    group.addChild(raster);

    // 应用边框（通过绘制边框路径）
    if (hasBorder) {
      const borderPath = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(
          raster.position.x - width / 2,
          raster.position.y - height / 2,
          width,
          height
        ),
        radius: state.borderRadius || 0,
      });
      borderPath.strokeColor = new paper.Color(state.borderColor || '#000000');
      borderPath.strokeWidth = state.borderWidth;
      borderPath.fillColor = null;
      group.addChild(borderPath);
    }

    // 毛玻璃效果：添加边框（如果启用）
    if (hasGlassEffect && state.glassBorder) {
      const glassBorderPath = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(
          raster.position.x - width / 2,
          raster.position.y - height / 2,
          width,
          height
        ),
        radius: state.borderRadius || 0,
      });
      glassBorderPath.strokeColor = new paper.Color(state.glassBorderColor || '#ffffff');
      glassBorderPath.strokeWidth = state.glassBorderWidth || 1;
      glassBorderPath.fillColor = null;
      glassBorderPath.opacity = 0.5; // 半透明边框
      group.addChild(glassBorderPath);
    }

    return group.children.length > 1 ? group : raster;
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

    // 应用滤镜效果（在创建 Raster 之前）
    let imageData = frameImage;
    const hasFilter = state.filter || 
      (state.brightness !== 1 || state.contrast !== 1 || state.saturation !== 1 || 
       state.hue !== 0 || state.grayscale > 0);
    const hasGlassEffect = state.glassEffect;
    
    if (hasFilter || hasGlassEffect) {
      try {
        // 创建临时 canvas 应用滤镜
        const imgWidth = this.finalWidth || width;
        const imgHeight = this.finalHeight || height;
        const tempCanvas = createCanvas(imgWidth, imgHeight);
        const tempCtx = tempCanvas.getContext('2d');
        
        // 绘制原始帧
        tempCtx.drawImage(frameImage, 0, 0, imgWidth, imgHeight);
        
        // 构建滤镜字符串
        let filterString = state.filter || '';
        if (!state.filter) {
          const filters = [];
          if (state.brightness !== 1) {
            filters.push(`brightness(${state.brightness})`);
          }
          if (state.contrast !== 1) {
            filters.push(`contrast(${state.contrast})`);
          }
          if (state.saturation !== 1) {
            filters.push(`saturate(${state.saturation})`);
          }
          if (state.hue !== 0) {
            filters.push(`hue-rotate(${state.hue}deg)`);
          }
          if (state.grayscale > 0) {
            filters.push(`grayscale(${state.grayscale})`);
          }
          // 毛玻璃效果：添加模糊
          if (hasGlassEffect && state.glassBlur > 0) {
            filters.push(`blur(${state.glassBlur}px)`);
          }
          filterString = filters.join(' ');
        } else if (hasGlassEffect && state.glassBlur > 0) {
          // 如果已有 filter 字符串，追加 blur
          filterString += ` blur(${state.glassBlur}px)`;
        }
        
        // 应用滤镜
        if (filterString) {
          tempCtx.filter = filterString;
          const originalData = tempCtx.getImageData(0, 0, imgWidth, imgHeight);
          tempCtx.clearRect(0, 0, imgWidth, imgHeight);
          tempCtx.putImageData(originalData, 0, 0);
          
          // 毛玻璃效果：添加半透明色调层
          if (hasGlassEffect) {
            tempCtx.globalAlpha = state.glassOpacity !== undefined ? state.glassOpacity : 0.7;
            tempCtx.fillStyle = state.glassTint || '#ffffff';
            tempCtx.fillRect(0, 0, imgWidth, imgHeight);
            tempCtx.globalAlpha = 1.0;
          }
          
          // 创建新的 Image 对象
          const filteredImage = new Image();
          filteredImage.src = tempCanvas.toDataURL();
          imageData = filteredImage;
        }
      } catch (error) {
        console.warn('应用滤镜失败:', error.message);
        // 如果滤镜失败，使用原始帧
        imageData = frameImage;
      }
    }

    // 使用 Paper.js 的 Raster 渲染视频帧
    const raster = new paper.Raster(imageData);
    raster.position = new paper.Point(x, y);
    raster.size = new paper.Size(width, height);

    // 使用统一的变换方法应用动画
    this.applyTransform(raster, state, {
      applyPosition: false, // 位置已经通过 raster.position 设置了
    });

    // 应用视觉效果（边框、阴影、翻转、混合模式）
    const finalItem = this.applyVisualEffects(raster, state, width, height);

    // 添加到 layer
    layer.addChild(finalItem);
    
    // 调用 onRender 回调
    this._callOnRender(time);
    
    return finalItem;
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


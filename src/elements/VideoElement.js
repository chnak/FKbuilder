import { BaseElement } from './BaseElement.js';
import { DEFAULT_IMAGE_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { Image, createCanvas } from 'canvas';
import { toPixels } from '../utils/unit-converter.js';
import execa from 'execa';
import { rawVideoToFrames, calculateVideoScale, getInputCodec, buildVideoFFmpegArgs, readFileStreams, createAudioStream } from '../utils/video-utils.js';
import paper from 'paper-jsdom-canvas';
import path from 'path';
import os from 'os';

/**
 * 检测是否在 CommonJS 环境中
 */
function isCommonJS() {
  return typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports;
}

/**
 * 从 RGBA Buffer 创建兼容的 Image 对象
 * CommonJS: 使用 jsdom Image
 * ESM: 使用 canvas Image
 * 优化：使用 'image/jpeg' 格式，质量 0.95，比 PNG 更快
 */
async function createImageFromRGBA(rgbaBuffer, width, height) {
  // 将 RGBA Buffer 转换为 data URL
  // 临时使用 canvas 来转换，但不保存 canvas 对象
  // 使用 JPEG 格式（质量 0.95）比 PNG 更快，适合视频帧
  const tempCanvas = createCanvas(width, height);
  const ctx = tempCanvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(rgbaBuffer);
  ctx.putImageData(imageData, 0, 0);
  
  // 使用 JPEG 格式，质量 0.95，比 PNG 编码更快
  const dataURL = tempCanvas.toDataURL('image/jpeg', 0.95);

  if (!isCommonJS()) {
    // ESM 环境使用 canvas Image
    const canvasImage = new Image();
    return new Promise((resolve, reject) => {
      // 设置超时，避免长时间等待
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 5000);
      
      canvasImage.onload = () => {
        clearTimeout(timeout);
        resolve(canvasImage);
      };
      canvasImage.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
      canvasImage.src = dataURL;
    });
  }

  try {
    // 动态导入 jsdom（只在 CommonJS 中需要）
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM();
    const jsdomImage = new dom.window.Image();

    // 使用 data URL 加载 jsdom Image
    return new Promise((resolve, reject) => {
      // 设置超时，避免长时间等待
      const timeout = setTimeout(() => {
        reject(new Error('jsdom Image load timeout'));
      }, 5000);
      
      jsdomImage.onload = () => {
        clearTimeout(timeout);
        resolve(jsdomImage);
      };
      jsdomImage.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load jsdom Image from RGBA: ${error.message || 'Unknown error'}`));
      };
      jsdomImage.src = dataURL;
    });
  } catch (error) {
    console.warn(`[VideoElement] 无法创建 jsdom Image，回退到 canvas Image: ${error.message}`);
    // 如果失败，回退到 canvas Image
    const canvasImage = new Image();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 5000);
      
      canvasImage.onload = () => {
        clearTimeout(timeout);
        resolve(canvasImage);
      };
      canvasImage.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
      canvasImage.src = dataURL;
    });
  }
}

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
    
    // 帧缓存（用于多进程渲染优化）
    this.frameImageCache = new Map(); // Map<progress, Image>
    this.frameImageCacheSize = 10; // 最多缓存10帧
    this.preloadNextFrame = null; // 预加载的下一帧 Promise
    
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
    
    // 防止并发初始化（使用 Promise 缓存）
    if (this._initializingPromise) {
      console.log(`[VideoElement] 等待正在进行的初始化... (${this.videoPath})`);
      await this._initializingPromise;
      return;
    }
    
    // 检测是否在 Worker 线程中
    const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    const threadInfo = isWorker ? '[Worker]' : '[Main]';
    console.log(`${threadInfo} [VideoElement] 开始初始化: ${this.videoPath}`);
    
    // 创建初始化 Promise
    this._initializingPromise = (async () => {
      try {
      // 获取视频流信息
      const streams = await readFileStreams(this.videoPath);
      const videoStream = streams.find(s => s.codec_type === 'video');
      
      if (!videoStream) {
        throw new Error(`无法找到视频流: ${this.videoPath}`);
      }

      // 解析帧率
      // 优先使用 avg_frame_rate（平均帧率，更准确），如果没有则使用 r_frame_rate（编码帧率）
      let fps = 30;
      if (videoStream.avg_frame_rate) {
        const [num, den] = videoStream.avg_frame_rate.split('/').map(Number);
        if (den && den > 0) {
          fps = num / den;
        }
      } else if (videoStream.r_frame_rate) {
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

      // 使用 BaseElement 的通用方法转换尺寸
      let { width: targetWidth, height: targetHeight } = this.convertSize(
        this.config.width,
        this.config.height,
        context
      );

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

      // 计算实际需要提取的视频时长
      // 如果元素有 duration，只提取 duration 对应的帧数
      // 否则使用 cutTo - cutFrom（如果指定了）
      let actualCutFrom = this.cutFrom || 0;
      let actualCutTo = this.cutTo;
      
      if (this.duration && this.duration > 0) {
        // 元素有 duration，只提取 duration 对应的时长
        actualCutTo = actualCutFrom + this.duration;
        
        // 如果原始 cutTo 存在且更短，使用原始 cutTo
        if (this.cutTo !== undefined && this.cutTo < actualCutTo) {
          actualCutTo = this.cutTo;
        }
        
        // 确保不超过视频总时长
        if (this.videoInfo.duration > 0 && actualCutTo > this.videoInfo.duration) {
          actualCutTo = this.videoInfo.duration;
        }
      }
      
      // 保存实际使用的 cutFrom 和 cutTo（用于音频提取等）
      this.actualCutFrom = actualCutFrom;
      this.actualCutTo = actualCutTo;

      // 使用视频的实际 FPS，而不是固定的 30
      // 这样可以确保提取的帧数正确
      const targetFps = this.fps || this.videoInfo.fps || 30;
      
      // 计算提取参数
      const extractDuration = actualCutTo - actualCutFrom;
      const expectedFrames = Math.ceil(extractDuration * targetFps);
      this.expectedFrames = expectedFrames;
      
      // 构建 FFmpeg 参数
      const args = buildVideoFFmpegArgs({
        inputPath: this.videoPath,
        inputCodec,
        cutFrom: actualCutFrom,
        cutTo: actualCutTo,
        speedFactor: this.speedFactor,
        framerate: targetFps,
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

      // 检测是否在 Worker 线程中
      // Worker 线程中的 process.stderr 是 WritableWorkerStdio，不能直接传递给 execa
      // 使用多种方法检测 Worker 线程
      let isWorkerThread = false;
      try {
        // 方法1: 检查 WorkerGlobalScope
        if (typeof WorkerGlobalScope !== 'undefined' && typeof self !== 'undefined' && self instanceof WorkerGlobalScope) {
          isWorkerThread = true;
        }
        // 方法2: 检查 process.stderr 的类型
        else if (process.stderr && typeof process.stderr === 'object') {
          // Worker 线程中的 process.stderr 是 WritableWorkerStdio
          const stderrType = process.stderr.constructor?.name || '';
          if (stderrType === 'WritableWorkerStdio' || (process.stderr._writableState && !process.stderr.isTTY)) {
            isWorkerThread = true;
          }
        }
      } catch (e) {
        // 如果检测失败，默认不在 Worker 线程中
        isWorkerThread = false;
      }
      
      const stderrOption = isWorkerThread ? 'pipe' : (process.stderr || 'pipe');
      
      // 启动 FFmpeg 进程
      const ps = execa('ffmpeg', args, {
        encoding: 'buffer',
        buffer: false,
        stdin: 'ignore',
        stdout: 'pipe', // 使用 pipe，然后手动连接
        stderr: stderrOption, // Worker 线程中使用 'pipe'，主线程使用 process.stderr
        cancelSignal: controller.signal
      });

      // 处理流的错误
      // 注意：在缓冲帧的过程中，transform 流可能会因为 FFmpeg 进程结束而触发错误
      // 这是正常的，只要已经缓冲了帧就可以继续
      let transformError = null;
      transform.on('error', (err) => {
        // 记录错误，但不立即中止（因为可能已经缓冲了足够的帧）
        transformError = err;
        console.warn('[VideoElement] Transform stream error (可能不影响缓冲):', err.message);
        // 只有在进程未结束时才中止
        if (!ps.killed && ps.exitCode === null) {
          controller.abort();
        }
      });

      // 在 Worker 线程中，stderr 使用 pipe，需要手动处理
      if (isWorkerThread && ps.stderr) {
        ps.stderr.on('data', (data) => {
          // Worker 线程中可以选择忽略 stderr 或记录到日志
          // 这里选择忽略，避免输出过多信息
        });
        ps.stderr.on('error', (err) => {
          // 忽略 stderr 错误
        });
      }

      // 等待 stdout 可用（CommonJS 环境中可能需要等待）
      if (!ps.stdout) {
        let waited = 0;
        const maxWait = 200; // 增加到 200ms，给更多时间
        while (!ps.stdout && waited < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 10));
          waited += 10;
          // 重新检查 ps.stdout（可能在等待过程中变为可用）
          if (ps.stdout) break;
        }
      }

      // 检查 stdout 是否可用
      if (!ps.stdout) {
        // 如果 stdout 不可用，尝试等待进程启动
        // 在某些情况下，execa 可能需要更多时间
        console.warn('[VideoElement] FFmpeg stdout 初始不可用，等待进程启动...');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 再次检查
        if (!ps.stdout) {
          console.error('[VideoElement] FFmpeg stdout is not available after waiting');
          throw new Error('FFmpeg stdout is not available');
        }
      }

      // 保存 stdout 引用，避免后续访问时它可能被关闭
      const stdout = ps.stdout;
      
      stdout.on('error', (err) => {
        // stdout 错误通常表示 FFmpeg 进程已经结束或出现问题
        // 但如果已经缓冲了帧，这可能不是致命错误
        console.warn('[VideoElement] FFmpeg stdout error (可能不影响缓冲):', err.message);
        // 不立即 destroy transform，让缓冲过程自然结束
        // transform.destroy(err); // 注释掉，避免触发 transform 错误事件
      });

      // 将 FFmpeg 的 stdout 管道连接到 transform
      // 设置 highWaterMark 以避免缓冲区溢出
      stdout.pipe(transform, { end: false });

      // 处理进程错误
      ps.catch((err) => {
        // FFmpeg 进程错误
        // 如果进程被取消（exitCode 143）或正常结束，这是正常的
        if (!err.isCanceled && err.exitCode !== 143) {
          console.warn('[VideoElement] FFmpeg process error (可能不影响缓冲):', err.message);
        }
        // 不立即 destroy，让缓冲过程自然结束
        // transform.destroy(); // 注释掉，避免在缓冲过程中中断
      });

      // 当进程正常结束时，结束 transform 流
      ps.then(() => {
        // 进程正常结束，结束 transform 流
        transform.end();
      }).catch(() => {
        // 进程异常结束，但不立即 destroy（可能正在缓冲）
      });

      // 转换为迭代器 - 使用 transform 流的迭代器
      this.frameIterator = transform[Symbol.asyncIterator]();
      this.controller = controller;
      this.ps = ps;
      this.finalWidth = finalWidth;
      this.finalHeight = finalHeight;

      // 缓冲所有帧（用于随机访问）
      let frameCount = 0;
      let bufferError = null;
      const frameSize = finalWidth * finalHeight * 4; // RGBA
      
      try {
        while (true) {
          try {
            const { value, done } = await this.frameIterator.next();
            if (done) {
              break;
            }
            if (value) {
              this.frameBuffer.push(Buffer.from(value));
              frameCount++;
            }
          } catch (iterError) {
            if (frameCount === 0) {
              bufferError = iterError;
            }
            break;
          }
        }
      } catch (error) {
        if (frameCount === 0) {
          bufferError = error;
        }
      }
      
      // 只有在没有缓冲到任何帧时才抛出错误
      if (frameCount === 0) {
        const errorMsg = bufferError 
          ? `无法缓冲视频帧: ${bufferError.message}` 
          : (transformError 
            ? `无法缓冲视频帧: Transform stream error - ${transformError.message}` 
            : '无法缓冲视频帧: 未知错误');
        throw new Error(errorMsg);
      }
      
      // 重新创建迭代器（如果需要的话，但通常不需要了）
      // 注意：由于我们已经缓冲了所有帧，frameIterator 已经用完了
      // 后续访问都从 frameBuffer 中获取

      // 如果不禁音，提取视频中的音频
      if (!this.mute) {
        try {
          const outputDir = path.join(os.tmpdir(), 'fknew-video-audio');
          await import('fs-extra').then(fs => fs.ensureDir(outputDir));
          
          this.audioStream = await createAudioStream({
            source: this.videoPath,
            cutFrom: this.actualCutFrom,
            cutTo: this.actualCutTo,
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
        
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        const threadInfo = isWorker ? '[Worker]' : '[Main]';
        console.log(`${threadInfo} [VideoElement] 初始化完成: ${this.videoPath}, 缓冲了 ${this.frameBuffer.length} 帧`);
        
        // 调用 onLoaded 回调（注意：此时还没有 paperItem，所以传递 null）
        this._callOnLoaded(this.startTime || 0, null, null);
      } catch (error) {
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        const threadInfo = isWorker ? '[Worker]' : '[Main]';
        console.error(`${threadInfo} [VideoElement] 初始化失败: ${this.videoPath}`, error);
        this.initialized = false;
        throw error;
      } finally {
        // 清除初始化 Promise，允许后续重新初始化
        this._initializingPromise = null;
      }
    })();
    
    await this._initializingPromise;
  }

  /**
   * 获取当前帧的 Image 对象
   * @param {number} progress - 进度 (0-1)，基于元素的 duration
   * @returns {Promise<Image|null>} 当前帧的 Image 对象
   */
  async getFrameAtProgress(progress) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return null;
    }

    try {
      // 检查缓存
      const cacheKey = Math.floor(progress * 1000) / 1000; // 保留3位小数作为缓存键
      if (this.frameImageCache.has(cacheKey)) {
        return this.frameImageCache.get(cacheKey);
      }

      let rgba = null;
      let frameIndex = 0;

      if (this.frameBuffer.length > 0 && this.videoInfo) {
        // frameBuffer 现在只包含元素 duration 对应的帧
        const elementDuration = this.duration || 0;
        const videoFps = this.videoInfo.fps || 30;
        
        // 计算帧索引
        if (elementDuration > 0) {
          const videoTime = progress * elementDuration;
          frameIndex = Math.floor(videoTime * videoFps);
        } else {
          frameIndex = Math.floor(progress * this.frameBuffer.length);
        }
        
        // 确保帧索引在有效范围内
        frameIndex = Math.max(0, Math.min(frameIndex, this.frameBuffer.length - 1));
        
        if (this.loop) {
          frameIndex = frameIndex % this.frameBuffer.length;
        }
        
        // 获取帧，如果无效则尝试使用相邻帧
        rgba = this.frameBuffer[frameIndex];
        
        // 如果当前帧无效，尝试使用相邻帧
        if (!rgba || !Buffer.isBuffer(rgba) || rgba.length === 0) {
          // 尝试使用前一帧
          if (frameIndex > 0) {
            rgba = this.frameBuffer[frameIndex - 1];
          }
          // 如果前一帧也无效，尝试使用后一帧
          if ((!rgba || !Buffer.isBuffer(rgba) || rgba.length === 0) && frameIndex < this.frameBuffer.length - 1) {
            rgba = this.frameBuffer[frameIndex + 1];
          }
          // 如果都无效，使用第一帧
          if ((!rgba || !Buffer.isBuffer(rgba) || rgba.length === 0) && this.frameBuffer.length > 0) {
            rgba = this.frameBuffer[0];
          }
        }
      } else if (this.frameIterator) {
        // 如果没有缓冲，尝试从迭代器获取
        try {
          const { value, done } = await this.frameIterator.next();
          if (!done && value) {
            rgba = Buffer.from(value);
          }
        } catch (err) {
          // 忽略迭代器错误
        }
      }

      // 如果仍然无法获取有效帧，返回 null（避免黑屏，render 方法会跳过渲染）
      if (!rgba || !Buffer.isBuffer(rgba) || rgba.length === 0) {
        return null;
      }

      // 根据环境创建兼容的 Image 对象（不使用 createCanvas 保存）
      const imagePromise = createImageFromRGBA(rgba, this.finalWidth, this.finalHeight);
      
      // 缓存 Image 对象
      imagePromise.then((image) => {
        if (image) {
          // 限制缓存大小
          if (this.frameImageCache.size >= this.frameImageCacheSize) {
            // 删除最旧的缓存（FIFO）
            const firstKey = this.frameImageCache.keys().next().value;
            this.frameImageCache.delete(firstKey);
          }
          this.frameImageCache.set(cacheKey, image);
        }
      }).catch(() => {
        // 忽略缓存错误
      });
      
      return await imagePromise;
    } catch (error) {
      console.error('Failed to get video frame:', error);
      return null;
    }
  }
  
  /**
   * 清理帧缓存
   */
  clearFrameCache() {
    this.frameImageCache.clear();
    this.preloadNextFrame = null;
  }

  /**
   * 应用视觉效果（滤镜、边框、阴影等）
   * @param {paper.Raster} raster - Paper.js Raster 对象
   * @param {Object} state - 元素状态
   * @param {number} width - 元素宽度
   * @param {number} height - 元素高度
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   * @returns {paper.Group|paper.Raster} 应用效果后的对象
   */
  applyVisualEffects(raster, state, width, height, paperInstance = null) {
    // 获取 Paper.js 实例
    const { paper: p } = this.getPaperInstance(paperInstance);
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
    const group = new p.Group();
    
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
      shadowRaster.position = new p.Point(
        raster.position.x + (state.shadowOffsetX || 0),
        raster.position.y + (state.shadowOffsetY || 0)
      );
      shadowRaster.opacity = 0.3; // 阴影透明度
      
      // 应用阴影颜色（通过 tint）
      if (state.shadowColor) {
        const shadowColor = new p.Color(state.shadowColor);
        shadowRaster.tint = shadowColor;
      }
      
      // 应用模糊（通过降低分辨率模拟）
      if (state.shadowBlur > 0) {
        const blurFactor = Math.max(1, state.shadowBlur / 10);
        shadowRaster.size = new p.Size(
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
      const borderPath = new p.Path.Rectangle({
        rectangle: new p.Rectangle(
          raster.position.x - width / 2,
          raster.position.y - height / 2,
          width,
          height
        ),
        radius: state.borderRadius || 0,
      });
      borderPath.strokeColor = new p.Color(state.borderColor || '#000000');
      borderPath.strokeWidth = state.borderWidth;
      borderPath.fillColor = null;
      group.addChild(borderPath);
    }

    // 毛玻璃效果：添加边框（如果启用）
    if (hasGlassEffect && state.glassBorder) {
      const glassBorderPath = new p.Path.Rectangle({
        rectangle: new p.Rectangle(
          raster.position.x - width / 2,
          raster.position.y - height / 2,
          width,
          height
        ),
        radius: state.borderRadius || 0,
      });
      glassBorderPath.strokeColor = new p.Color(state.glassBorderColor || '#ffffff');
      glassBorderPath.strokeWidth = state.glassBorderWidth || 1;
      glassBorderPath.fillColor = null;
      glassBorderPath.opacity = 0.5; // 半透明边框
      group.addChild(glassBorderPath);
    }

    return group.children.length > 1 ? group : raster;
  }

  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null;
    if (!this.isActiveAtTime(time)) return null;
    if (!this.initialized) await this.initialize();
    if (!this.initialized) return null;
    
    const { paper: p, project } = this.getPaperInstance(paperInstance);
    const viewSize = project?.view?.viewSize || { width: 1920, height: 1080 };
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);
    
    // 计算进度
    const progress = this.getProgressAtTime(time);
    
    // 视频帧已经在 initialize() 时根据 fit 参数通过 FFmpeg 处理过了
    // 所以这里直接使用处理后的帧尺寸（finalWidth, finalHeight）
    // 但也要考虑元素配置的 width/height（可能被动画修改）
    const containerSize = this.convertSize(state.width, state.height, context);
    const containerWidth = containerSize.width || viewSize.width;
    const containerHeight = containerSize.height || viewSize.height;
    
    // 如果视频已经根据 fit 处理过，使用处理后的尺寸
    // 否则使用容器尺寸（fill 模式）
    const fit = state.fit || this.fit || 'cover';
    let width, height;
    
    if (fit === 'fill' || fit === 'stretch') {
      // fill 模式：使用容器尺寸
      width = containerWidth;
      height = containerHeight;
    } else {
      // cover/contain 模式：使用 FFmpeg 处理后的尺寸
      // 这些尺寸已经在 initialize() 时根据 fit 计算好了
      width = this.finalWidth || containerWidth;
      height = this.finalHeight || containerHeight;
    }
    
    const { x, y } = this.calculatePosition(state, context, { width, height });
    
    // 获取当前帧
    const frameImage = await this.getFrameAtProgress(progress);
    if (!frameImage) {
      // 如果无法获取帧，尝试使用第一帧作为回退（避免黑屏）
      if (this.frameBuffer.length > 0) {
        try {
          const fallbackRgba = this.frameBuffer[0];
          if (fallbackRgba && Buffer.isBuffer(fallbackRgba) && fallbackRgba.length > 0) {
            const fallbackImage = await createImageFromRGBA(fallbackRgba, this.finalWidth, this.finalHeight);
            if (fallbackImage) {
              // 使用回退帧继续渲染，避免黑屏
              const raster = new p.Raster(fallbackImage);
              raster.position = new p.Point(x, y);
              raster.size = new p.Size(width, height);
              this.applyTransform(raster, state, {
                applyPosition: false,
                paperInstance: p
              });
              const finalItem = this.applyVisualEffects(raster, state, width, height, p);
              if (layer) {
                layer.addChild(finalItem);
              }
              return finalItem;
            }
          }
        } catch (error) {
          // 忽略回退帧创建错误
        }
      }
      // 如果回退也失败，跳过渲染（避免黑屏）
      return null;
    }
    
    // 直接使用 Image 对象创建 Raster
    const raster = new p.Raster(frameImage);
    raster.position = new p.Point(x, y);
    raster.size = new p.Size(width, height);
    
    // 应用变换
    this.applyTransform(raster, state, {
      applyPosition: false,
      paperInstance: p
    });
    
    // 应用视觉效果
    const finalItem = this.applyVisualEffects(raster, state, width, height, p);
    
    // 添加到图层
    if (layer) {
      layer.addChild(finalItem);
    }
    
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
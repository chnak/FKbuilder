import { Timeline } from './Timeline.js';
import { Renderer } from './Renderer.js';
import { BackgroundLayer } from '../layers/BackgroundLayer.js';
import { ElementLayer } from '../layers/ElementLayer.js';
import { OverlayLayer } from '../layers/OverlayLayer.js';
import { DEFAULT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { generateId } from '../utils/helpers.js';

/**
 * 视频制作器主类
 */
export class VideoMaker {
  constructor(config = {}) {
    this.id = generateId('composition');
    this.config = deepMerge({}, DEFAULT_CONFIG, config);
    this.width = this.config.width;
    this.height = this.config.height;
    this.fps = this.config.fps;
    this.backgroundColor = this.config.backgroundColor;
    this.duration = this.config.duration;
    
    // 时间范围控制
    this.startTime = config.startTime !== undefined ? config.startTime : 0;
    this.endTime = config.endTime !== undefined ? config.endTime : undefined;
    
    // 如果指定了endTime但没有duration，自动计算duration
    if (this.endTime !== undefined && this.duration === undefined) {
      this.duration = this.endTime - this.startTime;
    }
    
    // 如果指定了duration但没有endTime，自动计算endTime
    if (this.duration !== undefined && this.endTime === undefined) {
      this.endTime = this.startTime + this.duration;
    }

    // 创建时间线
    this.timeline = new Timeline({
      duration: this.duration,
      fps: this.fps,
    });

    // 创建渲染器
    this.renderer = new Renderer({
      width: this.width,
      height: this.height,
      fps: this.fps,
      quality: this.config.renderQuality,
    });

    // 图层管理
    this.layers = [];
    this.backgroundLayer = null;

    // 音频管理
    this.audioElements = [];

    // 初始化背景图层
    this.initBackgroundLayer();
  }

  /**
   * 初始化背景图层
   */
  initBackgroundLayer() {
    this.backgroundLayer = new BackgroundLayer({
      backgroundColor: this.backgroundColor,
      zIndex: -9999,
    });
    this.backgroundLayer.initBackground(this.width, this.height);
    this.addLayer(this.backgroundLayer);
  }

  /**
   * 设置尺寸
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.config.width = width;
    this.config.height = height;
    this.renderer.setSize(width, height);
    if (this.backgroundLayer) {
      this.backgroundLayer.initBackground(width, height);
    }
  }

  /**
   * 设置背景颜色
   */
  setBackgroundColor(color) {
    this.backgroundColor = color;
    this.config.backgroundColor = color;
    if (this.backgroundLayer) {
      this.backgroundLayer.setBackgroundColor(color);
    }
  }

  /**
   * 设置持续时间
   */
  setDuration(duration) {
    this.duration = duration;
    this.config.duration = duration;
    this.timeline.setDuration(duration);
    
    // 更新endTime
    if (this.endTime !== undefined) {
      this.endTime = this.startTime + duration;
    }
  }

  /**
   * 设置时间范围
   * @param {number} startTime - 开始时间（秒）
   * @param {number} endTime - 结束时间（秒），如果未指定则使用duration计算
   */
  setTimeRange(startTime, endTime) {
    this.startTime = startTime;
    if (endTime !== undefined) {
      this.endTime = endTime;
      this.duration = endTime - startTime;
      this.config.duration = this.duration;
      this.timeline.setDuration(this.duration);
    } else if (this.duration !== undefined) {
      this.endTime = startTime + this.duration;
    }
  }

  /**
   * 判断合成在指定时间是否激活
   * @param {number} time - 时间（秒）
   * @returns {boolean}
   */
  isActiveAtTime(time) {
    if (this.endTime === undefined) {
      return time >= this.startTime;
    }
    return time >= this.startTime && time <= this.endTime;
  }

  /**
   * 添加图层
   */
  addLayer(layer) {
    if (!this.layers.includes(layer)) {
      this.layers.push(layer);
      this.timeline.addLayer(layer);
    }
  }

  /**
   * 移除图层
   */
  removeLayer(layer) {
    const index = this.layers.indexOf(layer);
    if (index > -1) {
      this.layers.splice(index, 1);
      this.timeline.removeLayer(layer);
    }
  }

  /**
   * 获取所有图层
   */
  getLayers() {
    return [...this.layers];
  }

  /**
   * 创建元素图层
   */
  createElementLayer(config = {}) {
    const layer = new ElementLayer(config);
    this.addLayer(layer);
    return layer;
  }

  /**
   * 创建叠加图层
   */
  createOverlayLayer(config = {}) {
    const layer = new OverlayLayer(config);
    this.addLayer(layer);
    return layer;
  }

  /**
   * 添加音频元素
   * @param {AudioElement} audioElement - 音频元素
   */
  addAudio(audioElement) {
    if (audioElement && audioElement.type === 'audio') {
      this.audioElements.push(audioElement);
    }
  }

  /**
   * 获取所有音频元素
   * @returns {Array<AudioElement>}
   */
  getAudioElements() {
    return this.audioElements;
  }

  /**
   * 收集所有音频元素（包括嵌套合成中的音频）
   * @returns {Array<Object>} 音频配置数组
   */
  async collectAllElements() {
    const audioConfigs = [];

    // 收集当前合成的音频元素
    for (const audioElement of this.audioElements) {
      if (audioElement && audioElement.type === 'audio') {
        // 如果音频已加载，使用加载后的配置；否则使用当前配置
        await audioElement.initialize();
        if (audioElement.loaded && audioElement.audioPath) {
          audioConfigs.push(audioElement.getAudioConfig());
        } else if (audioElement.audioPath) {
          // 即使未加载，也尝试收集配置（可能在导出时加载）
          audioConfigs.push(audioElement.getAudioConfig());
        }
      }
    }
    
    // 收集图层中的音频元素（如果有）
    for (const layer of this.layers) {
      if (layer.elements) {
        for (const element of layer.elements) {
          if (element && element.type === 'audio') {
            await element.initialize();
            if (element.loaded && element.audioPath) {
              audioConfigs.push(element.getAudioConfig());
            } else if (element.audioPath) {
              audioConfigs.push(element.getAudioConfig());
            }
          }else if(element && element.type === 'video') {
            // 确保视频已初始化（如果还未初始化，getAudioConfig 会返回 null，但会在导出时初始化）
            // 这里先尝试获取配置，如果 audioPath 存在则收集
            await element.initialize();
            if (element.audioPath || (!element.mute && element.videoPath)) {
              const audioConfig = element.getAudioConfig();
              if (audioConfig && audioConfig.path) {
                audioConfigs.push(audioConfig);
              }
            }
          }else if(element.initialize){
            await element.initialize();
          }
          
        }
      }
      
    }
    
    return audioConfigs;
  }

  /**
   * 渲染一帧
   * @param {number} time - 时间（秒）
   */
  async renderFrame(time) {
    await this.renderer.init();
    const canvas = await this.renderer.renderFrame(this.timeline.getLayers(), time, this.backgroundColor);
    return canvas;
  }

  /**
   * 获取当前帧的 Canvas 缓冲区
   */
  getFrameBuffer(time) {
    return this.renderer.getCanvasBuffer();
  }

  /**
   * 播放合成（预览）
   */
  async play() {
    this.timeline.play();
    // 这里可以实现预览逻辑
  }

  /**
   * 暂停
   */
  pause() {
    this.timeline.pause();
  }

  /**
   * 停止
   */
  stop() {
    this.timeline.stop();
  }

  /**
   * 跳转到指定时间
   */
  seek(time) {
    this.timeline.seek(time);
  }

  /**
   * 导出动画帧序列（类似 paper.view.exportFrames）
   * @param {Object} options - 导出选项
   * @param {number} options.amount - 要导出的总帧数
   * @param {string} options.directory - 保存帧的目录（默认 './frames'）
   * @param {number} options.fps - 帧率（默认使用合成的 fps）
   * @param {number} options.startTime - 开始时间（秒，默认 0）
   * @param {number} options.endTime - 结束时间（秒，默认使用合成的 duration）
   * @param {Function} options.onProgress - 进度回调函数 (current, total) => {}
   * @param {Function} options.onComplete - 完成回调函数 (framePaths) => {}
   * @returns {Promise<string[]>} 返回所有导出帧的文件路径数组
   */
  async exportFrames(options = {}) {
    const {
      amount,
      directory = './frames',
      fps = this.fps,
      startTime = this.startTime || 0,
      endTime = this.endTime || (this.duration ? startTime + this.duration : undefined),
      onProgress,
      onComplete,
    } = options;

    await this.renderer.init();
    
    return await this.renderer.exportFrames(this.timeline.getLayers(), {
      amount,
      directory,
      fps,
      startTime,
      endTime,
      backgroundColor: this.backgroundColor,
      onProgress,
      onComplete,
    });
  }

  /**
   * 导出视频
   * @param {string} outputPath - 输出路径
   * @param {Object} options - 选项
   */
  async export(outputPath, options = {}) {
    const { VideoExporter } = await import('./VideoExporter.js');
    const exporter = new VideoExporter({
      fps: this.fps,
      quality: this.config.renderQuality,
      ...options,
    });
    return await exporter.export(this, outputPath, options);
  }

  /**
   * 销毁合成
   */
  destroy() {
    this.layers.forEach(layer => layer.destroy());
    this.layers = [];
    if (this.renderer) {
      this.renderer.destroy();
    }
    this.timeline.reset();
  }
}


/**
 * 视频构建器 - 多轨道多场景支持（使用 CompositionElement 嵌套）
 */
import { VideoMaker } from '../core/VideoMaker.js';
import { Track } from './Track.js';
import { CompositionElement } from '../elements/CompositionElement.js';

/**
 * 视频构建器主类
 */
export class VideoBuilder {
  constructor(config = {}) {
    this.config = {
      width: config.width || 1920,
      height: config.height || 1080,
      fps: config.fps || 30,
      // backgroundColor 不再在构造函数中设置，应该通过 Scene 的 addBackground() 添加
      ...config,
    };
    
    this.tracks = [];
    this.currentTime = 0; // 当前时间位置
  }

  /**
   * 创建轨道
   * @param {Object} config - 轨道配置 { zIndex, name }
   * @returns {Track} 轨道实例
   */
  createTrack(config = {}) {
    const track = new Track({
      ...config,
      builder: this,
      zIndex: config.zIndex || this.tracks.length,
    });
    
    this.tracks.push(track);
    return track;
  }

  /**
   * 获取所有轨道
   * @returns {Array<Track>}
   */
  getTracks() {
    return this.tracks;
  }

  /**
   * 计算总时长（所有轨道中最长的）
   * @returns {number} 总时长（秒）
   */
  getTotalDuration() {
    if (this.tracks.length === 0) return 0;
    
    return Math.max(...this.tracks.map(track => track.getTotalDuration()));
  }

  /**
   * 构建最终的 VideoMaker（使用 CompositionElement 嵌套）
   * @returns {VideoMaker}
   */
  build() {
    const totalDuration = this.getTotalDuration();
    
    // 创建主合成（背景透明，背景应该通过 Scene 的 addBackground() 添加）
    const mainComposition = new VideoMaker({
      width: this.config.width,
      height: this.config.height,
      fps: this.config.fps,
      duration: totalDuration,
      backgroundColor: 'transparent', // 主合成背景透明
    });

    // 按 zIndex 排序轨道
    const sortedTracks = [...this.tracks].sort((a, b) => a.zIndex - b.zIndex);

    // 构建所有轨道，获取它们的 CompositionElement 配置
    const trackElements = [];
    for (const track of sortedTracks) {
      const trackElementConfig = track.build(); // 返回 CompositionElement 的配置
      if (trackElementConfig) {
        trackElements.push(trackElementConfig);
      }
    }

    // 创建主 CompositionElement，包含所有轨道
    if (trackElements.length > 0) {
      const mainCompositionElement = new CompositionElement({
        x: '50%',
        y: '50%',
        width: this.config.width,
        height: this.config.height,
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: totalDuration,
        zIndex: 0,
        elements: trackElements, // 所有轨道作为子元素
      });

      // 添加到主合成的图层
      const layer = mainComposition.createElementLayer();
      layer.addElement(mainCompositionElement);
    }

    return mainComposition;
  }

  /**
   * 导出视频
   * @param {string} outputPath - 输出路径
   * @param {Object} options - 导出选项
   * @returns {Promise<void>}
   */
  async export(outputPath, options = {}) {
    const composition = this.build();
    await composition.export(outputPath, options);
    composition.destroy();
  }

  /**
   * 渲染一帧
   * @param {number} time - 时间（秒）
   * @returns {Promise<Canvas>}
   */
  async renderFrame(time) {
    const composition = this.build();
    const canvas = await composition.renderFrame(time);
    composition.destroy();
    return canvas;
  }

  /**
   * 销毁构建器
   */
  destroy() {
    for (const track of this.tracks) {
      track.destroy();
    }
    this.tracks = [];
  }
}


/**
 * 视频构建器 - 多轨道多场景支持
 */
import { VideoMaker } from '../core/VideoMaker.js';
import { Track } from './Track.js';
import { VideoExporter } from '../core/VideoExporter.js';
import { CompositionLayer } from '../layers/CompositionLayer.js';

/**
 * 视频构建器主类
 */
export class VideoBuilder {
  constructor(config = {}) {
    this.config = {
      width: config.width || 1920,
      height: config.height || 1080,
      fps: config.fps || 30,
      backgroundColor: config.backgroundColor || '#000000',
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
   * 构建最终的 VideoMaker
   * @returns {VideoMaker}
   */
  build() {
    const totalDuration = this.getTotalDuration();
    
    // 创建主合成
    const mainComposition = new VideoMaker({
      width: this.config.width,
      height: this.config.height,
      fps: this.config.fps,
      duration: totalDuration,
      backgroundColor: this.config.backgroundColor,
    });

    // 按 zIndex 排序轨道
    const sortedTracks = [...this.tracks].sort((a, b) => a.zIndex - b.zIndex);

    // 为每个轨道创建 CompositionLayer（直接作为 layer，而不是 element）
    for (const track of sortedTracks) {
      // 构建轨道（轨道本身是 VideoMaker，会构建其内部的场景）
      track.build();
      
      // 创建 CompositionLayer 直接渲染轨道合成
      const trackLayer = new CompositionLayer({
        composition: track, // track 本身就是 VideoMaker
        x: this.config.width / 2,
        y: this.config.height / 2,
        width: this.config.width,
        height: this.config.height,
        anchor: [0.5, 0.5],
        zIndex: track.zIndex,
        startTime: 0,
        endTime: track.duration || Infinity,
      });

      // 直接添加到 timeline（作为 layer）
      mainComposition.timeline.addLayer(trackLayer);
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


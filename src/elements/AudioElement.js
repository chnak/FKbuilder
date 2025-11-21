import { BaseElement } from './BaseElement.js';
import { ElementType } from '../types/enums.js';
import fs from 'fs-extra';

/**
 * 音频元素
 */
export class AudioElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.AUDIO;
    
    // 音频文件路径
    this.src = config.src || '';
    this.audioPath = config.audioPath || config.src || '';
    
    // 音频裁剪时间（从原始音频文件中裁剪的开始和结束时间）
    this.audioStartTime = config.cutFrom !== undefined ? config.cutFrom : 0; // 从音频文件的哪个时间点开始裁剪（秒）
    this.audioEndTime = config.cutTo !== undefined ? config.cutTo : undefined; // 裁剪到音频文件的哪个时间点（秒，undefined 表示裁剪到文件末尾）
    
    // 音频配置
    this.volume = config.volume !== undefined ? config.volume : 1.0; // 音量 (0.0 - 1.0)
    this.fadeIn = config.fadeIn || 0; // 淡入时长（秒）
    this.fadeOut = config.fadeOut || 0; // 淡出时长（秒）
    this.loop = config.loop || false; // 是否循环
    
    // 音频信息（在加载后填充）
    this.audioInfo = null;
    this.loaded = false;
  }

  async initialize() {
    await super.initialize();
    await this.load();
  }

  /**
   * 加载音频信息（使用 FFmpeg 获取音频时长等信息）
   */
  async load() {
    if (!this.audioPath || !await fs.pathExists(this.audioPath)) {
      console.warn(`音频文件不存在: ${this.audioPath}`);
      return;
    }

    try {
      const { FFmpegUtil } = await import('../utils/ffmpeg.js');
      const ffmpeg = new FFmpegUtil();
      
      // 使用 FFprobe 获取音频信息
      const execaModule = await import('execa');
      const execa = execaModule.default || execaModule.execa || execaModule;
      const { stdout } = await execa('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        this.audioPath,
      ]);
      
      const duration = parseFloat(stdout.trim());
      
      this.audioInfo = {
        duration: duration || 0,
        path: this.audioPath,
      };
      
      // 如果 duration 未指定，使用音频文件的时长
      if (!this.duration && this.audioInfo.duration > 0) {
        this.duration = this.audioInfo.duration;
        if (this.endTime === Infinity) {
          this.endTime = this.startTime + this.duration;
        }
      }
      
      this.loaded = true;
    } catch (error) {
      console.warn(`获取音频信息失败: ${this.audioPath}`, error.message);
      this.loaded = false;
    }
  }

  /**
   * 设置音频源
   */
  async setSrc(src) {
    this.src = src;
    this.audioPath = src;
    await this.load();
  }

  /**
   * 设置音量
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 设置淡入时长
   */
  setFadeIn(duration) {
    this.fadeIn = Math.max(0, duration);
  }

  /**
   * 设置淡出时长
   */
  setFadeOut(duration) {
    this.fadeOut = Math.max(0, duration);
  }

  /**
   * 音频元素不需要渲染到 canvas
   */
  render(layer, time) {
    // 音频元素不渲染到 canvas
    return null;
  }

  /**
   * 设置音频裁剪时间
   */
  setAudioTrim(startTime, endTime) {
    this.audioStartTime = Math.max(0, startTime || 0);
    this.audioEndTime = endTime !== undefined ? Math.max(this.audioStartTime, endTime) : undefined;
  }

  /**
   * 获取音频配置（用于导出）
   */
  getAudioConfig() {
    return {
      path: this.audioPath,
      startTime: this.startTime || 0, // 在视频中的开始时间
      duration: this.duration, // 在视频中的持续时间
      audioStartTime: this.audioStartTime || 0, // 从音频文件中裁剪的开始时间
      audioEndTime: this.audioEndTime, // 从音频文件中裁剪的结束时间（undefined 表示裁剪到文件末尾）
      volume: this.volume,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      loop: this.loop,
    };
  }
}


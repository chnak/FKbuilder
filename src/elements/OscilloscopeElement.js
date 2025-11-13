import { BaseElement } from './BaseElement.js';
import { ElementType } from '../types/enums.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { toPixels } from '../utils/unit-converter.js';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import paper from 'paper-jsdom-canvas';
import { ensureRenderersLoaded, getRenderer } from './oscilloscope/renderer-loader.js';

/**
 * 示波器元素 - 可视化音频波形
 */
export class OscilloscopeElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.OSCILLOSCOPE;
    
    // 重新合并配置
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    
    // 音频文件路径
    this.audioPath = config.audioPath || config.src || '';
    
    // 示波器样式配置
    this.waveColor = config.waveColor || config.color || '#00ff00'; // 波形颜色
    this.backgroundColor = config.backgroundColor || 'rgba(0, 0, 0, 0.3)'; // 背景颜色
    this.lineWidth = config.lineWidth || 2; // 线条宽度
    this.smoothing = config.smoothing !== undefined ? config.smoothing : 0.3; // 平滑度 (0-1)
    this.mirror = config.mirror !== undefined ? config.mirror : true; // 是否镜像显示
    this.style = config.style || 'line'; // 样式: 'line', 'bars', 'circle', 'spectrum', 'particles', 'waterfall', 'spiral', 'ripple', 'grid', 'explosion'
    this.barWidth = config.barWidth || 2; // 柱状图宽度（当 style 为 'bars' 时）
    this.barGap = config.barGap || 1; // 柱状图间距
    this.sensitivity = config.sensitivity !== undefined ? config.sensitivity : 1.0; // 灵敏度
    
    // 粒子/圆点样式配置
    this.particleCount = config.particleCount || 50; // 圆点数量
    this.particleMinSize = config.particleMinSize || 3; // 圆点最小尺寸
    this.particleMaxSize = config.particleMaxSize || 15; // 圆点最大尺寸
    this.particleColors = config.particleColors || [ // 圆点颜色数组（渐变色）
      '#ff0080', '#ff0080', '#ff4080', '#ff4080',
      '#ff8000', '#ff8000', '#ffc000', '#ffc000',
      '#ffff00', '#ffff00', '#80ff00', '#80ff00',
      '#00ff80', '#00ff80', '#00ffff', '#00ffff',
      '#0080ff', '#0080ff', '#8000ff', '#8000ff',
    ];
    this.particleTrail = config.particleTrail !== undefined ? config.particleTrail : true; // 是否显示拖尾效果
    this.particleTrailLength = config.particleTrailLength || 5; // 拖尾长度
    
    // 瀑布图样式配置
    this.waterfallHeight = config.waterfallHeight || 200; // 瀑布图高度
    this.waterfallBands = config.waterfallBands || 64; // 频段数量
    
    // 螺旋样式配置
    this.spiralTurns = config.spiralTurns || 3; // 螺旋圈数
    this.spiralRadius = config.spiralRadius || 200; // 螺旋半径
    
    // 涟漪样式配置
    this.rippleCount = config.rippleCount || 5; // 涟漪数量
    this.rippleSpeed = config.rippleSpeed || 1.0; // 涟漪速度
    
    // 网格样式配置
    this.gridRows = config.gridRows || 8; // 网格行数
    this.gridCols = config.gridCols || 16; // 网格列数
    
    // 爆炸样式配置
    this.explosionParticles = config.explosionParticles || 100; // 爆炸粒子数
    
    // Blob 球体碰撞样式配置
    this.blobBallCount = config.blobBallCount || 6; // Blob 球体数量
    
    // 音频数据
    this.audioData = null; // 解析后的音频波形数据
    this.sampleRate = 44100; // 采样率
    this.channels = 1; // 声道数（单声道）
    this.loaded = false;
    
    // 音频裁剪时间（从原始音频文件中裁剪的开始和结束时间）
    this.cutFrom = config.cutFrom !== undefined ? config.cutFrom : 0; // 从音频文件的哪个时间点开始裁剪（秒）
    this.cutTo = config.cutTo !== undefined ? config.cutTo : undefined; // 裁剪到音频文件的哪个时间点（秒，undefined 表示裁剪到文件末尾）
    
    // 显示窗口配置
    this.windowSize = config.windowSize || 0.1; // 显示窗口大小（秒），0 表示显示全部
    this.scrollSpeed = config.scrollSpeed || 1.0; // 滚动速度
  }

  /**
   * 加载音频文件并解析波形数据
   */
  async load() {
    if (!this.audioPath || !await fs.pathExists(this.audioPath)) {
      console.warn(`音频文件不存在: ${this.audioPath}`);
      return;
    }

    try {
      const cutInfo = this.cutFrom > 0 || this.cutTo !== undefined 
        ? ` (截取: ${this.cutFrom}s${this.cutTo !== undefined ? ` - ${this.cutTo}s` : ' - 结束'})`
        : '';
      console.log(`[OscilloscopeElement] 开始解析音频文件: ${this.audioPath}${cutInfo}`);
      
      // 使用 FFmpeg 提取音频波形数据
      // 将音频转换为单声道 PCM 16位数据
      // 注意：临时文件放在系统临时目录，避免与源文件冲突
      const os = await import('os');
      const tempDir = os.tmpdir();
      const tempPcmPath = path.join(tempDir, `oscilloscope_temp_${Date.now()}_${path.basename(this.audioPath)}.pcm`);
      
      try {
        // 提取音频数据为 PCM 格式
        // 注意：只读取源文件，不会修改或删除源文件
        const ffmpegArgs = [];
        
        // 如果指定了音频起始时间，添加 -ss 参数（放在 -i 之前可以提高精度）
        if (this.cutFrom > 0) {
          ffmpegArgs.push('-ss', this.cutFrom.toString());
        }
        
        ffmpegArgs.push('-i', this.audioPath); // 输入文件（只读）
        
        // 如果指定了音频结束时间，添加 -t 参数（时长 = cutTo - cutFrom）
        if (this.cutTo !== undefined && this.cutTo > this.cutFrom) {
          const duration = this.cutTo - this.cutFrom;
          ffmpegArgs.push('-t', duration.toString());
        }
        
        ffmpegArgs.push(
          '-f', 's16le', // 16位小端 PCM
          '-acodec', 'pcm_s16le',
          '-ac', '1', // 单声道
          '-ar', '44100', // 采样率 44.1kHz
          '-y', // 覆盖输出文件（仅对输出文件有效）
          tempPcmPath, // 输出到临时文件
        );
        
        await execa('ffmpeg', ffmpegArgs, { stdio: 'pipe' });
        
        // 读取 PCM 数据
        const pcmBuffer = await fs.readFile(tempPcmPath);
        
        // 解析 PCM 数据为波形数组
        this.audioData = this.parsePCMData(pcmBuffer);
        this.sampleRate = 44100;
        this.channels = 1;
        
        console.log(`[OscilloscopeElement] 音频解析完成，采样点数: ${this.audioData.length}`);
        
        // 清理临时文件
        await fs.remove(tempPcmPath).catch(() => {});
        
        this.loaded = true;
      } catch (error) {
        console.error(`[OscilloscopeElement] 解析音频失败:`, error.message);
        await fs.remove(tempPcmPath).catch(() => {});
        this.loaded = false;
      }
    } catch (error) {
      console.error(`[OscilloscopeElement] 加载音频失败:`, error.message);
      this.loaded = false;
    }
  }

  /**
   * 解析 PCM 16位数据为波形数组
   * @param {Buffer} pcmBuffer - PCM 数据缓冲区
   * @returns {Array<number>} 归一化的波形数据数组 (-1 到 1)
   */
  parsePCMData(pcmBuffer) {
    const samples = [];
    const maxValue = 32768; // 16位 PCM 的最大值
    
    // 每2个字节代表一个样本（16位）
    for (let i = 0; i < pcmBuffer.length; i += 2) {
      // 读取16位有符号整数（小端序）
      const sample = pcmBuffer.readInt16LE(i);
      // 归一化到 -1 到 1
      samples.push(sample / maxValue);
    }
    
    return samples;
  }

  /**
   * 获取指定时间范围的波形数据
   * @param {number} startTime - 开始时间（秒）
   * @param {number} duration - 持续时间（秒），如果为 0 则返回全部数据
   * @returns {Array<number>} 波形数据数组
   */
  getWaveformData(startTime = 0, duration = 0) {
    if (!this.loaded || !this.audioData || this.audioData.length === 0) {
      return [];
    }

    if (duration === 0) {
      // 返回全部数据
      return this.audioData;
    }

    // 计算采样点范围
    const startSample = Math.floor(startTime * this.sampleRate);
    const sampleCount = Math.floor(duration * this.sampleRate);
    const endSample = Math.min(startSample + sampleCount, this.audioData.length);

    if (startSample >= this.audioData.length) {
      return [];
    }

    return this.audioData.slice(startSample, endSample);
  }

  /**
   * 平滑处理波形数据
   * @param {Array<number>} data - 原始波形数据
   * @param {number} smoothing - 平滑度 (0-1)
   * @returns {Array<number>} 平滑后的数据
   */
  smoothData(data, smoothing) {
    if (smoothing <= 0 || data.length === 0) {
      return data;
    }

    const smoothed = [...data];
    const windowSize = Math.max(1, Math.floor(data.length * smoothing * 0.1));

    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize); j <= Math.min(data.length - 1, i + windowSize); j++) {
        sum += data[j];
        count++;
      }
      
      smoothed[i] = sum / count;
    }

    return smoothed;
  }

  /**
   * 渲染示波器元素
   */
  async render(layer, time) {
    if (!this.visible) return null;
    
    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    if (!this.loaded || !this.audioData || this.audioData.length === 0) {
      return null;
    }

    // 获取当前状态
    const viewSize = paper.view.viewSize;
    const context = { 
      width: this.canvasWidth || viewSize.width, 
      height: this.canvasHeight || viewSize.height 
    };
    const state = this.getStateAtTime(time, context);

    // 转换位置和尺寸单位
    let x = state.x;
    let y = state.y;
    let width = state.width || 800;
    let height = state.height || 200;

    if (typeof x === 'string') {
      x = toPixels(x, context.width, 'x');
    }
    if (typeof y === 'string') {
      y = toPixels(y, context.height, 'y');
    }
    if (typeof width === 'string') {
      width = toPixels(width, context.width, 'x');
    }
    if (typeof height === 'string') {
      height = toPixels(height, context.height, 'y');
    }

    // 处理 anchor
    const anchor = state.anchor || [0.5, 0.5];
    const rectX = x - width * anchor[0];
    const rectY = y - height * anchor[1];

    // 计算相对时间（相对于元素开始时间）
    const relativeTime = Math.max(0, time - this.startTime);
    
    // 获取波形数据
    let waveformData;
    if (this.windowSize > 0) {
      // 显示窗口模式：显示当前时间附近的波形
      const windowStartTime = Math.max(0, relativeTime - this.windowSize / 2);
      waveformData = this.getWaveformData(windowStartTime, this.windowSize);
    } else {
      // 显示全部波形（从当前时间开始）
      const maxDuration = this.duration || (this.audioData.length / this.sampleRate);
      const remainingDuration = Math.max(0, maxDuration - relativeTime);
      waveformData = this.getWaveformData(relativeTime, remainingDuration);
    }

    if (waveformData.length === 0) {
      return null;
    }

    // 平滑处理
    if (this.smoothing > 0) {
      waveformData = this.smoothData(waveformData, this.smoothing);
    }

    // 绘制背景
    if (this.backgroundColor && this.backgroundColor !== 'transparent') {
      const bgRect = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(rectX, rectY, width, height),
        fillColor: this.backgroundColor,
      });
      bgRect.sendToBack();
    }

    // 确保渲染器已加载
    await ensureRenderersLoaded();
    
    // 根据样式绘制波形 - 使用动态加载的渲染器
    const styleName = (this.style === 'dots') ? 'particles' : this.style;
    const renderer = getRenderer(styleName) || getRenderer('line');
    
    if (renderer) {
      // 调用渲染器函数，传递 element, data, x, y, width, height, time
      renderer(this, waveformData, rectX, rectY, width, height, time);
    } else {
      console.warn(`[OscilloscopeElement] 未找到渲染器: ${styleName}，使用默认 line 渲染器`);
      const defaultRenderer = getRenderer('line');
      if (defaultRenderer) {
        defaultRenderer(this, waveformData, rectX, rectY, width, height);
      }
    }

    return null;
  }

  /**
   * 设置音频源
   */
  async setAudioPath(audioPath) {
    this.audioPath = audioPath;
    await this.load();
  }

  /**
   * 设置波形颜色
   */
  setWaveColor(color) {
    this.waveColor = color;
    this.config.waveColor = color;
  }

  /**
   * 设置样式
   */
  setStyle(style) {
    this.style = style;
    this.config.style = style;
  }

  /**
   * 销毁元素
   */
  destroy() {
    this.audioData = null;
    super.destroy();
  }
}


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

// 在模块加载时预加载渲染器（非阻塞）
ensureRenderersLoaded().catch(err => {
  console.warn('[OscilloscopeElement] 预加载渲染器失败:', err.message);
});

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
    
    // 示波器通用样式配置（所有样式共享）
    this.waveColor = config.waveColor || config.color || '#00ff00'; // 波形颜色
    this.backgroundColor = config.backgroundColor || 'rgba(0, 0, 0, 0.3)'; // 背景颜色
    this.lineWidth = config.lineWidth || 2; // 线条宽度
    this.smoothing = config.smoothing !== undefined ? config.smoothing : 0.3; // 平滑度 (0-1)
    this.mirror = config.mirror !== undefined ? config.mirror : true; // 是否镜像显示
    this.style = config.style || 'line'; // 样式: 'line', 'bars', 'circle', 'spectrum', 'particles', 'waterfall', 'spiral', 'ripple', 'grid', 'explosion', 'blob', 'rotating3d', 'trail', 'weave', 'lightwave', 'particleflow'
    this.sensitivity = config.sensitivity !== undefined ? config.sensitivity : 1.0; // 灵敏度
    
    // 注意：特定样式的配置项已移到对应的渲染器文件中
    // 这些配置项仍然可以通过 config 传入，但会在 render 时传递给对应的渲染器
    
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
    
    // 初始化状态
    this._initialized = false;
  }
  
  /**
   * 初始化元素（加载音频数据）
   * @returns {Promise<void>}
   */
  async initialize() {
    // 如果已经初始化，直接返回
    if (this._initialized && this.loaded && this.audioData && this.audioData.length > 0) {
      return;
    }
    
    // 加载音频数据
    await this.load();
    
    // 标记为已初始化
    this._initialized = true;
  }
  
  /**
   * 检查元素是否已初始化
   * @returns {boolean}
   */
  isInitialized() {
    return this._initialized && this.loaded && this.audioData && this.audioData.length > 0;
  }

  /**
   * 加载音频文件并解析波形数据
   */
  async load() {
    // 如果已经在加载中，返回现有的 Promise
    if (this._loadingPromise) {
      return this._loadingPromise;
    }
    
    // 如果已经加载完成，直接返回
    if (this.loaded && this.audioData && this.audioData.length > 0) {
      return;
    }
    
    // 创建加载 Promise（不在这里 await，让调用者决定是否等待）
    this._loadingPromise = this._doLoad().finally(() => {
      // 加载完成后清除 Promise 引用
      this._loadingPromise = null;
    });
    
    return this._loadingPromise;
  }
  
  /**
   * 实际执行加载音频文件并解析波形数据
   */
  async _doLoad() {
    if (!this.audioPath || !await fs.pathExists(this.audioPath)) {
      console.warn(`音频文件不存在: ${this.audioPath}`);
      return;
    }

    try {
      const cutInfo = this.cutFrom > 0 || this.cutTo !== undefined 
        ? ` (截取: ${this.cutFrom}s${this.cutTo !== undefined ? ` - ${this.cutTo}s` : ' - 结束'})`
        : '';
    //   console.log(`[OscilloscopeElement] 开始解析音频文件: ${this.audioPath}${cutInfo}`);
      
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
          '-hide_banner', // 隐藏版本信息横幅
          '-loglevel', 'error', // 只显示错误信息
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
        
        // console.log(`[OscilloscopeElement] 音频解析完成，采样点数: ${this.audioData.length}`);
        
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

    // 如果音频数据还没加载完成，尝试初始化（通常应该在渲染前通过 initialize 完成）
    if (!this.loaded || !this.audioData || this.audioData.length === 0) {
      // 如果正在加载中，等待加载完成
      if (this._loadingPromise) {
        await this._loadingPromise;
      } else if (this.audioPath && !this._initialized) {
        // 如果还没初始化，尝试初始化（作为后备方案）
        await this.initialize();
      }
      
      // 加载完成后再次检查
      if (!this.loaded || !this.audioData || this.audioData.length === 0) {
        return null;
      }
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
      x = toPixels(x, context, 'x');
    }
    if (typeof y === 'string') {
      y = toPixels(y, context, 'y');
    }
    if (typeof width === 'string') {
      width = toPixels(width, context, 'width');
    }
    if (typeof height === 'string') {
      height = toPixels(height, context, 'height');
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

    // 创建一个 Group 来包含示波器的背景和波形
    // 这样可以确保背景和波形在同一层级，背景不会被场景背景覆盖
    const oscilloscopeGroup = new paper.Group();
    if (layer) {
      layer.addChild(oscilloscopeGroup);
    } else if (paper.project && paper.project.activeLayer) {
      paper.project.activeLayer.addChild(oscilloscopeGroup);
    }
    
    // 绘制背景（在渲染波形之前）
    // 注意：背景必须在渲染波形之前绘制，并且要确保在 group 的最底层
    if (this.backgroundColor && this.backgroundColor !== 'transparent') {
      const bgRect = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(rectX, rectY, width, height),
        fillColor: this.backgroundColor,
        parent: oscilloscopeGroup, // 添加到 group 中
      });
      // 确保背景在 group 的最底层
      bgRect.sendToBack();
    }

    // 确保渲染器已加载（通常已经在初始化时加载完成）
    // 如果还没加载完成，这里会等待，但通常不会阻塞
    await ensureRenderersLoaded();
    
    // 获取当前 activeLayer 的子元素数量，用于在渲染后识别新创建的路径
    const activeLayer = paper.project && paper.project.activeLayer;
    const childrenBeforeRender = activeLayer ? [...activeLayer.children] : [];
    
    // 根据样式绘制波形 - 使用动态加载的渲染器
    const styleName = (this.style === 'dots') ? 'particles' : this.style;
    const renderer = getRenderer(styleName) || getRenderer('line');
    
    if (renderer) {
      // 从 config 中提取该样式相关的配置项
      const styleConfig = this._extractStyleConfig(styleName);
      
      // 调用渲染器函数，传递 element, data, x, y, width, height, time, config
      // 注意：所有渲染器都接受 time 和 config 参数（即使不使用）
      renderer(this, waveformData, rectX, rectY, width, height, time, styleConfig);
    } else {
      console.warn(`[OscilloscopeElement] 未找到渲染器: ${styleName}，使用默认 line 渲染器`);
      const defaultRenderer = getRenderer('line');
      if (defaultRenderer) {
        defaultRenderer(this, waveformData, rectX, rectY, width, height, time, {});
      }
    }
    
    // 将渲染器创建的新路径移动到 group 中
    if (activeLayer) {
      const childrenAfterRender = [...activeLayer.children];
      // 找出新创建的子元素（在渲染后添加的）
      const newChildren = childrenAfterRender.filter(child => !childrenBeforeRender.includes(child));
      // 将新创建的子元素移动到 group 中
      for (const child of newChildren) {
        child.parent = oscilloscopeGroup;
      }
    }

    return null;
  }

  /**
   * 从 config 中提取特定样式相关的配置项
   * @param {string} styleName - 样式名称
   * @returns {Object} 样式配置对象
   */
  _extractStyleConfig(styleName) {
    const config = this.config || {};
    const styleConfig = {};
    
    // 根据样式名称提取对应的配置项
    switch (styleName) {
      case 'particles':
      case 'dots':
        if (config.particleCount !== undefined) styleConfig.particleCount = config.particleCount;
        if (config.particleMinSize !== undefined) styleConfig.particleMinSize = config.particleMinSize;
        if (config.particleMaxSize !== undefined) styleConfig.particleMaxSize = config.particleMaxSize;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        if (config.particleTrail !== undefined) styleConfig.particleTrail = config.particleTrail;
        if (config.particleTrailLength !== undefined) styleConfig.particleTrailLength = config.particleTrailLength;
        break;
      case 'waterfall':
        if (config.waterfallHeight !== undefined) styleConfig.waterfallHeight = config.waterfallHeight;
        if (config.waterfallBands !== undefined) styleConfig.waterfallBands = config.waterfallBands;
        break;
      case 'spiral':
        if (config.spiralTurns !== undefined) styleConfig.spiralTurns = config.spiralTurns;
        if (config.spiralRadius !== undefined) styleConfig.spiralRadius = config.spiralRadius;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      case 'ripple':
        if (config.rippleCount !== undefined) styleConfig.rippleCount = config.rippleCount;
        if (config.rippleSpeed !== undefined) styleConfig.rippleSpeed = config.rippleSpeed;
        break;
      case 'grid':
        if (config.gridRows !== undefined) styleConfig.gridRows = config.gridRows;
        if (config.gridCols !== undefined) styleConfig.gridCols = config.gridCols;
        break;
      case 'explosion':
        if (config.explosionParticles !== undefined) styleConfig.explosionParticles = config.explosionParticles;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      case 'bars':
        if (config.barWidth !== undefined) styleConfig.barWidth = config.barWidth;
        if (config.barGap !== undefined) styleConfig.barGap = config.barGap;
        break;
      case 'blob':
        if (config.blobBallCount !== undefined) styleConfig.blobBallCount = config.blobBallCount;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      case 'rotating3d':
        if (config.rotationSpeed !== undefined) styleConfig.rotationSpeed = config.rotationSpeed;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      case 'trail':
        if (config.trailParticleCount !== undefined) styleConfig.trailParticleCount = config.trailParticleCount;
        if (config.trailLength !== undefined) styleConfig.trailLength = config.trailLength;
        if (config.trailSpeed !== undefined) styleConfig.trailSpeed = config.trailSpeed;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      case 'weave':
        if (config.weaveLayers !== undefined) styleConfig.weaveLayers = config.weaveLayers;
        if (config.weaveLayerSpacing !== undefined) styleConfig.weaveLayerSpacing = config.weaveLayerSpacing;
        if (config.weaveSpeed !== undefined) styleConfig.weaveSpeed = config.weaveSpeed;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      case 'lightwave':
        if (config.lightwaveCount !== undefined) styleConfig.lightwaveCount = config.lightwaveCount;
        if (config.lightwaveSpeed !== undefined) styleConfig.lightwaveSpeed = config.lightwaveSpeed;
        if (config.lightwaveSegments !== undefined) styleConfig.lightwaveSegments = config.lightwaveSegments;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      case 'particleflow':
        if (config.flowParticleCount !== undefined) styleConfig.flowParticleCount = config.flowParticleCount;
        if (config.flowSpeed !== undefined) styleConfig.flowSpeed = config.flowSpeed;
        if (config.showWaveform !== undefined) styleConfig.showWaveform = config.showWaveform;
        if (config.particleColors !== undefined) styleConfig.particleColors = config.particleColors;
        break;
      // 其他样式可以在这里添加
      default:
        // 对于没有特定配置的样式，返回空对象
        break;
    }
    
    return styleConfig;
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


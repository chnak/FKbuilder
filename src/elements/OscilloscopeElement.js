import { BaseElement } from './BaseElement.js';
import { ElementType } from '../types/enums.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { toPixels } from '../utils/unit-converter.js';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import paper from 'paper-jsdom-canvas';

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
    this.style = config.style || 'line'; // 样式: 'line', 'bars', 'circle', 'spectrum'
    this.barWidth = config.barWidth || 2; // 柱状图宽度（当 style 为 'bars' 时）
    this.barGap = config.barGap || 1; // 柱状图间距
    this.sensitivity = config.sensitivity !== undefined ? config.sensitivity : 1.0; // 灵敏度
    
    // 音频数据
    this.audioData = null; // 解析后的音频波形数据
    this.sampleRate = 44100; // 采样率
    this.channels = 1; // 声道数（单声道）
    this.loaded = false;
    
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
      console.log(`[OscilloscopeElement] 开始解析音频文件: ${this.audioPath}`);
      
      // 使用 FFmpeg 提取音频波形数据
      // 将音频转换为单声道 PCM 16位数据
      const tempPcmPath = path.join(path.dirname(this.audioPath), `temp_${Date.now()}.pcm`);
      
      try {
        // 提取音频数据为 PCM 格式
        await execa('ffmpeg', [
          '-i', this.audioPath,
          '-f', 's16le', // 16位小端 PCM
          '-acodec', 'pcm_s16le',
          '-ac', '1', // 单声道
          '-ar', '44100', // 采样率 44.1kHz
          '-y', // 覆盖输出文件
          tempPcmPath,
        ], { stdio: 'pipe' });
        
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
  render(layer, time) {
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

    // 根据样式绘制波形
    switch (this.style) {
      case 'bars':
        this.renderBars(waveformData, rectX, rectY, width, height);
        break;
      case 'circle':
        this.renderCircle(waveformData, rectX, rectY, width, height);
        break;
      case 'spectrum':
        this.renderSpectrum(waveformData, rectX, rectY, width, height);
        break;
      case 'line':
      default:
        this.renderLine(waveformData, rectX, rectY, width, height);
        break;
    }

    return null;
  }

  /**
   * 绘制线条波形
   */
  renderLine(data, x, y, width, height) {
    const centerY = y + height / 2;
    const stepX = width / data.length;
    const amplitude = (height / 2) * this.sensitivity;

    // 创建波形路径
    const path = new paper.Path();
    path.strokeColor = this.waveColor;
    path.strokeWidth = this.lineWidth;

    // 绘制上半部分
    for (let i = 0; i < data.length; i++) {
      const px = x + i * stepX;
      const py = centerY - data[i] * amplitude;
      if (i === 0) {
        path.moveTo(new paper.Point(px, py));
      } else {
        path.lineTo(new paper.Point(px, py));
      }
    }

    // 如果启用镜像，绘制下半部分
    if (this.mirror) {
      for (let i = data.length - 1; i >= 0; i--) {
        const px = x + i * stepX;
        const py = centerY + data[i] * amplitude;
        path.lineTo(new paper.Point(px, py));
      }
      path.closePath();
      path.fillColor = this.waveColor;
      path.fillColor.alpha = 0.3;
    }
  }

  /**
   * 绘制柱状波形
   */
  renderBars(data, x, y, width, height) {
    const centerY = y + height / 2;
    const barCount = Math.floor(width / (this.barWidth + this.barGap));
    const step = Math.max(1, Math.floor(data.length / barCount));
    const amplitude = (height / 2) * this.sensitivity;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      if (dataIndex >= data.length) break;

      // 计算该段的平均值
      let sum = 0;
      let count = 0;
      for (let j = dataIndex; j < Math.min(dataIndex + step, data.length); j++) {
        sum += Math.abs(data[j]);
        count++;
      }
      const avg = count > 0 ? sum / count : 0;

      const barX = x + i * (this.barWidth + this.barGap);
      const barHeight = avg * amplitude * 2;

      // 绘制柱状图
      const bar = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(
          barX,
          centerY - barHeight / 2,
          this.barWidth,
          barHeight
        ),
        fillColor: this.waveColor,
      });

      // 如果启用镜像，绘制下半部分
      if (this.mirror) {
        const barBottom = new paper.Path.Rectangle({
          rectangle: new paper.Rectangle(
            barX,
            centerY,
            this.barWidth,
            barHeight / 2
          ),
          fillColor: this.waveColor,
        });
      }
    }
  }

  /**
   * 绘制圆形波形
   */
  renderCircle(data, x, y, width, height) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const pointCount = Math.min(data.length, 360);

    const path = new paper.Path();
    path.strokeColor = this.waveColor;
    path.strokeWidth = this.lineWidth;
    path.closed = true;

    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      const dataIndex = Math.floor((i / pointCount) * data.length);
      const amplitude = data[dataIndex] * radius * this.sensitivity;
      const r = radius + amplitude;

      const px = centerX + Math.cos(angle) * r;
      const py = centerY + Math.sin(angle) * r;

      if (i === 0) {
        path.moveTo(new paper.Point(px, py));
      } else {
        path.lineTo(new paper.Point(px, py));
      }
    }

    path.fillColor = this.waveColor;
    path.fillColor.alpha = 0.2;
  }

  /**
   * 绘制频谱波形（类似频谱分析仪）
   */
  renderSpectrum(data, x, y, width, height) {
    const centerY = y + height / 2;
    const barCount = 64; // 频谱条数
    const step = Math.max(1, Math.floor(data.length / barCount));
    const barWidth = (width / barCount) * 0.8;
    const barGap = (width / barCount) * 0.2;
    const amplitude = (height / 2) * this.sensitivity;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      if (dataIndex >= data.length) break;

      // 计算该段的 RMS（均方根）
      let sumSquares = 0;
      let count = 0;
      for (let j = dataIndex; j < Math.min(dataIndex + step, data.length); j++) {
        sumSquares += data[j] * data[j];
        count++;
      }
      const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;

      const barX = x + i * (barWidth + barGap);
      const barHeight = rms * amplitude * 2;

      // 绘制频谱条（从中心向上）
      const bar = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(
          barX,
          centerY - barHeight,
          barWidth,
          barHeight
        ),
        fillColor: this.waveColor,
      });

      // 如果启用镜像，绘制下半部分
      if (this.mirror) {
        const barBottom = new paper.Path.Rectangle({
          rectangle: new paper.Rectangle(
            barX,
            centerY,
            barWidth,
            barHeight
          ),
          fillColor: this.waveColor,
        });
      }
    }
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


/**
 * 转场元素 - 使用 gl-transitions 渲染转场效果
 */
import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { TransitionRenderer } from '../utils/transition-renderer.js';
import { createCanvas } from 'canvas';

/**
 * 转场元素类
 */
export class TransitionElement extends BaseElement {
  // 静态变量：累计所有转场渲染的总时间
  static totalTransitionTime = 0;
  static transitionRenderCount = 0;

  constructor(config = {}) {
    super(config);
    this.type = ElementType.TRANSITION || 'transition';
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    
    this.fromComposition = config.fromComposition; // 源场景合成
    this.toComposition = config.toComposition; // 目标场景合成
    this.transitionConfig = config.transitionConfig || {}; // 转场配置
    this.transitionRenderer = null;
    this.transitionFunction = null;
    
    // 转场时间范围
    this.startTime = config.startTime || 0;
    this.endTime = config.endTime || Infinity;
    this.duration = config.duration || 0.5;
    
    if (this.duration !== undefined && this.endTime === Infinity) {
      this.endTime = this.startTime + this.duration;
    }
    
    // 初始化转场渲染器（延迟初始化，避免在构造函数中抛出错误）
    this.transitionRenderer = null;
    if (this.transitionConfig.name) {
      try {
        this.transitionRenderer = new TransitionRenderer(this.transitionConfig);
      } catch (error) {
        console.warn(`转场渲染器初始化失败: ${this.transitionConfig.name}`, error);
        this.transitionRenderer = null;
      }
    }
  }

  /**
   * 初始化转场渲染函数
   */
  async initTransitionFunction(width, height) {
    if (!this.transitionRenderer || !this.transitionConfig.name) {
      return;
    }

    if (!this.transitionFunction) {
      this.transitionFunction = this.transitionRenderer.create({
        width,
        height,
        channels: 4,
      });
    }
  }

  /**
   * 将 Canvas 转换为 Buffer (RGBA)
   */
  canvasToBuffer(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return Buffer.from(imageData.data);
  }

  /**
   * 将 Buffer (RGBA) 转换为 Canvas
   */
  bufferToCanvas(buffer, width, height) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(buffer);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * 渲染到 Canvas
   */
  async renderToCanvas(ctx, time) {
    if (!this.isActiveAtTime(time)) {
      return;
    }

    if (!this.fromComposition || !this.toComposition) {
      return;
    }

    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // 计算转场进度 (0-1)
    const progress = Math.max(
      0,
      Math.min(1, (time - this.startTime) / this.duration)
    );

    // 如果没有转场效果，直接切换
    if (!this.transitionRenderer || !this.transitionConfig.name) {
      // 简单的淡入淡出
      if (progress < 0.5) {
        // 显示源场景
        await this.renderComposition(ctx, this.fromComposition, time, 1 - progress * 2);
      } else {
        // 显示目标场景
        await this.renderComposition(ctx, this.toComposition, time, (progress - 0.5) * 2);
      }
      return;
    }

    // 初始化转场渲染函数
    try {
      await this.initTransitionFunction(width, height);
    } catch (error) {
      console.warn('初始化转场渲染函数失败:', error);
      // 降级到简单切换
      if (progress < 0.5) {
        await this.renderComposition(ctx, this.fromComposition, time, 1 - progress * 2);
      } else {
        await this.renderComposition(ctx, this.toComposition, time, (progress - 0.5) * 2);
      }
      return;
    }

    let fromCanvas = null;
    let toCanvas = null;
    let transitionCanvas = null;

    try {
      // 记录转场渲染开始时间
      const renderStartTime = performance.now();

      // 渲染源场景和目标场景的帧
      const fromTime = Math.max(0, time - this.startTime);
      const toTime = Math.max(0, time - (this.startTime + this.duration / 2));

      // 创建临时 Canvas 来渲染两个场景
      fromCanvas = createCanvas(width, height);
      const fromCtx = fromCanvas.getContext('2d');
      await this.renderComposition(fromCtx, this.fromComposition, fromTime, 1);

      toCanvas = createCanvas(width, height);
      const toCtx = toCanvas.getContext('2d');
      await this.renderComposition(toCtx, this.toComposition, toTime, 1);

      // 转换为 Buffer
      const fromBuffer = this.canvasToBuffer(fromCanvas);
      const toBuffer = this.canvasToBuffer(toCanvas);

      // 使用 gl-transitions 混合
      const transitionBuffer = this.transitionFunction({
        fromFrame: fromBuffer,
        toFrame: toBuffer,
        progress: progress,
      });

      // 转换回 Canvas 并绘制
      transitionCanvas = this.bufferToCanvas(transitionBuffer, width, height);
      ctx.drawImage(transitionCanvas, 0, 0);

      // 记录转场渲染结束时间并累计
      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;
      TransitionElement.totalTransitionTime += renderTime;
      TransitionElement.transitionRenderCount += 1;
    } catch (error) {
      console.error('转场渲染失败，使用简单切换:', error);
      console.error('错误堆栈:', error.stack);
      // 降级到简单切换
      try {
        if (progress < 0.5) {
          await this.renderComposition(ctx, this.fromComposition, time, 1 - progress * 2);
        } else {
          await this.renderComposition(ctx, this.toComposition, time, (progress - 0.5) * 2);
        }
      } catch (fallbackError) {
        console.error('降级渲染也失败:', fallbackError);
        console.error('降级错误堆栈:', fallbackError.stack);
      }
    } finally {
      // 清理临时 Canvas（如果 Node.js Canvas 支持的话）
      // 注意：node-canvas 的 Canvas 对象没有 dispose 方法，但我们可以尝试设置为 null
      if (fromCanvas) {
        try {
          // 尝试清理
          fromCanvas = null;
        } catch (e) {
          // 忽略清理错误
        }
      }
      if (toCanvas) {
        try {
          toCanvas = null;
        } catch (e) {
          // 忽略清理错误
        }
      }
      if (transitionCanvas) {
        try {
          transitionCanvas = null;
        } catch (e) {
          // 忽略清理错误
        }
      }
    }
  }

  /**
   * 渲染合成到 Canvas
   */
  async renderComposition(ctx, composition, time, opacity = 1) {
    if (!composition) return;

    try {
      // 确保 renderer 已初始化
      if (!composition.renderer.initialized) {
        await composition.renderer.init();
      }

      // 渲染合成的一帧
      await composition.renderer.renderFrame(
        composition.timeline.getLayers(),
        time,
        composition.backgroundColor || 'transparent'
      );

      // 绘制到目标 Canvas
      const sourceCanvas = composition.renderer.canvas;
      if (sourceCanvas) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.drawImage(sourceCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
    } catch (error) {
      console.warn('渲染合成失败:', error);
      // 绘制一个黑色背景作为降级
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }

  /**
   * 获取转场渲染统计信息
   * @returns {Object} { totalTime, count, averageTime }
   */
  static getTransitionStats() {
    return {
      totalTime: TransitionElement.totalTransitionTime,
      count: TransitionElement.transitionRenderCount,
      averageTime: TransitionElement.transitionRenderCount > 0
        ? TransitionElement.totalTransitionTime / TransitionElement.transitionRenderCount
        : 0,
    };
  }

  /**
   * 重置转场统计信息
   */
  static resetTransitionStats() {
    TransitionElement.totalTransitionTime = 0;
    TransitionElement.transitionRenderCount = 0;
  }

  /**
   * 打印转场统计信息
   */
  static printTransitionStats() {
    const stats = TransitionElement.getTransitionStats();
    if (stats.count > 0) {
      console.log(`\n转场渲染统计:`);
      console.log(`  总渲染次数: ${stats.count}`);
      console.log(`  总耗时: ${(stats.totalTime / 1000).toFixed(2)} 秒`);
      console.log(`  平均耗时: ${(stats.averageTime).toFixed(2)} 毫秒/帧`);
    }
  }
}


/**
 * 转场元素 - 使用 gl-transitions 渲染转场效果
 */
import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { TransitionRenderer } from '../utils/transition-renderer.js';
import { createCanvas } from 'node-canvas-webgl';

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
   * 渲染转场元素（使用 Paper.js）
   * 注意：转场效果需要预先渲染两个合成，然后使用 gl-transitions 混合
   */
  render(layer, time) {
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    if (!this.fromComposition || !this.toComposition) {
      return null;
    }

    // 转场效果需要特殊处理，这里暂时返回 null
    // 实际转场效果应该在 VideoExporter 中处理，因为它需要渲染两个合成
    // 或者可以在这里渲染两个合成的 canvas，然后使用 gl-transitions 混合
    console.warn('TransitionElement.render() 在 Paper.js 中需要特殊处理，转场效果建议在 VideoExporter 中处理');
    return null;
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


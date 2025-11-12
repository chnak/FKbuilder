import { BaseLayer } from './BaseLayer.js';
import { LayerType } from '../types/enums.js';

/**
 * 元素图层
 */
export class ElementLayer extends BaseLayer {
  constructor(config = {}) {
    super(config);
    this.type = LayerType.ELEMENT;
  }

  /**
   * 渲染元素图层
   */
  render(scene, time) {
    if (!this.isActiveAtTime(time)) return;

    // 渲染所有元素
    for (const element of this.elements) {
      if (element.visible) {
        element.render(scene, time);
      }
    }
  }

  /**
   * 直接使用Canvas 2D API渲染图层
   */
  async renderToCanvas(ctx, time) {
    if (!this.isActiveAtTime(time)) return;

    // 先预渲染所有嵌套合成和字幕元素
    for (const element of this.elements) {
      if (element.visible) {
        // 预渲染嵌套合成
        if (element.type === 'composition' && typeof element.preRender === 'function') {
          try {
            await element.preRender(time);
          } catch (error) {
            console.warn('预渲染嵌套合成失败:', error);
          }
        }
        // 初始化字幕元素（如果需要）
        if (element.type === 'text' && element.constructor.name === 'SubtitleElement' && !element.initialized) {
          try {
            const canvas = ctx.canvas;
            await element.initialize({ width: canvas.width, height: canvas.height });
          } catch (error) {
            console.warn('初始化字幕元素失败:', error);
          }
        }
      }
    }

    // 然后渲染所有元素（支持异步）
    for (const element of this.elements) {
      if (element.visible && typeof element.renderToCanvas === 'function') {
        try {
          const result = element.renderToCanvas(ctx, time);
          // 如果是 Promise，等待完成
          if (result && typeof result.then === 'function') {
            await result;
          }
        } catch (error) {
          console.error(`渲染元素失败 (${element.type || 'unknown'}):`, error);
        }
      }
    }
  }
}


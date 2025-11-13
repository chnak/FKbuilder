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
   * 渲染元素图层（使用 Paper.js）
   */
  async render(layer, time) {
    if (!this.isActiveAtTime(time)) return;

    // 渲染所有元素
    for (const element of this.elements) {
      // 检查元素是否在指定时间激活（使用相对时间）
      if (element.visible && element.isActiveAtTime && element.isActiveAtTime(time)) {
        // 使用 Paper.js 渲染
        if (typeof element.render === 'function') {
          try {
            // 支持异步渲染（如 CompositionElement）
            const result = element.render(layer, time);
            if (result && typeof result.then === 'function') {
              await result;
            }
          } catch (error) {
            console.error(`渲染元素失败 (${element.type || 'unknown'}, id: ${element.id}):`, error);
            console.error('错误堆栈:', error.stack);
          }
        } else {
          console.warn(`元素 ${element.type || 'unknown'} 没有 render 方法`);
        }
      }
    }
  }

}


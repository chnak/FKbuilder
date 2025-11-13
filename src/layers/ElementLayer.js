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

    // 按 zIndex 排序元素（zIndex 小的先渲染，大的后渲染，显示在上层）
    const sortedElements = [...this.elements].sort((a, b) => {
      const zIndexA = a.zIndex !== undefined ? a.zIndex : 0;
      const zIndexB = b.zIndex !== undefined ? b.zIndex : 0;
      return zIndexA - zIndexB;
    });

    // 渲染所有元素（按 zIndex 顺序）
    for (const element of sortedElements) {
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


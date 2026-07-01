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
   * @param {paper.Layer} layer - Paper.js 图层
   * @param {number} time - 当前时间（秒）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  async render(layer, time, paperInstance = null) {
    if (!this.isActiveAtTime(time)) return;

    // 重置已渲染元素列表
    this.renderedElements = [];

    // 按 zIndex 排序元素（zIndex 小的先渲染，大的后渲染，显示在上层）
    const sortedElements = [...this.elements].sort((a, b) => {
      const zIndexA = a.zIndex !== undefined ? a.zIndex : 0;
      const zIndexB = b.zIndex !== undefined ? b.zIndex : 0;
      return zIndexA - zIndexB;
    });

    // 渲染所有元素（按 zIndex 顺序）
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];
      // 检查元素是否在指定时间激活（使用相对时间）
      if (element.visible && element.isActiveAtTime && element.isActiveAtTime(time)) {
        try {
          // 在渲染之前先初始化元素（如果还未初始化）
          if (typeof element.isInitialized === 'function' && !element.isInitialized()) {
            if (typeof element.initialize === 'function') {
              const initStartTime = Date.now();
              const initResult = element.initialize();
              if (initResult && typeof initResult.then === 'function') {
                // 添加超时保护（30秒）
                await Promise.race([
                  initResult,
                  new Promise((_, reject) => setTimeout(() => reject(new Error(`元素 ${element.type || 'unknown'} 初始化超时（30秒）`)), 30000))
                ]);
              }
              const initDuration = Date.now() - initStartTime;
              if (initDuration > 1000) {
                console.warn(`  [ElementLayer] 元素 ${element.type || 'unknown'} 初始化耗时 ${initDuration}ms`);
              }
            }
          }
          
          // 使用 Paper.js 渲染
          if (typeof element.render === 'function') {
            // 支持异步渲染，传递 paperInstance 给元素
            const renderStartTime = Date.now();
            const result = element.render(layer, time, paperInstance);
            if (result && typeof result.then === 'function') {
              // 添加超时保护（60秒）
              await Promise.race([
                result,
                new Promise((_, reject) => setTimeout(() => reject(new Error(`元素 ${element.type || 'unknown'} 渲染超时（60秒）`)), 60000))
              ]);
            }
            const renderDuration = Date.now() - renderStartTime;
            if (renderDuration > 1000) {
              console.warn(`  [ElementLayer] 元素 ${element.type || 'unknown'} 渲染耗时 ${renderDuration}ms`);
            }
            
            // 记录已渲染的元素（用于 onFrame 回调）
            this.renderedElements.push(element);
          } else {
            console.warn(`元素 ${element.type || 'unknown'} 没有 render 方法`);
          }
        } catch (error) {
          console.error(`渲染元素失败 (${element.type || 'unknown'}, id: ${element.id}):`, error.message);
          if (error.stack) {
            console.error('错误堆栈:', error.stack.split('\n').slice(0, 5).join('\n'));
          }
          throw error;
        }
      }
    }

  }

  /**
   * 获取已渲染的元素列表
   * @returns {Array} 已渲染的元素数组
   */
  getRenderedElements() {
    return this.renderedElements || [];
  }

}


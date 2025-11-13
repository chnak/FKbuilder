import { BaseLayer } from './BaseLayer.js';
import { LayerType } from '../types/enums.js';
import { RectElement } from '../elements/RectElement.js';

/**
 * 背景图层
 */
export class BackgroundLayer extends BaseLayer {
  constructor(config = {}) {
    super(config);
    this.type = LayerType.BACKGROUND;
    this.backgroundColor = config.backgroundColor || '#000000';
    this.backgroundElement = null;
  }

  /**
   * 设置背景颜色
   */
  setBackgroundColor(color) {
    this.backgroundColor = color;
    if (this.backgroundElement) {
      this.backgroundElement.setBgColor(color);
    }
  }

  /**
   * 初始化背景元素
   */
  initBackground(width, height) {
    if (!this.backgroundElement) {
      this.backgroundElement = new RectElement({
        x: width / 2,  // 中心位置
        y: height / 2, // 中心位置
        width: width,
        height: height,
        bgcolor: this.backgroundColor,
        anchor: [0.5, 0.5], // 中心锚点，这样矩形会以中心为基准覆盖整个画布
        zIndex: -9999, // 确保在最底层
      });
      this.addElement(this.backgroundElement);
    } else {
      this.backgroundElement.setSize(width, height);
      this.backgroundElement.setBgColor(this.backgroundColor);
      // 更新位置到中心
      this.backgroundElement.setPosition(width / 2, height / 2);
    }
  }

  /**
   * 渲染背景图层（使用 Paper.js）
   */
  async render(layer, time) {
    if (!this.isActiveAtTime(time)) return;

    // 渲染背景元素
    if (this.backgroundElement) {
      try {
        // 在渲染之前先初始化元素（如果还未初始化）
        if (typeof this.backgroundElement.isInitialized === 'function' && !this.backgroundElement.isInitialized()) {
          if (typeof this.backgroundElement.initialize === 'function') {
            const initResult = this.backgroundElement.initialize();
            if (initResult && typeof initResult.then === 'function') {
              await initResult;
            }
          }
        }
        
        const result = this.backgroundElement.render(layer, time);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } catch (error) {
        console.error(`渲染背景元素失败:`, error);
      }
    }

    // 渲染其他元素
    for (const element of this.elements) {
      if (element !== this.backgroundElement && element.visible) {
        try {
          // 在渲染之前先初始化元素（如果还未初始化）
          if (typeof element.isInitialized === 'function' && !element.isInitialized()) {
            if (typeof element.initialize === 'function') {
              const initResult = element.initialize();
              if (initResult && typeof initResult.then === 'function') {
                await initResult;
              }
            }
          }
          
          const result = element.render(layer, time);
          if (result && typeof result.then === 'function') {
            await result;
          }
        } catch (error) {
          console.error(`渲染元素失败 (${element.type || 'unknown'}, id: ${element.id}):`, error);
        }
      }
    }
  }

}



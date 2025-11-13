import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper-jsdom-canvas';

/**
 * 精灵元素（通用元素包装器，使用 Paper.js）
 */
export class SpriteElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.SPRITE;
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, this.config, config);
    this.spriteType = config.spriteType || 'Sprite'; // Sprite, Rect, Circle, Label 等
    this.spriteConfig = config.spriteConfig || {};
  }

  /**
   * 设置 Sprite 类型
   */
  setSpriteType(type) {
    this.spriteType = type;
  }

  /**
   * 设置 Sprite 配置
   */
  setSpriteConfig(config) {
    this.spriteConfig = { ...this.spriteConfig, ...config };
  }

  /**
   * 渲染 Sprite 元素（使用 Paper.js）
   * 注意：SpriteElement 在 Paper.js 中可能需要根据 spriteType 创建不同的元素
   */
  render(layer, time) {
    if (!this.visible) return null;

    const viewSize = paper.view.viewSize;
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);

    // 转换位置和尺寸单位
    let x = state.x;
    let y = state.y;
    let width = state.width;
    let height = state.height;

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

    // 根据 spriteType 创建对应的 Paper.js 元素
    let item;
    switch (this.spriteType) {
      case 'Rect':
        item = new paper.Path.Rectangle({
          rectangle: new paper.Rectangle(x - width * 0.5, y - height * 0.5, width, height),
        });
        break;
      case 'Circle':
        item = new paper.Path.Circle({
          center: new paper.Point(x, y),
          radius: Math.min(width, height) / 2,
        });
        break;
      default:
        // 默认创建矩形
        item = new paper.Path.Rectangle({
          rectangle: new paper.Rectangle(x - width * 0.5, y - height * 0.5, width, height),
        });
    }

    item.fillColor = this.spriteConfig.bgcolor || '#ffffff';
    item.opacity = state.opacity !== undefined ? state.opacity : 1;

    // 应用变换
    if (state.rotation) {
      item.rotate(state.rotation, new paper.Point(x, y));
    }
    if (state.scaleX !== 1 || state.scaleY !== 1) {
      item.scale(state.scaleX || 1, state.scaleY || 1, new paper.Point(x, y));
    }

    layer.addChild(item);
    return item;
  }
}


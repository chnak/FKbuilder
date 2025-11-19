import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper';

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
   * @param {paper.Layer} layer - Paper.js 图层
   * @param {number} time - 当前时间（秒）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  render(layer, time, paperInstance = null) {
    if (!this.visible) return null;

    // 获取 Paper.js 实例
    const { paper: p, project } = this.getPaperInstance(paperInstance);

    const viewSize = project && project.view && project.view.viewSize 
      ? project.view.viewSize 
      : { width: 1920, height: 1080 };
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);

    // 转换位置和尺寸单位
    // 使用 BaseElement 的通用方法转换尺寸
    let width = state.width;
    let height = state.height;
    const size = this.convertSize(width, height, context);
    width = size.width;
    height = size.height;
    
    // state.x 和 state.y 已经在 getStateAtTime 中转换了单位
    const x = state.x || 0;
    const y = state.y || 0;

    // 根据 spriteType 创建对应的 Paper.js 元素
    let item;
    switch (this.spriteType) {
      case 'Rect':
        item = new p.Path.Rectangle({
          rectangle: new p.Rectangle(x - width * 0.5, y - height * 0.5, width, height),
        });
        break;
      case 'Circle':
        item = new p.Path.Circle({
          center: new p.Point(x, y),
          radius: Math.min(width, height) / 2,
        });
        break;
      default:
        // 默认创建矩形
        item = new p.Path.Rectangle({
          rectangle: new p.Rectangle(x - width * 0.5, y - height * 0.5, width, height),
        });
    }

    item.fillColor = this.spriteConfig.bgcolor || '#ffffff';

    // 使用统一的变换方法应用动画
    this.applyTransform(item, state, {
      pivot: new p.Point(x, y), // 使用中心作为变换中心
      paperInstance: paperInstance,
    });

    layer.addChild(item);
    return item;
  }
}


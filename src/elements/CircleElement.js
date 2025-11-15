import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper-jsdom-canvas';

/**
 * 圆形元素
 */
export class CircleElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.CIRCLE;
    // 重新合并配置，确保传入的config优先级最高
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    this.config.bgcolor = this.config.bgcolor || '#ffffff';
    this.config.borderWidth = this.config.borderWidth || 0;
    this.config.borderColor = this.config.borderColor || '#000000';
    // 圆形使用 width 作为半径
    if (!this.config.radius) {
      this.config.radius = Math.min(this.config.width, this.config.height) / 2;
    }
  }

  /**
   * 设置半径
   */
  setRadius(radius) {
    this.config.radius = radius;
    this.config.width = radius * 2;
    this.config.height = radius * 2;
  }

  /**
   * 设置背景颜色
   */
  setBgColor(color) {
    this.config.bgcolor = color;
  }

  /**
   * 设置边框
   */
  setBorder(width, color) {
    this.config.borderWidth = width;
    this.config.borderColor = color;
  }

  /**
   * 渲染圆形元素（使用 Paper.js）
   */
  render(layer, time) {
    if (!this.visible) return null;

    const viewSize = paper.view.viewSize;
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);

    // 转换位置单位
    let x = state.x;
    let y = state.y;
    if (typeof x === 'string') {
      x = toPixels(x, context.width, 'x');
    }
    if (typeof y === 'string') {
      y = toPixels(y, context.height, 'y');
    }

    // 计算半径
    let radius = state.radius;
    if (typeof radius === 'string') {
      radius = toPixels(radius, context);
    } else if (!radius) {
      radius = Math.min(state.width, state.height) / 2;
    }

    // 创建圆形
    const circle = new paper.Path.Circle({
      center: new paper.Point(x, y),
      radius: radius,
    });

    circle.fillColor = state.bgcolor || '#ffffff';

    // 边框
    if (state.borderWidth > 0) {
      circle.strokeColor = state.borderColor || '#000000';
      circle.strokeWidth = state.borderWidth;
    }

    // 使用统一的变换方法应用动画
    this.applyTransform(circle, state, {
      pivot: new paper.Point(x, y), // 使用圆心作为变换中心
    });

    // 添加到 layer
    layer.addChild(circle);
    
    // 调用 onRender 回调，传递 Paper.js 项目引用
    this._callOnRender(time, circle);
    
    return circle;
  }

}


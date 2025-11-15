import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper-jsdom-canvas';

/**
 * 矩形元素
 */
export class RectElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.RECT;
    // 重新合并配置，确保传入的config优先级最高
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    this.config.bgcolor = this.config.bgcolor || '#ffffff';
    this.config.borderRadius = this.config.borderRadius || 0;
    this.config.borderWidth = this.config.borderWidth || 0;
    this.config.borderColor = this.config.borderColor || '#000000';
  }

  /**
   * 设置背景颜色
   */
  setBgColor(color) {
    this.config.bgcolor = color;
  }

  /**
   * 设置圆角
   */
  setBorderRadius(radius) {
    this.config.borderRadius = radius;
  }

  /**
   * 设置边框
   */
  setBorder(width, color) {
    this.config.borderWidth = width;
    this.config.borderColor = color;
  }

  /**
   * 渲染矩形元素（使用 Paper.js）
   */
  render(layer, time) {
    if (!this.visible) return null;
    
    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    // 优先使用元素的 canvasWidth/canvasHeight，如果没有则使用 paper.view.viewSize
    const viewSize = paper.view.viewSize;
    const context = { 
      width: this.canvasWidth || viewSize.width, 
      height: this.canvasHeight || viewSize.height 
    };
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

    // 处理 anchor
    const anchor = state.anchor || [0.5, 0.5];
    const rectX = x - width * anchor[0];
    const rectY = y - height * anchor[1];

    // 创建矩形
    let rect;
    if (state.borderRadius > 0) {
      // 圆角矩形 - Paper.js 需要手动创建圆角路径
      const r = Math.min(state.borderRadius, width / 2, height / 2);
      const path = new paper.Path();
      
      // 创建圆角矩形路径（顺时针）
      // 从左上角开始
      path.moveTo(new paper.Point(rectX + r, rectY));
      // 上边
      path.lineTo(new paper.Point(rectX + width - r, rectY));
      // 右上角圆弧
      path.arcTo(new paper.Point(rectX + width, rectY + r));
      // 右边
      path.lineTo(new paper.Point(rectX + width, rectY + height - r));
      // 右下角圆弧
      path.arcTo(new paper.Point(rectX + width - r, rectY + height));
      // 下边
      path.lineTo(new paper.Point(rectX + r, rectY + height));
      // 左下角圆弧
      path.arcTo(new paper.Point(rectX, rectY + height - r));
      // 左边
      path.lineTo(new paper.Point(rectX, rectY + r));
      // 左上角圆弧
      path.arcTo(new paper.Point(rectX + r, rectY));
      path.closePath();
      rect = path;
    } else {
      // 普通矩形
      rect = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(rectX, rectY, width, height),
      });
    }

    // 处理填充颜色（支持 fillColor 和 bgcolor）
    const fillColor = state.fillColor || state.bgcolor || '#ffffff';
    rect.fillColor = fillColor;

    // 边框（支持 strokeColor 和 borderColor）
    const strokeColor = state.strokeColor || state.borderColor;
    const strokeWidth = state.strokeWidth || state.borderWidth || 0;
    if (strokeWidth > 0 && strokeColor) {
      rect.strokeColor = strokeColor;
      rect.strokeWidth = strokeWidth;
    }

    // 使用统一的变换方法应用动画
    // 优化：对于没有动画的静态矩形，直接设置 opacity，避免不必要的变换计算
    if (this.animations.length === 0 && state.opacity === undefined) {
      // 没有动画，直接设置默认透明度
      rect.opacity = 1;
    } else {
      // 有动画或需要设置透明度，使用统一的变换方法
      this.applyTransform(rect, state, {
        pivot: new paper.Point(x, y), // 使用矩形中心作为变换中心
      });
    }

    // 添加到 layer
    layer.addChild(rect);
    
    // 调用 onRender 回调
    this._callOnRender(time);
    
    return rect;
  }

}


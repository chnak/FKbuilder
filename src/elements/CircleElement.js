import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper';

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

    // 使用 BaseElement 的通用方法转换位置
    // state.x 和 state.y 已经在 getStateAtTime 中转换了单位
    const { x, y } = this.convertPosition(state.x, state.y, context);

    // 计算半径
    let radius = state.radius;
    if (typeof radius === 'string') {
      // 半径可以基于宽度或高度，这里使用宽度作为基准
      radius = toPixels(radius, context, 'x');
    } else if (!radius) {
      // 如果没有指定半径，使用 width 和 height 的最小值的一半
      const { width = 0, height = 0 } = this.convertSize(state.width, state.height, context);
      radius = Math.min(width, height) / 2;
    }

    // 创建圆形
    const circle = new p.Path.Circle({
      center: new p.Point(x, y),
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
      pivot: new p.Point(x, y), // 使用圆心作为变换中心
      paperInstance: paperInstance,
    });

    // 添加到 layer
    layer.addChild(circle);
    
    // 调用 onRender 回调，传递 Paper.js 项目引用和 paperInstance
    this._callOnRender(time, circle, paperInstance);
    
    return circle;
  }

}


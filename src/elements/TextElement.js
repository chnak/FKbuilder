import { BaseElement, normalizeAnimationConfig } from './BaseElement.js';
import { DEFAULT_TEXT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import { getDefaultFontFamily, isFontRegistered } from '../utils/font-manager.js';
import { TextSplitter } from '../utils/text-splitter.js';
import { TransformAnimation } from '../animations/TransformAnimation.js';
import { createCanvas, Image } from 'canvas';
import paper from 'paper-jsdom-canvas';

/**
 * 文本元素
 */
export class TextElement extends BaseElement {
  constructor(config = {}) {
    // 在调用 super 之前保存原始动画配置（因为 BaseElement 构造函数会删除它）
    const originalAnimations = config.animations || [];
    
    super(config);
    this.type = ElementType.TEXT;
    // 重新合并配置，确保传入的config优先级最高
    this.config = deepMerge({}, DEFAULT_TEXT_CONFIG, config);
    
    // 保存原始动画配置
    this.originalAnimations = originalAnimations;
    
    // 文本分割相关配置
    this.split = this.config.split || null; // 'letter', 'word', 'line' 或 null
    this.splitDelay = this.config.splitDelay || 0.1; // 分割动画延迟（秒）
    this.splitDuration = this.config.splitDuration || 0.3; // 分割动画持续时间（秒）
    
    // 存储分割后的子元素
    this.segments = [];
    this.splitter = null;
    
    // 如果启用了分割，初始化分割器
    if (this.split) {
      this._initializeSplitter();
    }
  }
  


  /**
   * 初始化文本分割器
   */
  _initializeSplitter() {
    if (!this.config.text) {
      return;
    }
    
    // 获取字体大小（可能需要单位转换）
    // 暂时使用默认上下文，实际渲染时会重新计算
    const context = { width: 1920, height: 1080, baseFontSize: 16 };
    const fontSize = this.convertFontSize(this.config.fontSize, context, 24);
    
    const fontFamily = this.config.fontFamily || getDefaultFontFamily();
    
    // 创建分割器
    this.splitter = new TextSplitter(this.config.text, {
      fontSize,
      fontFamily,
      fontWeight: this.config.fontWeight || 'normal',
      fontStyle: this.config.fontStyle || 'normal',
      dynamicSpacing: true,
    });
    
    // 获取分割后的片段
    const segments = this.splitter.getTextSegments(this.split);
    
    // 计算文本总宽度和高度（用于对齐）
    const totalWidth = this.splitter.getTotalWidth();
    const totalHeight = this.splitter.getTotalHeight();
    
    // 获取父元素的 anchor 和 textAlign
    const anchor = this.config.anchor || [0.5, 0.5];
    const textAlign = this.config.textAlign || 'center';
    
    // 计算父元素的结束时间
    const parentStartTime = this.startTime || 0;
    const parentEndTime = this.endTime !== undefined ? this.endTime : (parentStartTime + (this.duration || 5));
    
    // 为每个片段创建子 TextElement
    this.segments = segments.map((segment, index) => {
      // 计算每个片段的起始时间（相对于父元素的开始时间）
      const segmentStartTime = parentStartTime + index * this.splitDelay;
      // 子元素应该持续显示到父元素结束，而不是只显示 splitDuration
      const segmentEndTime = parentEndTime;
      
      // 创建子元素配置
      // 注意：位置会在 render 时动态计算，因为需要场景尺寸来转换单位
      const segmentConfig = {
        ...this.config,
        text: segment.text,
        // 子元素的位置偏移（相对于父元素位置）
        // 注意：这些值必须在 ...this.config 之后设置，确保不被覆盖
        segmentOffsetX: segment.x,
        segmentOffsetY: segment.y,
        // 保存父元素的位置和对齐信息，用于动态计算
        parentX: this.config.x,
        parentY: this.config.y,
        parentAnchor: anchor,
        parentTextAlign: textAlign,
        totalTextWidth: totalWidth,
        totalTextHeight: totalHeight,
        // 子元素的尺寸
        width: segment.width,
        height: segment.height,
        // 子元素的时间范围
        startTime: segmentStartTime,
        endTime: segmentEndTime,
        duration: segmentEndTime - segmentStartTime,
        // 子元素不进行分割
        split: null,
        // 子元素的文本对齐方式改为 left（因为位置已经计算好了）
        textAlign: 'left',
        // 分割文本初始透明度为 0，动画开始时才设置为 1
        // 注意：不要在这里设置 opacity: 0，因为这会覆盖动画的初始状态
        // opacity 应该由动画来控制
        // 继承父元素的动画配置，但会应用到每个片段
        // 参考 FKVideo 的实现：不调整动画的 delay，而是调整计算动画时使用的时间
        // 这样每个片段的动画会相对于自己的延迟时间来计算，实现逐字动画效果
        // 使用统一的动画配置规范化函数（从 BaseElement 导入）
        animations: this.originalAnimations && Array.isArray(this.originalAnimations) 
          ? this.originalAnimations.map(anim => normalizeAnimationConfig(anim))
          : [],
      };
      
      // 创建子 TextElement
      const segmentElement = new TextElement(segmentConfig);
      segmentElement.parentElement = this; // 标记父元素
      segmentElement.segmentIndex = index; // 标记片段索引
      segmentElement.isSegment = true; // 标记这是分割后的片段
      
      // 调试信息：检查动画是否正确创建（已禁用）
      // if (index === 0 && segmentElement.animations.length > 0) {
      //   console.log(`[TextElement] Segment ${index} has ${segmentElement.animations.length} animations:`, 
      //     segmentElement.animations.map(a => ({ 
      //       type: a.type, 
      //       delay: a.config.delay, 
      //       duration: a.config.duration,
      //       from: a.from,
      //       to: a.to
      //     })));
      // }
      
      // 如果用户没有指定任何动画，为分割片段添加默认淡入动画
      const hasAnyAnimation = this.originalAnimations && Array.isArray(this.originalAnimations) && this.originalAnimations.length > 0;
      
      if (!hasAnyAnimation) {
        // 创建默认淡入动画实例
        const fadeAnimation = new TransformAnimation({
          from: { opacity: 0 },
          to: { opacity: 1 },
          duration: this.splitDuration || 0.3,
          startTime: 0,
          easing: 'easeOut',
        });
        segmentElement.addAnimation(fadeAnimation);
      }
      
      // 不预先应用动画的初始状态，让动画在开始时才应用
      // 这样分割文本的初始透明度就是 0，动画开始时才变为 1
      
      return segmentElement;
    });
  }

  /**
   * 设置文本内容
   */
  setText(text) {
    this.config.text = text;
  }

  /**
   * 设置字体大小
   */
  setFontSize(size) {
    this.config.fontSize = size;
  }

  /**
   * 设置字体
   */
  setFont(fontFamily, fontWeight = 'normal', fontStyle = 'normal') {
    this.config.fontFamily = fontFamily;
    this.config.fontWeight = fontWeight;
    this.config.fontStyle = fontStyle;
  }

  /**
   * 设置颜色
   */
  setColor(color) {
    this.config.color = color;
  }

  /**
   * 设置文本对齐
   */
  setTextAlign(align) {
    this.config.textAlign = align;
  }

  /**
   * 渲染文本元素（使用 Paper.js）
   * @param {paper.Layer} layer - Paper.js 图层
   * @param {number} time - 当前时间（秒）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  render(layer, time, paperInstance = null) {
    if (!this.visible) {
      return null;
    }

    // 如果没有传入 paperInstance，尝试使用全局 paper（向后兼容）
    const p = paperInstance ? paperInstance.paper : paper;
    const project = paperInstance ? paperInstance.project : (paper.project || null);

    // 如果启用了分割，渲染所有子片段
    if (this.split && this.segments.length > 0) {
      // 先检查父元素是否在活动时间范围内
      if (!this.isActiveAtTime(time)) {
        return null;
      }
      
      // 渲染所有子片段
      // 参考 FKVideo 的实现：对于分割文本，每个片段有自己的 segmentDelay
      // 动画的 delay 不需要调整，而是调整计算动画时使用的时间
      // 注意：时间调整在子片段的 render 方法中进行，这里直接传递原始时间
      for (const segment of this.segments) {
        if (segment && typeof segment.render === 'function') {
          // 直接传递原始时间和 paperInstance，子片段会在自己的 render 方法中调整时间
          segment.render(layer, time, paperInstance);
        }
      }
      return null; // 分割文本不返回单个元素
    }

    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    // 获取场景尺寸用于单位转换
    // 优先使用元素的 canvasWidth/canvasHeight，如果没有则使用 project.view.viewSize
    const viewSize = project && project.view && project.view.viewSize 
      ? project.view.viewSize 
      : { width: 1920, height: 1080 };
    const context = { 
      width: this.canvasWidth || viewSize.width, 
      height: this.canvasHeight || viewSize.height, 
      baseFontSize: 16 
    };
    
    // 对于分割片段，不需要调整时间
    // 退出动画的错开效果已经在 BaseElement.getStateAtTime 中通过调整 effectiveEndTime 实现
    // 进入动画的错开效果通过每个片段的 startTime 不同自然实现
    const state = this.getStateAtTime(time, context);

    // 转换字体大小单位（使用 BaseElement 的通用方法）
    const fontSize = this.convertFontSize(state.fontSize, context, 24);

    // 处理分割后的片段位置计算
    let x, y;
    let segmentBaseline = null; // 用于标记分割片段应该使用的 baseline
    if (this.isSegment && this.config.segmentOffsetX !== undefined) {
      // 这是分割后的片段，使用 BaseElement 的通用方法计算位置
      const segmentPos = this.calculateSegmentPosition(state, context, {
        parentX: this.config.parentX || 0,
        parentY: this.config.parentY || 0,
        parentAnchor: this.config.parentAnchor || [0.5, 0.5],
        parentTextAlign: this.config.parentTextAlign || 'center',
        totalTextWidth: this.config.totalTextWidth || 0,
        totalTextHeight: this.config.totalTextHeight || 0,
        segmentOffsetX: this.config.segmentOffsetX || 0,
        segmentOffsetY: this.config.segmentOffsetY || 0,
      });
      x = segmentPos.x;
      y = segmentPos.y;
      segmentBaseline = segmentPos.baseline;
    } else {
      // 普通元素，使用 BaseElement 的统一方法计算位置
      // calculatePosition 会处理单位转换和 anchor 对齐
      const position = this.calculatePosition(state, context, {
        anchor: state.anchor || [0.5, 0.5],
      });
      x = position.x;
      y = position.y;
    }

    // 构建字体字符串
    const fontStyle = state.fontStyle || 'normal';
    const fontWeight = state.fontWeight || 'normal';
    let fontFamily = state.fontFamily || getDefaultFontFamily();
    
    // 如果指定的字体未注册，使用默认字体
    if (!isFontRegistered(fontFamily)) {
      fontFamily = getDefaultFontFamily();
    }

    // 使用 Paper.js 的 PointText 渲染文本
    const pointText = new p.PointText(new p.Point(x, y));
    // 确保 text 属性正确传递（优先使用 state.text，如果没有则使用 this.config.text）
    const textContent = state.text !== undefined ? state.text : (this.config.text || '');
    pointText.content = textContent;
    pointText.fontSize = fontSize;
    pointText.fontFamily = fontFamily;
    pointText.fontWeight = fontWeight;
    pointText.fontStyle = fontStyle;
    
    // 设置文本对齐（需要在获取边界之前设置）
    const textAlign = state.textAlign || 'center';
    if (textAlign === 'center') {
      pointText.justification = 'center';
    } else if (textAlign === 'right') {
      pointText.justification = 'right';
    } else {
      pointText.justification = 'left';
    }

    // 处理 anchor（Paper.js 使用 justification 和 baseline）
    // 对于分割文本片段，使用 segmentBaseline（因为位置已经手动计算好了）
    // 对于普通文本，根据 anchor 设置 baseline
    if (segmentBaseline !== null) {
      pointText.baseline = segmentBaseline;
    } else {
      const anchor = state.anchor || [0.5, 0.5];
      if (anchor[1] === 0.5) {
        pointText.baseline = 'middle';
      } else if (anchor[1] === 1) {
        pointText.baseline = 'bottom';
      } else {
        pointText.baseline = 'top';
      }
    }
    
    // 应用渐变或普通颜色
    if (state.gradient && state.gradientColors && Array.isArray(state.gradientColors) && state.gradientColors.length >= 2) {
      // 先设置一个临时颜色来获取文本边界框
      pointText.fillColor = state.color || '#000000';
      
      // 获取文本边界框来确定渐变范围
      const bounds = pointText.bounds;
      
      // 创建渐变
      const gradient = new p.Gradient();
      const stops = state.gradientColors.map((color, index) => {
        const stop = new p.GradientStop();
        stop.color = new p.Color(color);
        stop.rampPoint = index / (state.gradientColors.length - 1);
        return stop;
      });
      gradient.stops = stops;
      
      // 根据渐变方向设置渐变起点和终点
      const gradientDirection = state.gradientDirection || 'horizontal';
      let startPoint, endPoint;
      
      if (gradientDirection === 'vertical') {
        startPoint = new p.Point(bounds.x, bounds.y);
        endPoint = new p.Point(bounds.x, bounds.y + bounds.height);
      } else if (gradientDirection === 'diagonal') {
        startPoint = new p.Point(bounds.x, bounds.y);
        endPoint = new p.Point(bounds.x + bounds.width, bounds.y + bounds.height);
      } else {
        // horizontal (default)
        startPoint = new p.Point(bounds.x, bounds.y);
        endPoint = new p.Point(bounds.x + bounds.width, bounds.y);
      }
      
      // 创建线性渐变颜色
      const gradientColor = new p.Color(gradient, startPoint, endPoint);
      pointText.fillColor = gradientColor;
    } else {
      // 使用普通颜色
      pointText.fillColor = state.color || '#000000';
    }

    // 使用统一的变换方法应用动画
    // 注意：TextElement 的位置已经在创建时通过 pointText.point 设置了，所以不需要再次应用位置
    this.applyTransform(pointText, state, {
      applyPosition: false, // 位置已经通过 pointText.point 设置了
      paperInstance: paperInstance,
    });

    // 应用描边样式（使用 Paper.js 原生属性）
    if (state.stroke && state.strokeWidth > 0) {
      pointText.strokeColor = state.strokeColor || '#000000';
      pointText.strokeWidth = state.strokeWidth || 2;
      
      // 虚线样式
      const strokeStyle = state.strokeStyle || 'solid';
      if (strokeStyle === 'dashed' || strokeStyle === 'dotted') {
        const dashArray = state.strokeDashArray || (strokeStyle === 'dotted' ? [2, 2] : [5, 5]);
        if (Array.isArray(dashArray) && dashArray.length >= 2) {
          pointText.dashArray = dashArray;
        }
        if (state.strokeDashOffset !== undefined) {
          pointText.dashOffset = state.strokeDashOffset;
        }
      }
      
      // 线帽样式
      if (state.strokeCap) {
        pointText.strokeCap = state.strokeCap;
      }
      
      // 连接样式
      if (state.strokeJoin) {
        pointText.strokeJoin = state.strokeJoin;
      }
      
      // 尖角限制
      if (state.strokeMiterLimit !== undefined) {
        pointText.miterLimit = state.strokeMiterLimit;
      }
    }

    // 应用文本发光效果（使用多层阴影模拟）
    if (state.textGlow) {
      const glowColor = state.textGlowColor || '#FFFFFF';
      const glowBlur = state.textGlowBlur || 20;
      const glowIntensity = state.textGlowIntensity || 1;
      
      // 创建发光效果：使用多层阴影叠加
      // Paper.js 的 shadowBlur 和 shadowColor 可以创建发光效果
      // 为了增强发光效果，我们可以使用较大的模糊半径和较小的偏移
      pointText.shadowColor = new p.Color(glowColor);
      pointText.shadowColor.alpha = Math.min(glowIntensity, 1);
      pointText.shadowBlur = glowBlur;
      pointText.shadowOffset = new p.Point(0, 0); // 发光效果通常不需要偏移
    }
    
    // 应用文本阴影效果（使用 Paper.js 原生属性）
    // 注意：如果同时设置了发光和阴影，阴影会覆盖发光，所以发光应该在阴影之前设置
    // 但为了更好的效果，我们优先使用阴影（如果设置了阴影）
    if (state.textShadow && !state.textGlow) {
      const shadowColor = state.textShadowColor || '#000000';
      const shadowBlur = state.textShadowBlur || 0;
      const shadowOffsetX = state.textShadowOffsetX || 2;
      const shadowOffsetY = state.textShadowOffsetY || 2;
      
      // 设置阴影颜色
      pointText.shadowColor = new p.Color(shadowColor);
      if (state.textShadowOpacity !== undefined) {
        pointText.shadowColor.alpha = state.textShadowOpacity;
      }
      
      // 设置阴影模糊
      pointText.shadowBlur = shadowBlur;
      
      // 设置阴影偏移
      pointText.shadowOffset = new p.Point(shadowOffsetX, shadowOffsetY);
    }

    // 添加到 layer
    layer.addChild(pointText);
    
    // 调用 onRender 回调（传递 paperItem 和 paperInstance）
    this._callOnRender(time, pointText, paperInstance);
    
    return pointText;
  }

  
  /**
   * 清理资源
   */
  destroy() {
    // 清理子片段
    if (this.segments && this.segments.length > 0) {
      for (const segment of this.segments) {
        if (segment && typeof segment.destroy === 'function') {
          segment.destroy();
        }
      }
      this.segments = [];
    }
    
    // 清理分割器
    if (this.splitter && typeof this.splitter.destroy === 'function') {
      this.splitter.destroy();
      this.splitter = null;
    }
    
    // 调用父类的清理方法
    if (super.destroy) {
      super.destroy();
    }
  }
}



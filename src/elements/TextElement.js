import { BaseElement } from './BaseElement.js';
import { DEFAULT_TEXT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toFontSizePixels, toPixels } from '../utils/unit-converter.js';
import { getDefaultFontFamily, isFontRegistered } from '../utils/font-manager.js';
import { TextSplitter } from '../utils/text-splitter.js';
import { FadeAnimation } from '../animations/FadeAnimation.js';
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
    let fontSize = this.config.fontSize || 24;
    if (typeof fontSize === 'string') {
      // 暂时使用默认上下文，实际渲染时会重新计算
      const context = { width: 1920, height: 1080, baseFontSize: 16 };
      fontSize = toFontSizePixels(fontSize, context);
    }
    
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
        opacity: 0,
        // 继承父元素的动画配置，但会应用到每个片段
        // 注意：动画的 startTime 是相对于子元素的 startTime 的，所以不需要调整
        // 使用 originalAnimations（原始配置数组），而不是动画实例
        animations: this.originalAnimations && Array.isArray(this.originalAnimations) ? this.originalAnimations.map(anim => {
          // 如果是动画实例，提取其配置；如果是配置对象，直接使用
          if (anim && typeof anim.getStateAtTime === 'function') {
            // 这是动画实例，需要提取配置
            // 从动画实例中提取配置信息（避免循环引用）
            const animConfig = {};
            if (anim.type) animConfig.type = anim.type;
            if (anim.duration !== undefined) animConfig.duration = anim.duration;
            if (anim.delay !== undefined) animConfig.delay = anim.delay;
            if (anim.startTime !== undefined) animConfig.startTime = anim.startTime;
            if (anim.easing) animConfig.easing = anim.easing;
            if (anim.property) animConfig.property = anim.property;
            if (anim.from !== undefined) animConfig.from = anim.from;
            if (anim.to !== undefined) animConfig.to = anim.to;
            return animConfig;
          } else {
            // 这是配置对象，直接深拷贝（只拷贝基本类型）
            const animConfig = {};
            for (const key in anim) {
              if (anim.hasOwnProperty(key) && typeof anim[key] !== 'object') {
                animConfig[key] = anim[key];
              } else if (anim.hasOwnProperty(key) && Array.isArray(anim[key])) {
                animConfig[key] = [...anim[key]];
              } else if (anim.hasOwnProperty(key) && anim[key] !== null && typeof anim[key] === 'object' && !anim[key].target) {
                // 只拷贝非循环引用的对象
                animConfig[key] = { ...anim[key] };
              }
            }
            return animConfig;
          }
        }) : [],
      };
      
      // 创建子 TextElement
      const segmentElement = new TextElement(segmentConfig);
      segmentElement.parentElement = this; // 标记父元素
      segmentElement.segmentIndex = index; // 标记片段索引
      segmentElement.isSegment = true; // 标记这是分割后的片段
      
      // 分割文本初始透明度为 0，动画开始时才设置为 1
      // 检查是否有淡入动画（fadeIn），如果没有则添加一个默认的淡入动画
      const hasFadeInAnimation = segmentElement.animations && segmentElement.animations.some(anim => {
        if (anim && typeof anim.getStateAtTime === 'function') {
          // 这是动画实例
          return anim.type === 'fade' || (anim.property === 'opacity' && anim.fromOpacity === 0);
        }
        return false;
      });
      
      // 如果没有淡入动画，添加一个默认的淡入动画（从 0 到 1）
      if (!hasFadeInAnimation) {
        const defaultFadeIn = new FadeAnimation({
          fromOpacity: 0,
          toOpacity: 1,
          duration: this.splitDuration || 0.3,
          startTime: 0,
          easing: 'easeOut',
        });
        segmentElement.addAnimation(defaultFadeIn);
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
   */
  render(layer, time) {
    if (!this.visible) {
      return null;
    }

    // 如果启用了分割，渲染所有子片段
    if (this.split && this.segments.length > 0) {
      // 渲染所有子片段
      for (const segment of this.segments) {
        if (segment && typeof segment.render === 'function') {
          segment.render(layer, time);
        }
      }
      return null; // 分割文本不返回单个元素
    }

    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    // 获取场景尺寸用于单位转换
    // 优先使用元素的 canvasWidth/canvasHeight，如果没有则使用 paper.view.viewSize
    const viewSize = paper.view.viewSize;
    const context = { 
      width: this.canvasWidth || viewSize.width, 
      height: this.canvasHeight || viewSize.height, 
      baseFontSize: 16 
    };
    const state = this.getStateAtTime(time, context);

    // 转换字体大小单位
    let fontSize = state.fontSize;
    if (typeof fontSize === 'string') {
      fontSize = toFontSizePixels(fontSize, context);
    }

    // 确保字体大小有效
    if (!fontSize || fontSize <= 0) {
      fontSize = 24; // 默认字体大小
    }

    // 转换位置单位
    let x = state.x;
    let y = state.y;
    if (typeof x === 'string') {
      x = toPixels(x, context.width, 'x');
    }
    if (typeof y === 'string') {
      y = toPixels(y, context.height, 'y');
    }

    // 处理分割后的片段位置计算
    if (this.isSegment && this.config.segmentOffsetX !== undefined) {
      // 这是分割后的片段，需要计算最终位置
      const parentX = this.config.parentX || 0;
      const parentY = this.config.parentY || 0;
      const anchor = this.config.parentAnchor || [0.5, 0.5];
      const textAlign = this.config.parentTextAlign || 'center';
      const totalWidth = this.config.totalTextWidth || 0;
      const totalHeight = this.config.totalTextHeight || 0;
      
      // 转换父元素位置单位
      const parentXPixels = typeof parentX === 'string' ? toPixels(parentX, context.width, 'x') : parentX;
      const parentYPixels = typeof parentY === 'string' ? toPixels(parentY, context.height, 'y') : parentY;
      
      // 计算文本基准位置（考虑 anchor 和 textAlign）
      let baseX = parentXPixels;
      let baseY = parentYPixels;
      
      // 根据 anchor 调整位置
      if (anchor[0] === 0.5) {
        // 水平居中
        if (textAlign === 'center') {
          baseX = baseX - totalWidth / 2;
        } else if (textAlign === 'right') {
          baseX = baseX - totalWidth;
        }
      } else if (anchor[0] === 1) {
        // 右对齐
        if (textAlign === 'center') {
          baseX = baseX - totalWidth / 2;
        } else if (textAlign === 'right') {
          baseX = baseX - totalWidth;
        }
      }
      
      if (anchor[1] === 0.5) {
        // 垂直居中
        baseY = baseY - totalHeight / 2;
      } else if (anchor[1] === 1) {
        // 底部对齐
        baseY = baseY - totalHeight;
      }
      
      // 最终位置 = 基准位置 + 片段偏移
      x = baseX + (this.config.segmentOffsetX || 0);
      y = baseY + (this.config.segmentOffsetY || 0);
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
    const pointText = new paper.PointText(new paper.Point(x, y));
    pointText.content = state.text || '';
    pointText.fontSize = fontSize;
    pointText.fontFamily = fontFamily;
    pointText.fontWeight = fontWeight;
    pointText.fontStyle = fontStyle;
    pointText.fillColor = state.color || '#000000';
    pointText.opacity = state.opacity !== undefined ? state.opacity : 1;

    // 设置文本对齐
    const textAlign = state.textAlign || 'center';
    if (textAlign === 'center') {
      pointText.justification = 'center';
    } else if (textAlign === 'right') {
      pointText.justification = 'right';
    } else {
      pointText.justification = 'left';
    }

    // 处理 anchor（Paper.js 使用 justification 和 baseline）
    const anchor = state.anchor || [0.5, 0.5];
    if (anchor[1] === 0.5) {
      pointText.baseline = 'middle';
    } else if (anchor[1] === 1) {
      pointText.baseline = 'bottom';
    } else {
      pointText.baseline = 'top';
    }

    // 应用变换
    if (state.rotation) {
      pointText.rotate(state.rotation);
    }
    if (state.scaleX !== 1 || state.scaleY !== 1) {
      pointText.scale(state.scaleX || 1, state.scaleY || 1);
    }

    // 如果启用了描边
    if (state.stroke && state.strokeWidth > 0) {
      pointText.strokeColor = state.strokeColor || '#000000';
      pointText.strokeWidth = state.strokeWidth || 2;
    }

    // 添加到 layer
    layer.addChild(pointText);
    
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


import { BaseElement } from './BaseElement.js';
import { DEFAULT_TEXT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toFontSizePixels, toPixels } from '../utils/unit-converter.js';
import { getDefaultFontFamily, isFontRegistered } from '../utils/font-manager.js';
import { TextSplitter } from '../utils/text-splitter.js';
import spritejs from 'spritejs';

const { Label } = spritejs;

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
      // 注意：位置会在 renderToCanvas 时动态计算，因为需要 Canvas 尺寸来转换单位
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
        // 继承父元素的动画配置，但会应用到每个片段
        // 注意：动画的 startTime 是相对于子元素的 startTime 的，所以不需要调整
        animations: this.originalAnimations && Array.isArray(this.originalAnimations) ? this.originalAnimations.map(anim => {
          // 深拷贝动画配置，确保每个片段都有独立的动画实例
          return JSON.parse(JSON.stringify(anim));
        }) : [],
      };
      
      // 创建子 TextElement
      const segmentElement = new TextElement(segmentConfig);
      segmentElement.parentElement = this; // 标记父元素
      segmentElement.segmentIndex = index; // 标记片段索引
      segmentElement.isSegment = true; // 标记这是分割后的片段
      
      // 在片段开始显示之前，预先应用动画的初始状态到 config
      // 这样可以避免在片段刚开始显示时出现闪烁
      if (segmentElement.animations && segmentElement.animations.length > 0) {
        for (const animation of segmentElement.animations) {
          if (animation.getInitialState) {
            const initialState = animation.getInitialState();
            // 将初始状态合并到 config 中，确保片段开始显示时就有正确的初始状态
            Object.assign(segmentElement.config, initialState);
          }
        }
      }
      
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
   * 渲染文本元素
   */
  render(scene, time) {
    if (!this.visible) return null;

    const state = this.getStateAtTime(time);

    const label = new Label({
      id: this.id,
      text: state.text,
      pos: [state.x, state.y],
      size: [state.width, state.height],
      font: `${state.fontStyle} ${state.fontWeight} ${state.fontSize}px ${state.fontFamily}`,
      color: state.color,
      textAlign: state.textAlign,
      textBaseline: state.textBaseline,
      opacity: state.opacity,
      anchor: state.anchor,
      rotate: state.rotation,
      scale: [state.scaleX, state.scaleY],
    });

    scene.appendChild(label);
    return label;
  }

  /**
   * 直接使用Canvas 2D API渲染文本
   */
  renderToCanvas(ctx, time) {
    // 如果启用了分割，渲染所有子片段
    if (this.split && this.segments.length > 0) {
      // 渲染所有子片段
      for (const segment of this.segments) {
        if (segment && typeof segment.renderToCanvas === 'function') {
          segment.renderToCanvas(ctx, time);
        }
      }
      return;
    }
    
    // 检查可见性和时间范围（父类方法会检查）
    if (!this.isActiveAtTime(time)) return;

    // 获取Canvas尺寸用于单位转换
    const canvas = ctx.canvas;
    const context = { width: canvas.width, height: canvas.height, baseFontSize: 16 };
    
    // 如果是分割后的片段，需要动态计算位置
    let finalX = this.config.x;
    let finalY = this.config.y;
    
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
        // left 时不需要调整
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
      finalX = baseX + (this.config.segmentOffsetX || 0);
      finalY = baseY + (this.config.segmentOffsetY || 0);
    } else {
      // 普通元素，转换单位
      if (typeof finalX === 'string') {
        finalX = toPixels(finalX, context.width, 'x');
      }
      if (typeof finalY === 'string') {
        finalY = toPixels(finalY, context.height, 'y');
      }
    }
    
    // 临时修改 config 中的 x, y 用于 getStateAtTime
    const originalX = this.config.x;
    const originalY = this.config.y;
    this.config.x = finalX;
    this.config.y = finalY;
    
    const state = this.getStateAtTime(time, context);
    
    // 恢复原始值
    this.config.x = originalX;
    this.config.y = originalY;
    
    // 转换字体大小单位（必须在getStateAtTime之后，因为fontSize可能还是字符串）
    let fontSize = state.fontSize;
    if (typeof fontSize === 'string') {
      fontSize = toFontSizePixels(fontSize, context);
    }
    
    // 确保字体大小有效
    if (!fontSize || fontSize <= 0) {
      fontSize = 24; // 默认字体大小
    }
    
    ctx.save();
    ctx.globalAlpha = state.opacity;
    
    // 设置字体（确保fontStyle和fontWeight有默认值）
    const fontStyle = state.fontStyle || 'normal';
    const fontWeight = state.fontWeight || 'normal';
    let fontFamily = state.fontFamily || getDefaultFontFamily();
    
    // 如果指定的字体未注册，使用默认字体
    if (!isFontRegistered(fontFamily)) {
      fontFamily = getDefaultFontFamily();
    }
    
    // 构建字体字符串
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = state.color || '#000000';
    ctx.textAlign = state.textAlign || 'center';
    ctx.textBaseline = state.textBaseline || 'middle';
    
    // 应用变换
    ctx.translate(state.x, state.y);
    ctx.rotate((state.rotation || 0) * Math.PI / 180);
    ctx.scale(state.scaleX || 1, state.scaleY || 1);
    
    // 绘制文本
    if (state.text) {
      // 如果启用了描边，先绘制描边
      if (state.stroke && state.strokeWidth > 0) {
        ctx.strokeStyle = state.strokeColor || '#000000';
        ctx.lineWidth = state.strokeWidth || 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeText(state.text, 0, 0);
      }
      // 绘制填充文本
      ctx.fillText(state.text, 0, 0);
    }
    
    ctx.restore();
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


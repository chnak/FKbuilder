import { BaseElement, normalizeAnimationConfig } from './BaseElement.js';
import { TextElement } from './TextElement.js';
import { ElementType } from '../types/enums.js';
import { parseSubtitles, calculateMixedTextCapacity } from '../utils/subtitle-utils.js';
import { getDefaultFontFamily } from '../utils/font-manager.js';
import paper from 'paper';

/**
 * 字幕元素
 * 根据时长自动分割文本，并创建多个 TextElement 进行渲染
 */
export class SubtitleElement extends BaseElement {
  constructor(config = {}) {
    // 在调用 super 之前保存原始动画配置
    const originalAnimations = config.animations || [];
    
    super(config);
    this.type = ElementType.TEXT; // 使用 TEXT 类型，因为最终渲染的是文本
    
    // 保存原始动画配置
    this.originalAnimations = originalAnimations;
    
    // 字幕相关配置
    this.text = config.text || '';
    this.fontSize = config.fontSize || 72;
    this.fontFamily = config.fontFamily || getDefaultFontFamily();
    this.textColor = config.color || config.textColor || '#ffffff';
    this.position = config.position || 'center';
    this.textAlign = config.textAlign || 'center';
    
    // 分割相关配置
    this.split = config.split || null; // 'letter', 'word', 'line' 或 null
    this.splitDelay = config.splitDelay || 0.1;
    this.splitDuration = config.splitDuration || 0.3;
    
    // 字幕分割相关
    this.maxLength = config.maxLength || 20; // 每段最大字符数
    
    // 文本效果相关配置（传递给子 TextElement）
    // 描边效果
    this.stroke = config.stroke;
    this.strokeColor = config.strokeColor;
    this.strokeWidth = config.strokeWidth;
    this.strokeStyle = config.strokeStyle;
    this.strokeDashArray = config.strokeDashArray;
    this.strokeDashOffset = config.strokeDashOffset;
    this.strokeCap = config.strokeCap;
    this.strokeJoin = config.strokeJoin;
    this.strokeMiterLimit = config.strokeMiterLimit;
    
    // 文本阴影效果
    this.textShadow = config.textShadow;
    this.textShadowColor = config.textShadowColor;
    this.textShadowOffsetX = config.textShadowOffsetX;
    this.textShadowOffsetY = config.textShadowOffsetY;
    this.textShadowBlur = config.textShadowBlur;
    this.textShadowOpacity = config.textShadowOpacity;
    this.textShadowStyle = config.textShadowStyle;
    this.textShadowSpread = config.textShadowSpread;
    
    // 文本渐变效果
    this.gradient = config.gradient;
    this.gradientColors = config.gradientColors;
    this.gradientDirection = config.gradientDirection;
    
    // 文本发光效果
    this.textGlow = config.textGlow;
    this.textGlowColor = config.textGlowColor;
    this.textGlowBlur = config.textGlowBlur;
    this.textGlowIntensity = config.textGlowIntensity;
    
    // 文本背景
    this.textBackground = config.textBackground;
    this.textBackgroundColor = config.textBackgroundColor;
    this.textBackgroundPadding = config.textBackgroundPadding;
    this.textBackgroundRadius = config.textBackgroundRadius;
    
    // 其他文本属性
    this.fontWeight = config.fontWeight;
    this.fontStyle = config.fontStyle;
    this.lineHeight = config.lineHeight;
    this.textBaseline = config.textBaseline;
    
    // 存储分割后的 TextElement 列表
    this.textElements = [];
    this.initialized = false;
  }
  
  /**
   * 初始化字幕元素
   * 根据时长分割文本并创建 TextElement
   */
  async initialize(context = {}) {
    if (this.initialized) {
      return;
    }
    
    const { width = 1920, height = 1080 } = context;
    
    // 使用 BaseElement 的通用方法转换字体大小
    const unitContext = { width, height, baseFontSize: 16 };
    const fontSize = this.convertFontSize(this.fontSize, unitContext, 24);
    
    const fontFamily = this.fontFamily || getDefaultFontFamily();
    
    // 计算文本容量
    const capacity = calculateMixedTextCapacity(width * 0.85, fontSize, this.text, fontFamily);
    
    // 解析字幕，按时长分割
    const subtitleSegments = parseSubtitles(this.text, this.duration, capacity.maxChars || this.maxLength);
    
    // 为每个段落创建 TextElement
    this.textElements = [];
    
    // 如果配置中有明确的 startTime（如 LRC 歌词），使用它；否则使用累计时间
    const hasExplicitStartTime = this.startTime !== undefined && this.startTime !== null;
    let currentStartTime = this.startTime || 0;
    
    for (const segment of subtitleSegments) {
      // 如果只有一个段落且有明确的 startTime（LRC 歌词），使用配置的 startTime
      // 否则使用累计时间
      const segmentStartTime = (hasExplicitStartTime && subtitleSegments.length === 1) 
        ? this.startTime 
        : currentStartTime;
      
      const textElement = new TextElement({
        text: segment.text,
        x: this.config.x || (this.position === 'center' ? '50%' : this.config.x),
        y: this.config.y || (this.position === 'center' ? '80%' : this.config.y),
        fontSize: fontSize,
        fontFamily: fontFamily,
        color: this.textColor,
        textAlign: this.textAlign,
        anchor: this.config.anchor || [0.5, 0.5],
        // 时间范围
        startTime: segmentStartTime,
        duration: segment.duration,
        endTime: segmentStartTime + segment.duration,
        // 分割配置
        split: this.split,
        splitDelay: this.splitDelay,
        splitDuration: this.splitDuration,
        // 动画配置（使用统一的动画配置规范化函数）
        animations: this.originalAnimations && Array.isArray(this.originalAnimations) 
          ? this.originalAnimations.map(anim => normalizeAnimationConfig(anim))
          : [],
        // 其他配置
        opacity: this.config.opacity !== undefined ? this.config.opacity : 1,
        rotation: this.config.rotation || 0,
        scaleX: this.config.scaleX || 1,
        scaleY: this.config.scaleY || 1,
        // 文本效果配置
        // 描边效果
        stroke: this.stroke,
        strokeColor: this.strokeColor,
        strokeWidth: this.strokeWidth,
        strokeStyle: this.strokeStyle,
        strokeDashArray: this.strokeDashArray,
        strokeDashOffset: this.strokeDashOffset,
        strokeCap: this.strokeCap,
        strokeJoin: this.strokeJoin,
        strokeMiterLimit: this.strokeMiterLimit,
        // 文本阴影效果
        textShadow: this.textShadow,
        textShadowColor: this.textShadowColor,
        textShadowOffsetX: this.textShadowOffsetX,
        textShadowOffsetY: this.textShadowOffsetY,
        textShadowBlur: this.textShadowBlur,
        textShadowOpacity: this.textShadowOpacity,
        textShadowStyle: this.textShadowStyle,
        textShadowSpread: this.textShadowSpread,
        // 文本渐变效果
        gradient: this.gradient,
        gradientColors: this.gradientColors,
        gradientDirection: this.gradientDirection,
        // 文本发光效果
        textGlow: this.textGlow,
        textGlowColor: this.textGlowColor,
        textGlowBlur: this.textGlowBlur,
        textGlowIntensity: this.textGlowIntensity,
        // 文本背景
        textBackground: this.textBackground,
        textBackgroundColor: this.textBackgroundColor,
        textBackgroundPadding: this.textBackgroundPadding,
        textBackgroundRadius: this.textBackgroundRadius,
        // 其他文本属性
        fontWeight: this.fontWeight,
        fontStyle: this.fontStyle,
        lineHeight: this.lineHeight,
        textBaseline: this.textBaseline,
      });
      
      this.textElements.push(textElement);
      currentStartTime += segment.duration;
    }
    
    this.initialized = true;
  }
  
  /**
   * 渲染字幕元素
   */
  /**
   * 渲染字幕元素（使用 Paper.js）
   * 注意：字幕元素需要异步初始化，所以在首次渲染时可能需要同步初始化
   * @param {paper.Layer} layer - Paper.js 图层
   * @param {number} time - 当前时间（秒）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  render(layer, time, paperInstance = null) {
    if (!this.visible) return null;

    // 获取 Paper.js 实例
    const { project } = this.getPaperInstance(paperInstance);

    // 如果未初始化，尝试同步初始化（使用视图尺寸）
    if (!this.initialized) {
      try {
        const viewSize = project && project.view && project.view.viewSize 
          ? project.view.viewSize 
          : { width: 1920, height: 1080 };
        const width = viewSize.width || 1920;
        const height = viewSize.height || 1080;
        // 同步初始化（如果可能）
        // 注意：这可能会阻塞，但对于字幕元素，初始化应该很快
        this.initialize({ width, height }).catch(err => {
          console.warn('SubtitleElement 初始化失败:', err);
        });
      } catch (error) {
        console.warn('SubtitleElement 同步初始化失败:', error);
      }
    }

    // 如果已初始化，渲染所有 TextElement
    if (this.initialized) {
      for (const textElement of this.textElements) {
        if (textElement && textElement.isActiveAtTime(time)) {
          if (typeof textElement.render === 'function') {
            // 传递 paperInstance 给 TextElement
            textElement.render(layer, time, paperInstance);
          }
        }
      }
    }
    
    return null; // 字幕元素不返回单个元素
  }
  
  /**
   * 获取所有 TextElement（用于添加到 Layer）
   */
  getTextElements() {
    return this.textElements;
  }
  
  /**
   * 清理资源
   */
  destroy() {
    if (this.textElements && this.textElements.length > 0) {
      for (const textElement of this.textElements) {
        if (textElement && typeof textElement.destroy === 'function') {
          textElement.destroy();
        }
      }
      this.textElements = [];
    }
    this.initialized = false;
    
    if (super.destroy) {
      super.destroy();
    }
  }
}


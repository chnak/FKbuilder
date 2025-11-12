import { BaseElement } from './BaseElement.js';
import { TextElement } from './TextElement.js';
import { ElementType } from '../types/enums.js';
import { parseSubtitles, calculateMixedTextCapacity } from '../utils/subtitle-utils.js';
import { toFontSizePixels } from '../utils/unit-converter.js';
import { getDefaultFontFamily } from '../utils/font-manager.js';

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
    
    // 获取字体大小（可能需要单位转换）
    let fontSize = this.fontSize;
    if (typeof fontSize === 'string') {
      const unitContext = { width, height, baseFontSize: 16 };
      fontSize = toFontSizePixels(fontSize, unitContext);
    }
    
    const fontFamily = this.fontFamily || getDefaultFontFamily();
    
    // 计算文本容量
    const capacity = calculateMixedTextCapacity(width * 0.85, fontSize, this.text, fontFamily);
    
    // 解析字幕，按时长分割
    const subtitleSegments = parseSubtitles(this.text, this.duration, capacity.maxChars || this.maxLength);
    
    // 为每个段落创建 TextElement
    this.textElements = [];
    let currentStartTime = this.startTime || 0;
    
    for (const segment of subtitleSegments) {
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
        startTime: currentStartTime,
        duration: segment.duration,
        endTime: currentStartTime + segment.duration,
        // 分割配置
        split: this.split,
        splitDelay: this.splitDelay,
        splitDuration: this.splitDuration,
        // 动画配置
        animations: this.originalAnimations && Array.isArray(this.originalAnimations) 
          ? this.originalAnimations.map(anim => JSON.parse(JSON.stringify(anim)))
          : [],
        // 其他配置
        opacity: this.config.opacity !== undefined ? this.config.opacity : 1,
        rotation: this.config.rotation || 0,
        scaleX: this.config.scaleX || 1,
        scaleY: this.config.scaleY || 1,
      });
      
      this.textElements.push(textElement);
      currentStartTime += segment.duration;
    }
    
    this.initialized = true;
  }
  
  /**
   * 渲染字幕元素
   */
  async renderToCanvas(ctx, time) {
    // 如果未初始化，先初始化
    if (!this.initialized) {
      const canvas = ctx.canvas;
      await this.initialize({ width: canvas.width, height: canvas.height });
    }
    
    // 渲染所有在当前时间激活的 TextElement
    for (const textElement of this.textElements) {
      if (textElement.isActiveAtTime(time)) {
        if (typeof textElement.renderToCanvas === 'function') {
          await textElement.renderToCanvas(ctx, time);
        }
      }
    }
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


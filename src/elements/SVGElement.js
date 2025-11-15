import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import fs from 'fs-extra';
import path from 'path';
import paper from 'paper-jsdom-canvas';

/**
 * SVG 元素 - 支持导入和渲染 SVG 文件
 */
export class SVGElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.SVG;
    // 重新合并配置
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    
    // SVG 文件路径或 SVG 字符串
    this.src = config.src || config.path || '';
    this.svgString = config.svgString || null;
    
    // 加载状态
    this.loaded = false;
    this.loading = false;
    this.svgItem = null;
    this.svgContent = null;
    this._loadedCallbackCalled = false; // 标记 loaded 回调是否已调用
    
    // 尺寸和位置
    this.width = config.width || 100;
    this.height = config.height || 100;
    
    // 缩放和适配
    this.fit = config.fit || 'contain'; // contain, cover, fill, scale-down, none
    this.preserveAspectRatio = config.preserveAspectRatio !== undefined ? config.preserveAspectRatio : true;
    
    // SVG 内部元素动画配置
    this.elementAnimations = new Map(); // selector -> animation config
    this.cachedElements = new Map(); // selector -> element reference
    
    // 回调函数
    this.onLoaded = config.loaded || null; // (svgItem) => void
    this.onRender = config.render || null; // (svgItem, time) => void
  }

  /**
   * 加载 SVG 文件或字符串
   */
  async load() {
    if (this.loaded || this.loading) {
      return;
    }

    this.loading = true;

    try {
      // 如果提供了 SVG 字符串，直接使用
      if (this.svgString) {
        this.svgContent = this.svgString;
      } else if (this.src) {
        // 从文件加载
        const svgPath = path.isAbsolute(this.src) ? this.src : path.resolve(this.src);
        if (await fs.pathExists(svgPath)) {
          this.svgContent = await fs.readFile(svgPath, 'utf-8');
        } else {
          throw new Error(`SVG 文件不存在: ${svgPath}`);
        }
      } else {
        throw new Error('SVG 元素需要提供 src 或 svgString');
      }

      this.loaded = true;
      this.loading = false;
    } catch (error) {
      this.loading = false;
      console.error('[SVGElement] 加载 SVG 失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized() {
    return this.loaded && this.svgContent !== null;
  }

  /**
   * 初始化 SVG（同步方式，在渲染时调用）
   */
  async initialize() {
    if (!this.loaded) {
      await this.load();
    }
  }

  /**
   * 渲染 SVG 元素（使用 Paper.js）
   */
  async render(layer, time) {
    if (!this.visible) return null;

    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    // 如果还没加载，尝试加载
    if (!this.loaded) {
      await this.initialize();
    }

    if (!this.svgContent) {
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
    let width = state.width || this.width;
    let height = state.height || this.height;

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

    try {
      // 使用缓存的 svgItem，避免每次重新导入
      let svgItem = this.svgItem;
      
      // 如果还没有导入 SVG，则导入
      if (!svgItem) {
        // 尝试导入 SVG
        if (typeof paper.project.importSVG === 'function') {
          // 方法1：直接导入 SVG 字符串
          svgItem = paper.project.importSVG(this.svgContent, {
            expandShapes: true,
          });
        } else {
          // 如果 importSVG 不可用，尝试其他方法
          console.warn('[SVGElement] paper.project.importSVG 不可用，尝试使用其他方法');
          return null;
        }

        if (!svgItem) {
          console.warn('[SVGElement] SVG 导入失败');
          return null;
        }

        // 保存引用
        this.svgItem = svgItem;
        
        // 如果是第一次渲染，调用 loaded 回调
        if (this.onLoaded && !this._loadedCallbackCalled) {
          try {
            this.onLoaded(svgItem, this);
            this._loadedCallbackCalled = true;
          } catch (e) {
            console.warn('[SVGElement] loaded 回调执行失败:', e);
          }
        }
        
        // 缓存 SVG 内部元素（如果已配置动画）
        if (this.elementAnimations.size > 0) {
          this._cacheElements(svgItem);
        }
      }

      // 获取 SVG 的原始尺寸（使用缓存的或重新计算）
      const bounds = svgItem.bounds;
      const svgWidth = bounds.width || width;
      const svgHeight = bounds.height || height;

      // 根据 fit 模式计算缩放
      let scaleX = 1;
      let scaleY = 1;

      if (this.fit === 'contain') {
        // 保持宽高比，完整显示
        const scale = Math.min(width / svgWidth, height / svgHeight);
        scaleX = scaleY = scale;
      } else if (this.fit === 'cover') {
        // 保持宽高比，填充整个区域
        const scale = Math.max(width / svgWidth, height / svgHeight);
        scaleX = scaleY = scale;
      } else if (this.fit === 'fill') {
        // 拉伸填充
        scaleX = width / svgWidth;
        scaleY = height / svgHeight;
      } else if (this.fit === 'scale-down') {
        // 如果 SVG 比容器大，则缩小；否则保持原尺寸
        const scale = Math.min(1, Math.min(width / svgWidth, height / svgHeight));
        scaleX = scaleY = scale;
      }
      // 'none' 模式保持原始尺寸

      // 应用缩放（只在第一次导入时应用，后续不再修改整体缩放）
      if (!this._svgInitialScaleApplied) {
        if (scaleX !== 1 || scaleY !== 1) {
          svgItem.scale(scaleX, scaleY);
        }
        this._svgInitialScaleApplied = true;
      }

      // 计算位置（考虑 anchor）
      const scaledWidth = svgWidth * scaleX;
      const scaledHeight = svgHeight * scaleY;
      const itemX = rectX + width * anchor[0] - scaledWidth * 0.5;
      const itemY = rectY + height * anchor[1] - scaledHeight * 0.5;

      svgItem.position = new paper.Point(itemX + scaledWidth / 2, itemY + scaledHeight / 2);

      // 应用变换（旋转、缩放等，位置已经设置了）
      this.applyTransform(svgItem, state, {
        applyPosition: false, // 位置已经设置了
      });

      // 添加到 layer（如果还没有添加）
      if (!svgItem.parent) {
        layer.addChild(svgItem);
      }

      // 应用内部元素的动画（每次渲染都要应用）
      this._applyElementAnimations(time);
      
      // 调用 render 回调
      if (this.onRender) {
        try {
          this.onRender(svgItem, time, this);
        } catch (e) {
          console.warn('[SVGElement] render 回调执行失败:', e);
        }
      }

      return svgItem;
    } catch (error) {
      console.error('[SVGElement] 渲染 SVG 失败:', error);
      return null;
    }
  }

  /**
   * 查找 SVG 内部的元素
   * @param {string} selector - 选择器，支持：
   *   - ID: "#elementId"
   *   - 类名: ".className"
   *   - 标签名: "path", "circle", "rect" 等
   *   - 属性选择器: "[data-name='value']"
   * @returns {paper.Item|null} 找到的元素，如果未找到返回 null
   */
  findElement(selector) {
    if (!this.svgItem) {
      return null;
    }
    
    // 检查缓存
    if (this.cachedElements.has(selector)) {
      return this.cachedElements.get(selector);
    }
    
    const element = this._findElementInItem(this.svgItem, selector);
    if (element) {
      this.cachedElements.set(selector, element);
    }
    return element;
  }

  /**
   * 查找 SVG 内部的多个元素
   * @param {string} selector - 选择器
   * @returns {paper.Item[]} 找到的元素数组
   */
  findElements(selector) {
    if (!this.svgItem) {
      return [];
    }
    
    const elements = [];
    this._findElementsInItem(this.svgItem, selector, elements);
    return elements;
  }

  /**
   * 为 SVG 内部元素添加动画配置
   * @param {string} selector - 元素选择器
   * @param {Object|Function} animationConfig - 动画配置对象或函数
   *   如果是对象，格式：{ x, y, rotation, scaleX, scaleY, opacity, fillColor, strokeColor, ... }
   *   如果是函数，格式：(time, element) => ({ x, y, ... })
   */
  animateElement(selector, animationConfig) {
    this.elementAnimations.set(selector, animationConfig);
    // 清除缓存，以便重新查找元素
    this.cachedElements.delete(selector);
  }

  /**
   * 移除元素的动画配置
   * @param {string} selector - 元素选择器
   */
  removeElementAnimation(selector) {
    this.elementAnimations.delete(selector);
    this.cachedElements.delete(selector);
  }

  /**
   * 清除所有元素动画配置
   */
  clearElementAnimations() {
    this.elementAnimations.clear();
    this.cachedElements.clear();
  }

  /**
   * 在 SVG 项目中递归查找元素
   * @private
   */
  _findElementInItem(item, selector) {
    if (!item) return null;
    
    // 检查当前元素是否匹配
    if (this._matchesSelector(item, selector)) {
      return item;
    }
    
    // 递归检查子元素
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        const found = this._findElementInItem(child, selector);
        if (found) return found;
      }
    }
    
    return null;
  }

  /**
   * 检查元素是否是某个父元素的后代
   * @private
   */
  _isDescendantOf(child, parent) {
    let current = child;
    while (current && current.parent) {
      if (current.parent === parent) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /**
   * 在 SVG 项目中递归查找所有匹配的元素
   * @private
   */
  _findElementsInItem(item, selector, results) {
    if (!item) return;
    
    // 检查当前元素是否匹配
    if (this._matchesSelector(item, selector)) {
      results.push(item);
    }
    
    // 递归检查子元素
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        this._findElementsInItem(child, selector, results);
      }
    }
  }

  /**
   * 检查元素是否匹配选择器
   * @private
   */
  _matchesSelector(item, selector) {
    if (!selector || !item) return false;
    
    // ID 选择器: #elementId
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return item.id === id || item.data?.id === id || item.name === id;
    }
    
    // 类名选择器: .className
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      const classAttr = item.data?.class || item.data?.className;
      if (typeof classAttr === 'string') {
        return classAttr.split(/\s+/).includes(className);
      }
      return false;
    }
    
    // 属性选择器: [data-name='value']
    const attrMatch = selector.match(/\[([^\]]+)\]/);
    if (attrMatch) {
      const attrStr = attrMatch[1];
      const [attrName, attrValue] = attrStr.split('=').map(s => s.trim().replace(/['"]/g, ''));
      const itemValue = item.data?.[attrName];
      return itemValue === attrValue || itemValue === attrValue;
    }
    
    // 标签名选择器: path, circle, rect 等
    // Paper.js 中，SVG 元素的类型可以通过 className 或 name 获取
    const itemType = item.className || item.name || '';
    return itemType.toLowerCase() === selector.toLowerCase();
  }

  /**
   * 缓存所有需要动画的元素
   * @private
   */
  _cacheElements(svgItem) {
    for (const selector of this.elementAnimations.keys()) {
      if (!this.cachedElements.has(selector)) {
        const element = this._findElementInItem(svgItem, selector);
        if (element) {
          this.cachedElements.set(selector, element);
        }
      }
    }
  }

  /**
   * 应用内部元素的动画
   * @private
   */
  _applyElementAnimations(time) {
    if (!this.svgItem || this.elementAnimations.size === 0) {
      return;
    }
    
    // 确保元素已缓存
    if (this.cachedElements.size < this.elementAnimations.size) {
      this._cacheElements(this.svgItem);
    }
    
    // 计算相对于元素开始时间的相对时间
    const relativeTime = time - (this.startTime || 0);
    const elementDuration = this.duration || 0;
    
    for (const [selector, animationConfig] of this.elementAnimations.entries()) {
      let element = this.cachedElements.get(selector);
      
      // 如果缓存中没有，尝试重新查找
      if (!element) {
        element = this._findElementInItem(this.svgItem, selector);
        if (element) {
          this.cachedElements.set(selector, element);
        } else {
          // 调试：输出未找到的元素
          if (this._debugMode) {
            console.warn(`[SVGElement] 未找到元素: ${selector}`);
          }
          continue;
        }
      }
      
      // 保存元素的原始状态（第一次）
      if (!element._originalPosition) {
        element._originalPosition = element.position ? element.position.clone() : new paper.Point(0, 0);
      }
      if (!element._originalScaling) {
        element._originalScaling = element.scaling ? element.scaling.clone() : new paper.Point(1, 1);
      }
      if (element._originalOpacity === undefined) {
        element._originalOpacity = element.opacity !== undefined ? element.opacity : 1;
      }
      
      let props;
      
      // 如果动画配置是函数，调用它获取属性
      if (typeof animationConfig === 'function') {
        try {
          // 传入相对时间、元素、SVGElement 实例、以及元素的开始时间和时长
          props = animationConfig(relativeTime, element, this, {
            absoluteTime: time,
            relativeTime: relativeTime,
            startTime: this.startTime || 0,
            duration: elementDuration,
            progress: elementDuration > 0 ? Math.max(0, Math.min(1, relativeTime / elementDuration)) : 0,
          });
        } catch (e) {
          console.warn(`[SVGElement] 动画函数执行失败 (${selector}):`, e);
          continue;
        }
      } else {
        // 如果是对象，直接使用
        props = animationConfig;
      }
      
      if (!props || typeof props !== 'object') {
        continue;
      }
      
      // 应用属性
      this._applyPropertiesToElement(element, props, time);
    }
  }

  /**
   * 将属性应用到元素
   * @private
   */
  _applyPropertiesToElement(element, props, time) {
    // 位置
    if (typeof props.x === 'number' || typeof props.y === 'number') {
      // 使用原始位置作为基准
      const originalPos = element._originalPosition || (element.position ? element.position.clone() : new paper.Point(0, 0));
      if (!element._originalPosition) {
        element._originalPosition = originalPos.clone();
      }
      
      const newX = typeof props.x === 'number' ? (originalPos.x + props.x) : originalPos.x;
      const newY = typeof props.y === 'number' ? (originalPos.y + props.y) : originalPos.y;
      element.position = new paper.Point(newX, newY);
    }
    
    // 旋转
    if (typeof props.rotation === 'number') {
      element.rotation = props.rotation;
    }
    
    // 缩放
    if (typeof props.scaleX === 'number' || typeof props.scaleY === 'number') {
      const originalScale = element._originalScaling || new paper.Point(1, 1);
      const newScaleX = typeof props.scaleX === 'number' ? props.scaleX : originalScale.x;
      const newScaleY = typeof props.scaleY === 'number' ? props.scaleY : originalScale.y;
      // 设置绝对缩放值
      element.scaling = new paper.Point(newScaleX, newScaleY);
    } else if (typeof props.scale === 'number') {
      // 统一缩放
      const originalScale = element._originalScaling || new paper.Point(1, 1);
      element.scaling = new paper.Point(originalScale.x * props.scale, originalScale.y * props.scale);
    }
    
    // 不透明度
    if (typeof props.opacity === 'number') {
      element.opacity = Math.max(0, Math.min(1, props.opacity));
    }
    
    // 填充颜色
    if (props.fillColor !== undefined) {
      if (props.fillColor === null) {
        element.fillColor = null;
      } else {
        element.fillColor = props.fillColor;
      }
    }
    
    // 描边颜色
    if (props.strokeColor !== undefined) {
      if (props.strokeColor === null) {
        element.strokeColor = null;
      } else {
        element.strokeColor = props.strokeColor;
      }
    }
    
    // 描边宽度
    if (typeof props.strokeWidth === 'number') {
      element.strokeWidth = props.strokeWidth;
    }
  }

  /**
   * 销毁元素
   */
  destroy() {
    if (this.svgItem) {
      this.svgItem.remove();
      this.svgItem = null;
    }
    this.svgContent = null;
    this.loaded = false;
    this.loading = false;
    this._loadedCallbackCalled = false;
    this.elementAnimations.clear();
    this.cachedElements.clear();
    this.onLoaded = null;
    this.onRender = null;
    super.destroy();
  }
}


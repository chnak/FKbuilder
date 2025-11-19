import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import { parseSVGAnimations, convertSVGAnimationToFunction } from '../utils/svg-animation-parser.js';
import fs from 'fs-extra';
import path from 'path';
import paper from 'paper';

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
    this._loadingPromise = null; // 加载 Promise，用于避免重复加载
    this.svgItem = null;
    this.svgContent = null;
    this._loadedCallbackCalled = false; // 标记 loaded 回调是否已调用
    this._svgInitialScaleApplied = false; // 标记 SVG 初始缩放是否已应用
    
    // 尺寸和位置
    this.width = config.width || 100;
    this.height = config.height || 100;
    
    // 缩放和适配
    this.fit = config.fit || 'contain'; // contain, cover, fill, scale-down, none
    this.preserveAspectRatio = config.preserveAspectRatio !== undefined ? config.preserveAspectRatio : true;
    
    // SVG 内部元素动画配置
    this.elementAnimations = new Map(); // selector -> animation config
    this.cachedElements = new Map(); // selector -> element reference
    
    // SVG 原生动画支持
    this.enableSVGAnimations = config.enableSVGAnimations !== undefined ? config.enableSVGAnimations : true;
    this.svgAnimations = []; // 解析出的 SVG 原生动画
    
    // 回调函数
    this.onLoaded = config.onLoaded || config.loaded || null; // (svgElement, time) => void
    this.onRender = config.onRender || config.render || null; // (svgElement, time) => void
  }

  /**
   * 加载 SVG 文件或字符串
   */
  async load() {
    if (this.loaded && this.svgContent) {
      return;
    }

    // 如果正在加载，返回现有的 Promise
    if (this.loading && this._loadingPromise) {
      return this._loadingPromise;
    }

    this.loading = true;
    
    // 创建加载 Promise
    this._loadingPromise = (async () => {
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

        // 如果启用了 SVG 原生动画支持，解析动画（但不立即应用，等待 onLoaded 回调）
        if (this.enableSVGAnimations && this.svgContent) {
          try {
            this.svgAnimations = parseSVGAnimations(this.svgContent);
            // 注意：动画将在 _callOnLoaded 中通过 animateElement 方法自动添加
          } catch (error) {
            console.warn('[SVGElement] 解析 SVG 动画失败:', error);
          }
        }

        this.loaded = true;
        this.loading = false;
        this._loadingPromise = null;
      } catch (error) {
        this.loading = false;
        this._loadingPromise = null;
        console.error('[SVGElement] 加载 SVG 失败:', error);
        throw error;
      }
    })();

    return this._loadingPromise;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized() {
    return this.loaded && this.svgContent !== null;
  }

  /**
   * 初始化 SVG（统一使用 initialize 方法）
   */
  async initialize() {
    // 如果已经加载，直接返回
    if (this.loaded && this.svgContent) {
      return;
    }
    
    // 如果正在加载，等待加载完成
    if (this.loading && this._loadingPromise) {
      await this._loadingPromise;
      return;
    }
    
    // 开始加载
    await this.load();
  }

  /**
   * 渲染 SVG 元素（使用 Paper.js）
   * @param {paper.Layer} layer - Paper.js 图层
   * @param {number} time - 当前时间（秒）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null;

    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    // 如果还没加载，尝试加载
    if (!this.loaded || !this.svgContent) {
      await this.initialize();
    }

    if (!this.svgContent) {
      console.warn(`[SVGElement] SVG 内容为空，无法渲染。loaded: ${this.loaded}, svgString: ${!!this.svgString}, src: ${this.src}`);
      return null;
    }

    // 获取 Paper.js 实例
    const { paper: p, project } = this.getPaperInstance(paperInstance);

    // 优先使用元素的 canvasWidth/canvasHeight，如果没有则使用 project.view.viewSize
    const viewSize = project && project.view && project.view.viewSize 
      ? project.view.viewSize 
      : { width: 1920, height: 1080 };
    const context = { 
      width: this.canvasWidth || viewSize.width, 
      height: this.canvasHeight || viewSize.height 
    };
    const state = this.getStateAtTime(time, context);

    // 转换位置和尺寸单位
    // 使用 BaseElement 的通用方法转换尺寸
    let width = state.width || this.width;
    let height = state.height || this.height;
    const size = this.convertSize(width, height, context);
    width = size.width;
    height = size.height;
    
    // state.x 和 state.y 已经在 getStateAtTime 中转换了单位
    const x = state.x || 0;
    const y = state.y || 0;

    // 使用 BaseElement 的通用方法计算位置（包括 anchor 对齐）
    const { x: rectX, y: rectY } = this.calculatePosition(state, context, {
      elementWidth: width,
      elementHeight: height,
    });

    try {
      // 检查 project 是否可用
      if (!project) {
        console.warn('[SVGElement] project 不可用');
        return null;
      }
      
      // 检查缓存的 svgItem 是否仍然有效（属于当前的 project）
      let svgItem = this.svgItem;
      const isItemValid = svgItem && svgItem.project === project && svgItem.parent;
      
      // 如果 svgItem 无效或不存在，需要重新导入
      if (!isItemValid) {
        // 如果 svgItem 存在但不属于当前 project，清除它
        if (svgItem && svgItem.project !== project) {
          this.svgItem = null;
          svgItem = null;
        }
        
        // 尝试导入 SVG
        if (typeof project.importSVG === 'function') {
          try {
            // 方法1：直接导入 SVG 字符串
            svgItem = project.importSVG(this.svgContent, {
              expandShapes: true,
            });
          } catch (importError) {
            console.error('[SVGElement] SVG 导入失败:', importError);
            console.error('[SVGElement] SVG 内容长度:', this.svgContent?.length);
            return null;
          }
        } else {
          // 如果 importSVG 不可用，尝试其他方法
          console.warn('[SVGElement] paper.project.importSVG 不可用，尝试使用其他方法');
          return null;
        }

        if (!svgItem) {
          console.warn('[SVGElement] SVG 导入失败，svgItem 为 null');
          return null;
        }

        // 保存引用
        this.svgItem = svgItem;
        
        // 如果是第一次渲染，调用 loaded 回调
        // 使用 _callOnLoaded 方法以确保正确传递 paperInstance
        this._callOnLoaded(time, svgItem, paperInstance);
        
        // 缓存 SVG 内部元素（如果已配置动画）
        if (this.elementAnimations.size > 0) {
          this._cacheElements(svgItem);
        }
        
        // 重置缩放标志，因为这是新的 item
        this._svgInitialScaleApplied = false;
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

      // 计算位置（rectX 和 rectY 已经考虑了 anchor 对齐）
      const scaledWidth = svgWidth * scaleX;
      const scaledHeight = svgHeight * scaleY;
      // rectX 和 rectY 已经是考虑了 anchor 的左上角位置，所以直接使用
      const itemX = rectX;
      const itemY = rectY;

      svgItem.position = new p.Point(itemX + scaledWidth / 2, itemY + scaledHeight / 2);

      // 应用变换（旋转、缩放等，位置已经设置了）
      this.applyTransform(svgItem, state, {
        applyPosition: false, // 位置已经设置了
        paperInstance: paperInstance,
      });

      // 添加到 layer（如果还没有添加）
      if (!svgItem.parent) {
        layer.addChild(svgItem);
      }

      // 应用内部元素的动画（每次渲染都要应用，传递 paperInstance）
      this._applyElementAnimations(time, paperInstance);
      
      // 调用 render 回调（使用 _callOnRender 方法以确保正确传递 paperInstance）
      this._callOnRender(time, svgItem, paperInstance);

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
   *   如果是函数，格式：(relativeTime, element, svgElement, info) => ({ x, y, ... })
   *   info 包含：{ absoluteTime, relativeTime, startTime, duration, progress }
   */
  animateElement(selector, animationConfig) {
    // 如果同一个选择器已有动画，合并它们
    if (this.elementAnimations.has(selector)) {
      const existingAnim = this.elementAnimations.get(selector);
      // 合并动画属性
      if (typeof animationConfig === 'function' && typeof existingAnim === 'function') {
        const mergedAnim = (relativeTime, element, svgElement, context) => {
          const props1 = existingAnim(relativeTime, element, svgElement, context);
          const props2 = animationConfig(relativeTime, element, svgElement, context);
          return { ...props1, ...props2 };
        };
        this.elementAnimations.set(selector, mergedAnim);
      } else if (typeof animationConfig === 'object' && typeof existingAnim === 'object') {
        this.elementAnimations.set(selector, { ...existingAnim, ...animationConfig });
      } else {
        // 如果类型不匹配，使用新的配置
        this.elementAnimations.set(selector, animationConfig);
      }
    } else {
      this.elementAnimations.set(selector, animationConfig);
    }
    // 清除缓存，以便重新查找元素
    this.cachedElements.delete(selector);
  }
  
  /**
   * 重写 _callOnLoaded 方法，在调用用户回调之前自动应用 SVG 原生动画
   * @param {number} time - 当前时间（秒）
   * @param {paper.Item} paperItem - Paper.js 项目（如果已创建）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  _callOnLoaded(time, paperItem = null, paperInstance = null) {
    // 如果启用了 SVG 原生动画支持，且已解析到动画，自动应用
    if (this.enableSVGAnimations && this.svgAnimations && this.svgAnimations.length > 0) {
      // 将 SVG 动画转换为 animateElement 调用
      for (const svgAnim of this.svgAnimations) {
        const animFunction = convertSVGAnimationToFunction(svgAnim);
        // 使用 animateElement 方法添加动画
        this.animateElement(svgAnim.selector, animFunction);
      }
    }
    
    // 调用父类的 _callOnLoaded 方法（会调用用户的 onLoaded 回调）
    super._callOnLoaded(time, paperItem, paperInstance);
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
   * @param {number} time - 当前时间
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  _applyElementAnimations(time, paperInstance = null) {
    // 获取 Paper.js 实例
    const { paper: p } = this.getPaperInstance(paperInstance);
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
      // 注意：只在第一次保存，之后不再更新，以确保位置基准稳定
      if (!element._originalPosition) {
        // 保存当前实际位置作为原始位置
        const currentPos = element.position ? element.position.clone() : new p.Point(0, 0);
        element._originalPosition = currentPos;
      }
      if (!element._originalScaling) {
        element._originalScaling = element.scaling ? element.scaling.clone() : new p.Point(1, 1);
      }
      if (element._originalOpacity === undefined) {
        element._originalOpacity = element.opacity !== undefined ? element.opacity : 1;
      }
      
      // 确保元素位置始终基于原始位置（防止被其他操作改变）
      // 如果当前没有应用 x/y 动画，保持原始位置
      // 注意：这个检查需要在获取 props 之前进行，所以先检查动画配置类型
      const hasPositionAnimation = typeof animationConfig === 'function' 
        ? false // 函数类型需要调用后才能知道，这里先假设没有
        : (typeof animationConfig === 'object' && (typeof animationConfig.x === 'number' || typeof animationConfig.y === 'number'));
      
      if (!hasPositionAnimation && element._originalPosition && element.position) {
        // 检查位置是否被意外改变（允许小的浮点误差）
        const currentPos = element.position;
        const origPos = element._originalPosition;
        const distance = Math.sqrt(
          Math.pow(currentPos.x - origPos.x, 2) + 
          Math.pow(currentPos.y - origPos.y, 2)
        );
        // 如果位置偏差超过 1 像素，可能是被意外改变了，需要恢复
        if (distance > 1) {
          element.position = element._originalPosition.clone();
        }
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
      
      // 应用属性（传递 paperInstance）
      this._applyPropertiesToElement(element, props, time, paperInstance);
      
      // 应用属性后，如果动画没有改变位置，确保位置保持原始值
      // 这样可以防止在设置 visible 或其他属性时位置被意外改变
      if (typeof props.x !== 'number' && typeof props.y !== 'number') {
        if (element._originalPosition && element.position) {
          // 检查位置是否被意外改变（允许小的浮点误差）
          const currentPos = element.position;
          const origPos = element._originalPosition;
          const distance = Math.sqrt(
            Math.pow(currentPos.x - origPos.x, 2) + 
            Math.pow(currentPos.y - origPos.y, 2)
          );
          // 如果位置偏差超过 1 像素，可能是被意外改变了，需要恢复
          if (distance > 1) {
            element.position = element._originalPosition.clone();
          }
        }
      }
    }
  }

  /**
   * 将属性应用到元素
   * @private
   * @param {paper.Item} element - Paper.js 元素
   * @param {Object} props - 属性对象
   * @param {number} time - 当前时间
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  _applyPropertiesToElement(element, props, time, paperInstance = null) {
    // 获取 Paper.js 实例
    const { paper: p } = this.getPaperInstance(paperInstance);
    
    // 位置
    if (typeof props.x === 'number' || typeof props.y === 'number') {
      // 使用原始位置作为基准
      const originalPos = element._originalPosition || (element.position ? element.position.clone() : new p.Point(0, 0));
      if (!element._originalPosition) {
        element._originalPosition = originalPos.clone();
      }
      
      const newX = typeof props.x === 'number' ? (originalPos.x + props.x) : originalPos.x;
      const newY = typeof props.y === 'number' ? (originalPos.y + props.y) : originalPos.y;
      element.position = new p.Point(newX, newY);
    }
    
    // 旋转
    if (typeof props.rotation === 'number') {
      element.rotation = props.rotation;
    }
    
    // 缩放
    if (typeof props.scaleX === 'number' || typeof props.scaleY === 'number') {
      const originalScale = element._originalScaling || new p.Point(1, 1);
      const newScaleX = typeof props.scaleX === 'number' ? props.scaleX : originalScale.x;
      const newScaleY = typeof props.scaleY === 'number' ? props.scaleY : originalScale.y;
      // 设置绝对缩放值
      element.scaling = new p.Point(newScaleX, newScaleY);
    } else if (typeof props.scale === 'number') {
      // 统一缩放
      const originalScale = element._originalScaling || new p.Point(1, 1);
      element.scaling = new p.Point(originalScale.x * props.scale, originalScale.y * props.scale);
    }
    
    // 不透明度
    if (typeof props.opacity === 'number') {
      const opacity = Math.max(0, Math.min(1, props.opacity));
      
      // 保存当前位置，防止在设置 visible 时位置被改变
      const savedPosition = element.position ? element.position.clone() : null;
      
      // 对于 Group 元素，设置 visible 和 opacity
      // 注意：在 Paper.js 中，Group 的 visible=false 会隐藏所有子元素
      // 但是我们需要确保子元素也被正确设置
      if (opacity === 0) {
        // 隐藏元素及其所有子元素
        element.visible = false;
        element.opacity = 0;
        // 递归设置所有子元素
        if (element.children && element.children.length > 0) {
          const hideChildren = (item) => {
            if (item.children && item.children.length > 0) {
              for (const child of item.children) {
                child.visible = false;
                child.opacity = 0;
                hideChildren(child);
              }
            }
          };
          hideChildren(element);
        }
      } else {
        // 显示元素
        element.visible = true;
        element.opacity = opacity;
        // 递归设置所有子元素
        if (element.children && element.children.length > 0) {
          const showChildren = (item) => {
            if (item.children && item.children.length > 0) {
              for (const child of item.children) {
                child.visible = true;
                child.opacity = opacity;
                showChildren(child);
              }
            }
          };
          showChildren(element);
        }
      }
      
      // 恢复位置，防止在设置 visible 时位置被改变
      if (savedPosition) {
        element.position = savedPosition;
      }
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
    this._loadingPromise = null;
    this._loadedCallbackCalled = false;
    this.elementAnimations.clear();
    this.cachedElements.clear();
    this.onLoaded = null;
    this.onRender = null;
    super.destroy();
  }
}


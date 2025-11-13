/**
 * 场景类 - 使用 CompositionElement 方式构建
 */
import { TextElement } from '../elements/TextElement.js';
import { ImageElement } from '../elements/ImageElement.js';
import { RectElement } from '../elements/RectElement.js';
import { CircleElement } from '../elements/CircleElement.js';

/**
 * 场景类 - 不再继承 VideoMaker，而是构建 CompositionElement 配置
 */
export class Scene {
  constructor(config = {}) {
    this.track = config.track;
    this.startTime = config.startTime; // 可选，如果不指定则自动计算
    this.duration = config.duration || 5;
    this.name = config.name || `Scene-${this.track?.scenes?.length || 0}`;
    this.width = config.width || config.track?.width || config.track?.builder?.config?.width || 1920;
    this.height = config.height || config.track?.height || config.track?.builder?.config?.height || 1080;
    this.fps = config.fps || config.track?.fps || config.track?.builder?.config?.fps || 30;
    
    this.elements = [];
    this.backgroundLayer = null;
  }

  /**
   * 添加背景
   * @param {Object} config - 背景配置 { color, image, ... }
   * @returns {Scene} 返回自身以支持链式调用
   */
  addBackground(config = {}) {
    // 如果已经有背景图层，更新它
    if (!this.backgroundLayer) {
      this.backgroundLayer = {
        type: 'background',
        config: {
          backgroundColor: config.color || config.backgroundColor || '#000000',
          ...config,
        },
      };
    } else {
      this.backgroundLayer.config = {
        ...this.backgroundLayer.config,
        ...config,
      };
    }
    
    return this;
  }

  /**
   * 添加文本元素
   * @param {Object} config - 文本配置
   * @returns {Scene} 返回自身以支持链式调用
   */
  addText(config = {}) {
    this.elements.push({
      type: 'text',
      element: new TextElement(config),
    });
    return this;
  }

  /**
   * 添加图片元素
   * @param {Object} config - 图片配置
   * @returns {Scene} 返回自身以支持链式调用
   */
  addImage(config = {}) {
    const imageElement = new ImageElement(config);
    // 如果提供了src，异步加载图片
    if (config.src) {
      imageElement.load().catch(err => {
        console.warn('图片加载失败:', config.src, err);
      });
    }
    this.elements.push({
      type: 'image',
      element: imageElement,
    });
    return this;
  }

  /**
   * 添加矩形元素
   * @param {Object} config - 矩形配置
   * @returns {Scene} 返回自身以支持链式调用
   */
  addRect(config = {}) {
    this.elements.push({
      type: 'rect',
      element: new RectElement(config),
    });
    return this;
  }

  /**
   * 添加圆形元素
   * @param {Object} config - 圆形配置
   * @returns {Scene} 返回自身以支持链式调用
   */
  addCircle(config = {}) {
    this.elements.push({
      type: 'circle',
      element: new CircleElement(config),
    });
    return this;
  }

  /**
   * 添加自定义元素
   * @param {BaseElement} element - 元素实例
   * @returns {Scene} 返回自身以支持链式调用
   */
  addElement(element) {
    this.elements.push({
      type: 'custom',
      element: element,
    });
    return this;
  }

  /**
   * 获取所有元素
   * @returns {Array}
   */
  getElements() {
    return this.elements.map(e => e.element);
  }

  /**
   * 构建场景（返回 CompositionElement 配置，包含所有元素）
   * @returns {Object} CompositionElement 配置对象
   */
  build() {
    const elementConfigs = [];
    
    // 添加背景（作为矩形元素）
    if (this.backgroundLayer) {
      elementConfigs.push({
        type: 'rect',
        x: '50%',
        y: '50%',
        width: this.width,
        height: this.height,
        bgcolor: this.backgroundLayer.config.backgroundColor,
        anchor: [0.5, 0.5],
        zIndex: -9999,
        startTime: 0,
        duration: this.duration,
      });
    }

    // 添加所有元素配置
    for (const { element } of this.elements) {
      // 将元素转换为配置对象
      const elementConfig = this.elementToConfig(element);
      if (elementConfig) {
        elementConfigs.push(elementConfig);
      }
    }

    // 返回场景的 CompositionElement 配置
    return {
      type: 'composition',
      x: '50%',
      y: '50%',
      width: this.width,
      height: this.height,
      anchor: [0.5, 0.5],
      startTime: 0, // 相对于轨道的开始时间，由 Track 设置
      duration: this.duration,
      zIndex: 0,
      elements: elementConfigs, // 所有元素作为子元素
    };
  }

  /**
   * 将元素实例转换为配置对象
   * @param {BaseElement} element - 元素实例
   * @returns {Object} 元素配置对象
   */
  elementToConfig(element) {
    if (!element) return null;
    
    // 元素的属性可能存储在 element.config 中，也可能直接作为 element 的属性
    // 优先从 element.config 读取，如果没有则从 element 本身读取
    const elementConfig = element.config || {};
    
    // 获取元素的所有属性
    const config = {
      type: element.type,
      x: element.x !== undefined ? element.x : elementConfig.x,
      y: element.y !== undefined ? element.y : elementConfig.y,
      width: element.width !== undefined ? element.width : elementConfig.width,
      height: element.height !== undefined ? element.height : elementConfig.height,
      startTime: element.startTime,
      duration: element.duration,
      zIndex: element.zIndex !== undefined ? element.zIndex : elementConfig.zIndex,
      opacity: element.opacity !== undefined ? element.opacity : elementConfig.opacity,
      anchor: element.anchor || elementConfig.anchor,
      animations: element.animations || elementConfig.animations,
    };

    // 根据元素类型添加特定属性
    if (element.type === 'text') {
      config.text = element.text !== undefined ? element.text : elementConfig.text;
      config.fontSize = element.fontSize !== undefined ? element.fontSize : elementConfig.fontSize;
      config.color = element.color !== undefined ? element.color : elementConfig.color;
      config.fontFamily = element.fontFamily !== undefined ? element.fontFamily : elementConfig.fontFamily;
      config.textAlign = element.textAlign !== undefined ? element.textAlign : elementConfig.textAlign;
      config.stroke = element.stroke !== undefined ? element.stroke : elementConfig.stroke;
      config.strokeColor = element.strokeColor !== undefined ? element.strokeColor : elementConfig.strokeColor;
      config.strokeWidth = element.strokeWidth !== undefined ? element.strokeWidth : elementConfig.strokeWidth;
      config.split = element.split !== undefined ? element.split : elementConfig.split;
      config.splitDelay = element.splitDelay !== undefined ? element.splitDelay : elementConfig.splitDelay;
      config.splitDuration = element.splitDuration !== undefined ? element.splitDuration : elementConfig.splitDuration;
    } else if (element.type === 'image') {
      config.src = element.src !== undefined ? element.src : elementConfig.src;
      config.fit = element.fit !== undefined ? element.fit : elementConfig.fit;
    } else if (element.type === 'rect') {
      config.fillColor = element.fillColor || element.bgcolor || elementConfig.fillColor || elementConfig.bgcolor;
      config.strokeColor = element.strokeColor || element.borderColor || elementConfig.strokeColor || elementConfig.borderColor;
      config.strokeWidth = element.strokeWidth || element.borderWidth || elementConfig.strokeWidth || elementConfig.borderWidth;
    } else if (element.type === 'circle') {
      config.radius = element.radius !== undefined ? element.radius : elementConfig.radius;
      config.fillColor = element.fillColor !== undefined ? element.fillColor : elementConfig.fillColor;
      config.strokeColor = element.strokeColor !== undefined ? element.strokeColor : elementConfig.strokeColor;
      config.strokeWidth = element.strokeWidth !== undefined ? element.strokeWidth : elementConfig.strokeWidth;
    }

    return config;
  }

  /**
   * 销毁场景
   */
  destroy() {
    for (const { element } of this.elements) {
      if (element.destroy) {
        element.destroy();
      }
    }
    this.elements = [];
    this.backgroundLayer = null;
  }
}


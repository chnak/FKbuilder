/**
 * 场景类 - 直接使用 Layer 方式构建
 */
import { TextElement } from '../elements/TextElement.js';
import { ImageElement } from '../elements/ImageElement.js';
import { RectElement } from '../elements/RectElement.js';
import { CircleElement } from '../elements/CircleElement.js';
import { AudioElement } from '../elements/AudioElement.js';
import { SubtitleElement } from '../elements/SubtitleElement.js';
import { OscilloscopeElement } from '../elements/OscilloscopeElement.js';
import { LRCSubtitleBuilder } from '../utils/lrcSubtitleBuilder.js';

/**
 * 场景类 - 直接返回元素实例数组，不使用 CompositionElement
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
   * 添加字幕元素
   * @param {Object} config - 字幕配置
   * @returns {Scene} 返回自身以支持链式调用
   */
  addSubtitle(config = {}) {
    this.elements.push({
      type: 'subtitle',
      element: new SubtitleElement(config),
    });
    return this;
  }

  /**
   * 从 LRC 文件添加歌词字幕
   * @param {string} lrcPath - LRC 文件路径
   * @param {Object} options - 字幕样式选项
   * @returns {Promise<Scene>} 返回自身以支持链式调用
   */
  async addLRC(lrcPath, options = {}) {
    await LRCSubtitleBuilder.addSubtitlesFromLRC(this, lrcPath, options);
    return this;
  }

  /**
   * 添加音频元素
   * @param {Object} config - 音频配置 { src, startTime, duration, volume, fadeIn, fadeOut, loop }
   * @returns {Scene} 返回自身以支持链式调用
   */
  addAudio(config = {}) {
    const audioElement = new AudioElement(config);
    // 异步加载音频信息
    audioElement.load().catch(err => {
      console.warn('音频加载失败:', config.src, err);
    });
    this.elements.push({
      type: 'audio',
      element: audioElement,
    });
    return this;
  }

  /**
   * 添加示波器元素
   * @param {Object} config - 示波器配置 { audioPath, waveColor, style, width, height, ... }
   * @returns {Promise<Scene>} 返回自身以支持链式调用
   */
  async addOscilloscope(config = {}) {
    const oscilloscopeElement = new OscilloscopeElement(config);
    // 异步加载音频数据
    await oscilloscopeElement.load().catch(err => {
      console.warn('示波器音频加载失败:', config.audioPath || config.src, err);
    });
    this.elements.push({
      type: 'oscilloscope',
      element: oscilloscopeElement,
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
   * 构建场景（返回元素实例数组，不使用 CompositionElement）
   * @param {number} sceneStartTime - 场景在轨道中的开始时间（绝对时间）
   * @returns {Array<BaseElement>} 元素实例数组
   */
  build(sceneStartTime = 0) {
    const elementInstances = [];
    
    // 添加背景（作为矩形元素）
    if (this.backgroundLayer) {
      const backgroundElement = new RectElement({
        x: 0,
        y: 0,
        width: this.width,
        height: this.height,
        anchor: [0, 0], // 从左上角开始，确保填充全屏
        bgcolor: this.backgroundLayer.config.backgroundColor,
        startTime: 0, // 相对于场景的开始时间
        duration: this.duration,
        zIndex: -9999,
      });
      elementInstances.push(backgroundElement);
    }

    // 添加所有元素实例
    for (const { element } of this.elements) {
      // 元素的时间是相对于场景的，需要确保正确设置
      if (element) {
        // 如果元素没有设置 startTime，默认为 0（相对于场景开始）
        if (element.startTime === undefined) {
          element.startTime = 0;
        }
        // 确保元素的 endTime 正确
        if (element.duration !== undefined && element.endTime === Infinity) {
          element.endTime = element.startTime + element.duration;
        }
        elementInstances.push(element);
      }
    }

    return elementInstances;
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
    } else if (element.type === 'subtitle') {
      config.text = element.text !== undefined ? element.text : elementConfig.text;
      config.fontSize = element.fontSize !== undefined ? element.fontSize : elementConfig.fontSize;
      config.color = element.color !== undefined ? element.color : (element.textColor !== undefined ? element.textColor : elementConfig.color);
      config.textColor = element.textColor !== undefined ? element.textColor : elementConfig.textColor;
      config.fontFamily = element.fontFamily !== undefined ? element.fontFamily : elementConfig.fontFamily;
      config.textAlign = element.textAlign !== undefined ? element.textAlign : elementConfig.textAlign;
      config.split = element.split !== undefined ? element.split : elementConfig.split;
      config.splitDelay = element.splitDelay !== undefined ? element.splitDelay : elementConfig.splitDelay;
      config.splitDuration = element.splitDuration !== undefined ? element.splitDuration : elementConfig.splitDuration;
      config.animations = element.animations !== undefined ? element.animations : elementConfig.animations;
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
    } else if (element.type === 'audio') {
      config.src = element.src !== undefined ? element.src : elementConfig.src;
      config.audioPath = element.audioPath !== undefined ? element.audioPath : elementConfig.audioPath;
      // 支持 cutFrom 和 cutTo（新方式）以及 audioStartTime 和 audioEndTime（旧方式）
      config.cutFrom = element.cutFrom !== undefined ? element.cutFrom : (element.audioStartTime !== undefined ? element.audioStartTime : elementConfig.cutFrom);
      config.cutTo = element.cutTo !== undefined ? element.cutTo : (element.audioEndTime !== undefined ? element.audioEndTime : elementConfig.cutTo);
      config.volume = element.volume !== undefined ? element.volume : elementConfig.volume;
      config.fadeIn = element.fadeIn !== undefined ? element.fadeIn : elementConfig.fadeIn;
      config.fadeOut = element.fadeOut !== undefined ? element.fadeOut : elementConfig.fadeOut;
      config.loop = element.loop !== undefined ? element.loop : elementConfig.loop;
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


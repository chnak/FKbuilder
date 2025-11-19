/**
 * 组件类 - 可复用的元素容器
 * 组件有自己的宽高和时间控制，可以包含多个元素
 * 组件内的元素使用相对坐标（相对于组件）
 * 组件可以添加到轨道或场景中进行复用
 */
import { TextElement } from '../elements/TextElement.js';
import { ImageElement } from '../elements/ImageElement.js';
import { VideoElement } from '../elements/VideoElement.js';
import { RectElement } from '../elements/RectElement.js';
import { CircleElement } from '../elements/CircleElement.js';
import { PathElement } from '../elements/PathElement.js';
import { SVGElement } from '../elements/SVGElement.js';
import { JSONElement } from '../elements/JSONElement.js';
import { AudioElement } from '../elements/AudioElement.js';
import { SubtitleElement } from '../elements/SubtitleElement.js';
import { OscilloscopeElement } from '../elements/OscilloscopeElement.js';
import { toPixels, toFontSizePixels } from '../utils/unit-converter.js';

/**
 * 组件类
 */
export class Component {
  constructor(config = {}) {
    this.id = config.id || `component-${Date.now()}`;
    this.name = config.name || `Component-${this.id}`;
    
    // 组件的尺寸（相对于父容器）
    this.width = config.width || 1920;
    this.height = config.height || 1080;
    
    // 组件的时间控制（相对于父容器）
    this.startTime = config.startTime !== undefined ? config.startTime : 0;
    this.duration = config.duration || 5;
    this.endTime = this.startTime + this.duration;
    
    // 组件的位置（相对于父容器，默认居中）
    this.x = config.x !== undefined ? config.x : '50%';
    this.y = config.y !== undefined ? config.y : '50%';
    this.anchor = config.anchor || [0.5, 0.5]; // 锚点，默认中心
    
    // 组件的其他属性
    this.zIndex = config.zIndex || 0;
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    this.visible = config.visible !== undefined ? config.visible : true;
    
    // 存储组件内的元素
    this.elements = [];
    this.backgroundLayer = null;
    
    // 父容器引用（Track 或 Scene）
    this.parent = null;
    this.parentType = null; // 'track' 或 'scene'
  }

  /**
   * 添加背景
   * @param {Object} config - 背景配置 { color, image, ... }
   * @returns {Component} 返回自身以支持链式调用
   */
  addBackground(config = {}) {
    const presetColors = [
      "#4ecdc4", "#45b7d1", "#f39c12", "#e74c3c", "#9b59b6",
      "#1abc9c", "#2ecc71", "#f1c40f", "#34495e", "#16a085",
    ];
    
    let backgroundColor = config.color || config.backgroundColor;
    if (!backgroundColor) {
      const randomIndex = Math.floor(Math.random() * presetColors.length);
      backgroundColor = presetColors[randomIndex];
    }
    
    if (!this.backgroundLayer) {
      this.backgroundLayer = {
        type: 'background',
        config: {
          backgroundColor: backgroundColor,
          ...config,
        },
      };
    } else {
      this.backgroundLayer.config = {
        ...this.backgroundLayer.config,
        backgroundColor: backgroundColor,
        ...config,
      };
    }
    
    return this;
  }

  /**
   * 添加文本元素（相对于组件）
   */
  addText(config = {}) {
    this.elements.push({
      type: 'text',
      element: new TextElement(config),
    });
    return this;
  }

  /**
   * 添加图片元素（相对于组件）
   */
  addImage(config = {}) {
    this.elements.push({
      type: 'image',
      element: new ImageElement(config),
    });
    return this;
  }

  /**
   * 添加视频元素（相对于组件）
   */
  addVideo(config = {}) {
    this.elements.push({
      type: 'video',
      element: new VideoElement(config),
    });
    return this;
  }

  /**
   * 添加矩形元素（相对于组件）
   */
  addRect(config = {}) {
    this.elements.push({
      type: 'rect',
      element: new RectElement(config),
    });
    return this;
  }

  /**
   * 添加圆形元素（相对于组件）
   */
  addCircle(config = {}) {
    this.elements.push({
      type: 'circle',
      element: new CircleElement(config),
    });
    return this;
  }

  /**
   * 添加路径元素（相对于组件）
   */
  addPath(config = {}) {
    this.elements.push({
      type: 'path',
      element: new PathElement(config),
    });
    return this;
  }

  /**
   * 添加 SVG 元素（相对于组件）
   */
  addSVG(config = {}) {
    this.elements.push({
      type: 'svg',
      element: new SVGElement(config),
    });
    return this;
  }

  /**
   * 添加 JSON 元素（相对于组件）
   */
  addJSON(config = {}) {
    this.elements.push({
      type: 'json',
      element: new JSONElement(config),
    });
    return this;
  }

  /**
   * 添加音频元素（相对于组件）
   */
  addAudio(config = {}) {
    this.elements.push({
      type: 'audio',
      element: new AudioElement(config),
    });
    return this;
  }

  /**
   * 添加字幕元素（相对于组件）
   */
  addSubtitle(config = {}) {
    this.elements.push({
      type: 'subtitle',
      element: new SubtitleElement(config),
    });
    return this;
  }

  /**
   * 添加示波器元素（相对于组件）
   */
  addOscilloscope(config = {}) {
    this.elements.push({
      type: 'oscilloscope',
      element: new OscilloscopeElement(config),
    });
    return this;
  }

  /**
   * 初始化组件（预加载需要异步加载的元素）
   * @returns {Promise<void>}
   */
  async initialize() {
    for (const { element } of this.elements) {
      if (element && typeof element.initialize === 'function') {
        try {
          const initResult = element.initialize();
          if (initResult && typeof initResult.then === 'function') {
            await initResult;
          }
        } catch (err) {
          console.warn(`[Component] 元素 ${element.type} 初始化失败:`, err);
        }
      }
    }
  }

  /**
   * 构建组件（将组件内的元素转换为绝对坐标的元素）
   * @param {number} parentStartTime - 父容器的开始时间（绝对时间）
   * @param {number} parentWidth - 父容器的宽度
   * @param {number} parentHeight - 父容器的高度
   * @returns {Array<BaseElement>} 转换后的元素实例数组
   */
  build(parentStartTime = 0, parentWidth = 1920, parentHeight = 1080) {
    const elementInstances = [];
    
    // 计算组件在父容器中的绝对位置
    const parentUnitContext = { width: parentWidth, height: parentHeight };
    const componentAbsoluteX = typeof this.x === 'string'
      ? toPixels(this.x, parentUnitContext, 'x')
      : (this.x || parentWidth / 2);
    const componentAbsoluteY = typeof this.y === 'string'
      ? toPixels(this.y, parentUnitContext, 'y')
      : (this.y || parentHeight / 2);
    
    // 转换组件的尺寸（支持百分比、vw、vh 等单位）
    const componentWidth = typeof this.width === 'string'
      ? toPixels(this.width, parentUnitContext, 'width')
      : (this.width || parentWidth);
    const componentHeight = typeof this.height === 'string'
      ? toPixels(this.height, parentUnitContext, 'height')
      : (this.height || parentHeight);
    
    // 计算锚点偏移（使用转换后的像素值）
    const anchorOffsetX = componentWidth * this.anchor[0];
    const anchorOffsetY = componentHeight * this.anchor[1];
    
    // 组件的左上角位置（绝对坐标）
    const componentLeft = componentAbsoluteX - anchorOffsetX;
    const componentTop = componentAbsoluteY - anchorOffsetY;
    
    // 计算组件的绝对开始时间
    const componentAbsoluteStartTime = parentStartTime + this.startTime;
    
    // 添加背景（作为矩形元素，相对于组件）
    if (this.backgroundLayer) {
      const backgroundElement = new RectElement({
        x: componentLeft + componentWidth / 2, // 组件中心 X（绝对坐标）
        y: componentTop + componentHeight / 2, // 组件中心 Y（绝对坐标）
        width: componentWidth,
        height: componentHeight,
        anchor: [0.5, 0.5],
        bgcolor: this.backgroundLayer.config.backgroundColor,
        startTime: componentAbsoluteStartTime,
        duration: this.duration,
        zIndex: this.zIndex - 9999,
        opacity: this.opacity,
      });
      elementInstances.push(backgroundElement);
    }

    // 转换所有元素
    for (const { element } of this.elements) {
      if (element) {
        // 创建元素的副本（避免修改原始元素）
        // 注意：元素的属性可能在 element.config 中，也可能直接在 element 上
        const elementConfig = { ...element.config };
        
        // 如果元素有直接属性（不在 config 中），也需要复制
        // 例如 visible 可能在 element.visible 而不是 element.config.visible
        if (element.visible !== undefined && elementConfig.visible === undefined) {
          elementConfig.visible = element.visible;
        }
        
        // 转换元素的位置（从相对坐标转换为绝对坐标）
        // 元素的位置是相对于组件的，需要转换为相对于父容器的绝对位置
        // 使用 toPixels 来处理各种单位（%, px, vw, vh, rpx 等）
        // 使用转换后的组件尺寸作为单位上下文
        const unitContext = { width: componentWidth, height: componentHeight };
        let elementRelativeX = 0;
        let elementRelativeY = 0;
        
        if (elementConfig.x !== undefined) {
          elementRelativeX = typeof elementConfig.x === 'string' 
            ? toPixels(elementConfig.x, unitContext, 'x')
            : (elementConfig.x || 0);
        }
        if (elementConfig.y !== undefined) {
          elementRelativeY = typeof elementConfig.y === 'string'
            ? toPixels(elementConfig.y, unitContext, 'y')
            : (elementConfig.y || 0);
        }
        
        // 转换元素的尺寸属性（使用组件的尺寸作为单位上下文）
        // width, height 等尺寸属性应该相对于组件的尺寸
        let elementWidth = elementConfig.width;
        let elementHeight = elementConfig.height;
        
        if (elementConfig.width !== undefined) {
          elementWidth = typeof elementConfig.width === 'string'
            ? toPixels(elementConfig.width, unitContext, 'width')
            : elementConfig.width;
          elementConfig.width = elementWidth;
        }
        if (elementConfig.height !== undefined) {
          elementHeight = typeof elementConfig.height === 'string'
            ? toPixels(elementConfig.height, unitContext, 'height')
            : elementConfig.height;
          elementConfig.height = elementHeight;
        }
        
        // 获取元素的 anchor（默认 [0.5, 0.5]），保持不变
        // 元素的位置（x, y）是 anchor 点的位置，不是左上角位置
        // render 方法中的 calculatePosition 会根据 anchor 和元素尺寸计算出左上角位置
        
        // 计算元素的绝对位置（组件左上角 + 元素 anchor 点相对位置）
        // elementRelativeX 和 elementRelativeY 是 anchor 点在组件中的位置
        elementConfig.x = componentLeft + elementRelativeX;
        elementConfig.y = componentTop + elementRelativeY;
        
        // 保持元素的 anchor 不变（默认 [0.5, 0.5]）
        // render 时会根据 anchor 和元素尺寸自动计算左上角位置
        
        // 转换字体大小（使用组件的尺寸作为单位上下文）
        if (elementConfig.fontSize !== undefined) {
          elementConfig.fontSize = typeof elementConfig.fontSize === 'string'
            ? toFontSizePixels(elementConfig.fontSize, unitContext)
            : elementConfig.fontSize;
        }
        
        // 转换圆形半径（使用组件的尺寸作为单位上下文）
        if (elementConfig.radius !== undefined) {
          elementConfig.radius = typeof elementConfig.radius === 'string'
            ? toPixels(elementConfig.radius, unitContext, 'width') // 半径通常基于宽度
            : elementConfig.radius;
        }
        
        // 转换描边宽度（使用组件的尺寸作为单位上下文）
        if (elementConfig.strokeWidth !== undefined) {
          elementConfig.strokeWidth = typeof elementConfig.strokeWidth === 'string'
            ? toPixels(elementConfig.strokeWidth, unitContext, 'width')
            : elementConfig.strokeWidth;
        }
        
        // 转换元素的时间（从相对时间转换为绝对时间）
        // 元素的时间是相对于组件的，需要转换为绝对时间
        const elementRelativeStartTime = element.startTime !== undefined ? element.startTime : 0;
        elementConfig.startTime = componentAbsoluteStartTime + elementRelativeStartTime;
        
        // 保持其他属性
        if (element.duration !== undefined) {
          elementConfig.duration = element.duration;
          // 如果元素有 duration，计算 endTime
          elementConfig.endTime = elementConfig.startTime + element.duration;
        } else if (element.endTime !== undefined && element.endTime !== Infinity) {
          // 如果元素有 endTime（相对于组件的），转换为绝对时间
          const elementRelativeEndTime = element.endTime;
          elementConfig.endTime = componentAbsoluteStartTime + (elementRelativeEndTime - elementRelativeStartTime);
        } else {
          // 如果元素没有 duration 和 endTime，使用组件的 duration
          elementConfig.duration = this.duration - elementRelativeStartTime;
          elementConfig.endTime = componentAbsoluteStartTime + this.duration;
        }
        
        // 合并 zIndex（组件的 zIndex + 元素的 zIndex）
        if (elementConfig.zIndex !== undefined) {
          elementConfig.zIndex = this.zIndex + elementConfig.zIndex;
        } else {
          elementConfig.zIndex = this.zIndex;
        }
        
        // 合并 opacity（组件的 opacity * 元素的 opacity）
        if (elementConfig.opacity !== undefined) {
          elementConfig.opacity = this.opacity * elementConfig.opacity;
        } else {
          elementConfig.opacity = this.opacity;
        }
        
        // 合并 visible（组件和元素都必须可见）
        if (element.visible !== undefined) {
          elementConfig.visible = this.visible && element.visible;
        } else {
          elementConfig.visible = this.visible;
        }
        
        // 复制其他属性
        for (const key in element.config) {
          if (!['x', 'y', 'startTime', 'endTime', 'zIndex', 'opacity', 'visible'].includes(key)) {
            if (elementConfig[key] === undefined) {
              elementConfig[key] = element.config[key];
            }
          }
        }
        
        // 如果元素有直接属性（不在 config 中），也需要复制
        if (element.visible !== undefined && elementConfig.visible === undefined) {
          elementConfig.visible = this.visible && element.visible;
        }
        
        // 复制动画
        if (element.animations && element.animations.length > 0) {
          elementConfig.animations = element.animations;
        }
        
        // 复制回调函数
        if (element.onFrame) {
          elementConfig.onFrame = element.onFrame;
        }
        if (element.onRender) {
          elementConfig.onRender = element.onRender;
        }
        if (element.onLoaded) {
          elementConfig.onLoaded = element.onLoaded;
        }
        
        // 创建新元素实例
        let newElement;
        switch (element.type) {
          case 'text':
            newElement = new TextElement(elementConfig);
            break;
          case 'image':
            newElement = new ImageElement(elementConfig);
            break;
          case 'video':
            newElement = new VideoElement(elementConfig);
            break;
          case 'rect':
            newElement = new RectElement(elementConfig);
            break;
          case 'circle':
            newElement = new CircleElement(elementConfig);
            break;
          case 'path':
            newElement = new PathElement(elementConfig);
            break;
          case 'svg':
            newElement = new SVGElement(elementConfig);
            break;
          case 'json':
            newElement = new JSONElement(elementConfig);
            break;
          case 'audio':
            newElement = new AudioElement(elementConfig);
            break;
          case 'subtitle':
            newElement = new SubtitleElement(elementConfig);
            break;
          case 'oscilloscope':
            newElement = new OscilloscopeElement(elementConfig);
            break;
          default:
            console.warn(`[Component] 未知的元素类型: ${element.type}`);
            continue;
        }
        
        elementInstances.push(newElement);
      }
    }

    return elementInstances;
  }


  /**
   * 销毁组件
   */
  destroy() {
    for (const { element } of this.elements) {
      if (element.destroy) {
        element.destroy();
      }
    }
    this.elements = [];
    this.backgroundLayer = null;
    this.parent = null;
  }
}


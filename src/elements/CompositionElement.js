import { BaseElement } from './BaseElement.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import { TextElement } from './TextElement.js';
import { ImageElement } from './ImageElement.js';
import { RectElement } from './RectElement.js';
import { CircleElement } from './CircleElement.js';
import { SubtitleElement } from './SubtitleElement.js';
import { ElementLayer } from '../layers/ElementLayer.js';
import paper from 'paper-jsdom-canvas';

/**
 * 组合元素 - 包含多个子元素的容器（类似 FKVideo 的 Composition）
 * 
 * 核心概念：
 * 1. Composition 是一个容器元素，包含一个 elements 数组（子元素配置）
 * 2. 子元素的时间是相对于 Composition 的 startTime 的（relativeTime = time - this.startTime）
 * 3. 在渲染时，创建一个临时 canvas，将所有子元素渲染到这个 canvas 上
 * 4. 然后将这个 canvas 作为 Raster 添加到父 layer，应用 Composition 的变换
 */
export class CompositionElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.COMPOSITION;
    
    // 子元素配置数组（类似 FKVideo 的 elements）
    this.elementsConfig = config.elements || [];
    
    // 解析后的子元素实例
    this.subElements = [];
    
    // Composition 的宽高（用于创建临时 canvas）
    this.compositionWidth = config.width || 1920;
    this.compositionHeight = config.height || 1080;
    
    // 是否已初始化
    this.isInitialized = false;
    
    // 临时 renderer（用于渲染子元素）
    this.tempRenderer = null;
  }

  /**
   * 初始化 Composition（解析子元素配置）
   */
  async initialize() {
    if (this.isInitialized) return;
    
    // 解析宽高（支持百分比）
    const parentContext = {
      width: this.compositionWidth,
      height: this.compositionHeight
    };
    
    if (typeof this.compositionWidth === 'string') {
      this.compositionWidth = toPixels(this.compositionWidth, 1920, 'x');
    }
    if (typeof this.compositionHeight === 'string') {
      this.compositionHeight = toPixels(this.compositionHeight, 1080, 'y');
    }
    
    // 创建临时 renderer（用于渲染子元素）
    const { Renderer } = await import('../core/Renderer.js');
    this.tempRenderer = new Renderer({
      width: this.compositionWidth,
      height: this.compositionHeight,
      fps: this.fps || 30,
    });
    await this.tempRenderer.init();
    
    // 解析子元素配置，创建子元素实例
    this.subElements = [];
    for (const elementConfig of this.elementsConfig) {
      // 为子元素设置正确的画布尺寸和 FPS（类似 FKVideo）
      // 注意：子元素的时间是相对于 Composition 的 startTime 的，所以不需要调整
      const element = await this.createElement({
        ...elementConfig,
        // 子元素使用 Composition 的宽高作为画布尺寸
        canvasWidth: this.compositionWidth,
        canvasHeight: this.compositionHeight,
        fps: this.fps || 30,
      });
      if (element) {
        // 确保子元素使用 Composition 的宽高作为画布尺寸
        // 注意：子元素在渲染时会使用 paper.view.viewSize，所以需要确保临时 renderer 的 canvas 尺寸正确
        element.canvasWidth = this.compositionWidth;
        element.canvasHeight = this.compositionHeight;
        element.fps = this.fps || 30;
        // 子元素的时间已经是相对于 Composition 的，不需要调整
        // 但需要确保 endTime 正确计算
        if (element.duration !== undefined && element.endTime === Infinity) {
          element.endTime = element.startTime + element.duration;
        }
        this.subElements.push(element);
      }
    }
    
    // 为每个子元素创建图层
    const elementLayer = new ElementLayer({ zIndex: 0 });
    for (const element of this.subElements) {
      elementLayer.addElement(element);
    }
    
    // 将图层添加到临时 renderer 的 timeline
    // 注意：这里我们需要一个临时的 VideoMaker 来管理 timeline
    // 或者直接使用 renderer 的 timeline
    // 实际上，我们需要一个临时的 VideoMaker 来管理子元素
    const { VideoMaker } = await import('../core/VideoMaker.js');
    this.tempComposition = new VideoMaker({
      width: this.compositionWidth,
      height: this.compositionHeight,
      fps: this.fps || 30,
      duration: this.duration || 10,
      backgroundColor: 'transparent',
    });
    
    // 移除自动创建的背景图层（因为我们使用透明背景）
    const backgroundLayer = this.tempComposition.timeline.getLayers().find(layer => 
      layer.type === 'background' || layer.constructor.name === 'BackgroundLayer'
    );
    if (backgroundLayer) {
      this.tempComposition.timeline.removeLayer(backgroundLayer);
    }
    
    // 将子元素添加到临时合成
    this.tempComposition.timeline.addLayer(elementLayer);
    
    this.isInitialized = true;
  }

  /**
   * 创建元素实例（根据配置类型）
   */
  async createElement(elementConfig) {
    const elementType = elementConfig.type;
    
    switch (elementType) {
      case 'text':
      case 'title':
        return new TextElement(elementConfig);
      case 'subtitle':
        return new SubtitleElement(elementConfig);
      case 'image':
        const imageElement = new ImageElement(elementConfig);
        if (elementConfig.src) {
          await imageElement.load().catch(err => {
            console.warn('图片加载失败:', elementConfig.src, err);
          });
        }
        return imageElement;
      case 'rect':
      case 'rectangle':
        return new RectElement(elementConfig);
      case 'circle':
        return new CircleElement(elementConfig);
      case 'composition':
        // 支持嵌套 Composition
        const { CompositionElement } = await import('./CompositionElement.js');
        // 确保嵌套 Composition 使用正确的画布尺寸
        return new CompositionElement({
          ...elementConfig,
          canvasWidth: this.compositionWidth,
          canvasHeight: this.compositionHeight,
          fps: this.fps || 30,
        });
      case 'audio':
        // 音频元素不需要渲染，但需要收集配置
        const { AudioElement } = await import('./AudioElement.js');
        const audioElement = new AudioElement(elementConfig);
        // 异步加载音频信息
        audioElement.load().catch(err => {
          console.warn('音频加载失败:', elementConfig.src || elementConfig.audioPath, err);
        });
        return audioElement;
      case 'oscilloscope':
        const { OscilloscopeElement } = await import('./OscilloscopeElement.js');
        const oscilloscopeElement = new OscilloscopeElement(elementConfig);
        // 异步加载音频数据
        oscilloscopeElement.load().catch(err => {
          console.warn('示波器音频加载失败:', elementConfig.audioPath || elementConfig.src, err);
        });
        return oscilloscopeElement;
      default:
        console.warn(`未知的元素类型: ${elementType}`);
        return null;
    }
  }

  /**
   * 渲染 Composition 元素
   */
  async render(layer, time) {
    if (!this.visible) return null;
    
    // 检查时间是否在 Composition 的范围内
    if (time < this.startTime || time > this.endTime) {
      return null;
    }
    
    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // 计算相对于 Composition 的时间
    const relativeTime = Math.max(0, time - this.startTime);
    
    // 限制相对时间不超过 Composition 的时长
    const maxRelativeTime = this.duration || Infinity;
    if (relativeTime > maxRelativeTime) {
      return null;
    }
    
    // 获取当前状态（位置、尺寸、变换等）
    const viewSize = paper.view.viewSize;
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);
    
    // 转换位置和尺寸单位
    let x = state.x;
    let y = state.y;
    let width = state.width || this.compositionWidth;
    let height = state.height || this.compositionHeight;
    
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
    
    // 渲染所有子元素到临时 canvas
    // 使用临时合成来渲染子元素
    if (!this.tempComposition.renderer) {
      this.tempComposition.renderer = this.tempRenderer;
    }
    
    
    const tempCanvas = await this.tempComposition.renderer.renderFrame(
      this.tempComposition.timeline.getLayers(),
      relativeTime,
      'transparent'
    );
    
    if (!tempCanvas) {
      console.warn(`[CompositionElement] tempCanvas 为空 (time: ${time}, relativeTime: ${relativeTime})`);
      return null;
    }
    
    // 检查 canvas 是否有内容（检查整个 canvas，不只是左上角）
    const ctx = tempCanvas.getContext('2d');
    const fullImageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let hasContent = false;
    let pixelCount = 0;
    let nonTransparentPixels = 0;
    for (let i = 0; i < fullImageData.data.length; i += 4) {
      const alpha = fullImageData.data[i + 3];
      if (alpha > 0) {
        nonTransparentPixels++;
        // 检查是否有非背景色的像素（背景是透明的，所以任何有颜色的像素都是内容）
        const r = fullImageData.data[i];
        const g = fullImageData.data[i + 1];
        const b = fullImageData.data[i + 2];
        if (r > 10 || g > 10 || b > 10) {
          hasContent = true;
          pixelCount++;
        }
      }
    }
    
    if (!hasContent) {
      return null; // 没有内容，不渲染
    }
    
    // 将临时 canvas 转换为 Raster
    try {
      // 在 Node.js 环境中，使用 dataURL 创建 Raster
      // 注意：在 Node.js 中，Raster 从 dataURL 加载通常是同步的或很快的
      const dataURL = tempCanvas.toDataURL('image/png');
      const raster = new paper.Raster(dataURL);
      
      // 在 Node.js 环境中，Raster 加载通常是同步的
      // 但为了确保兼容性，进行快速检查（不阻塞太久）
      if (!raster.loaded) {
        // 使用非常短的超时（50ms），因为 Node.js 中应该很快
        await new Promise((resolve) => {
          // 立即检查
          if (raster.loaded) {
            resolve();
            return;
          }
          
          let resolved = false;
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(); // 超时后继续，Raster 可能已经可以使用
            }
          }, 50);
          
          // 快速检查（每 1ms 检查一次，最多检查 50 次）
          let checkCount = 0;
          const maxChecks = 50;
          const checkInterval = setInterval(() => {
            checkCount++;
            if (raster.loaded || checkCount >= maxChecks) {
              if (!resolved) {
                resolved = true;
                clearInterval(checkInterval);
                clearTimeout(timeout);
                resolve();
              }
            }
          }, 1);
        });
      }
      
      // 处理 anchor
      const anchor = state.anchor || [0.5, 0.5];
      
      // 设置 Raster 的尺寸（使用临时 canvas 的实际尺寸）
      raster.size = new paper.Size(tempCanvas.width, tempCanvas.height);
      
      // Raster 的位置计算
      // 由于 anchor 是 [0.5, 0.5]，所以 raster 应该在 Composition 的中心
      // raster 的 position 是左上角，所以需要根据 anchor 调整
      const rasterOffsetX = -tempCanvas.width * anchor[0];
      const rasterOffsetY = -tempCanvas.height * anchor[1];
      
      // 设置 Raster 的位置（相对于原点）
      raster.position = new paper.Point(rasterOffsetX, rasterOffsetY);
      raster.opacity = 1;
      
      // 创建 Group 用于应用变换
      // 注意：先设置 Raster 的位置，再添加到 Group，最后设置 Group 的位置
      const group = new paper.Group();
      group.addChild(raster);
      
      // 设置 Group 的位置（这是 Composition 在父 canvas 中的位置）
      group.position = new paper.Point(x, y);
      group.opacity = state.opacity !== undefined ? state.opacity : 1;
      
      // 如果指定了 width 和 height，需要缩放 Raster
      if (width !== tempCanvas.width || height !== tempCanvas.height) {
        const scaleX = width / tempCanvas.width;
        const scaleY = height / tempCanvas.height;
        raster.scale(scaleX, scaleY);
      }
      
      
      // 应用变换（以 group 的位置 (x, y) 为中心）
      if (state.rotation) {
        group.rotate(state.rotation);
      }
      if (state.scaleX !== 1 || state.scaleY !== 1) {
        group.scale(state.scaleX || 1, state.scaleY || 1);
      }
      
      // 添加到 layer
      layer.addChild(group);
      return group;
    } catch (error) {
      console.warn('[CompositionElement] 创建 Raster 失败:', error);
      console.warn('错误堆栈:', error.stack);
      return null;
    }
  }

  /**
   * 销毁 Composition
   */
  destroy() {
    // 销毁所有子元素
    for (const element of this.subElements) {
      if (element.destroy) {
        element.destroy();
      }
    }
    this.subElements = [];
    
    // 销毁临时 renderer
    if (this.tempRenderer && this.tempRenderer.destroy) {
      this.tempRenderer.destroy();
    }
    this.tempRenderer = null;
    
    // 销毁临时合成
    if (this.tempComposition && this.tempComposition.destroy) {
      this.tempComposition.destroy();
    }
    this.tempComposition = null;
    
    super.destroy();
  }
}

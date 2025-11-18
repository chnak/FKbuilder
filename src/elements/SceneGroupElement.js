/**
 * 场景组元素 - 使用 paper.Group 包装场景，避免重新实例化 paper
 */
import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import paper from '../vendor/paper-node.js';

/**
 * 场景组元素类
 * 使用 paper.Group 包装场景元素，避免重新实例化 paper
 */
export class SceneGroupElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.SCENE_GROUP || 'sceneGroup';
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    
    // 子元素数组（元素实例）
    this.elements = config.elements || [];
    
    // 场景组的宽高
    this.groupWidth = config.width || 1920;
    this.groupHeight = config.height || 1080;
    
    // 是否已初始化
    this.isInitialized = false;
  }

  /**
   * 初始化场景组
   */
  async initialize() {
    if (this.isInitialized) return;
    
    // 设置子元素的 canvasWidth 和 canvasHeight
    for (const element of this.elements) {
      if (element) {
        element.canvasWidth = this.groupWidth;
        element.canvasHeight = this.groupHeight;
      }
    }
    
    this.isInitialized = true;
  }

  /**
   * 检查是否已初始化
   */
  checkInitialized() {
    return this.isInitialized;
  }

  /**
   * 渲染场景组元素（使用 Paper.js Group）
   */
  async render(layer, time) {
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 创建 paper.Group 来包装所有子元素
    const group = new paper.Group();
    
    // 获取当前状态
    const viewSize = paper.view.viewSize;
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);
    
    // 设置 Group 的位置（相对于场景组的中心）
    const x = typeof state.x === 'string' ? 
      parseFloat(state.x) / 100 * context.width : 
      (state.x !== undefined ? state.x : context.width / 2);
    const y = typeof state.y === 'string' ? 
      parseFloat(state.y) / 100 * context.height : 
      (state.y !== undefined ? state.y : context.height / 2);
    
    group.position = new paper.Point(x, y);
    
    // 渲染所有子元素到 Group 中
    // 注意：元素的时间是绝对时间（相对于视频开始），所以直接使用 time
    for (const element of this.elements) {
      if (!element || element.type === 'audio') {
        continue; // 跳过音频元素
      }
      
      // 检查元素是否在指定时间激活（使用绝对时间）
      if (element.isActiveAtTime && !element.isActiveAtTime(time)) {
        continue;
      }
      
      try {
        // 确保元素已初始化
        let needsInit = false;
        if (typeof element.checkInitialized === 'function' && !element.checkInitialized()) {
          needsInit = true;
        } else if (typeof element.isInitialized === 'function' && !element.isInitialized()) {
          needsInit = true;
        }
        
        if (needsInit && typeof element.initialize === 'function') {
          const initResult = element.initialize();
          if (initResult && typeof initResult.then === 'function') {
            await initResult;
          }
        }
        
        // 渲染元素到 Group 中
        // 元素的时间是绝对时间（相对于视频开始），所以直接使用 time
        if (typeof element.render === 'function') {
          const result = element.render(group, time);
          if (result && typeof result.then === 'function') {
            await result;
          }
        }
      } catch (error) {
        console.error(`[SceneGroupElement] 渲染子元素失败 (${element.type || 'unknown'}):`, error);
      }
    }
    
    // 应用变换（缩放、旋转等）
    this.applyTransform(group, state, {
      applyPosition: false, // 位置已经通过 group.position 设置了
    });
    
    // 添加到 layer
    layer.addChild(group);
    
    return group;
  }

  /**
   * 销毁场景组
   */
  destroy() {
    // 销毁所有子元素
    for (const element of this.elements) {
      if (element && typeof element.destroy === 'function') {
        element.destroy();
      }
    }
    this.elements = [];
    this.isInitialized = false;
  }
}


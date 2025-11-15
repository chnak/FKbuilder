/**
 * 轨道类 - 直接使用 Layer 方式构建
 */
import { Scene } from './Scene.js';
import { Transition } from './Transition.js';

/**
 * 轨道类 - 直接创建 Layer 并添加元素，不使用 CompositionElement
 */
export class Track {
  constructor(config = {}) {
    this.builder = config.builder;
    this.zIndex = config.zIndex || 0;
    this.name = config.name || `Track-${this.zIndex}`;
    this.width = config.width || config.builder?.config?.width || 1920;
    this.height = config.height || config.builder?.config?.height || 1080;
    this.fps = config.fps || config.builder?.config?.fps || 30;
    this.scenes = [];
    this.transitions = []; // 场景之间的转场效果
  }

  /**
   * 创建场景
   * @param {Object} config - 场景配置 { duration, startTime, name }
   * @returns {Scene} 场景实例
   */
  createScene(config = {}) {
    const scene = new Scene({
      ...config,
      track: this,
      duration: config.duration || 5,
    });
    
    this.scenes.push(scene);
    return scene;
  }

  /**
   * 添加转场效果
   * @param {Object} config - 转场配置 { fromScene, toScene, type, duration }
   * @returns {Track} 返回自身以支持链式调用
   */
  addTransition(config = {}) {
    const transition = new Transition({
      ...config,
      track: this,
    });
    
    this.transitions.push(transition);
    return this;
  }

  /**
   * 获取所有场景
   * @returns {Array<Scene>}
   */
  getScenes() {
    return this.scenes;
  }

  /**
   * 计算轨道总时长
   * 总时长 = 最后一个场景的结束时间 = max(scene.startTime + scene.duration)
   * 注意：转场时长不应该单独加，因为转场是重叠在场景之间的
   * @returns {number} 总时长（秒）
   */
  getTotalDuration() {
    if (this.scenes.length === 0) return 0;
    
    // 计算所有场景的结束时间，取最大值
    // 场景的结束时间 = startTime + duration
    let maxEndTime = 0;
    for (const scene of this.scenes) {
      const sceneStartTime = scene.startTime !== undefined ? scene.startTime : 0;
      const sceneEndTime = sceneStartTime + scene.duration;
      if (sceneEndTime > maxEndTime) {
        maxEndTime = sceneEndTime;
      }
    }
    
    return maxEndTime;
  }

  /**
   * 初始化轨道（预加载需要异步加载的元素）
   * @returns {Promise<void>}
   */
  async initialize() {
    // 初始化所有场景
    for (const scene of this.scenes) {
      if (scene.initialize) {
        await scene.initialize();
      }
    }
  }

  /**
   * 构建轨道（直接创建 Layer 并添加元素到 VideoMaker）
   * @param {VideoMaker} videoMaker - VideoMaker 实例
   * @returns {ElementLayer} 创建的 Layer
   */
  build(videoMaker) {
    const totalDuration = this.getTotalDuration();
    
    // 为轨道创建 Layer
    const layer = videoMaker.createElementLayer({
      zIndex: this.zIndex,
      startTime: 0,
      endTime: totalDuration,
    });
    
    // 构建所有场景，获取它们的元素
    // 按 startTime 排序场景，确保场景按时间顺序处理
    const sortedScenes = [...this.scenes].sort((a, b) => {
      const aStartTime = a.startTime !== undefined ? a.startTime : 0;
      const bStartTime = b.startTime !== undefined ? b.startTime : 0;
      return aStartTime - bStartTime;
    });
    
    let currentTime = 0;
    
    for (let i = 0; i < sortedScenes.length; i++) {
      const scene = sortedScenes[i];
      const sceneStartTime = scene.startTime !== undefined ? scene.startTime : currentTime;
      
      // 构建场景，返回元素实例数组
      const sceneElements = scene.build(sceneStartTime);
      
      // 将所有元素添加到 Layer 或 VideoMaker（音频元素特殊处理）
      for (const element of sceneElements) {
        // 设置元素的绝对时间（相对于视频开始）
        const relativeStartTime = element.startTime || 0;
        const absoluteStartTime = sceneStartTime + relativeStartTime;
        
        // 如果是分割文本，需要在更新父元素的 startTime 之前保存相对开始时间
        const parentRelativeStartTime = relativeStartTime;
        
        element.startTime = absoluteStartTime;
        
        // 更新元素的 endTime（基于绝对时间）
        if (element.duration !== undefined) {
          element.endTime = absoluteStartTime + element.duration;
        } else if (element.endTime !== Infinity) {
          // 如果 endTime 不是 Infinity，也需要转换为绝对时间
          element.endTime = sceneStartTime + (element.endTime - relativeStartTime);
        }
        
        // 音频元素需要添加到 VideoMaker 的 audioElements 数组，而不是 Layer
        if (element.type === 'audio') {
          // 更新音频元素的开始时间
          if (element.audioStartTime === undefined) {
            element.audioStartTime = 0;
          }
          videoMaker.addAudio(element);
        } else {
          // 设置元素的 canvasWidth 和 canvasHeight
          element.canvasWidth = videoMaker.width;
          element.canvasHeight = videoMaker.height;
          
          // 如果是分割文本，也需要设置子元素的 canvasWidth 和 canvasHeight，并更新时间
          if (element.type === 'text' && element.segments && element.segments.length > 0) {
            
            for (const segment of element.segments) {
              segment.canvasWidth = videoMaker.width;
              segment.canvasHeight = videoMaker.height;
              
              // 更新子片段的绝对时间（相对于视频开始）
              // 子片段的 startTime 在 _initializeSplitter 中是基于父元素的相对 startTime 计算的
              // 格式：segmentStartTime = parentStartTime + index * splitDelay
              // 其中 parentStartTime 是父元素相对于场景的开始时间
              // 所以子片段的相对开始时间 = 父元素的相对开始时间 + 偏移
              const segmentRelativeStartTime = segment.startTime || 0;
              
              // 计算子片段相对于父元素的偏移时间（在父元素更新为绝对时间之前计算）
              const segmentOffset = segmentRelativeStartTime - parentRelativeStartTime;
              
              // 子片段的绝对时间 = 父元素的绝对时间 + 子片段相对于父元素的偏移
              const segmentAbsoluteStartTime = absoluteStartTime + segmentOffset;
              segment.startTime = segmentAbsoluteStartTime;
              
              // 更新子片段的 endTime
              if (segment.duration !== undefined) {
                segment.endTime = segmentAbsoluteStartTime + segment.duration;
              } else if (segment.endTime !== Infinity) {
                // 计算子片段的相对结束时间
                const segmentRelativeEndTime = segment.endTime;
                const segmentEndOffset = segmentRelativeEndTime - parentRelativeStartTime;
                segment.endTime = absoluteStartTime + segmentEndOffset;
              }
            }
          }
          
          // 其他元素添加到 Layer
          layer.addElement(element);
        }
      }
      
      currentTime = sceneStartTime + scene.duration;
      
      // 处理转场（暂时跳过，转场需要特殊处理）
      // TODO: 转场效果需要重新设计
    }

    return layer;
  }

  /**
   * 销毁轨道
   */
  destroy() {
    for (const scene of this.scenes) {
      scene.destroy();
    }
    this.scenes = [];
    this.transitions = [];
  }
}


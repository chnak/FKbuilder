/**
 * 轨道类 - 使用 CompositionElement 方式构建
 */
import { Scene } from './Scene.js';
import { Transition } from './Transition.js';

/**
 * 轨道类 - 不再继承 VideoMaker，而是构建 CompositionElement 配置
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
   * @returns {number} 总时长（秒）
   */
  getTotalDuration() {
    if (this.scenes.length === 0) return 0;
    
    let totalDuration = 0;
    for (const scene of this.scenes) {
      totalDuration += scene.duration;
    }
    
    // 加上转场时长
    for (const transition of this.transitions) {
      totalDuration += transition.duration || 0;
    }
    
    return totalDuration;
  }

  /**
   * 构建轨道（返回 CompositionElement 配置，包含所有场景）
   * @returns {Object} CompositionElement 配置对象
   */
  build() {
    const totalDuration = this.getTotalDuration();
    
    // 构建所有场景，获取它们的 CompositionElement 配置
    const sceneElements = [];
    let currentTime = 0;
    
    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      const sceneStartTime = scene.startTime !== undefined ? scene.startTime : currentTime;
      
      // 构建场景，返回 CompositionElement 配置
      const sceneElementConfig = scene.build();
      if (sceneElementConfig) {
        // 设置场景的时间范围
        sceneElementConfig.startTime = sceneStartTime;
        sceneElementConfig.duration = scene.duration;
        sceneElements.push(sceneElementConfig);
      }
      
      currentTime = sceneStartTime + scene.duration;
      
      // 处理转场（暂时跳过，转场需要特殊处理）
      // TODO: 转场效果需要重新设计
    }

    // 返回轨道的 CompositionElement 配置
    return {
      type: 'composition',
      x: '50%',
      y: '50%',
      width: this.width,
      height: this.height,
      anchor: [0.5, 0.5],
      startTime: 0,
      duration: totalDuration,
      zIndex: this.zIndex,
      elements: sceneElements, // 所有场景作为子元素
    };
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


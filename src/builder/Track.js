/**
 * 轨道类 - 本身是一个独立的 VideoMaker（嵌套合成）
 */
import { Scene } from './Scene.js';
import { Transition } from './Transition.js';
import { VideoMaker } from '../core/VideoMaker.js';
import { CompositionLayer } from '../layers/CompositionLayer.js';

/**
 * 轨道类 - 继承自 VideoMaker
 */
export class Track extends VideoMaker {
  constructor(config = {}) {
    // 初始化 VideoMaker
    super({
      width: config.width || config.builder?.config?.width || 1920,
      height: config.height || config.builder?.config?.height || 1080,
      fps: config.fps || config.builder?.config?.fps || 30,
      duration: 0, // 初始为0，会根据场景自动计算
      backgroundColor: 'transparent', // 轨道背景透明
    });
    
    this.builder = config.builder;
    this.zIndex = config.zIndex || 0;
    this.name = config.name || `Track-${this.zIndex}`;
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
   * 构建轨道（将场景作为 CompositionLayer 添加到轨道）
   */
  build() {
    const totalDuration = this.getTotalDuration();
    
    // 更新轨道合成的时长
    this.setDuration(totalDuration);
    
    // 先创建所有场景 layer
    let currentTime = 0;
    
    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      const sceneStartTime = scene.startTime !== undefined ? scene.startTime : currentTime;
      
      // 构建场景为独立的 VideoMaker
      const sceneComposition = scene.build();
      
      // 创建 CompositionLayer 直接渲染场景合成
      const sceneLayer = new CompositionLayer({
        composition: sceneComposition,
        x: this.width / 2,
        y: this.height / 2,
        width: this.width,
        height: this.height,
        anchor: [0.5, 0.5],
        startTime: sceneStartTime,
        endTime: sceneStartTime + scene.duration,
        zIndex: 0, // 场景在轨道中的 zIndex
      });
      
      // 直接添加到 timeline（作为 layer）
      this.timeline.addLayer(sceneLayer);
      
      currentTime = sceneStartTime + scene.duration;
      
      // 处理转场（暂时跳过，转场需要特殊处理）
      // TODO: 转场效果需要重新设计，可能需要使用 TransitionLayer
    }

    return this;
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
    // 调用父类的销毁方法
    super.destroy();
  }
}


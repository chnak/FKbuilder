/**
 * 转场效果类 - 使用 gl-transitions
 */
import { TransitionElement } from '../elements/TransitionElement.js';

/**
 * 转场效果类
 */
export class Transition {
  constructor(config = {}) {
    this.track = config.track;
    this.name = config.name || config.type || 'fade'; // gl-transitions 名称
    this.duration = config.duration || 0.5; // 转场时长（秒）
    this.startTime = config.startTime; // 转场开始时间（转场结束的时间点）
    this.fromScene = config.fromScene;
    this.toScene = config.toScene;
    this.fromSceneIndex = config.fromSceneIndex;
    this.toSceneIndex = config.toSceneIndex;
    this.easing = config.easing || 'easeInOutQuad';
    this.params = config.params; // gl-transitions 参数
  }

  /**
   * 应用转场效果 - 创建 TransitionElement 并返回
   * @param {VideoMaker} fromSceneComposition - 源场景合成
   * @param {VideoMaker} toSceneComposition - 目标场景合成
   * @param {number} transitionStartTime - 转场开始时间
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {TransitionElement} 转场元素
   */
  createTransitionElement(fromSceneComposition, toSceneComposition, transitionStartTime, width, height) {
    // 创建转场元素
    const transitionElement = new TransitionElement({
      x: width / 2,
      y: height / 2,
      width: width,
      height: height,
      anchor: [0.5, 0.5],
      fromComposition: fromSceneComposition,
      toComposition: toSceneComposition,
      transitionConfig: {
        name: this.name,
        duration: this.duration,
        easing: this.easing,
        params: this.params,
      },
      startTime: transitionStartTime - this.duration,
      duration: this.duration,
    });

    return transitionElement;
  }
}


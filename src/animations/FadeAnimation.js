import { Animation } from './Animation.js';
import { AnimationType } from '../types/enums.js';
import { lerp } from '../utils/helpers.js';

/**
 * 淡入淡出动画
 */
export class FadeAnimation extends Animation {
  constructor(config = {}) {
    super(config);
    this.type = AnimationType.FADE;
    this.fromOpacity = config.fromOpacity !== undefined ? config.fromOpacity : 0;
    this.toOpacity = config.toOpacity !== undefined ? config.toOpacity : 1;
  }

  /**
   * 设置起始透明度
   */
  setFromOpacity(opacity) {
    this.fromOpacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * 设置结束透明度
   */
  setToOpacity(opacity) {
    this.toOpacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * 淡入动画
   */
  fadeIn(duration, delay = 0) {
    this.fromOpacity = 0;
    this.toOpacity = 1;
    this.config.duration = duration;
    this.config.delay = delay;
    this.setStartTime(delay);
  }

  /**
   * 淡出动画
   */
  fadeOut(duration, delay = 0) {
    this.fromOpacity = 1;
    this.toOpacity = 0;
    this.config.duration = duration;
    this.config.delay = delay;
    this.setStartTime(delay);
  }

  /**
   * 获取透明度状态
   */
  getStateAtTime(time) {
    const progress = this.getEasedProgress(time);
    const opacity = lerp(this.fromOpacity, this.toOpacity, progress);
    return { opacity };
  }

  /**
   * 获取初始状态（from 值）
   */
  getInitialState() {
    return { opacity: this.fromOpacity };
  }

  /**
   * 获取结束状态（to 值）
   */
  getFinalState() {
    return { opacity: this.toOpacity };
  }
}


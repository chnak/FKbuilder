import { generateId } from '../utils/helpers.js';
import { DEFAULT_ANIMATION_CONFIG } from '../types/constants.js';
import { deepMerge, applyEasing } from '../utils/helpers.js';

/**
 * 动画基类
 */
export class Animation {
  constructor(config = {}) {
    this.id = generateId('animation');
    this.type = 'base';
    this.config = deepMerge({}, DEFAULT_ANIMATION_CONFIG, config);
    this.target = null; // 目标元素
    // startTime 优先使用 config.startTime，如果没有则使用 delay
    // 注意：delay 可能是负数，负数 delay 会在 BaseElement 中从元素结束时间计算
    this.startTime = config.startTime !== undefined ? config.startTime : (this.config.delay || 0);
    this.endTime = this.startTime + this.config.duration;
    this.iterations = this.config.iterations || 1;
    this.currentIteration = 0;
  }

  /**
   * 设置目标元素
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * 获取目标元素
   */
  getTarget() {
    return this.target;
  }

  /**
   * 设置开始时间
   */
  setStartTime(time) {
    this.startTime = time;
    this.endTime = this.startTime + this.config.duration;
  }

  /**
   * 设置持续时间
   */
  setDuration(duration) {
    this.config.duration = duration;
    this.endTime = this.startTime + duration;
  }

  /**
   * 判断动画在指定时间是否激活
   */
  isActiveAtTime(time) {
    if (time < this.startTime) return false;
    if (this.iterations === 1) {
      return time <= this.endTime;
    }
    // 循环动画
    const cycleDuration = this.config.duration;
    const cycleTime = (time - this.startTime) % cycleDuration;
    return cycleTime <= cycleDuration;
  }

  /**
   * 获取动画进度（0-1）
   */
  getProgress(time) {
    if (time <= this.startTime) return 0; // 使用 <= 确保在开始时刻返回 0
    if (time >= this.endTime && this.iterations === 1) return 1;

    const elapsed = time - this.startTime;
    const cycleDuration = this.config.duration;
    
    if (this.iterations === 1) {
      const progress = elapsed / cycleDuration;
      return Math.min(1, Math.max(0, progress));
    }

    // 循环动画
    const cycleProgress = (elapsed % cycleDuration) / cycleDuration;
    return cycleProgress;
  }

  /**
   * 获取应用缓动后的进度
   */
  getEasedProgress(time) {
    const progress = this.getProgress(time);
    return applyEasing(progress, this.config.easing);
  }

  /**
   * 在指定时间获取动画状态（子类实现）
   */
  getStateAtTime(time) {
    // 子类实现具体逻辑
    return {};
  }

  /**
   * 重置动画
   */
  reset() {
    this.currentIteration = 0;
  }
}


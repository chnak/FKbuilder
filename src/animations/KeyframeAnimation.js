import { Animation } from './Animation.js';
import { AnimationType } from '../types/enums.js';
import { lerp } from '../utils/helpers.js';

/**
 * 关键帧动画
 */
export class KeyframeAnimation extends Animation {
  constructor(config = {}) {
    super(config);
    this.type = AnimationType.KEYFRAME;
    this.keyframes = config.keyframes || []; // [{ time: 0, props: {...} }, ...]
    this.properties = config.properties || []; // 要动画的属性列表
  }

  /**
   * 添加关键帧
   */
  addKeyframe(time, props) {
    this.keyframes.push({ time, props });
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * 设置关键帧
   */
  setKeyframes(keyframes) {
    this.keyframes = keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * 获取指定时间的关键帧状态
   */
  getStateAtTime(time) {
    if (this.keyframes.length === 0) return {};

    const progress = this.getEasedProgress(time);
    const normalizedTime = progress * this.config.duration;

    // 找到当前时间所在的关键帧区间
    let startKeyframe = this.keyframes[0];
    let endKeyframe = this.keyframes[this.keyframes.length - 1];

    for (let i = 0; i < this.keyframes.length - 1; i++) {
      const currentTime = this.keyframes[i].time * this.config.duration;
      const nextTime = this.keyframes[i + 1].time * this.config.duration;
      if (normalizedTime >= currentTime && normalizedTime <= nextTime) {
        startKeyframe = this.keyframes[i];
        endKeyframe = this.keyframes[i + 1];
        break;
      }
    }

    // 计算区间内的插值进度
    const startTime = startKeyframe.time * this.config.duration;
    const endTime = endKeyframe.time * this.config.duration;
    const segmentDuration = endTime - startTime;
    const segmentProgress = segmentDuration > 0 
      ? (normalizedTime - startTime) / segmentDuration 
      : 0;

    // 插值所有属性
    const state = {};
    
    // 支持两种格式：
    // 1. { time: 0, props: { opacity: 0, y: 50 } }
    // 2. { time: 0, opacity: 0, y: 50 } (直接属性)
    const startProps = startKeyframe.props || startKeyframe;
    const endProps = endKeyframe.props || endKeyframe;
    
    // 排除 time 属性
    const allProps = new Set([
      ...Object.keys(startProps).filter(k => k !== 'time'),
      ...Object.keys(endProps).filter(k => k !== 'time'),
    ]);

    for (const prop of allProps) {
      const startValue = startProps[prop] ?? 0;
      const endValue = endProps[prop] ?? 0;
      
      // 对于 x, y 属性，如果是相对值（相对于当前位置），需要特殊处理
      // 但这里我们直接插值，因为预设动画中的 x, y 通常是相对偏移量
      state[prop] = lerp(startValue, endValue, segmentProgress);
    }

    return state;
  }
}


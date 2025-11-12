import { Animation } from './Animation.js';
import { AnimationType } from '../types/enums.js';
import { lerp } from '../utils/helpers.js';

/**
 * 移动动画
 */
export class MoveAnimation extends Animation {
  constructor(config = {}) {
    super(config);
    this.type = AnimationType.MOVE;
    this.fromX = config.fromX !== undefined ? config.fromX : 0;
    this.fromY = config.fromY !== undefined ? config.fromY : 0;
    this.toX = config.toX !== undefined ? config.toX : 0;
    this.toY = config.toY !== undefined ? config.toY : 0;
  }

  /**
   * 设置起始位置
   */
  setFrom(x, y) {
    this.fromX = x;
    this.fromY = y;
  }

  /**
   * 设置结束位置
   */
  setTo(x, y) {
    this.toX = x;
    this.toY = y;
  }

  /**
   * 设置移动路径（直线）
   */
  setPath(fromX, fromY, toX, toY) {
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
  }

  /**
   * 获取位置状态
   * 如果 fromX/fromY 和 toX/toY 是相对偏移量（用于滑入滑出），返回 translateX/translateY
   * 否则返回绝对位置 x/y
   */
  getStateAtTime(time) {
    const progress = this.getEasedProgress(time);
    
    // 检查是否是相对偏移量模式（用于滑入滑出动画）
    // 如果 toX 和 toY 都是 0，且 fromX 或 fromY 不为 0，则认为是相对偏移量
    const isRelative = (this.toX === 0 && this.toY === 0) && 
                       (this.fromX !== 0 || this.fromY !== 0);
    
    if (isRelative) {
      // 相对偏移量模式：返回 translateX/translateY
      return {
        translateX: lerp(this.fromX, this.toX, progress),
        translateY: lerp(this.fromY, this.toY, progress),
      };
    } else {
      // 绝对位置模式：返回 x/y
      return {
        x: lerp(this.fromX, this.toX, progress),
        y: lerp(this.fromY, this.toY, progress),
      };
    }
  }

  /**
   * 获取初始状态（from 值）
   */
  getInitialState() {
    // 检查是否是相对偏移量模式
    const isRelative = (this.toX === 0 && this.toY === 0) && 
                       (this.fromX !== 0 || this.fromY !== 0);
    
    if (isRelative) {
      return {
        translateX: this.fromX,
        translateY: this.fromY,
      };
    } else {
      return {
        x: this.fromX,
        y: this.fromY,
      };
    }
  }

  /**
   * 获取结束状态（to 值）
   */
  getFinalState() {
    // 检查是否是相对偏移量模式
    const isRelative = (this.toX === 0 && this.toY === 0) && 
                       (this.fromX !== 0 || this.fromY !== 0);
    
    if (isRelative) {
      return {
        translateX: this.toX,
        translateY: this.toY,
      };
    } else {
      return {
        x: this.toX,
        y: this.toY,
      };
    }
  }
}


import { generateId } from '../utils/helpers.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { toPixels } from '../utils/unit-converter.js';
import { FadeAnimation } from '../animations/FadeAnimation.js';
import { MoveAnimation } from '../animations/MoveAnimation.js';
import { TransformAnimation } from '../animations/TransformAnimation.js';
import { KeyframeAnimation } from '../animations/KeyframeAnimation.js';
import { AnimationType } from '../types/enums.js';
import { getPresetAnimation } from '../animations/preset-animations.js';

/**
 * 根据动画配置创建动画实例
 * 支持字符串形式的预设动画名称，如 "fadeIn", "fadeOut"
 * 也支持对象形式的配置，如 {type: "fadeIn", duration: 1, delay: 2}
 */
function createAnimationFromConfig(animConfig) {
  // 如果已经是动画实例，直接返回
  if (animConfig && typeof animConfig.getStateAtTime === 'function') {
    return animConfig;
  }

  // 如果是字符串，尝试获取预设动画
  if (typeof animConfig === 'string') {
    const preset = getPresetAnimation(animConfig);
    if (preset) {
      // 使用预设动画的默认配置
      return createAnimationFromConfig(preset);
    } else {
      console.warn(`未找到预设动画: ${animConfig}`);
      // 如果找不到预设，返回一个默认的淡入动画
      return new FadeAnimation({ fromOpacity: 0, toOpacity: 1 });
    }
  }

  // 如果是对象，检查是否有预设动画名称
  if (animConfig && typeof animConfig === 'object') {
    // 检查 type 是否是预设动画名称
    const presetName = animConfig.type || animConfig.animationType;
    const preset = getPresetAnimation(presetName);
    
    if (preset) {
      // 合并预设配置和用户配置（用户配置优先级更高）
      const mergedConfig = { ...preset, ...animConfig };
      // 移除 type，因为预设配置中已经有 type
      delete mergedConfig.type;
      delete mergedConfig.animationType;
      // 使用合并后的配置创建动画
      return createAnimationFromConfig(mergedConfig);
    }
  }

  // 从配置对象创建动画
  const type = animConfig.type || animConfig.animationType;
  const config = { ...animConfig };
  delete config.type;
  delete config.animationType;

  switch (type) {
    case AnimationType.FADE:
    case 'fade':
      return new FadeAnimation(config);
    case AnimationType.MOVE:
    case 'move':
      return new MoveAnimation(config);
    case AnimationType.TRANSFORM:
    case 'transform':
      return new TransformAnimation(config);
    case AnimationType.KEYFRAME:
    case 'keyframe':
      return new KeyframeAnimation(config);
    default:
      // 默认使用 FadeAnimation
      return new FadeAnimation(config);
  }
}

/**
 * 元素基类
 */
export class BaseElement {
  constructor(config = {}) {
    this.id = generateId('element');
    this.type = 'base';
    
    // 提取 animations 配置（在 deepMerge 之前）
    const animationsConfig = config.animations || [];
    delete config.animations; // 从 config 中移除，避免被合并到 this.config
    
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    this.animations = [];
    this.parent = null;
    this.visible = true;
    this.createdAt = Date.now();
    
    // 时间范围控制
    this.startTime = config.startTime !== undefined ? config.startTime : 0;
    this.endTime = config.endTime !== undefined ? config.endTime : Infinity;
    this.duration = config.duration !== undefined ? config.duration : undefined;
    
    // 如果指定了duration但没有endTime，自动计算endTime
    if (this.duration !== undefined && this.endTime === Infinity) {
      this.endTime = this.startTime + this.duration;
    }

    // 从配置中添加动画
    if (Array.isArray(animationsConfig)) {
      for (const animConfig of animationsConfig) {
        if (animConfig) {
          const animation = createAnimationFromConfig(animConfig);
          this.addAnimation(animation);
        }
      }
    }
  }

  /**
   * 获取元素类型
   */
  getType() {
    return this.type;
  }

  /**
   * 获取配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = deepMerge(this.config, newConfig);
  }

  /**
   * 设置位置
   */
  setPosition(x, y) {
    this.config.x = x;
    this.config.y = y;
  }

  /**
   * 设置尺寸
   */
  setSize(width, height) {
    this.config.width = width;
    this.config.height = height;
  }

  /**
   * 设置透明度
   */
  setOpacity(opacity) {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * 设置旋转角度（度）
   */
  setRotation(rotation) {
    this.config.rotation = rotation;
  }

  /**
   * 设置缩放
   */
  setScale(scaleX, scaleY = scaleX) {
    this.config.scaleX = scaleX;
    this.config.scaleY = scaleY;
  }

  /**
   * 设置锚点
   */
  setAnchor(x, y) {
    this.config.anchor = [x, y];
  }

  /**
   * 添加动画
   */
  addAnimation(animation) {
    this.animations.push(animation);
    animation.setTarget(this);
  }

  /**
   * 移除动画
   */
  removeAnimation(animationId) {
    this.animations = this.animations.filter(anim => anim.id !== animationId);
  }

  /**
   * 显示元素
   */
  show() {
    this.visible = true;
  }

  /**
   * 隐藏元素
   */
  hide() {
    this.visible = false;
  }

  /**
   * 判断元素在指定时间是否激活
   * @param {number} time - 时间（秒）
   * @returns {boolean}
   */
  isActiveAtTime(time) {
    return this.visible && time >= this.startTime && time <= this.endTime;
  }

  /**
   * 设置时间范围
   * @param {number} startTime - 开始时间（秒）
   * @param {number} endTime - 结束时间（秒），如果未指定则使用duration计算
   */
  setTimeRange(startTime, endTime) {
    this.startTime = startTime;
    if (endTime !== undefined) {
      this.endTime = endTime;
    } else if (this.duration !== undefined) {
      this.endTime = startTime + this.duration;
    }
  }

  /**
   * 设置持续时间
   * @param {number} duration - 持续时间（秒）
   */
  setDuration(duration) {
    this.duration = duration;
    if (this.endTime === Infinity) {
      this.endTime = this.startTime + duration;
    }
  }

  /**
   * 在指定时间获取元素状态
   * @param {number} time - 时间（秒）
   * @param {Object} context - 上下文对象 { width, height } 用于单位转换
   * @returns {Object} 元素状态
   */
  getStateAtTime(time, context = {}) {
    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      // 如果不在时间范围内，返回隐藏状态
      return { ...this.config, opacity: 0, visible: false };
    }
    
    let state = { ...this.config };

    // 应用所有动画
    // 注意：动画的 startTime 是相对于元素自己的 startTime 的
    // 如果 delay 为负数，则从元素的结束时间往前计算
    for (const animation of this.animations) {
      // 获取动画的 delay（可能是负数）
      const delay = animation.config.delay !== undefined ? animation.config.delay : 0;
      
      // 计算动画的绝对开始时间
      let animationAbsoluteStartTime;
      if (delay < 0) {
        // 负数 delay：从元素结束时间往前计算
        // 例如：delay = -1，duration = 2，元素结束时间是 10
        // 动画开始时间 = 10 - 1 - 2 = 7（确保动画在元素结束前完成）
        // 或者更简单：动画开始时间 = 元素结束时间 + delay - duration
        // 但通常我们希望动画在元素结束前完成，所以：
        // 动画开始时间 = 元素结束时间 + delay
        animationAbsoluteStartTime = this.endTime + delay;
      } else {
        // 正数或0 delay：从元素开始时间往后计算
        animationAbsoluteStartTime = this.startTime + (animation.startTime || delay);
      }
      
      const animationAbsoluteEndTime = animationAbsoluteStartTime + animation.config.duration;
      
      // 检查动画是否在激活状态（使用绝对时间）
      if (time >= animationAbsoluteStartTime && time <= animationAbsoluteEndTime) {
        // 计算相对于动画开始的时间（从0开始）
        const animationRelativeTime = time - animationAbsoluteStartTime;
        // 使用动画的 startTime + 相对时间来计算状态
        // 这样 getStateAtTime 会正确计算进度
        const animationState = animation.getStateAtTime(animation.startTime + animationRelativeTime);
        state = { ...state, ...animationState };
      }
    }

    // 处理 translateX 和 translateY（相对偏移量）
    // 这些属性来自 KeyframeAnimation，表示相对于元素原始位置的偏移
    if (state.translateX !== undefined) {
      // translateX 是相对于原始 x 的偏移量
      const baseX = typeof this.config.x === 'string' 
        ? toPixels(this.config.x, { width: context.width || 1920, height: context.height || 1080 }, 'x')
        : (this.config.x || 0);
      state.x = baseX + (state.translateX || 0);
      delete state.translateX;
    }
    if (state.translateY !== undefined) {
      // translateY 是相对于原始 y 的偏移量
      const baseY = typeof this.config.y === 'string'
        ? toPixels(this.config.y, { width: context.width || 1920, height: context.height || 1080 }, 'y')
        : (this.config.y || 0);
      state.y = baseY + (state.translateY || 0);
      delete state.translateY;
    }

    // 转换单位（x, y, width, height）
    const { width = 1920, height = 1080 } = context;
    const unitContext = { width, height };

    // 只对字符串类型进行单位转换，数字类型直接使用
    // 注意：x和width基于宽度，y和height基于高度
    if (typeof state.x === 'string') {
      state.x = toPixels(state.x, unitContext, 'x');
    }
    if (typeof state.y === 'string') {
      state.y = toPixels(state.y, unitContext, 'y');
    }
    if (typeof state.width === 'string') {
      state.width = toPixels(state.width, unitContext, 'width');
    }
    if (typeof state.height === 'string') {
      state.height = toPixels(state.height, unitContext, 'height');
    }

    return state;
  }

  /**
   * 渲染元素到 SpriteJS 场景（子类实现）
   * @param {Object} scene - SpriteJS 场景对象
   * @param {number} time - 当前时间（秒）
   */
  render(scene, time) {
    // 子类实现具体渲染逻辑
    throw new Error('render method must be implemented by subclass');
  }

  /**
   * 直接使用Canvas 2D API渲染元素（子类实现）
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} time - 当前时间（秒）
   */
  renderToCanvas(ctx, time) {
    // 检查时间范围，如果不在范围内则不渲染
    if (!this.isActiveAtTime(time)) {
      return;
    }
    // 子类实现具体渲染逻辑
    throw new Error('renderToCanvas method must be implemented by subclass');
  }

  /**
   * 销毁元素
   */
  destroy() {
    this.animations = [];
    this.parent = null;
  }
}


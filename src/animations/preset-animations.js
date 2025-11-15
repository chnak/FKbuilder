import { TransformAnimation } from './TransformAnimation.js';

/**
 * 预设动画配置映射表
 */
export const PRESET_ANIMATIONS = {
  // 淡入淡出
  fadeIn: {
    type: 'transform',
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeOut: {
    type: 'transform',
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: 0.6,
    delay: -1, // 默认在元素结束前 1 秒开始
    easing: 'easeInQuad',
  },
  
  // 从上方滑入（使用更大的偏移量，相对于画布高度）
  slideInTop: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateY: -200 },
      { time: 1, translateY: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  // 从下方滑入
  slideInBottom: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateY: 200 },
      { time: 1, translateY: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  // 从左侧滑入
  slideInLeft: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateX: -300 },
      { time: 1, translateX: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  // 从右侧滑入
  slideInRight: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateX: 300 },
      { time: 1, translateX: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  
  // 滑出
  slideOutTop: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateY: 0 },
      { time: 1, translateY: -200 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideOutBottom: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateY: 0 },
      { time: 1, translateY: 200 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideOutLeft: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateX: 0 },
      { time: 1, translateX: -300 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideOutRight: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateX: 0 },
      { time: 1, translateX: 300 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 缩放
  zoomIn: {
    type: 'transform',
    from: { scaleX: 0, scaleY: 0 },
    to: { scaleX: 1, scaleY: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-back',
  },
  zoomOut: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1 },
    to: { scaleX: 0, scaleY: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-back',
  },

  bigIn: {
    type: 'transform',
    from: { scaleX: 2, scaleY: 2, opacity: 0 },
    to: { scaleX: 1, scaleY: 1, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-back',
  },
  bigOut: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1, opacity: 1 },
    to: { scaleX: 2, scaleY: 2, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-back',
  },
  
  // 旋转
  rotateIn: {
    type: 'transform',
    from: { rotation: -180 },
    to: { rotation: 0 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  rotateOut: {
    type: 'transform',
    from: { rotation: 0 },
    to: { rotation: 180 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 组合动画（使用 KeyframeAnimation 实现组合效果）
  // KeyframeAnimation 支持 translateX/translateY 作为相对偏移量
  fadeInUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: 50 },
      { time: 1, opacity: 1, translateY: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeInDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: -50 },
      { time: 1, opacity: 1, translateY: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeOutUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0 },
      { time: 1, opacity: 0, translateY: -50 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  fadeOutDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0 },
      { time: 1, opacity: 0, translateY: 50 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 弹跳效果
  bounceIn: {
    type: 'transform',
    from: { scaleX: 0, scaleY: 0 },
    to: { scaleX: 1, scaleY: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-bounce',
  },
  bounceOut: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1 },
    to: { scaleX: 0, scaleY: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-bounce',
  },
  
  // 旋转变体
  rotateInLeft: {
    type: 'transform',
    from: { rotation: -180, opacity: 0 },
    to: { rotation: 0, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  rotateInRight: {
    type: 'transform',
    from: { rotation: 180, opacity: 0 },
    to: { rotation: 0, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  rotateOutLeft: {
    type: 'transform',
    from: { rotation: 0, opacity: 1 },
    to: { rotation: -180, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  rotateOutRight: {
    type: 'transform',
    from: { rotation: 0, opacity: 1 },
    to: { rotation: 180, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 缩放+淡入组合
  zoomInFade: {
    type: 'transform',
    from: { scaleX: 0.5, scaleY: 0.5, opacity: 0 },
    to: { scaleX: 1, scaleY: 1, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  zoomOutFade: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1, opacity: 1 },
    to: { scaleX: 0.5, scaleY: 0.5, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 缩放+旋转组合
  zoomRotateIn: {
    type: 'transform',
    from: { scaleX: 0, scaleY: 0, rotation: -180 },
    to: { scaleX: 1, scaleY: 1, rotation: 0 },
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-back',
  },
  zoomRotateOut: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1, rotation: 0 },
    to: { scaleX: 0, scaleY: 0, rotation: 180 },
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-back',
  },
  
  // 弹跳变体（带方向）
  bounceInUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: 200, scaleX: 0.3, scaleY: 0.3 },
      { time: 0.6, opacity: 1, translateY: -20, scaleX: 1.05, scaleY: 1.05 },
      { time: 0.8, translateY: 10, scaleX: 0.95, scaleY: 0.95 },
      { time: 1, translateY: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-bounce',
  },
  bounceInDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: -200, scaleX: 0.3, scaleY: 0.3 },
      { time: 0.6, opacity: 1, translateY: 20, scaleX: 1.05, scaleY: 1.05 },
      { time: 0.8, translateY: -10, scaleX: 0.95, scaleY: 0.95 },
      { time: 1, translateY: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-bounce',
  },
  bounceInLeft: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateX: -300, scaleX: 0.3, scaleY: 0.3 },
      { time: 0.6, opacity: 1, translateX: 20, scaleX: 1.05, scaleY: 1.05 },
      { time: 0.8, translateX: -10, scaleX: 0.95, scaleY: 0.95 },
      { time: 1, translateX: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-bounce',
  },
  bounceInRight: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateX: 300, scaleX: 0.3, scaleY: 0.3 },
      { time: 0.6, opacity: 1, translateX: -20, scaleX: 1.05, scaleY: 1.05 },
      { time: 0.8, translateX: 10, scaleX: 0.95, scaleY: 0.95 },
      { time: 1, translateX: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-bounce',
  },
  bounceOutUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0, scaleX: 1, scaleY: 1 },
      { time: 0.2, translateY: -10, scaleX: 0.95, scaleY: 0.95 },
      { time: 0.4, opacity: 1, translateY: 20, scaleX: 1.05, scaleY: 1.05 },
      { time: 1, opacity: 0, translateY: -200, scaleX: 0.3, scaleY: 0.3 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-bounce',
  },
  bounceOutDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0, scaleX: 1, scaleY: 1 },
      { time: 0.2, translateY: 10, scaleX: 0.95, scaleY: 0.95 },
      { time: 0.4, opacity: 1, translateY: -20, scaleX: 1.05, scaleY: 1.05 },
      { time: 1, opacity: 0, translateY: 200, scaleX: 0.3, scaleY: 0.3 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-bounce',
  },
  
  // 缩放变体（带方向）
  zoomInUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: 100, scaleX: 0.3, scaleY: 0.3 },
      { time: 1, opacity: 1, translateY: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-back',
  },
  zoomInDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: -100, scaleX: 0.3, scaleY: 0.3 },
      { time: 1, opacity: 1, translateY: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-back',
  },
  zoomInLeft: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateX: -150, scaleX: 0.3, scaleY: 0.3 },
      { time: 1, opacity: 1, translateX: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-back',
  },
  zoomInRight: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateX: 150, scaleX: 0.3, scaleY: 0.3 },
      { time: 1, opacity: 1, translateX: 0, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-back',
  },
  zoomOutUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0, scaleX: 1, scaleY: 1 },
      { time: 1, opacity: 0, translateY: -100, scaleX: 0.3, scaleY: 0.3 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-back',
  },
  zoomOutDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0, scaleX: 1, scaleY: 1 },
      { time: 1, opacity: 0, translateY: 100, scaleX: 0.3, scaleY: 0.3 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-back',
  },
  zoomOutLeft: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateX: 0, scaleX: 1, scaleY: 1 },
      { time: 1, opacity: 0, translateX: -150, scaleX: 0.3, scaleY: 0.3 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-back',
  },
  zoomOutRight: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateX: 0, scaleX: 1, scaleY: 1 },
      { time: 1, opacity: 0, translateX: 150, scaleX: 0.3, scaleY: 0.3 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-back',
  },
  
  // 翻转效果
  flipInX: {
    type: 'transform',
    from: { rotation: -90, opacity: 0 },
    to: { rotation: 0, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  flipInY: {
    type: 'transform',
    from: { rotation: 90, opacity: 0 },
    to: { rotation: 0, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  flipOutX: {
    type: 'transform',
    from: { rotation: 0, opacity: 1 },
    to: { rotation: 90, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  flipOutY: {
    type: 'transform',
    from: { rotation: 0, opacity: 1 },
    to: { rotation: -90, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 弹性效果
  elasticIn: {
    type: 'transform',
    from: { scaleX: 0, scaleY: 0 },
    to: { scaleX: 1, scaleY: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'ease-out-elastic',
  },
  elasticOut: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1 },
    to: { scaleX: 0, scaleY: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'ease-in-elastic',
  },
  
  // 摇摆效果
  swing: {
    type: 'keyframe',
    keyframes: [
      { time: 0, rotation: 0 },
      { time: 0.2, rotation: 15 },
      { time: 0.4, rotation: -10 },
      { time: 0.6, rotation: 5 },
      { time: 0.8, rotation: -5 },
      { time: 1, rotation: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeInOutQuad',
  },
  
  // 脉冲效果
  pulse: {
    type: 'keyframe',
    keyframes: [
      { time: 0, scaleX: 1, scaleY: 1 },
      { time: 0.5, scaleX: 1.1, scaleY: 1.1 },
      { time: 1, scaleX: 1, scaleY: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeInOutQuad',
  },
  
  // 抖动效果
  shake: {
    type: 'keyframe',
    keyframes: [
      { time: 0, translateX: 0 },
      { time: 0.1, translateX: -10 },
      { time: 0.2, translateX: 10 },
      { time: 0.3, translateX: -10 },
      { time: 0.4, translateX: 10 },
      { time: 0.5, translateX: -10 },
      { time: 0.6, translateX: 10 },
      { time: 0.7, translateX: -10 },
      { time: 0.8, translateX: 10 },
      { time: 0.9, translateX: -5 },
      { time: 1, translateX: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'linear',
  },
  
  // 闪烁效果
  flash: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1 },
      { time: 0.25, opacity: 0 },
      { time: 0.5, opacity: 1 },
      { time: 0.75, opacity: 0 },
      { time: 1, opacity: 1 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'linear',
  },
  
  // 淡入+缩放组合（更平滑）
  fadeInScale: {
    type: 'transform',
    from: { scaleX: 0.8, scaleY: 0.8, opacity: 0 },
    to: { scaleX: 1, scaleY: 1, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeOutScale: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1, opacity: 1 },
    to: { scaleX: 0.8, scaleY: 0.8, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 淡入+旋转组合
  fadeInRotate: {
    type: 'transform',
    from: { rotation: -45, opacity: 0 },
    to: { rotation: 0, opacity: 1 },
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeOutRotate: {
    type: 'transform',
    from: { rotation: 0, opacity: 1 },
    to: { rotation: 45, opacity: 0 },
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 滑入+淡入组合
  slideFadeInLeft: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateX: -100 },
      { time: 1, opacity: 1, translateX: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  slideFadeInRight: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateX: 100 },
      { time: 1, opacity: 1, translateX: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  slideFadeInUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: 50 },
      { time: 1, opacity: 1, translateY: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  slideFadeInDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: -50 },
      { time: 1, opacity: 1, translateY: 0 },
    ],
    duration: 0.6,
    delay: 0,
    easing: 'easeOutQuad',
  },
  slideFadeOutLeft: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateX: 0 },
      { time: 1, opacity: 0, translateX: -100 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideFadeOutRight: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateX: 0 },
      { time: 1, opacity: 0, translateX: 100 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideFadeOutUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0 },
      { time: 1, opacity: 0, translateY: -50 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideFadeOutDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0 },
      { time: 1, opacity: 0, translateY: 50 },
    ],
    duration: 0.6,
    delay: -1,
    easing: 'easeInQuad',
  },
};

/**
 * 获取预设动画配置
 * @param {string} presetName - 预设动画名称
 * @returns {Object|null} 预设动画配置，如果不存在则返回 null
 */
export function getPresetAnimation(presetName) {
  return PRESET_ANIMATIONS[presetName] || null;
}

/**
 * 获取所有可用的预设动画名称
 * @returns {Array<string>} 预设动画名称数组
 */
export function getPresetAnimationNames() {
  return Object.keys(PRESET_ANIMATIONS);
}


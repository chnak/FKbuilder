import { FadeAnimation } from './FadeAnimation.js';
import { MoveAnimation } from './MoveAnimation.js';
import { TransformAnimation } from './TransformAnimation.js';

/**
 * 预设动画配置映射表
 */
export const PRESET_ANIMATIONS = {
  // 淡入淡出
  fadeIn: {
    type: 'fade',
    fromOpacity: 0,
    toOpacity: 1,
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeOut: {
    type: 'fade',
    fromOpacity: 1,
    toOpacity: 0,
    duration: 1,
    delay: -1, // 默认在元素结束前 1 秒开始
    easing: 'easeInQuad',
  },
  
  // 从上方滑入（使用更大的偏移量，相对于画布高度）
  slideInTop: {
    type: 'move',
    fromX: 0,
    fromY: -200, // 从上方 200 像素处滑入
    toX: 0,
    toY: 0, // 滑到原始位置
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  // 从下方滑入
  slideInBottom: {
    type: 'move',
    fromX: 0,
    fromY: 200, // 从下方 200 像素处滑入
    toX: 0,
    toY: 0,
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  // 从左侧滑入
  slideInLeft: {
    type: 'move',
    fromX: -300, // 从左侧 300 像素处滑入（对于 1920 宽度，这个偏移量更明显）
    fromY: 0,
    toX: 0,
    toY: 0,
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  // 从右侧滑入
  slideInRight: {
    type: 'move',
    fromX: 300, // 从右侧 300 像素处滑入
    fromY: 0,
    toX: 0,
    toY: 0,
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  
  // 滑出
  slideOutTop: {
    type: 'move',
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: -200, // 向上滑出 200 像素
    duration: 1,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideOutBottom: {
    type: 'move',
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 200, // 向下滑出 200 像素
    duration: 1,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideOutLeft: {
    type: 'move',
    fromX: 0,
    fromY: 0,
    toX: -300, // 向左滑出 300 像素
    toY: 0,
    duration: 1,
    delay: -1,
    easing: 'easeInQuad',
  },
  slideOutRight: {
    type: 'move',
    fromX: 0,
    fromY: 0,
    toX: 300, // 向右滑出 300 像素
    toY: 0,
    duration: 1,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 缩放
  zoomIn: {
    type: 'transform',
    from: { scaleX: 0, scaleY: 0 },
    to: { scaleX: 1, scaleY: 1 },
    duration: 1,
    delay: 0,
    easing: 'ease-out-back',
  },
  zoomOut: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1 },
    to: { scaleX: 0, scaleY: 0 },
    duration: 1,
    delay: -1,
    easing: 'ease-in-back',
  },
  
  // 旋转
  rotateIn: {
    type: 'transform',
    from: { rotation: -180 },
    to: { rotation: 0 },
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  rotateOut: {
    type: 'transform',
    from: { rotation: 0 },
    to: { rotation: 180 },
    duration: 1,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 组合动画（使用 MoveAnimation + FadeAnimation 的组合，而不是 KeyframeAnimation）
  // 因为 KeyframeAnimation 中的 y 会直接覆盖元素的 y，而不是作为偏移量
  fadeInUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: 50 },
      { time: 1, opacity: 1, translateY: 0 },
    ],
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeInDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 0, translateY: -50 },
      { time: 1, opacity: 1, translateY: 0 },
    ],
    duration: 1,
    delay: 0,
    easing: 'easeOutQuad',
  },
  fadeOutUp: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0 },
      { time: 1, opacity: 0, translateY: -50 },
    ],
    duration: 1,
    delay: -1,
    easing: 'easeInQuad',
  },
  fadeOutDown: {
    type: 'keyframe',
    keyframes: [
      { time: 0, opacity: 1, translateY: 0 },
      { time: 1, opacity: 0, translateY: 50 },
    ],
    duration: 1,
    delay: -1,
    easing: 'easeInQuad',
  },
  
  // 弹跳效果
  bounceIn: {
    type: 'transform',
    from: { scaleX: 0, scaleY: 0 },
    to: { scaleX: 1, scaleY: 1 },
    duration: 1,
    delay: 0,
    easing: 'ease-out-bounce',
  },
  bounceOut: {
    type: 'transform',
    from: { scaleX: 1, scaleY: 1 },
    to: { scaleX: 0, scaleY: 0 },
    duration: 1,
    delay: -1,
    easing: 'ease-in-bounce',
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


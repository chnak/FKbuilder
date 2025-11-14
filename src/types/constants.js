/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 10, // 秒
  backgroundColor: '#000000',
  renderQuality: 'high',
};

/**
 * 动画默认配置
 */
export const DEFAULT_ANIMATION_CONFIG = {
  duration: 1, // 秒
  delay: 0,
  easing: 'linear',
  iterations: 1,
};

/**
 * 元素默认配置
 */
export const DEFAULT_ELEMENT_CONFIG = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  opacity: 1,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  anchor: [0.5, 0.5],
};

/**
 * 文本元素默认配置
 */
export const DEFAULT_TEXT_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  text: '',
  fontSize: 24,
  fontFamily: 'PatuaOne', // 默认使用PatuaOne字体以支持中文
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#ffffff',
  textAlign: 'center',
  textBaseline: 'middle',
  lineHeight: 1.2,
  stroke: false, // 是否启用描边
  strokeColor: '#000000', // 描边颜色
  strokeWidth: 2, // 描边宽度
};

/**
 * 图片元素默认配置
 */
export const DEFAULT_IMAGE_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  src: '',
  fit: 'cover', // cover, contain, fill, none
  // 视觉效果
  blendMode: 'normal', // normal, multiply, screen, overlay, soft-light, hard-light, color-dodge, color-burn, darken, lighten, difference, exclusion
  borderRadius: 0, // 圆角半径（像素）
  borderWidth: 0, // 边框宽度（像素）
  borderColor: '#000000', // 边框颜色
  shadowBlur: 0, // 阴影模糊半径（像素）
  shadowColor: '#000000', // 阴影颜色
  shadowOffsetX: 0, // 阴影 X 偏移（像素）
  shadowOffsetY: 0, // 阴影 Y 偏移（像素）
  // 滤镜效果
  filter: null, // CSS filter 字符串，如 'blur(5px)', 'brightness(1.2)', 'contrast(1.5)', 'saturate(1.3)', 'hue-rotate(90deg)', 'grayscale(0.5)'
  // 镜像/翻转
  flipX: false, // 水平翻转
  flipY: false, // 垂直翻转
  // 色彩调整（通过 filter 实现，但提供便捷属性）
  brightness: 1, // 亮度 (0-2)
  contrast: 1, // 对比度 (0-2)
  saturation: 1, // 饱和度 (0-2)
  hue: 0, // 色相旋转 (0-360 度)
  grayscale: 0, // 灰度 (0-1)
  // 毛玻璃效果
  glassEffect: false, // 是否启用毛玻璃效果
  glassBlur: 10, // 毛玻璃模糊半径（像素）
  glassOpacity: 0.7, // 毛玻璃透明度 (0-1)
  glassTint: '#ffffff', // 毛玻璃色调（通常为白色或浅色）
  glassBorder: true, // 是否显示毛玻璃边框
  glassBorderColor: '#ffffff', // 毛玻璃边框颜色
  glassBorderWidth: 1, // 毛玻璃边框宽度
};

/**
 * FFmpeg 默认配置
 */
export const DEFAULT_FFMPEG_CONFIG = {
  codec: 'libx264',
  preset: 'medium',
  crf: 23,
  pixelFormat: 'yuv420p',
  audioCodec: 'aac',
  audioBitrate: '128k',
};


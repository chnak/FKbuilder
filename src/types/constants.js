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
  // 描边效果
  stroke: false, // 是否启用描边
  strokeColor: '#000000', // 描边颜色
  strokeWidth: 2, // 描边宽度
  // Stroke Style（描边样式）
  strokeStyle: 'solid', // 描边样式: 'solid'（实线）, 'dashed'（虚线）, 'dotted'（点线）
  strokeDashArray: [5, 5], // 虚线模式：[线段长度, 间隔长度]
  strokeDashOffset: 0, // 虚线偏移量
  strokeCap: 'butt', // 线帽样式: 'butt'（平头）, 'round'（圆头）, 'square'（方头）
  strokeJoin: 'miter', // 连接样式: 'miter'（尖角）, 'round'（圆角）, 'bevel'（斜角）
  strokeMiterLimit: 4, // 尖角限制（仅当 strokeJoin 为 'miter' 时有效）
  // 文本阴影效果
  textShadow: false, // 是否启用文本阴影
  textShadowColor: '#000000', // 阴影颜色
  textShadowOffsetX: 2, // 阴影 X 偏移
  textShadowOffsetY: 2, // 阴影 Y 偏移
  textShadowBlur: 0, // 阴影模糊半径
  textShadowOpacity: 0.5, // 阴影透明度 (0-1)
  // Shadow Style（阴影样式）
  textShadowStyle: 'outer', // 阴影样式: 'outer'（外阴影）, 'inner'（内阴影）
  textShadowSpread: 0, // 阴影扩散（类似 CSS box-shadow 的 spread）
  // 文本渐变效果
  gradient: false, // 是否启用渐变
  gradientColors: ['#FF6B6B', '#4ECDC4'], // 渐变颜色数组
  gradientDirection: 'horizontal', // 渐变方向: 'horizontal'（水平）, 'vertical'（垂直）, 'diagonal'（对角线）
  // 文本发光效果
  textGlow: false, // 是否启用发光
  textGlowColor: '#FFFFFF', // 发光颜色
  textGlowBlur: 20, // 发光模糊半径
  textGlowIntensity: 1, // 发光强度 (0-1)
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

export const DEFAULT_AUDIO_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  src: '',
  cutFrom: 0,
  cutTo: undefined,
  volume: 1,
  fadeIn: 0,
  fadeOut: 0,
  loop: false,
};

export const DEFAULT_VIDEO_CONFIG = {
  ...DEFAULT_IMAGE_CONFIG,
  src: null,
  cutFrom: 0,
  cutTo: undefined,
  speedFactor: 1,
  loop: false,
  mute: true,
  volume: 1,
};

export const DEFAULT_RECT_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  bgcolor: '#ffffff',
  borderRadius: 0,
  borderWidth: 0,
  borderColor: '#000000',
};

export const DEFAULT_CIRCLE_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  bgcolor: '#ffffff',
  borderWidth: 0,
  borderColor: '#000000',
  radius: 0,
};

export const DEFAULT_PATH_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  points: [],
  closed: false,
  smooth: false,
  bezier: false,
  fillColor: null,
  strokeColor: '#000000',
  strokeWidth: 1,
  strokeCap: 'round',
  strokeJoin: 'round',
  dashArray: null,
  dashOffset: 0,
};

export const DEFAULT_SVG_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  src: '',
  svgString: null,
  fit: 'contain',
  preserveAspectRatio: true,
  enableSVGAnimations: true,
};

export const DEFAULT_OSCILLOSCOPE_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  src: '',
  waveColor: '#00ff00',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  lineWidth: 2,
  smoothing: 0.3,
  mirror: true,
  style: 'line',
  sensitivity: 1,
  cutFrom: 0,
  cutTo: undefined,
  windowSize: 0.1,
  scrollSpeed: 1,
};

export const DEFAULT_SUBTITLE_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  text: '',
  fontSize: 72,
  fontFamily: 'PatuaOne',
  textColor: '#ffffff',
  position: 'center',
  textAlign: 'center',
  split: null,
  splitDelay: 0.1,
  splitDuration: 0.3,
  maxLength: 20,
};

export const DEFAULT_SPRITE_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  spriteType: 'Sprite',
  spriteConfig: {},
};

export const DEFAULT_SPINE_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  dir: '',
  skeleton: '',
  atlas: '',
  role: null,
  prefer: 'alien',
  timeline: null,
  animationPlayMode: 'sequence',
  sequenceLoop: false,
  animSchedule: null,
  loop: true,
  scale: 1,
  timeScale: 1,
  fit: 'contain',
  valign: 'bottom',
  suppressWarnings: true,
};

export const DEFAULT_JSON_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  src: '',
  jsonData: null,
  jsonString: null,
  fit: 'contain',
  preserveAspectRatio: true,
};

export const DEFAULT_TRANSITION_CONFIG = {
  ...DEFAULT_ELEMENT_CONFIG,
  fromComposition: null,
  toComposition: null,
  transitionConfig: {},
  duration: 0.5,
};


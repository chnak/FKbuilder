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


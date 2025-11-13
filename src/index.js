/**
 * 视频制作库主入口文件
 */

// 核心类
export { VideoMaker } from './core/VideoMaker.js';
// 向后兼容：Composition 作为 VideoMaker 的别名
import { VideoMaker } from './core/VideoMaker.js';
export { VideoMaker as Composition };
export { Timeline } from './core/Timeline.js';
export { Renderer } from './core/Renderer.js';
export { VideoExporter } from './core/VideoExporter.js';

// 图层类
export { BaseLayer } from './layers/BaseLayer.js';
export { ElementLayer } from './layers/ElementLayer.js';
export { BackgroundLayer } from './layers/BackgroundLayer.js';
export { OverlayLayer } from './layers/OverlayLayer.js';
export { CompositionLayer } from './layers/CompositionLayer.js';

// 元素类
export { BaseElement } from './elements/BaseElement.js';
export { TextElement } from './elements/TextElement.js';
export { SubtitleElement } from './elements/SubtitleElement.js';
export { ImageElement } from './elements/ImageElement.js';
export { RectElement } from './elements/RectElement.js';
export { CircleElement } from './elements/CircleElement.js';
export { SpriteElement } from './elements/SpriteElement.js';
export { CompositionElement } from './elements/CompositionElement.js';
export { OscilloscopeElement } from './elements/OscilloscopeElement.js';

// 动画类
export { Animation } from './animations/Animation.js';
export { KeyframeAnimation } from './animations/KeyframeAnimation.js';
export { TransformAnimation } from './animations/TransformAnimation.js';
export { FadeAnimation } from './animations/FadeAnimation.js';
export { MoveAnimation } from './animations/MoveAnimation.js';
export { PRESET_ANIMATIONS, getPresetAnimation, getPresetAnimationNames } from './animations/preset-animations.js';

// 工具类
export { FFmpegUtil } from './utils/ffmpeg.js';
export { ImageLoader, imageLoader } from './utils/image-loader.js';

// 类型和常量
export * from './types/enums.js';
export * from './types/constants.js';

// 工具函数
export * from './utils/helpers.js';
export * from './utils/validator.js';
export * from './utils/unit-converter.js';
export { parseSubtitles, calculateMixedTextCapacity, calculateSpeechTimeMixed } from './utils/subtitle-utils.js';
export { getAudioDuration } from './utils/audio-utils.js';

// 构建器类（高级API）
export { VideoBuilder } from './builder/VideoBuilder.js';
export { Track } from './builder/Track.js';
export { Scene } from './builder/Scene.js';
export { Transition } from './builder/Transition.js';

// 转场相关
export { TransitionRenderer, AllTransitions } from './utils/transition-renderer.js';
export { TransitionElement } from './elements/TransitionElement.js';


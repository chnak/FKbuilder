/**
 * 转场渲染器 - 使用 gl-transitions 渲染转场效果
 * 参考 FKVideo 的实现
 */
import GL from 'gl';
import createBuffer from 'gl-buffer';
import createTexture from 'gl-texture2d';
import glTransition from 'gl-transition';
import glTransitions from 'gl-transitions';
import ndarray from 'ndarray';
import * as easings from './easings.js';

const { default: createTransition } = glTransition;

// 转场别名
const TransitionAliases = {
  // 方向性过渡效果
  'directional-left': { name: 'directional', easing: 'easeOutExpo', params: { direction: [1, 0] } },
  'directional-right': { name: 'directional', easing: 'easeOutExpo', params: { direction: [-1, 0] } },
  'directional-down': { name: 'directional', easing: 'easeOutExpo', params: { direction: [0, 1] } },
  'directional-up': { name: 'directional', easing: 'easeOutExpo', params: { direction: [0, -1] } },
};

export const AllTransitions = [
  ...glTransitions.map((t) => t.name),
  ...Object.keys(TransitionAliases),
  'random', // 添加随机过渡
];

/**
 * 转场渲染器类
 */
export class TransitionRenderer {
  constructor(options = {}) {
    if (!options || options.duration === 0) {
      options = { duration: 0 };
    }

    if (typeof options !== 'object') {
      throw new Error('Transition must be an object');
    }
    if (options.duration !== 0 && !options.name) {
      throw new Error('Please specify transition name or set duration to 0');
    }

    if (options.name === 'random') {
      // 为 random 过渡使用真正的随机选择
      const randomIndex = Math.floor(Math.random() * AllTransitions.length);
      options.name = AllTransitions[randomIndex];
    }

    const aliasedTransition = options.name && TransitionAliases[options.name];
    if (aliasedTransition) {
      Object.assign(options, aliasedTransition);
    }

    this.duration = options.duration ?? 0;
    this.name = options.name;
    this.params = options.params;
    this.easingFunction =
      options.easing && easings[options.easing]
        ? easings[options.easing]
        : easings.linear;

    // A dummy transition can be used to have an audio transition without a video transition
    // (Note: You will lose a portion from both clips due to overlap)
    if (this.name && this.name !== 'dummy') {
      this.source = glTransitions.find(
        ({ name }) => name.toLowerCase() === this.name?.toLowerCase()
      );
      if (!this.source) {
        throw new Error(`Transition not found: ${this.name}`);
      }
    }
  }

  /**
   * 创建转场渲染函数
   * @param {Object} config - 配置 { width, height, channels }
   * @returns {Function} 渲染函数 ({ fromFrame, toFrame, progress }) => Buffer
   */
  create({ width, height, channels = 4 }) {
    const gl = GL(width, height);
    const resizeMode = 'stretch';

    if (!gl) {
      throw new Error(
        'gl returned null, this probably means that some dependencies are not installed. See README.'
      );
    }

    function convertFrame(buf) {
      // @see https://github.com/stackgl/gl-texture2d/issues/16
      return ndarray(buf, [width, height, channels], [channels, width * channels, 1]);
    }

    // 预先创建并缓存可重用的资源（避免每帧都创建和销毁）
    const buffer = createBuffer(gl, [-1, -1, -1, 4, 4, -1], gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    let transition;
    
    if (this.source) {
      transition = createTransition(gl, this.source, { resizeMode });
    }

    return ({ fromFrame, toFrame, progress }) => {
      if (!this.source) {
        // No transition found, just switch frames half way through the transition.
        return this.easingFunction(progress) > 0.5 ? toFrame : fromFrame;
      }

      try {
        gl.clear(gl.COLOR_BUFFER_BIT);

        // 创建纹理（每帧都需要新的纹理，因为输入不同）
        const fromFrameNdArray = convertFrame(fromFrame);
        const textureFrom = createTexture(gl, fromFrameNdArray);
        textureFrom.minFilter = gl.LINEAR;
        textureFrom.magFilter = gl.LINEAR;

        const toFrameNdArray = convertFrame(toFrame);
        const textureTo = createTexture(gl, toFrameNdArray);
        textureTo.minFilter = gl.LINEAR;
        textureTo.magFilter = gl.LINEAR;

        // 重用预创建的 buffer 和 transition
        buffer.bind();
        transition.draw(
          this.easingFunction(progress),
          textureFrom,
          textureTo,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          this.params
        );

        // 立即释放纹理（避免内存泄漏）
        textureFrom.dispose();
        textureTo.dispose();

        // 读取像素到新分配的缓冲区（每次返回新的 Buffer，避免引用共享）
        const outArray = Buffer.allocUnsafe(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, outArray);

        return outArray;
      } catch (error) {
        console.error('转场渲染错误:', error);
        // 如果出错，返回简单的混合结果
        return this.easingFunction(progress) > 0.5 ? toFrame : fromFrame;
      }
    };
  }
}


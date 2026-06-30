/**
 * Takumi 渲染器单例与辅助工具
 *
 * 封装 @takumi-rs/core 与 @takumi-rs/helpers,提供:
 * - 全局共享的 Renderer 实例(复用字体/图片解码缓存)
 * - HTML / node tree 解析统一入口
 * - 字体注册缓存(避免重复解码)
 * - 简单降级:依赖缺失时返回 throw,由调用方决定是否降级渲染占位
 */
import { Renderer as TakumiRenderer } from '@takumi-rs/core';
import { fromHtml as takumiFromHtml } from '@takumi-rs/helpers/html';

let _renderer = null;

/**
 * 获取共享的 Takumi Renderer 实例
 * @returns {TakumiRenderer}
 */
export function getTakumiRenderer() {
  if (!_renderer) {
    _renderer = new TakumiRenderer();
  }
  return _renderer;
}

/**
 * 销毁共享实例(导出视频后调用,释放原生资源)
 */
export function destroyTakumiRenderer() {
  if (_renderer) {
    // 原生绑定无显式 destroy,GC 即可
    _renderer = null;
  }
  _fontRegistry.clear();
}

// 字体注册缓存: key = `${name}@${weight}@${style}`,value = true 表示已注册
const _fontRegistry = new Map();
let _fontSeq = 0;

/**
 * 注册字体到 Takumi 渲染器
 * @param {TakumiRenderer} renderer
 * @param {Array} fonts - 支持以下形式:
 *   - 字符串: URL,异步加载
 *   - { url: '...' }: 异步加载
 *   - { path: 'C:/Windows/Fonts/xxx.ttf' }: 同步读取后注册
 *   - { data: Buffer }: 直接使用 buffer
 * @returns {Promise<void>}
 */
export async function registerFontsToTakumi(renderer, fonts) {
  if (!Array.isArray(fonts) || fonts.length === 0) return;
  const promises = fonts.map(async (f) => {
    if (typeof f === 'string') {
      const key = `url:${f}`;
      if (_fontRegistry.has(key)) return;
      _fontRegistry.set(key, true);
      await renderer.loadFont(f);
      return;
    }

    if (f.url) {
      const key = `url:${f.url}`;
      if (_fontRegistry.has(key)) return;
      _fontRegistry.set(key, true);
      await renderer.loadFont(f.url);
      return;
    }

    if (f.path) {
      const key = `path:${f.path}`;
      if (_fontRegistry.has(key)) return;
      _fontRegistry.set(key, true);
      const fs = await import('fs/promises');
      const data = await fs.readFile(f.path);
      renderer.loadFontSync(data);
      return;
    }

    if (f.data) {
      const key = `data:${++_fontSeq}`;
      if (_fontRegistry.has(key)) return;
      _fontRegistry.set(key, true);
      renderer.loadFontSync(f.data);
    }
  });
  await Promise.all(promises);
}

/**
 * 解析 HTML 字符串为 Takumi node tree
 * @param {string} html
 * @returns {{ node: object, stylesheets: string[] }}
 */
export function parseHtml(html) {
  return takumiFromHtml(html);
}

/**
 * 包装 node tree(如果用户直接传入 node 树对象,直接返回)
 * @param {object} node
 * @returns {{ node: object, stylesheets: string[] }}
 */
export function wrapNode(node) {
  return { node, stylesheets: [] };
}

/**
 * 统一的渲染入口:接受 html 或 node,返回 RGBA Buffer
 * @param {object} input
 * @param {string} [input.html]
 * @param {object} [input.node]
 * @param {string[]} [input.stylesheets]
 * @param {Array}  [input.fonts]
 * @param {number}  input.width
 * @param {number}  input.height
 * @param {number} [input.timeMs=0]  - 用于 CSS keyframe 动画的当前时间
 * @param {object} [input.keyframes] - 结构化 keyframe 定义
 * @param {object} [input.devicePixelRatio=1]
 * @returns {Promise<Buffer>} width*height*4 RGBA bytes
 */
export async function renderHtmlFrame(input) {
  const renderer = getTakumiRenderer();
  const { width, height, html, node, stylesheets, fonts, timeMs, keyframes, devicePixelRatio } = input;
  if (!width || !height) {
    throw new Error('renderHtmlFrame: width and height are required');
  }

  // 1) 解析为 node tree
  let parsed;
  if (html) {
    parsed = parseHtml(html);
  } else if (node) {
    parsed = wrapNode(node);
  } else {
    throw new Error('renderHtmlFrame: must provide either html or node');
  }

  // 2) 注册用户字体(可幂等)
  if (fonts && fonts.length) {
    await registerFontsToTakumi(renderer, fonts);
  }

  // 3) 渲染 raw RGBA
  const allStylesheets = [...(parsed.stylesheets || []), ...(stylesheets || [])];
  const opts = {
    width,
    height,
    format: 'raw',
  };
  if (allStylesheets.length) opts.stylesheets = allStylesheets;
  if (timeMs !== undefined) opts.timeMs = timeMs;
  if (keyframes) opts.keyframes = keyframes;
  if (devicePixelRatio) opts.devicePixelRatio = devicePixelRatio;

  return await renderer.render(parsed.node, opts);
}

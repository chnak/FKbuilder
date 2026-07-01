/**
 * Takumi 渲染器单例与辅助工具
 *
 * 封装 @takumi-rs/core 与 @takumi-rs/helpers,提供:
 * - 全局共享的 Renderer 实例(复用字体/图片解码缓存)
 * - HTML / node tree 解析统一入口
 * - 字体注册缓存(幂等 + 失败可重试 + 并发安全)
 * - Emoji 渲染辅助(模块路径兼容 bundler / pnpm / npm hoisting)
 *
 * 修复记录:
 *  P0-1 字体加载失败不再永久污染缓存(写注册表改在 await 之后)
 *  P0-2 emoji 模块加载改用包名 import,不再硬拼 node_modules 路径
 *  P0-3 emoji 缓存绑到 renderer 实例(WeakMap),destroy() 后自动失效
 *  P1-4 字体注册并发竞态修复:inflight Promise 去重
 *  P1-5 emoji 并行预加载(Promise.all)
 *  P1-6 collectImageUrls 只收字符串 src,不再误把 Buffer 当 URL
 *  P2-7 renderHtmlFrame 透传 AbortSignal / images,加基础入参校验
 */
import { Renderer as TakumiRenderer } from '@takumi-rs/core';
import { fromHtml as takumiFromHtml } from '@takumi-rs/helpers/html';
import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';

/* ============================================================================
 *  Emoji 模块加载
 *  - 优先按包名 import,兼容 bundler / pnpm / monorepo / npm hoisting 各种场景
 *  - 失败时静默降级(返回 null),调用方无需 try/catch
 * ========================================================================== */
let _extractEmojis = null;

/**
 * @returns {Function|null} extractEmojis 函数;若模块不可用返回 null
 */
async function getExtractEmojis() {
  if (_extractEmojis) return _extractEmojis;

  // 优先级 1:子路径 export(包作者若在 package.json 中声明即可用)
  const candidates = [
    '@takumi-rs/helpers/emoji',
    '@takumi-rs/helpers/dist/emoji.mjs',
  ];
  for (const spec of candidates) {
    try {
      const mod = await import(spec);
      if (mod && typeof mod.extractEmojis === 'function') {
        _extractEmojis = mod.extractEmojis;
        return _extractEmojis;
      }
    } catch (_) {
      // try next
    }
  }

  // 优先级 2:相对 node_modules 路径解析
  // 在 bundler / pnpm 下大概率失败,但 try/catch 兜底
  try {
    if (typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
      const here = path.dirname(fileURLToPath(import.meta.url));
      const emojiPath = path.join(
        here,
        '..', '..', 'node_modules', '@takumi-rs', 'helpers', 'dist', 'emoji.mjs'
      );
      const mod = await import(pathToFileURL(emojiPath).href);
      if (mod && typeof mod.extractEmojis === 'function') {
        _extractEmojis = mod.extractEmojis;
        return _extractEmojis;
      }
    }
  } catch (_) {
    // 静默降级
  }

  return null;
}

/* ============================================================================
 *  Renderer 单例
 * ========================================================================== */
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
 * 字符串 key 的字体缓存必须清空 —— 旧 renderer 已死,新 renderer 不认识这些 key
 * WeakMap 绑定的缓存(emoji / Buffer 字体)随 renderer GC 自动失效,无需手动清
 */
export function destroyTakumiRenderer() {
  _renderer = null;
  _fontRegistry.clear();
  _fontInflightByKey.clear();
}

let _fontSeq = 0; // 仅用于生成唯一 key(label/debug 用,非去重键)

/* ============================================================================
 *  字体注册:幂等 + 并发安全 + 失败可重试
 *  - 字符串 URL / 绝对路径:按 key 去重,inflight Promise 复用
 *  - Buffer 数据:按引用去重(WeakMap 绑到 renderer),同上语义
 * ========================================================================== */
// key(string) → true:已成功加载的 URL / path
const _fontRegistry = new Map();
// key(string) → Promise:正在加载中的 URL / path(防止同一 key 并发重入)
const _fontInflightByKey = new Map();
// renderer → WeakMap<Buffer, true | Promise>:renderer 维度上的 Buffer 字体状态
//   true 表示已加载,Promise 表示加载中,命中后允许并发复用
const _fontBufferState = new WeakMap();

/**
 * 注册一组字体到 Takumi 渲染器(单个失败不阻塞其他)
 * @param {TakumiRenderer} renderer
 * @param {Array} fonts - 支持:
 *   - 字符串:URL,异步加载
 *   - { url: '...' }:异步加载
 *   - { path: '...' }:读盘后同步注册
 *   - { data: Buffer }:同步注册,按引用去重
 * @returns {Promise<void>}
 */
export async function registerFontsToTakumi(renderer, fonts) {
  if (!Array.isArray(fonts) || fonts.length === 0) return;
  await Promise.all(
    fonts.map((f) =>
      registerOneFont(renderer, f).catch((err) => {
        // 单个字体失败仅打 warning,不阻塞整段渲染
        // eslint-disable-next-line no-console
        console.warn(
          `[takumi-renderer] 字体注册失败 (${describeFont(f)}):`,
          err?.message || err
        );
      })
    )
  );
}

function describeFont(f) {
  if (typeof f === 'string') return `url:${f}`;
  if (f && typeof f === 'object') {
    if (f.url) return `url:${f.url}`;
    if (f.path) return `path:${f.path}`;
    if (f.data) return 'data:<Buffer>';
  }
  return 'unknown';
}

async function registerOneFont(renderer, f) {
  if (!renderer) throw new TypeError('registerOneFont: renderer is required');

  // === string URL ===
  if (typeof f === 'string') {
    return runKeyOnce(renderer, `url:${f}`, () => renderer.loadFont(f));
  }
  if (!f || typeof f !== 'object') return;

  // === { url } ===
  if (f.url) {
    return runKeyOnce(renderer, `url:${f.url}`, () => renderer.loadFont(f.url));
  }

  // === { path } ===
  if (f.path) {
    return runKeyOnce(renderer, `path:${f.path}`, async () => {
      const fs = await import('fs/promises');
      const data = await fs.readFile(f.path);
      renderer.loadFontSync(data);
    });
  }

  // === { data: Buffer } ===
  // 按 Buffer 引用去重,且状态绑到 renderer —— destroy() 后自然失效,无内存泄漏
  if (f.data) {
    return runBufferOnce(renderer, f.data, () => renderer.loadFontSync(f.data));
  }
}

/**
 * 按字符串 key(URL / 绝对路径)加载:幂等,失败可重试
 * - 已成功 → 立即返回
 * - 在飞 → 复用同一 Promise
 * - 加载失败 → 清掉状态,下次调用重新尝试
 */
async function runKeyOnce(renderer, key, loader) {
  if (_fontRegistry.has(key)) return;
  const existing = _fontInflightByKey.get(key);
  if (existing) return existing;

  const p = (async () => {
    await loader();
    _fontRegistry.set(key, true);
  })().catch((err) => {
    // 失败:清掉 inflight,以便后续可重试(不再写 _fontRegistry)
    _fontInflightByKey.delete(key);
    throw err;
  });

  _fontInflightByKey.set(key, p);
  return p;
}

/**
 * 按 Buffer 引用加载(状态绑到 renderer,WeakMap 自动 GC)
 * - 值 true:已加载
 * - 值 Promise:加载中(复用)
 * - 失败:删除状态,下次可重试
 */
async function runBufferOnce(renderer, buffer, loader) {
  if (!buffer || !(buffer instanceof Uint8Array)) {
    throw new TypeError('runBufferOnce: buffer must be a Uint8Array');
  }
  let stateMap = _fontBufferState.get(renderer);
  if (!stateMap) {
    stateMap = new WeakMap();
    _fontBufferState.set(renderer, stateMap);
  }

  const cur = stateMap.get(buffer);
  if (cur === true) return;
  if (cur instanceof Promise) {
    await cur;
    return;
  }

  const p = (async () => {
    loader();
    stateMap.set(buffer, true);
  })().catch((err) => {
    stateMap.delete(buffer); // 失败 → 允许重试
    throw err;
  });

  stateMap.set(buffer, p);
  await p;
}

/* ============================================================================
 *  Emoji 图片预加载
 *  - 缓存绑到 renderer(WeakMap),destroy() 后自动失效,无需手动清
 *  - 并发同 URL 复用同一 Promise
 *  - 失败 → 清状态,下次可重试
 *
 *  历史:
 *   1. 旧版 Takumi: renderer.loadImage(url) 一站式预加载
 *   2. 1.8.x: 重命名为 putPersistentImage({src,data}),需要先把 URL
 *      下载成 Buffer 再传 data 字段
 *  这里手动 fetch URL,再调 putPersistentImage。
 * ========================================================================== */
// renderer → Map<url, true | Promise>
const _emojiState = new WeakMap();

/**
 * 从 URL/相对路径/绝对路径读取图片字节
 * - http(s):// → node fetch
 * - 其他 → 当文件路径 fs.readFile
 */
async function fetchImageBytes(url) {
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`fetch ${url} failed: ${res.status} ${res.statusText}`);
    }
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  }
  // 本地文件路径
  const fs = await import('fs/promises');
  return new Uint8Array(await fs.readFile(url));
}

async function preloadEmojiImage(renderer, url) {
  if (!url) return;
  let stateMap = _emojiState.get(renderer);
  if (!stateMap) {
    stateMap = new Map();
    _emojiState.set(renderer, stateMap);
  }
  if (stateMap.get(url) === true) return;
  const inflight = stateMap.get(url);
  if (inflight) {
    await inflight;
    return;
  }
  const p = (async () => {
    if (typeof renderer.putPersistentImage === 'function') {
      // 1.8.x:必须 {src,data} 一起传
      const data = await fetchImageBytes(url);
      await renderer.putPersistentImage({ src: url, data });
    } else if (typeof renderer.loadImage === 'function') {
      // 旧版本
      await renderer.loadImage(url);
    } else {
      throw new Error('[takumi-renderer] renderer 不支持图片预加载 (无 putPersistentImage / loadImage)');
    }
    stateMap.set(url, true);
  })().catch((err) => {
    stateMap.delete(url); // 失败 → 允许下次重试
    throw err;
  });
  stateMap.set(url, p);
  await p;
}

/* ============================================================================
 *  Public helpers
 * ========================================================================== */

/**
 * 解析 HTML 字符串为 Takumi node tree
 * @param {string} html
 * @returns {{ node: object, stylesheets: string[] }}
 */
export function parseHtml(html) {
  if (typeof html !== 'string') {
    throw new TypeError('parseHtml: html must be a string');
  }
  return takumiFromHtml(html);
}

/**
 * 包装 node tree(如果用户直接传入 node 树对象,直接返回)
 * @param {object} node
 * @returns {{ node: object, stylesheets: string[] }}
 */
export function wrapNode(node) {
  if (!node || typeof node !== 'object') {
    throw new TypeError('wrapNode: node must be an object');
  }
  return { node, stylesheets: [] };
}

/**
 * 递归收集节点树中所有 image 类型的 string src(用于预加载 emoji SVG 等)
 * 注意:Takumi 的 image.src 也可以是 Uint8Array/ArrayBuffer,这种已经通过
 *       Renderer.images 预注册,无需走 URL 拉取,跳过即可
 */
function collectImageUrls(node, urls) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const n of node) collectImageUrls(n, urls);
    return;
  }
  if (node.type === 'image' && typeof node.src === 'string') {
    urls.add(node.src);
  }
  if (node.children) {
    collectImageUrls(node.children, urls);
  }
}

/**
 * 统一的渲染入口:接受 html 或 node,返回 RGBA Buffer
 * @param {object} input
 * @param {string} [input.html]
 * @param {object} [input.node]
 * @param {string[]} [input.stylesheets]
 * @param {Array}  [input.fonts]
 * @param {number}  input.width  (required)
 * @param {number}  input.height (required)
 * @param {number} [input.timeMs=0]      - CSS keyframe 动画当前时间(毫秒)
 * @param {object} [input.keyframes]     - 结构化 keyframe 定义
 * @param {number} [input.devicePixelRatio=1]
 * @param {AbortSignal} [input.signal]   - 取消渲染
 * @param {object} [input.images]        - 预取图片 { src: Buffer }
 * @param {string|false} [input.emoji='twemoji'] - emoji 风格,false 禁用
 * @param {number} [input.timeoutMs=30000] - 渲染超时(毫秒),默认 30 秒
 * @returns {Promise<Buffer>} width*height*4 RGBA bytes
 */
export async function renderHtmlFrame(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('renderHtmlFrame: input must be an object');
  }
  const {
    width, height,
    html, node, stylesheets, fonts,
    timeMs, keyframes, devicePixelRatio,
    signal, images, emoji,
    timeoutMs = 30000,  // 默认 30 秒超时
  } = input;

  if (!width || !height) {
    throw new Error('renderHtmlFrame: width and height are required');
  }
  if (!html && !node) {
    throw new Error('renderHtmlFrame: must provide either html or node');
  }

  // 1) 解析为 node tree
  let parsed;
  if (html) {
    parsed = parseHtml(html);
  } else {
    parsed = wrapNode(node);
  }

  // 1.5) Emoji 处理(失败时静默降级,不影响主体渲染)
  const renderer = getTakumiRenderer();
  if (parsed.node && emoji !== false) {
    const extractEmojis = await getExtractEmojis();
    if (extractEmojis) {
      const emojiType = typeof emoji === 'string' ? emoji : 'twemoji';
      try {
        const beforeNode = parsed.node;
        parsed.node = extractEmojis(parsed.node, emojiType);
        if (parsed.node !== beforeNode) {
          // 收集所有 emoji SVG URL 并行预加载(修复 #5 串行问题)
          const emojiUrls = new Set();
          collectImageUrls(parsed.node, emojiUrls);
          await Promise.all(
            Array.from(emojiUrls, (url) => preloadEmojiImage(renderer, url))
          );
        }
      } catch (_) {
        // 静默跳过 emoji 处理
      }
    }
  }

  // 2) 注册用户字体(单个失败 warning,不阻塞)
  if (fonts && fonts.length) {
    await registerFontsToTakumi(renderer, fonts);
  }

  // 3) 渲染 raw RGBA
  const allStylesheets = [
    ...(parsed.stylesheets || []),
    ...(stylesheets || []),
  ];
  const opts = {
    width,
    height,
    format: 'raw',
  };
  if (allStylesheets.length) opts.stylesheets = allStylesheets;
  if (timeMs !== undefined) opts.timeMs = timeMs;
  if (keyframes) opts.keyframes = keyframes;
  if (devicePixelRatio) opts.devicePixelRatio = devicePixelRatio;
  if (images) opts.images = images;

  // 4) 超时控制:使用 AbortSignal.timeout() (Node.js 15.13+)
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  // 合并用户 signal 和超时 signal
  let finalSignal = timeoutSignal;
  if (signal) {
    // 使用 AbortSignal.any 合并两个 signal (Node.js 15.13+)
    finalSignal = AbortSignal.any([signal, timeoutSignal]);
  }

  try {
    return await renderer.render(parsed.node, { ...opts, signal: finalSignal });
  } catch (err) {
    // 区分超时错误和其他错误
    if (err.name === 'AbortError') {
      // 检查是否是因为超时(检查 timeoutSignal 是否被中止)
      if (timeoutSignal.aborted) {
        const timeoutErr = new Error(
          `Takumi render timeout after ${timeoutMs}ms (HTML content may be too complex)`
        );
        timeoutErr.code = 'RENDER_TIMEOUT';
        throw timeoutErr;
      }
      // 用户取消了渲染
      const cancelErr = new Error('Render was cancelled by user');
      cancelErr.code = 'RENDER_CANCELLED';
      throw cancelErr;
    }
    throw err;
  }
}

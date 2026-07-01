/**
 * HTMLElement - 使用 Takumi 渲染任意 HTML/CSS 为 FKbuilder 元素
 *
 * 支持:
 * - html 字符串输入
 * - node tree 对象输入(直接 Takumi 节点树)
 * - x/y/width/height/opacity/rotation 基础变换
 * - FKbuilder 预设动画 (fadeIn, slideInLeft ...)
 * - 节点内 CSS @keyframes 动画(通过 timeMs 注入)
 * - 自定义字体注册
 * - 自定义 stylesheets
 */
import { BaseElement } from './BaseElement.js';
import { ElementType } from '../types/enums.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { toPixels } from '../utils/unit-converter.js';
import { renderHtmlFrame } from '../utils/takumi-renderer.js';
import { getTailwindCss } from '../utils/tailwind.js';
import paper from '@chnak/paper';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 获取默认字体配置（跨平台）
 * 加载顺序:
 *   1. 微软雅黑（中文首选，所有平台都有对应字体）
 *   2. 系统其他中文字体（备份）
 *   3. 系统 Emoji 字体（让 emoji 渲染为彩色图形，如 Segoe UI Emoji / Apple Color Emoji）
 *   4. 系统英文字体（Latin 字符）
 */
function getDefaultFonts() {
  const fonts = [];

  if (process.platform === 'win32') {
    // Windows
    const winFonts = [
      // === 微软雅黑（中文首选） ===
      { path: 'C:/Windows/Fonts/msyh.ttc', family: 'Microsoft YaHei' },
      { path: 'C:/Windows/Fonts/msyhbd.ttc', family: 'Microsoft YaHei', weight: 'bold' },
      { path: 'C:/Windows/Fonts/msyhl.ttc', family: 'Microsoft YaHei Light' },

      // === 其他中文字体（备份） ===
      { path: 'C:/Windows/Fonts/simhei.ttf', family: 'SimHei' },
      { path: 'C:/Windows/Fonts/simsun.ttc', family: 'SimSun' },
      { path: 'C:/Windows/Fonts/simkai.ttf', family: 'KaiTi' },
      { path: 'C:/Windows/Fonts/simfang.ttf', family: 'FangSong' },

      // === Emoji 字体（让 🚀🎨 等彩色显示） ===
      { path: 'C:/Windows/Fonts/seguiemj.ttf', family: 'Segoe UI Emoji' },
      { path: 'C:/Windows/Fonts/segoeprb.ttf', family: 'Segoe Print' },
      { path: 'C:/Windows/Fonts/segoesc.ttf', family: 'Segoe Script' },

      // === 英文字体 ===
      { path: 'C:/Windows/Fonts/segoeui.ttf', family: 'Segoe UI' },
      { path: 'C:/Windows/Fonts/arial.ttf', family: 'Arial' },
    ];
    for (const font of winFonts) {
      try {
        if (fs.existsSync(font.path)) {
          fonts.push(font);
        }
      } catch (e) {}
    }
  } else if (process.platform === 'darwin') {
    // macOS
    const macFonts = [
      // === 苹方（中文首选） ===
      { path: '/System/Library/Fonts/PingFang.ttc', family: 'PingFang SC' },
      { path: '/Library/Fonts/PingFang.ttc', family: 'PingFang SC' },

      // === 华文黑体（备份） ===
      { path: '/System/Library/Fonts/STHeiti Light.ttc', family: 'STHeiti' },
      { path: '/System/Library/Fonts/STHeiti Medium.ttc', family: 'STHeiti' },
      { path: '/Library/Fonts/Songti.ttc', family: 'Songti SC' },

      // === Apple Color Emoji（让 🍎🎉 等彩色显示） ===
      { path: '/System/Library/Fonts/Apple Color Emoji.ttc', family: 'Apple Color Emoji' },

      // === 英文字体 ===
      { path: '/System/Library/Fonts/Helvetica.ttc', family: 'Helvetica' },
      { path: '/Library/Fonts/Arial.ttf', family: 'Arial' },
    ];
    for (const font of macFonts) {
      try {
        if (fs.existsSync(font.path)) {
          fonts.push(font);
        }
      } catch (e) {}
    }
  } else {
    // Linux
    const linuxFonts = [
      // === Noto Sans CJK（中文首选） ===
      { path: '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', family: 'Noto Sans CJK SC' },
      { path: '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', family: 'Noto Sans CJK SC', weight: 'bold' },
      { path: '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', family: 'WenQuanYi Micro Hei' },
      { path: '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', family: 'WenQuanYi Zen Hei' },
      { path: '/usr/share/fonts/truetype/arphic/uming.ttc', family: 'AR PL UMing CN' },

      // === Noto Color Emoji（让 🎨🚀 等彩色显示） ===
      { path: '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', family: 'Noto Color Emoji' },

      // === 英文字体 ===
      { path: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', family: 'DejaVu Sans' },
      { path: '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', family: 'Liberation Sans' },
    ];
    for (const font of linuxFonts) {
      try {
        if (fs.existsSync(font.path)) {
          fonts.push(font);
        }
      } catch (e) {}
    }
  }

  return fonts.length > 0 ? fonts : null;
}

/* ============================================================================
 *  keyframes 选项预处理:自动应用 animation 属性
 *
 *  用户的几种格式:
 *    1. Rich:  { '.badge': { duration:'1s', easing:'ease-out', iteration:'infinite',
 *                            keyframes:{ '0%': {...}, '50%': {...} } } }
 *    2. 裸:    { '.badge': { '0%': {...}, '50%': {...} } }
 *    3. 数组:  [{ name:'foo', keyframes:[{ offsets, declarations }] }]
 *
 *  处理:
 *    - 数组:不动,原样传给 Takumi
 *    - 裸:   提取 keyframes rule,自动生成 anim 名字,注入 animation CSS
 *    - Rich: 同上,但用用户指定的 duration/easing/iteration
 *
 *  返回 { kf, css }:
 *    - kf: 给 Takumi 的 keyframes(Map, key 是自动生成的名字)
 *    - css: 要注入到 HTML 顶部的 <style> 内容
 * ========================================================================== */
function preprocessKeyframes(kf) {
  if (!kf) return { kf: null, css: '' };
  if (Array.isArray(kf)) return { kf, css: '' }; // 数组格式不动

  const generated = {};   // 给 Takumi 的 keyframes
  const styleRules = [];  // 要注入的 CSS 规则

  let counter = 0;
  for (const [selector, value] of Object.entries(kf)) {
    if (!value || typeof value !== 'object') continue;

    // 区分 rich 格式(有 duration 或 keyframes 字段)和裸格式
    const isRich = ('duration' in value) || ('easing' in value) ||
                   ('iteration' in value) || ('keyframes' in value);
    let kfRule;
    let animation;
    if (isRich) {
      kfRule = value.keyframes || {};
      animation = {
        duration: value.duration || '1s',
        easing: value.easing || 'ease-in-out',
        iteration: value.iteration || 'infinite',
        delay: value.delay || '0s',
        direction: value.direction || 'normal',
        fill: value.fill || 'none',
      };
    } else {
      kfRule = value;
      animation = { duration: '1s', easing: 'ease-in-out',
                    iteration: 'infinite', delay: '0s',
                    direction: 'normal', fill: 'none' };
    }

    // 自动生成 animation 名(确定性,基于 selector)
    const safeName = 'fk-anim-' + selector.replace(/[.#]/g, '') + '-' + (counter++);
    generated[safeName] = kfRule;

    const animStr = `${safeName} ${animation.duration} ${animation.easing} ${animation.iteration} ${animation.delay} ${animation.direction} ${animation.fill}`
      .replace(/\s+/g, ' ').trim();
    styleRules.push(`${selector} { animation: ${animStr}; }`);
  }

  return {
    kf: Object.keys(generated).length ? generated : null,
    css: styleRules.join('\n'),
  };
}

/* ============================================================================
 *  默认 font-family 自动注入
 *  - 仅作用于 html 字符串输入(node tree 不处理)
 *  - 在 HTML 顶部注入一条 body 规则,利用继承性覆盖整页
 *  - 选择器只命中 body(特异性 0,0,1),容易被用户的元素/类选择器覆盖,
 *    不会破坏 Tailwind / 自定义 CSS
 *  - 字体栈按平台优先级:Win 雅黑 → macOS 苹方 → Linux Noto CJK → Emoji → sans-serif
 * ========================================================================== */

const DEFAULT_FONT_FAMILY_STACK =
  "'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', " +
  "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

const DEFAULT_FONT_STYLE_BLOCK =
  `<style>body { font-family: ${DEFAULT_FONT_FAMILY_STACK}; }</style>`;

/**
 * 启发式检测:HTML 字符串中是否已经声明了 font-family
 * 简化策略:只查 `font-family:` 字面模式
 * - 误判(命中注释 / 字符串字面量)→ 不注入,这是更安全的方向
 * - 漏判(仅在 JS 字符串中提到、未生效)→ 会注入,可用 autoDefaultFont:false 关闭
 */
function htmlDeclaresFontFamily(html) {
  if (!html || typeof html !== 'string') return false;
  return /font-family\s*:/i.test(html);
}

/**
 * 在 HTML 顶部注入默认 font-family 声明(若未声明)
 * 返回新字符串,不修改入参
 */
function injectDefaultFontFamily(html) {
  if (htmlDeclaresFontFamily(html)) return html;
  return DEFAULT_FONT_STYLE_BLOCK + '\n' + html;
}

export class HTMLElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.HTML;

    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);

    // 输入源(三选一)
    this.html = config.html || null;
    this.node = config.node || null;
    this.jsx = config.jsx || null; // 仅作为占位,实际渲染时建议传入 html 或 node

    // 字体 / 样式表
    // 如果没有传入 fonts，自动添加默认字体支持（微软雅黑中文 + Emoji + 英文）
    if (config.fonts && Array.isArray(config.fonts) && config.fonts.length > 0) {
      this.fonts = config.fonts;
    } else {
      this.fonts = getDefaultFonts();
    }
    this.stylesheets = config.stylesheets || null;

    // 自动注入默认 font-family(在 HTML 顶部插 body 规则)
    // - 默认 true:让"默认字体就是微软雅黑"开箱即用
    // - 设为 false:保持原 HTML 不动,适合完全自定义字体的场景
    this.autoDefaultFont = config.autoDefaultFont !== false;

    // Tailwind CSS 提供器
    // - false / null:不启用(默认)
    // - true:用打包的通用 Tailwind CSS(零配置,158KB)
    // - { css: '...' }:用传入的 CSS 字符串(自己预编译的)
    // - { input: '/path/to.css' }:读本地 CSS 文件(自己预编译的)
    this.tailwind = config.tailwind || null;

    // 节点内 CSS 动画起始偏移(秒)
    this.timeOffset = config.timeOffset !== undefined ? config.timeOffset : 0;

    // 自定义 keyframes 对象(传给 Takumi)
    // 支持两种格式:
    //   1. Rich 格式(推荐): { '.selector': { duration, easing, iteration, delay, direction, fill, keyframes } }
    //      → 自动注入 animation 属性 + @keyframes 定义
    //   2. 裸格式:       { '.selector': { '0%': {...}, '50%': {...} } }
    //      → 只注入 @keyframes 定义(用户需自己写 animation)
    //   3. 数组格式:     [{ name: 'foo', keyframes: [{ offsets, declarations }] }]
    //      → 原样传 Takumi(向后兼容)
    this.keyframes = config.keyframes || null;

    // devicePixelRatio 缩放
    this.devicePixelRatio = config.devicePixelRatio || undefined;

    // 当前帧缓存(避免同帧重复渲染)
    this._lastFrameKey = null;
    this._lastRenderErr = null; // 渲染错误去重签名
    this._canvas = null;
    this._paperItem = null;
  }

  /**
   * 元素初始化
   * 这里可以预解析 HTML 字符串(轻量,不预渲染)
   */
  async initialize() {
    await super.initialize();
    if (!this.html && !this.node && !this.jsx) {
      console.warn('[HTMLElement] 必须提供 html、node 或 jsx 之一');
    }
  }

  /**
   * 检查当前帧是否需要重新渲染
   * 注意:由于 CSS @keyframes 动画内容存储在 HTML 字符串中,
   * 我们无法检测其变化,因此始终返回 true 强制每帧重渲染,
   * 确保 CSS 动画(通过 timeMs 驱动)能正确更新。
   */
  _shouldRerender(time) {
    return true;
  }

  /**
   * 渲染一帧
   * @param {object} layer - Paper.js layer 或 null
   * @param {number} time  - 当前时间(秒,场景时间轴)
   * @param {object} paperInstance
   * @returns {Promise<object|null>}
   */
  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null;
    if (!this.isActiveAtTime(time)) return null;
    if (!this.html && !this.node && !this.jsx) return null;

    const { paper: p, project } = this.getPaperInstance(paperInstance);
    const viewSize = project && project.view && project.view.viewSize
      ? project.view.viewSize
      : { width: 1920, height: 1080 };
    const context = { width: viewSize.width, height: viewSize.height };

    // 1) 计算目标位置 / 尺寸
    const state = this.getStateAtTime(time, context);
    const size = this.convertSize(state.width || 800, state.height || 600, context);
    const width = Math.max(1, Math.round(size.width));
    const height = Math.max(1, Math.round(size.height));

    // 2) 计算 timeMs(传给 Takumi 用)
    const relTime = Math.max(0, time - this.startTime + this.timeOffset);
    const timeMs = Math.floor(relTime * 1000);

    // 3) 缓存判断
    if (!this._shouldRerender(time)) {
      if (this._paperItem) {
        this._applyPaperTransform(this._paperItem, state, context, width, height, p);
        return this._paperItem;
      }
    }

    // 4) 解析输入
    let renderInput = { width, height, timeMs };
    if (this.html) {
      let effectiveHtml = this.html;

      // 4a) Tailwind CSS 注入(若开启)
      //   - 直接读 CSS(同步),无编译开销
      //   - 失败不阻塞:打 warning,继续渲染
      if (this.tailwind) {
        const twConfig = this.tailwind === true ? {} : this.tailwind;
        try {
          const tailwindCss = getTailwindCss(twConfig);
          effectiveHtml = `<style>${tailwindCss}</style>\n` + effectiveHtml;
        } catch (e) {
          console.warn(`[HTMLElement] Tailwind CSS 加载失败: ${e.message}`);
        }
      }

      // 4b) 默认 font-family 注入
      effectiveHtml = this.autoDefaultFont
        ? injectDefaultFontFamily(effectiveHtml)
        : effectiveHtml;

      renderInput.html = effectiveHtml;
    } else if (this.node) {
      renderInput.node = this.node;
    } else if (this.jsx) {
      // JSX 实际是 React.createElement 调用的语法糖,无法直接解析。
      // 建议用户传入 html 字符串或 node tree;此处仅给出提示。
      console.warn('[HTMLElement] jsx 字段无法在 Node 中直接解析,请改用 html 字符串或 node tree');
      return null;
    }
    if (this.stylesheets) renderInput.stylesheets = this.stylesheets;
    if (this.fonts) renderInput.fonts = this.fonts;

    // 4c) keyframes 选项预处理(自动应用 animation 属性)
    if (this.keyframes) {
      const { kf, css } = preprocessKeyframes(this.keyframes);
      if (kf) renderInput.keyframes = kf;
      if (css && renderInput.html) {
        renderInput.html = `<style>${css}</style>\n` + renderInput.html;
      }
    }

    if (this.devicePixelRatio) renderInput.devicePixelRatio = this.devicePixelRatio;

    // 5) 调 Takumi 渲染
    let rgba;
    try {
      rgba = await renderHtmlFrame(renderInput);
    } catch (e) {
      // 去重:同一个错误(按 message 前 80 字符)每个元素实例只警告一次
      // 30fps × N 秒 = 每秒 30 行噪音,所以要做缓存
      const sig = (e.message || '').slice(0, 80);
      if (this._lastRenderErr !== sig) {
        this._lastRenderErr = sig;
        console.error('[HTMLElement] Takumi 渲染失败:', e.message,
          '\n  (后续相同错误将静默,渲染占位框代替)');
      }
      return this._renderPlaceholder(layer, state, context, width, height, p, e.message);
    }

    // 6) 把 RGBA buffer 贴到 canvas
    //    注意:必须用 canvas 作为 Raster 源 — Paper.js 的 Raster(imageData)
    //    会报告 loaded=true 但实际上不会绘制到主画布。这是 Paper.js 的限制。
    if (!this._canvas || this._canvas.width !== width || this._canvas.height !== height) {
      this._canvas = paper.createCanvas(width, height);
    }
    const ctx = this._canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);

    // DEBUG: Check rgba content
    let colorful = 0;
    for (let i = 0; i < rgba.length; i += 4) {
      if (rgba[i] > 50 || rgba[i+1] > 50 || rgba[i+2] > 50) colorful++;
    }
    //console.log('[HTMLElement] rgba.length=' + rgba.length + ' colorful=' + colorful);
    // Check _canvas
    const canvasData = ctx.getImageData(0, 0, width, height);
    let ccolor = 0;
    for (let i = 0; i < canvasData.data.length; i += 4) {
      if (canvasData.data[i] > 50 || canvasData.data[i+1] > 50 || canvasData.data[i+2] > 50) ccolor++;
    }
    //console.log('[HTMLElement] _canvas after putImageData colorful=' + ccolor);

    // 7) 销毁旧 Raster(避免叠层)
    if (this._paperItem) {
      try { this._paperItem.remove(); } catch (_) {}
      this._paperItem = null;
    }

    // 8) 创建 Raster(从 canvas 源,Paper.js 异步加载——需 await load)
    const raster = new p.Raster(this._canvas);
    this._paperItem = raster;
    this._applyPaperTransform(raster, state, context, width, height, p);

    // 9) 同步等待 Raster 真正加载,否则 view.draw() 抓不到像素
    if (!raster.loaded) {
      await new Promise((resolve) => {
        raster.once('load', resolve);
        // 兜底 100ms
        setTimeout(resolve, 100);
      });
    }

    if (layer) {
      layer.addChild(raster);
    } else if (project && project.activeLayer) {
      project.activeLayer.addChild(raster);
    }

    this._lastFrameKey = Math.floor(time * 20) / 20;
    return raster;
  }

  /**
   * 应用 Paper.js 变换 / 位置 / 不透明度
   * 注意:calculatePosition 返回容器左上角,Paper.js Raster.position 是中心点
   */
  _applyPaperTransform(raster, state, context, width, height, p) {
    const { x, y } = this.calculatePosition(state, context, { elementWidth: width, elementHeight: height });
    // Raster.position 是中心点 → 偏移 width/2, height/2
    raster.position = new p.Point(x + width / 2, y + height / 2);
    raster.opacity = state.opacity !== undefined ? state.opacity : 1;
    this.applyTransform(raster, state, { applyPosition: false, paperInstance: p });
  }

  /**
   * 降级渲染:渲染失败时显示一个红色占位框
   */
  _renderPlaceholder(layer, state, context, width, height, p, msg) {
    const { x, y } = this.calculatePosition(state, context, { elementWidth: width, elementHeight: height });
    const rect = new p.Path.Rectangle({
      point: [x, y],
      size: [width, height],
      fillColor: new p.Color(0.9, 0.3, 0.3, 0.7),
      strokeColor: new p.Color(0.6, 0, 0),
      strokeWidth: 2,
    });
    const text = new p.PointText({
      point: [x + 12, y + 28],
      content: `HTML render failed: ${msg || ''}`.slice(0, 80),
      fillColor: 'white',
      fontSize: 16,
      fontFamily: 'sans-serif',
      parent: layer || p.project.activeLayer,
    });
    if (layer) layer.addChild(rect);
    return rect;
  }

  destroy() {
    if (this._paperItem) {
      try { this._paperItem.remove(); } catch (_) {}
      this._paperItem = null;
    }
    this._canvas = null;
    super.destroy();
  }
}

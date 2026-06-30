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
import paper from '@chnak/paper';

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
    this.fonts = config.fonts || null; // 详见 utils/takumi-renderer.js
    this.stylesheets = config.stylesheets || null;

    // 节点内 CSS 动画起始偏移(秒)
    this.timeOffset = config.timeOffset !== undefined ? config.timeOffset : 0;

    // 自定义 keyframes 对象(传给 Takumi)
    this.keyframes = config.keyframes || null;

    // devicePixelRatio 缩放
    this.devicePixelRatio = config.devicePixelRatio || undefined;

    // 当前帧缓存(避免同帧重复渲染)
    this._lastFrameKey = null;
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
      renderInput.html = this.html;
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
    if (this.keyframes) renderInput.keyframes = this.keyframes;
    if (this.devicePixelRatio) renderInput.devicePixelRatio = this.devicePixelRatio;

    // 5) 调 Takumi 渲染
    let rgba;
    try {
      rgba = await renderHtmlFrame(renderInput);
    } catch (e) {
      console.error('[HTMLElement] Takumi 渲染失败:', e.message);
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

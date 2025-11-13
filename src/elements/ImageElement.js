import { BaseElement } from './BaseElement.js';
import { DEFAULT_IMAGE_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { imageLoader } from '../utils/image-loader.js';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper-jsdom-canvas';

/**
 * 图片元素
 */
export class ImageElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.IMAGE;
    // 重新合并配置，确保传入的config优先级最高
    this.config = deepMerge({}, DEFAULT_IMAGE_CONFIG, config);
    this.imageData = null;
    this.loaded = false;
  }

  /**
   * 加载图片
   */
  async load() {
    if (this.config.src) {
      try {
        this.imageData = await imageLoader.load(this.config.src);
        this.loaded = true;
      } catch (error) {
        console.error(`Failed to load image: ${this.config.src}`, error);
        this.loaded = false;
      }
    }
  }

  /**
   * 设置图片源
   */
  async setSrc(src) {
    this.config.src = src;
    await this.load();
  }

  /**
   * 设置图片适配方式
   */
  setFit(fit) {
    this.config.fit = fit; // cover, contain, fill, none
  }

  /**
   * 渲染图片元素（使用 Paper.js）
   */
  render(layer, time) {
    if (!this.visible || !this.loaded || !this.imageData) return null;

    const viewSize = paper.view.viewSize;
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);

    // 转换位置和尺寸单位
    let x = state.x;
    let y = state.y;
    let width = state.width;
    let height = state.height;

    if (typeof x === 'string') {
      x = toPixels(x, context.width, 'x');
    }
    if (typeof y === 'string') {
      y = toPixels(y, context.height, 'y');
    }
    if (typeof width === 'string') {
      width = toPixels(width, context.width, 'x');
    }
    if (typeof height === 'string') {
      height = toPixels(height, context.height, 'y');
    }

    // 处理 anchor
    const anchor = state.anchor || [0.5, 0.5];
    const rectX = x - width * anchor[0];
    const rectY = y - height * anchor[1];

    // 使用 Paper.js 的 Raster 渲染图片
    const raster = new paper.Raster(this.imageData);
    raster.position = new paper.Point(x, y);
    raster.size = new paper.Size(width, height);
    raster.opacity = state.opacity !== undefined ? state.opacity : 1;

    // 处理图片适配方式
    if (state.fit === 'cover' || state.fit === 'contain') {
      // Paper.js 的 Raster 需要手动处理适配
      // 这里可以添加额外逻辑
    }

    // 应用变换
    if (state.rotation) {
      raster.rotate(state.rotation);
    }
    if (state.scaleX !== 1 || state.scaleY !== 1) {
      raster.scale(state.scaleX || 1, state.scaleY || 1);
    }

    // 添加到 layer
    layer.addChild(raster);
    return raster;
  }

}


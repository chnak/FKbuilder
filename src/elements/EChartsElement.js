import { BaseElement } from './BaseElement.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import paper from 'paper';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import * as ECharts from 'echarts';
const echartsPolyfill = () => {
  ECharts.Model.prototype.isAnimationEnabled = () => true;
  ECharts.SeriesModel.prototype.isAnimationEnabled = () => true;
  //echarts.PictorialBarView.prototype.isAnimationEnabled = () => true;
};
echartsPolyfill();
export class EChartsElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = 'echarts';
    this.config = deepMerge({}, { option: {}, renderer: 'canvas', theme: null }, config);
    this.option = this.config.option || {};
    this.theme = this.config.theme || null;
    this.backgroundColor = this.config.backgroundColor || this.config.bgcolor || undefined;
    this._canvas = null;
    this._echarts = null;
    this._ready = false;
    this._firstFrameSaved = false;
    this._firstFrameSaved = false;
  }

  async initialize() {
    await super.initialize();
    // 初始使用最小画布（实际尺寸由 render 时根据上下文计算），防止 config 中使用百分比导致 Number() 解析失败
    const w = 1;
    const h = 1;
    this._canvas = paper.createCanvas(w, h);
    this._echarts = ECharts.init(this._canvas, this.theme, { renderer: this.config.renderer, devicePixelRatio: 1, width: w, height: h });
    // 先做一次基础 setOption，后续在 render 中当尺寸确定后会重新 apply
    try {
      this._echarts.setOption({ animation: true, ...this.option, backgroundColor: this.backgroundColor }, true);
    } catch (e) {
      // 某些 option 在小画布上可能出错，忽略安全降级
    }
    
  }

  
  isInitialized() {
    return !!this._ready;
  }

  echartsUpdate(chart, time, delta) {
    const animation = chart._zr.animation;
    if (animation._running && !animation._paused) {
      animation.update(false, time, delta);
    }

  }

  fixZrender(chart) {
    const animation = chart._zr.animation;
    //console.log(animation)
    animation._startLoop = () => (animation._running = true);
    animation.update = function(notTriggerFrameAndStageUpdate, time, delta) {
      let clip = this._head;
      while (clip) {
        const nextClip = clip.next;
        let finished = clip.onframe(time, delta);
        if (finished) {
          clip.ondestroy && clip.ondestroy();
          this.removeClip(clip);
          clip = nextClip;
        } else {
          clip = nextClip;
        }
      }
      
      if (!notTriggerFrameAndStageUpdate) {
        //clip.onframe(delta);
        this.trigger('frame', delta);
        this.stage.update && this.stage.update();
      }
    };
  }

  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null;
    if (!this.isActiveAtTime(time)) return null;
    const { paper: p, project } = this.getPaperInstance(paperInstance);
    const viewSize = project?.view?.viewSize || { width: 1920, height: 1080 };
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);
    const size = this.convertSize(state.width, state.height, context);
    const width = size.width || viewSize.width;
    const height = size.height || viewSize.height;
    // 目标像素尺寸（向上取整至少为 1）
    const targetW = Math.max(1, Math.round(width));
    const targetH = Math.max(1, Math.round(height));
    // 如果画布或 chart 尺寸与目标不一致，则重建 canvas 与 echarts 实例（确保百分比尺寸生效）
    if (!this._canvas || this._canvas.width !== targetW || this._canvas.height !== targetH) {
      try {
        if (this._echarts && typeof this._echarts.dispose === 'function') {
          this._echarts.dispose();
        }
      } catch (_) {}
      this._canvas = paper.createCanvas(targetW, targetH);
      this._echarts = ECharts.init(this._canvas, this.theme, { renderer: this.config.renderer, devicePixelRatio: 1, width: targetW, height: targetH });
      try {
        this._echarts.setOption({ animation: true, ...this.option, backgroundColor: this.backgroundColor }, true);
      } catch (e) {
        // 忽略初始化时可能的错误，render 时继续尝试
      }
      // 需要重新修补 zrender 的动画方法
      try { this.fixZrender(this._echarts); } catch (_) {}
      this._ready = true;
    }
    if (!this._ready) {
      this.fixZrender(this._echarts);
      this._ready = true;
    }
    const ts = Math.max(0, Math.floor(time * 1000));
    const delta = Math.max(0, ts - (this._lastTimestamp || ts));
    this.echartsUpdate(this._echarts, time, delta);
    
    
    const raster = new p.Raster(this._canvas);
    const srcW = this._canvas.width || width;
    const srcH = this._canvas.height || height;
    const { x, y } = this.calculatePosition(state, context, { width, height });
    raster.position = new p.Point(x, y);
    if (srcW > 0 && srcH > 0) {
      const scaleX = width / srcW;
      const scaleY = height / srcH;
      raster.scale(scaleX, scaleY, raster.position);
    }
    raster.opacity = state.opacity !== undefined ? state.opacity : 1;
    this.applyTransform(raster, state, { applyPosition: false, paperInstance: p });
    if (layer) layer.addChild(raster);
    this._paperItem = raster;
    this._lastTimestamp = ts;
    return raster;
  }

  destroy() {
    try { if (this._echarts && typeof this._echarts.dispose === 'function') this._echarts.dispose(); } catch (_) {}
    this._echarts = null;
    this._canvas = null;
    super.destroy();
  }
}

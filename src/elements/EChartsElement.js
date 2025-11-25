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
    this._canvas = null;
    this._echarts = null;
    this._ready = false;
    this._firstFrameSaved = false;
    this._firstFrameSaved = false;
  }

  async initialize() {
    await super.initialize();
    const w = Number(this.config.width) || 1;
    const h = Number(this.config.height) || 1;
    this._canvas = paper.createCanvas(w, h);
    this._echarts = ECharts.init(this._canvas, this.theme, { renderer: this.config.renderer, devicePixelRatio: 1, width: w, height: h });
    this._echarts.setOption({ animation: true, ...this.option }, true);
    
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
}

import { BaseElement } from './BaseElement.js';
import { DEFAULT_IMAGE_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { loadImage } from '@napi-rs/canvas';
import { toPixels } from '../utils/unit-converter.js';
import paper from '@chnak/paper';
import { calculateImageFit } from '../utils/image-fit.js';
import { getPresetAnimation } from '../animations/preset-animations.js';
import { TransformAnimation } from '../animations/TransformAnimation.js';
import { KeyframeAnimation } from '../animations/KeyframeAnimation.js';
import fs from 'fs';
/**
 * 图片元素
 */
export class ImageElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.IMAGE;
    // 重新合并配置，确保传入的config优先级最高
    this.config = deepMerge({}, DEFAULT_IMAGE_CONFIG, config);
    this.src = this.config.src;
    this.imageData = null;
    this.loaded = false;
    this._warnedMissing = false;

    // 缓存 auto 模式选择的方向
    this._cachedZoomDirection = null;

    // 自动注入缩放动画（非 auto 模式）
    this._injectZoomAnimation();
  }

  /**
   * 自动注入缩放动画到动画系统
   */
  _injectZoomAnimation() {
    const zoomDirection = this.config.zoomDirection || 'none';
    if (zoomDirection === 'none' || zoomDirection === 'auto') return;

    const animationMap = {
      'in': 'zoomIn',
      'out': 'zoomOut',
      'left': 'zoomInLeft',
      'right': 'zoomInRight',
    };

    const presetName = animationMap[zoomDirection];
    if (presetName) {
      const preset = getPresetAnimation(presetName);
      if (preset) {
        const animConfig = { ...preset };

        if (preset.type === 'keyframe') {
          if (this.config.zoomAmount !== undefined && this.config.zoomAmount > 0) {
            const amount = this.config.zoomAmount;
            for (const kf of animConfig.keyframes) {
              kf.scaleX = 1 - amount * 0.5;
              kf.scaleY = 1 - amount * 0.5;
              if (presetName === 'zoomInLeft') {
                kf.translateX = -150 * amount * 2;
              } else if (presetName === 'zoomInRight') {
                kf.translateX = 150 * amount * 2;
              }
            }
          }
          const animation = new KeyframeAnimation(animConfig);
          this.addAnimation(animation);
        } else {
          if (this.config.zoomAmount !== undefined && this.config.zoomAmount > 0) {
            const amount = this.config.zoomAmount;
            if (presetName === 'zoomIn') {
              animConfig.from = { scaleX: 1 - amount, scaleY: 1 - amount };
            } else if (presetName === 'zoomOut') {
              animConfig.to = { scaleX: 1 - amount, scaleY: 1 - amount };
            }
          }
          const animation = new TransformAnimation(animConfig);
          this.addAnimation(animation);
        }
      }
    }
  }


  /**
   * 初始化方法 - 使用 canvas loadImage 加载图片
   */
  async initialize(loaded) {
    if(!loaded) {
      await super.initialize();
    }

    if (this.src && !this.loaded) {
      try {
        const isUrl = /^https?:\/\//i.test(this.src);
        if (!isUrl) {
          try {
            if (!fs.existsSync(this.src)) {
              this.loaded = false;
              return;
            }
          } catch (_) {}
        }
        this.imageData = await loadImage(this.src);
        this.loaded = true;
        this._callOnLoaded(this.startTime || 0, null, null);
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
    this.src = src;
    this.loaded = false;
    this.imageData = null;
    await this.initialize(false);
  }

  /**
   * 设置图片适配方式
   */
  setFit(fit) {
    this.config.fit = fit;
  }

  /**
   * 应用视觉效果（滤镜、边框、阴影等）
   */
  applyVisualEffects(raster, state, width, height, paperInstance = null) {
    const { paper: p } = this.getPaperInstance(paperInstance);
    const hasBorder = state.borderWidth > 0;
    const hasShadow = state.shadowBlur > 0;
    const hasFlip = state.flipX || state.flipY;
    const hasBlendMode = state.blendMode && state.blendMode !== 'normal';
    const hasFilter = state.filter ||
      (state.brightness !== 1 || state.contrast !== 1 || state.saturation !== 1 ||
       state.hue !== 0 || state.grayscale > 0);
    const hasGlassEffect = state.glassEffect;

    if (!hasBorder && !hasShadow && !hasFlip && !hasBlendMode && !hasFilter && !hasGlassEffect) {
      return raster;
    }

    const group = new p.Group();

    if (hasFlip) {
      if (state.flipX) raster.scale(-1, 1, raster.position);
      if (state.flipY) raster.scale(1, -1, raster.position);
    }

    if (hasBlendMode) {
      raster.blendMode = state.blendMode;
    }

    if (hasShadow) {
      const shadowRaster = raster.clone();
      shadowRaster.position = new p.Point(
        raster.position.x + (state.shadowOffsetX || 0),
        raster.position.y + (state.shadowOffsetY || 0)
      );
      shadowRaster.opacity = 0.3;
      if (state.shadowColor) {
        const shadowColor = new p.Color(state.shadowColor);
        shadowRaster.tint = shadowColor;
      }
      if (state.shadowBlur > 0) {
        const blurFactor = Math.max(1, state.shadowBlur / 10);
        shadowRaster.size = new p.Size(
          shadowRaster.size.width * (1 + blurFactor * 0.1),
          shadowRaster.size.height * (1 + blurFactor * 0.1)
        );
      }
      group.addChild(shadowRaster);
    }

    group.addChild(raster);

    if (hasBorder) {
      const borderPath = new p.Path.Rectangle({
        rectangle: new p.Rectangle(
          raster.position.x - width / 2,
          raster.position.y - height / 2,
          width,
          height
        ),
        radius: state.borderRadius || 0,
      });
      borderPath.strokeColor = new p.Color(state.borderColor || '#000000');
      borderPath.strokeWidth = state.borderWidth;
      borderPath.fillColor = null;
      group.addChild(borderPath);
    }

    if (hasGlassEffect && state.glassBorder) {
      const glassBorderPath = new p.Path.Rectangle({
        rectangle: new p.Rectangle(
          raster.position.x - width / 2,
          raster.position.y - height / 2,
          width,
          height
        ),
        radius: state.borderRadius || 0,
      });
      glassBorderPath.strokeColor = new p.Color(state.glassBorderColor || '#ffffff');
      glassBorderPath.strokeWidth = state.glassBorderWidth || 1;
      glassBorderPath.fillColor = null;
      glassBorderPath.opacity = 0.5;
      group.addChild(glassBorderPath);
    }

    return group.children.length > 1 ? group : raster;
  }

  /**
   * 计算当前元素进度 (0-1)
   */
  _getProgress(time) {
    const start = this.startTime || 0;
    const duration = this.duration || 1;
    return Math.max(0, Math.min(1, (time - start) / duration));
  }

  /**
   * 获取 auto 模式的随机方向
   */
  _getAutoZoomDirection() {
    if (!this._cachedZoomDirection) {
      const directions = ['left', 'right', 'in', 'out'];
      this._cachedZoomDirection = directions[Math.floor(Math.random() * directions.length)];
    }
    return this._cachedZoomDirection;
  }

  /**
   * 渲染图片元素
   */
  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null;
    if (!this.isActiveAtTime(time)) return null;

    if (!this.loaded) {
      try {
        await Promise.race([
          this.initialize(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Image initialization timeout (5s)')), 5000))
        ]);
      } catch (error) {
        console.error(`[ImageElement] 初始化失败 (id: ${this.id}):`, error.message);
        return null;
      }
    }

    if (!this.loaded || !this.imageData) {
      if (!this._warnedMissing) {
        console.warn(`[ImageElement] 图片未加载 (id: ${this.id})`);
        this._warnedMissing = true;
      }
      return null;
    }

    const { paper: p, project } = this.getPaperInstance(paperInstance);
    const viewSize = project?.view?.viewSize || { width: 1920, height: 1080 };
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);

    // 计算容器尺寸
    const containerSize = this.convertSize(state.width, state.height, context);
    const containerWidth = containerSize.width || viewSize.width;
    const containerHeight = containerSize.height || viewSize.height;

    // 获取图片原始尺寸
    const imageWidth = this.imageData.width || 0;
    const imageHeight = this.imageData.height || 0;

    // 根据 fit 参数计算实际显示尺寸
    const fit = state.fit || this.config.fit || 'cover';
    const fitResult = calculateImageFit({
      imageWidth,
      imageHeight,
      containerWidth,
      containerHeight,
      fit
    });

    const width = fitResult.width;
    const height = fitResult.height;
    const { x, y } = this.calculatePosition(state, context, { width, height });

    if (!this.imageData) {
      console.warn('[ImageElement] 图片数据未加载');
      return null;
    }

    // 创建 Raster
    const raster = new p.Raster(this.imageData);
    raster.size = new p.Size(width, height);
    raster.position = new p.Point(x, y);

    // 处理 zoomDirection（auto 模式在渲染时处理）
    const zoomDirection = this.config.zoomDirection || 'none';
    const zoomAmount = this.config.zoomAmount !== undefined ? this.config.zoomAmount : 0.1;

    if (zoomDirection === 'auto') {
      // auto 模式：每次渲染时随机选择方向
      const actualDir = this._getAutoZoomDirection();
      this._applyZoomEffect(raster, time, actualDir, zoomAmount, x, y, p);
    } else if (zoomDirection !== 'none') {
      this._applyZoomEffect(raster, time, zoomDirection, zoomAmount, x, y, p);
    }

    // 应用基础变换
    this.applyTransform(raster, state, {
      applyPosition: true,
      paperInstance: p
    });

    // 应用视觉效果
    const finalItem = this.applyVisualEffects(raster, state, width, height, p);

    if (layer) {
      layer.addChild(finalItem);
    }

    return finalItem;
  }

  /**
   * 获取缩放因子（与 editly getZoomParams 一致）
   */
  _getZoomFactor(progress, direction, amount) {
    if (direction === 'left' || direction === 'right') {
      return 1.3 + amount;
    }
    if (direction === 'in') {
      return 1 + amount * progress;
    }
    if (direction === 'out') {
      return 1 + amount * (1 - progress);
    }
    return 1;
  }

  /**
   * 获取平移参数（与 editly getTranslationParams 一致）
   * 注意：editly 的 range = zoomAmount * 1000，是像素值
   */
  _getTranslation(progress, direction, amount) {
    if (direction !== 'left' && direction !== 'right') return 0;
    const range = amount * 1000;
    if (direction === 'right') {
      return progress * range - range / 2;
    }
    if (direction === 'left') {
      return -(progress * range - range / 2);
    }
    return 0;
  }

  /**
   * 应用缩放效果（与 editly 行为一致）
   */
  _applyZoomEffect(raster, time, direction, amount, baseX, baseY, paper) {
    const progress = this._getProgress(time);

    // 获取缩放因子
    const scaleFactor = this._getZoomFactor(progress, direction, amount);

    // 获取平移参数
    const translation = this._getTranslation(progress, direction, amount);

    // 应用缩放（基于 raster 的中心点）
    if (scaleFactor !== 1) {
      raster.scale(scaleFactor, scaleFactor, raster.position);
    }

    // 应用平移
    if (translation !== 0) {
      raster.position = new paper.Point(baseX + translation, baseY);
    }
  }
}

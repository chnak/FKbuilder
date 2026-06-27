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
   * 注意：在构造函数中调用时，startTime/endTime 可能还未设置
   * 所以如果 startTime 无效，延迟到 initialize 时再注入
   */
  _injectZoomAnimation() {
    const zoomDirection = this.config.zoomDirection || 'none';
    if (zoomDirection === 'none' || zoomDirection === 'auto') return;


    // 如果 startTime 无效（undefined），延迟到 initialize 时再注入
    if (this.startTime === undefined || this.startTime === null) {
      return;
    }

    this._doInjectZoomAnimation();
  }


  /**
   * 实际执行 Ken Burns 动画注入
   * 可在需要时调用以重新计算动画
   */
  _doInjectZoomAnimation() {
    const zoomDirection = this.config.zoomDirection || 'none';
    if (zoomDirection === 'none' || zoomDirection === 'auto') return;

    // 获取 Ken Burns 参数
    const zoomAmount = this.config.zoomAmount !== undefined ? this.config.zoomAmount : 0.2;
    // 动画时长使用元素的有效时长（endTime - startTime），确保动画覆盖整个元素周期
    const elementDuration = (this.endTime !== undefined && this.endTime !== Infinity) 
      ? (this.endTime - this.startTime) 
      : (this.duration || 5);
    
    // 设置 this.duration 确保 _getProgress 正确计算进度
    this.duration = elementDuration;

    // 计算缩放值
    // zoomAmount = 0.2 → scale 从 1.0 到 1.3
    const scaleTo = 1 + zoomAmount * 1.5;
    const scaleFrom = 1.0;

    // 计算最大平移量
    // 根据时长动态调整：如果场景时长超过5秒，位移按比例增加
    // 与放大效果保持一致：放大最终值为 1 + zoomAmount * 1.5
    // 位移最终值 = zoomAmount * zoomPanRatio * (elementDuration / 5)
    // zoomPanRatio 可配置，默认 300 像素
    const zoomPanRatio = this.config.zoomPanRatio !== undefined ? this.config.zoomPanRatio : 300;
    const maxPan = zoomAmount * zoomPanRatio * (elementDuration / 5);

    // 根据方向计算起始和结束位置的平移
    // 关键：从全屏中心开始，向一个方向缓慢移动
    let startPanX = 0, startPanY = 0;
    let endPanX = 0, endPanY = 0;

    if (zoomDirection === 'left') {
      // 向左移动 → 看到的内容从中心向右移动
      endPanX = -maxPan;
    } else if (zoomDirection === 'right') {
      // 向右移动 → 图片位置增加（向右）
      endPanX = maxPan;
    } else if (zoomDirection === 'up') {
      // 向上移动 → 图片位置减少（向上）
      endPanY = -maxPan;
    } else if (zoomDirection === 'down') {
      // 向下移动 → 图片位置增加（向下）
      endPanY = maxPan;
    } else if (zoomDirection === 'diagonal1') {
      // 左上到右下 → 向右下方向
      endPanX = maxPan;
      endPanY = maxPan;
    } else if (zoomDirection === 'diagonal2') {
      // 右上到左下 → 向左下方向
      endPanX = -maxPan;
      endPanY = maxPan;
    } else if (zoomDirection === 'diagonal3') {
      // 左下到右上 → 向右上方向
      endPanX = maxPan;
      endPanY = -maxPan;
    } else if (zoomDirection === 'diagonal4') {
      // 右下到左上 → 向左上方向
      endPanX = -maxPan;
      endPanY = -maxPan;
    } else if (zoomDirection === 'diagonal5') {
      // 左上到右下（大角度，更水平）
      endPanX = maxPan;
      endPanY = maxPan;
    } else if (zoomDirection === 'diagonal6') {
      // 右上到左下（大角度，更水平）
      endPanX = -maxPan;
      endPanY = maxPan;
    }

    // 创建 Ken Burns 关键帧动画
    // 从全屏中心开始，随着放大有轻微的平移
    // 使用秒级时间格式（关键帧 time 使用秒）
    const kenBurnsConfig = {
      type: 'keyframe',
      keyframes: [
        {
          time: 0,
          scaleX: scaleFrom,
          scaleY: scaleFrom,
          translateX: startPanX,
          translateY: startPanY,
        },
        {
          time: elementDuration,  // 使用秒级时间
          scaleX: scaleTo,
          scaleY: scaleTo,
          translateX: endPanX,
          translateY: endPanY,
        },
      ],
      duration: elementDuration,
      // 设置 startTime 为元素的 startTime，确保动画在元素激活时开始
      startTime: this.startTime || 0,
      easing: 'linear',
    };

    const animation = new KeyframeAnimation(kenBurnsConfig);
    // 标记为 Ken Burns 动画，便于在 render 时识别和更新
    animation._isKenBurns = true;
    // 关键：将 Ken Burns 动画添加到数组开头，确保它优先于淡入/淡出动画
    // 这样 Ken Burns 的初始状态（scaleX=1, translateX=0）能正确覆盖淡入动画的 finalState
    this.animations.unshift(animation);
  }


  /**
   * 初始化方法 - 使用 canvas loadImage 加载图片
   */
  async initialize(loaded) {
    if(!loaded) {
      await super.initialize();
    }

    // 在 initialize 时，如果 Ken Burns 动画还未注入，则注入
    // 此时 startTime/endTime 应该已经被父容器设置好了
    if (!this._kenBurnsInjected && this.config.zoomDirection && 
        this.config.zoomDirection !== 'none' && this.config.zoomDirection !== 'auto') {
      this._kenBurnsInjected = true;
      this._doInjectZoomAnimation();
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
   * 使用元素的实际时长（endTime - startTime）来计算进度
   */
  _getProgress(time) {
    const start = this.startTime || 0;
    // 使用实际的元素时长，而不是可能不准确的 this.duration
    const elementDuration = (this.endTime !== undefined && this.endTime !== Infinity) 
      ? (this.endTime - start) 
      : (this.duration || 5);
    return Math.max(0, Math.min(1, (time - start) / elementDuration));
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

    let width;
    let height;
    let coverClipRect = null;

    if (fit === 'cover') {
      // cover：图片尺寸超过容器，使用 Group+clipMask 裁剪
      const coverFit = calculateImageFit({
        imageWidth, imageHeight, containerWidth, containerHeight, fit: 'cover'
      });
      width = coverFit.width;
      height = coverFit.height;
      // 记录需要的 clip 矩形（后面创建组时使用，使用容器的绝对坐标）
      coverClipRect = { x: 0, y: 0, width: containerWidth, height: containerHeight };
    } else {
      const fitResult = calculateImageFit({
        imageWidth, imageHeight, containerWidth, containerHeight, fit
      });
      width = fitResult.width;
      height = fitResult.height;
    }

    // 先按容器尺寸计算位置，得到容器的 top-left (x, y)
    const { x, y } = this.calculatePosition(state, context, { elementWidth: containerWidth, elementHeight: containerHeight });

    if (!this.imageData) {
      console.warn('[ImageElement] 图片数据未加载');
      return null;
    }

    // 创建 Raster
    // calculatePosition 返回容器左上角（根据 anchor 调整过）
    // Paper.js 的 raster.position 是中心点 → 偏移 containerWidth/2, containerHeight/2
    const raster = new p.Raster(this.imageData);
    raster.size = new p.Size(width, height);
    raster.position = new p.Point(x + containerWidth / 2, y + containerHeight / 2);

    // 处理 zoomDirection
    const zoomDirection = this.config.zoomDirection || 'none';
    const zoomAmount = this.config.zoomAmount !== undefined ? this.config.zoomAmount : 0.1;

    const isCover = fit === 'cover';

    // 在 clipGroup 包装前对 raster 应用 zoom 效果（非 cover 和 cover 都适用）
    if (zoomDirection === 'auto') {
      const actualDir = this._getAutoZoomDirection();
      this._applyZoomEffect(raster, time, actualDir, zoomAmount, x, y, p);
    } else if (zoomDirection !== 'none') {
      this._applyZoomEffect(raster, time, zoomDirection, zoomAmount, x, y, p);
    }

    // 应用基础变换（Ken Burns 缩放等；不应用位置以保留 zoom 的 translate）
    this.applyTransform(raster, state, {
      applyPosition: false,
      applyOpacity: true,
      applyRotation: true,
      applyScale: true,
      paperInstance: p
    });

    // 应用视觉效果
    // 对于 cover 模式：边框/阴影应基于容器尺寸（而不是 cover-fit 尺寸），否则会偏大
    const effectWidth = isCover ? containerWidth : width;
    const effectHeight = isCover ? containerHeight : height;
    const visualItem = this.applyVisualEffects(raster, state, effectWidth, effectHeight, p);

    // cover 模式：使用 Group + clipMask 实现裁剪
    let finalItem = visualItem;
    if (isCover && coverClipRect) {
      // 元素的中心点（世界坐标）
      const centerX = x + containerWidth / 2;
      const centerY = y + containerHeight / 2;

      // 1) 关键：raster 经过 zoom + applyTransform 后位置/缩放都已就位，
      //    此时它仍处于 world 坐标系。要放进 clipGroup 的局部坐标系，
      //    必须把 raster 的位置从 world 转为 group 局部坐标（减去 group.position）。
      //    visualItem 的所有子项（raster/shadow/border）相对于 visualItem 也有偏移，
      //    一并转换。

      // 2) 在 group 局部坐标 (-containerW/2, -containerH/2) 创建裁剪矩形
      const clipPath = new p.Path.Rectangle({
        rectangle: new p.Rectangle(
          -containerWidth / 2,
          -containerHeight / 2,
          containerWidth,
          containerHeight
        ),
      });

      // 3) 组装 clipGroup
      const clipGroup = new p.Group();
      clipGroup.addChild(clipPath);
      clipPath.clipMask = true;
      clipGroup.clipped = true;

      // 把 visualItem 放进 clipGroup，并把 visualItem 内所有子项的坐标从 world 转为 group 局部
      // （包括 raster 已应用的 zoom translate 和 Ken Burns scale 矩阵）
      if (visualItem === raster) {
        // 简单情况：raster 的 position 是 world 坐标，需要转为局部
        raster.position = new p.Point(
          raster.position.x - centerX,
          raster.position.y - centerY
        );
        clipGroup.addChild(visualItem);
      } else {
        // 视觉特效情况：visualItem 是 Group，遍历其子项转换坐标
        const children = visualItem.children ? [...visualItem.children] : [visualItem];
        for (const child of children) {
          if (child.position) {
            child.position = new p.Point(
              child.position.x - centerX,
              child.position.y - centerY
            );
          }
        }
        clipGroup.addChild(visualItem);
      }

      // 4) 设置 group.position（必须在添加完所有子项后）
      clipGroup.position = new p.Point(centerX, centerY);

      finalItem = clipGroup;
    }

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
  _getTranslation(progress, direction, amount, elementDuration = 5) {
    // 根据时长动态调整位移范围，与 _injectZoomAnimation 中的 maxPan 计算保持一致
    const zoomPanRatio = this.config.zoomPanRatio !== undefined ? this.config.zoomPanRatio : 300;
    const range = amount * zoomPanRatio * (elementDuration / 5);
    let translateX = 0, translateY = 0;

    if (direction === 'left') {
      translateX = -progress * range;
    } else if (direction === 'right') {
      translateX = progress * range;
    } else if (direction === 'up') {
      translateY = -progress * range;
    } else if (direction === 'down') {
      translateY = progress * range;
    } else if (direction === 'diagonal1') {
      // 左上→右下
      translateX = progress * range * 0.7;
      translateY = progress * range * 0.7;
    } else if (direction === 'diagonal2') {
      // 右上→左下
      translateX = -progress * range * 0.7;
      translateY = progress * range * 0.7;
    } else if (direction === 'diagonal3') {
      // 左下→右上
      translateX = progress * range * 0.7;
      translateY = -progress * range * 0.7;
    } else if (direction === 'diagonal4') {
      // 右下→左上
      translateX = -progress * range * 0.7;
      translateY = -progress * range * 0.7;
    } else if (direction === 'diagonal5') {
      // 左上→右下(更陡)
      translateX = progress * range * 0.5;
      translateY = progress * range * 0.8;
    } else if (direction === 'diagonal6') {
      // 右上→左下(更陡)
      translateX = -progress * range * 0.5;
      translateY = progress * range * 0.8;
    }

    // 返回 translateX，translateY 在 _applyZoomEffect 中单独处理
    this._currentTranslateX = translateX;
    this._currentTranslateY = translateY;
    return translateX;
  }

  /**
   * 应用缩放效果（与 editly 行为一致）
   */
  _applyZoomEffect(raster, time, direction, amount, baseX, baseY, paper) {
    const progress = this._getProgress(time);

    // 获取缩放因子
    const scaleFactor = this._getZoomFactor(progress, direction, amount);

    // 获取时长用于计算位移
    const elementDuration = (this.endTime !== undefined && this.endTime !== Infinity) 
      ? (this.endTime - this.startTime) 
      : (this.duration || 5);

    // 获取平移参数
    this._getTranslation(progress, direction, amount, elementDuration);
    const translateX = this._currentTranslateX || 0;
    const translateY = this._currentTranslateY || 0;

    // 应用缩放（基于 raster 的中心点）
    if (scaleFactor !== 1) {
      raster.scale(scaleFactor, scaleFactor, raster.position);
    }

    // 应用平移（X 和 Y 方向）- 在 raster 当前位置基础上偏移
    // 不直接用 baseX/baseY，因为 cover 模式下 raster.position 已被设为容器中心
    if (translateX !== 0 || translateY !== 0) {
      raster.position = new paper.Point(
        raster.position.x + translateX,
        raster.position.y + translateY
      );
    }
  }
}

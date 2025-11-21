import { BaseElement } from './BaseElement.js';
import { DEFAULT_IMAGE_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { loadImage } from 'canvas';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper';
import { calculateImageFit } from '../utils/image-fit.js';
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

  }
  

  /**
   * 初始化方法 - 使用 canvas loadImage 加载图片
   */
  async initialize(loaded) {
    if(!loaded) {
      await super.initialize();
    }
    console.log('📊 文件存在:', fs.existsSync(this.src));
    if (this.src && !this.loaded) {
      try {
        // 使用 canvas loadImage 加载图片（支持文件路径和 URL）
        this.imageData = await loadImage(this.src);
        this.loaded = true;
        // 调用 onLoaded 回调（注意：此时还没有 paperItem，所以传递 null）
        // paperInstance 会在 render 时保存
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
    this.config.fit = fit; // cover, contain, fill, none
  }

  /**
   * 应用视觉效果（滤镜、边框、阴影等）
   * @param {paper.Raster} raster - Paper.js Raster 对象
   * @param {Object} state - 元素状态
   * @param {number} width - 元素宽度
   * @param {number} height - 元素高度
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   * @returns {paper.Group|paper.Raster} 应用效果后的对象
   */
  applyVisualEffects(raster, state, width, height, paperInstance = null) {
    // 获取 Paper.js 实例
    const { paper: p } = this.getPaperInstance(paperInstance);
    // 检查是否有视觉效果
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

    // 创建组来包含所有效果
    const group = new p.Group();
    
    // 应用翻转
    if (hasFlip) {
      if (state.flipX) {
        raster.scale(-1, 1, raster.position);
      }
      if (state.flipY) {
        raster.scale(1, -1, raster.position);
      }
    }

    // 应用混合模式
    if (hasBlendMode) {
      raster.blendMode = state.blendMode;
    }

    // 应用阴影（通过创建阴影层）
    if (hasShadow) {
      const shadowRaster = raster.clone();
      shadowRaster.position = new p.Point(
        raster.position.x + (state.shadowOffsetX || 0),
        raster.position.y + (state.shadowOffsetY || 0)
      );
      shadowRaster.opacity = 0.3; // 阴影透明度
      
      // 应用阴影颜色（通过 tint）
      if (state.shadowColor) {
        const shadowColor = new p.Color(state.shadowColor);
        shadowRaster.tint = shadowColor;
      }
      
      // 应用模糊（通过降低分辨率模拟）
      if (state.shadowBlur > 0) {
        const blurFactor = Math.max(1, state.shadowBlur / 10);
        shadowRaster.size = new p.Size(
          shadowRaster.size.width * (1 + blurFactor * 0.1),
          shadowRaster.size.height * (1 + blurFactor * 0.1)
        );
      }
      
      group.addChild(shadowRaster);
    }

    // 添加主图片
    group.addChild(raster);

    // 应用边框（通过绘制边框路径）
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

    // 毛玻璃效果：添加边框（如果启用）
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
      glassBorderPath.opacity = 0.5; // 半透明边框
      group.addChild(glassBorderPath);
    }

    return group.children.length > 1 ? group : raster;
  }

  /**
   * 渲染图片元素（使用 Paper.js）
   * @param {paper.Layer} layer - Paper.js 图层
   * @param {number} time - 当前时间（秒）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null;
    if (!this.isActiveAtTime(time)) return null;
    
    // 确保图片已加载（添加超时保护）
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
      console.warn(`[ImageElement] 图片未加载 (id: ${this.id})`);
      return null;
    }
  
    const { paper: p, project } = this.getPaperInstance(paperInstance);
    const viewSize = project?.view?.viewSize || { width: 1920, height: 1080 };
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);
  
    // 计算容器尺寸（元素的目标尺寸）
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
  
    // 使用适配后的尺寸
    const width = fitResult.width;
    const height = fitResult.height;
    const { x, y } = this.calculatePosition(state, context, { width, height });

    // 直接使用 canvas 库的 Image 对象
    if (!this.imageData) {
      console.warn('[ImageElement] 图片数据未加载');
      return null;
    }

    // 直接使用 Image 对象创建 Raster
    const raster = new p.Raster(this.imageData);
    raster.position = new p.Point(x, y);
    
    // 使用 scale 来设置尺寸，而不是直接设置 size
    // 这样可以避免 Paper.js 内部的 drawImage 错误
    const sourceWidth = this.imageData.width || width;
    const sourceHeight = this.imageData.height || height;
    
    if (sourceWidth > 0 && sourceHeight > 0) {
      const scaleX = width / sourceWidth;
      const scaleY = height / sourceHeight;
      raster.scale(scaleX, scaleY, raster.position);
    } else {
      // 如果无法获取原始尺寸，直接设置 size
      raster.size = new p.Size(width, height);
    }
  
    // 应用变换
    this.applyTransform(raster, state, {
      applyPosition: false,
      paperInstance: p
    });
  
    // 应用视觉效果
    const finalItem = this.applyVisualEffects(raster, state, width, height, p);
  
    // 添加到图层
    if (layer) {
      layer.addChild(finalItem);
    }
  
    return finalItem;
  }

}


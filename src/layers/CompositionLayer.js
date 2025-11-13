import { BaseLayer } from './BaseLayer.js';
import { LayerType } from '../types/enums.js';
import paper from 'paper-jsdom-canvas';

/**
 * 合成图层 - 直接渲染一个 VideoMaker（composition）
 * 这样可以避免多层嵌套 CompositionElement 的问题
 */
export class CompositionLayer extends BaseLayer {
  constructor(config = {}) {
    super(config);
    this.type = LayerType.COMPOSITION;
    this.composition = config.composition || null;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width;
    this.height = config.height;
    this.anchor = config.anchor || [0.5, 0.5];
  }

  /**
   * 设置合成
   */
  setComposition(composition) {
    this.composition = composition;
  }

  /**
   * 渲染合成图层
   */
  async render(layer, time) {
    if (!this.isActiveAtTime(time) || !this.composition) {
      return;
    }

    // 计算嵌套合成的时间（相对于图层的开始时间）
    const nestedTime = Math.max(0, time - this.startTime);
    
    // 限制嵌套时间不超过合成的时长
    const maxNestedTime = this.composition.duration || Infinity;
    if (nestedTime > maxNestedTime) {
      return; // 合成已结束
    }

    // 确保嵌套合成的 renderer 已初始化
    if (!this.composition.renderer) {
      const { Renderer } = await import('../core/Renderer.js');
      this.composition.renderer = new Renderer({
        width: this.composition.width || 1920,
        height: this.composition.height || 1080,
        fps: this.composition.fps || 30,
      });
    }
    
    if (!this.composition.renderer.initialized) {
      await this.composition.renderer.init();
    }

    // 独立渲染嵌套合成
    const nestedCanvas = await this.composition.renderer.renderFrame(
      this.composition.timeline.getLayers(),
      nestedTime,
      this.composition.backgroundColor || 'transparent'
    );

    if (!nestedCanvas) {
      return;
    }

    // 检查 canvas 是否有内容
    const ctx = nestedCanvas.getContext('2d');
    const testImageData = ctx.getImageData(0, 0, Math.min(100, nestedCanvas.width), Math.min(100, nestedCanvas.height));
    let hasContent = false;
    let pixelCount = 0;
    for (let i = 0; i < testImageData.data.length; i += 4) {
      if (testImageData.data[i + 3] > 0 && 
          (testImageData.data[i] > 10 || testImageData.data[i + 1] > 10 || testImageData.data[i + 2] > 10)) {
        hasContent = true;
        pixelCount++;
      }
    }
    
    if (!hasContent) {
      console.warn(`[CompositionLayer] 嵌套合成 canvas 没有内容 (time: ${time}, nestedTime: ${nestedTime})`);
      console.warn(`  嵌套合成尺寸: ${nestedCanvas.width}x${nestedCanvas.height}`);
      console.warn(`  嵌套合成图层数: ${this.composition.timeline.getLayers().length}`);
      return; // 没有内容，不渲染
    }
    
    console.log(`[CompositionLayer] 嵌套合成有内容，像素数: ${pixelCount}`);

    // 将嵌套合成的 canvas 转换为 Raster
    try {
      const dataURL = nestedCanvas.toDataURL('image/png');
      const raster = new paper.Raster(dataURL);
      
      // 等待 Raster 加载完成
      await new Promise((resolve) => {
        if (raster.loaded) {
          resolve();
          return;
        }
        
        const timeout = setTimeout(() => {
          resolve();
        }, 1000);
        
        if (raster.onLoad) {
          const originalOnLoad = raster.onLoad;
          raster.onLoad = () => {
            clearTimeout(timeout);
            if (originalOnLoad) originalOnLoad();
            resolve();
          };
        } else {
          const checkInterval = setInterval(() => {
            if (raster.loaded) {
              clearInterval(checkInterval);
              clearTimeout(timeout);
              resolve();
            }
          }, 50);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          }, 1000);
        }
      });
      
      // 计算位置和尺寸
      const width = this.width || nestedCanvas.width;
      const height = this.height || nestedCanvas.height;
      
      // 设置尺寸（必须在设置位置之前）
      raster.size = new paper.Size(width, height);
      
      // 计算位置：anchor [0.5, 0.5] 表示中心对齐
      // Raster 的 position 是左上角，所以需要根据 anchor 调整
      const rasterOffsetX = -width * this.anchor[0];
      const rasterOffsetY = -height * this.anchor[1];
      raster.position = new paper.Point(this.x + rasterOffsetX, this.y + rasterOffsetY);
      raster.opacity = this.opacity !== undefined ? this.opacity : 1;

      // 添加到 layer
      layer.addChild(raster);
      
      // 确保 Raster 在正确的层级
      console.log(`[CompositionLayer] Raster 已添加: size=${raster.size.width}x${raster.size.height}, position=(${raster.position.x}, ${raster.position.y}), opacity=${raster.opacity}, loaded=${raster.loaded}`);
    } catch (error) {
      console.warn('[CompositionLayer] 创建 Raster 失败:', error);
    }
  }

  /**
   * 销毁图层
   */
  destroy() {
    if (this.composition && this.composition.destroy) {
      this.composition.destroy();
    }
    super.destroy();
  }
}


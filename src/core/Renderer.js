import paper from 'paper';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { createCanvas, registerFont } from 'canvas';
import {initDefaultFont,registerFontFile} from '../utils/font-manager.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDefaultFont();
/**
 * 渲染器类 - 使用 Paper.js 渲染
 */
export class Renderer {
  constructor(config = {}) {
    this.width = config.width || 1920;
    this.height = config.height || 1080;
    this.fps = config.fps || 30;
    this.quality = config.quality || 'high';
    this.canvas = null;
    this.project = null;
    this.paper = null; // Paper.js 实例引用
    this.initialized = false;
    
  }

  /**
   * 初始化渲染器
   */
  async init() {
    if (this.initialized) return;

    // 创建离屏 Canvas（用于最终输出）
    this.canvas = paper.createCanvas(this.width, this.height);
    
    // 创建新的 Paper.js Project（实例化）
    // 每个 Renderer 都有自己独立的 project
    this.project = new paper.Project(this.canvas);
    
    // 保存 paper 引用（用于访问 Paper.js 的类，如 paper.Point, paper.Path 等）
    this.paper = paper;

    this.initialized = true;
  }
  
  /**
   * 获取 Paper.js 实例（用于传递给元素）
   * @returns {Object} Paper.js 实例对象，包含 project 和 paper 类
   */
  getPaperInstance() {
    return {
      project: this.project,
      paper: this.paper, // 用于访问 Paper.js 的类（Point, Path, Color 等）
    };
  }

  /**
   * 设置尺寸
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.project && this.project.view) {
      this.project.view.viewSize = new this.paper.Size(width, height);
    }
  }

  /**
   * 清空场景
   */
  clear() {
    // 清空当前 project 的 activeLayer
    if (this.project && this.project.activeLayer) {
      this.project.activeLayer.removeChildren();
    }
  }

  /**
   * 渲染一帧 - 使用 Paper.js
   * @param {Array} layers - 图层数组
   * @param {number} time - 当前时间（秒）
   * @param {string} backgroundColor - 背景颜色
   */
  async renderFrame(layers, time, backgroundColor = '#000000') {
    if (!this.initialized) {
      await this.init();
    }

    // 先清空 canvas 的 2D context（确保 canvas 有初始状态）
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // 清空 Paper.js 场景（复用 project 时只需要清空子元素）
    if (this.project && this.project.activeLayer) {
      this.project.activeLayer.removeChildren();
    }
    
    // 绘制背景（使用 Paper.js）
    // 只有当背景不是透明时才绘制
    if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0,0,0,0)') {
      const bgRect = new this.paper.Path.Rectangle({
        rectangle: new this.paper.Rectangle(0, 0, this.width, this.height),
        fillColor: backgroundColor,
      });
      bgRect.sendToBack();
    }

    // 按 zIndex 排序图层
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    
    // 收集所有已渲染的元素
    const renderedElements = [];
    
    // 获取 Paper.js 实例（传递给图层和元素）
    const paperInstance = this.getPaperInstance();
    
    // 渲染所有图层到 Paper.js
    for (let i = 0; i < sortedLayers.length; i++) {
      const layer = sortedLayers[i];
      if (layer.isActiveAtTime(time)) {
        // 使用 Paper.js 渲染（支持异步）
        // 传递 paperInstance 给图层，图层再传递给元素
        const result = layer.render(this.project.activeLayer, time, paperInstance);
        if (result && typeof result.then === 'function') {
          await result;
        }
        
        // 收集图层中已渲染的元素
        if (layer.getRenderedElements && typeof layer.getRenderedElements === 'function') {
          const elements = layer.getRenderedElements();
          renderedElements.push(...elements);
        }
      }
    }
    
    // 创建 onFrame 事件对象
    const frameEvent = {
      count: Math.floor(time * this.fps), // 帧计数
      time: time, // 当前时间（秒）
      delta: 1 / this.fps, // 帧间隔（秒）
    };
    
    // 触发元素的 onFrame 回调
    for (const element of renderedElements) {
      if (element.onFrame) {
        // 使用元素保存的 _paperItem 引用，并传递 paperInstance
        element._callOnFrame(frameEvent, element._paperItem, paperInstance);
      }
    }
    
    // 触发全局的 Paper.js onFrame 事件（如果已注册，用于向后兼容）
    if (this.project.view && typeof this.project.view.onFrame === 'function') {
      try {
        this.project.view.onFrame(frameEvent);
      } catch (e) {
        console.warn('[Renderer] 全局 onFrame 事件触发失败:', e);
      }
    }
    
    // 更新视图并绘制到 canvas
    // Paper.js 在 Node.js 环境中需要调用 view.update() 来更新视图
    // 然后使用 view.draw() 将内容绘制到 canvas
    this.project.view.update();
    
    // 检查 project 中的项目数量
    const itemCount = this.project.activeLayer.children.length;
    if (itemCount > 0) {
      // 强制绘制
      this.project.view.draw();
    }

    return this.canvas;
  }

  /**
   * 将 BGRA 格式转换为 RGBA 格式
   * @param {Buffer} bgraBuffer - BGRA 格式的 Buffer
   * @returns {Buffer} RGBA 格式的 Buffer
   */
  convertBGRAtoRGBA(bgraBuffer) {
    const rgbaBuffer = Buffer.allocUnsafe(bgraBuffer.length);
    // 每 4 个字节为一组：BGRA -> RGBA
    for (let i = 0; i < bgraBuffer.length; i += 4) {
      rgbaBuffer[i] = bgraBuffer[i + 2];     // R = B
      rgbaBuffer[i + 1] = bgraBuffer[i + 1]; // G = G
      rgbaBuffer[i + 2] = bgraBuffer[i];     // B = R
      rgbaBuffer[i + 3] = bgraBuffer[i + 3]; // A = A
    }
    return rgbaBuffer;
  }

  /**
   * 获取 Canvas 缓冲区
   * @param {string} format - 格式：'raw'（原始 RGBA 数据）或 'png'（PNG 图片）
   * @returns {Buffer|null} Canvas 缓冲区
   */
  getCanvasBuffer(format = 'raw') {
    if (!this.canvas) return null;
    
    if (format === 'raw') {
      // 使用 toBuffer('raw') 获取原始数据，性能提升 5-10倍
      // 注意：node-canvas 的 toBuffer('raw') 在不同平台上可能返回不同格式：
      // - Windows: BGRA 格式
      // - Linux/Mac: RGBA 格式
      // FFmpeg 需要 RGBA 格式，所以如果是 BGRA 需要转换
      let buffer = this.canvas.toBuffer('raw');
      
      // 验证 buffer 大小是否正确
      const expectedSize = this.width * this.height * 4;
      if (buffer.length !== expectedSize) {
        console.warn(`[Renderer] Buffer size mismatch: expected ${expectedSize}, got ${buffer.length}`);
        // 如果大小不匹配，回退到 PNG 格式
        return this.canvas.toBuffer('image/png');
      }
      
      // 检测平台：Windows 上通常是 BGRA，需要转换为 RGBA
      const platform = process.platform;
      const isWindows = platform === 'win32';
      
      if (isWindows) {
        // Windows 上 toBuffer('raw') 返回 BGRA，需要转换为 RGBA
        buffer = this.convertBGRAtoRGBA(buffer);
      }
      // Linux/Mac 上通常是 RGBA，不需要转换
      
      return buffer;
    } else {
      // PNG 格式（用于保存帧文件或转场处理）
      return this.canvas.toBuffer('image/png');
    }
  }

  /**
   * 获取 Canvas
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * 导出动画帧序列（类似 paper.view.exportFrames）
   * @param {Array} layers - 图层数组
   * @param {Object} options - 导出选项
   * @param {number} options.amount - 要导出的总帧数
   * @param {string} options.directory - 保存帧的目录
   * @param {number} options.fps - 帧率（默认 30）
   * @param {number} options.startTime - 开始时间（秒，默认 0）
   * @param {number} options.endTime - 结束时间（秒）
   * @param {string} options.backgroundColor - 背景颜色（默认 '#000000'）
   * @param {Function} options.onProgress - 进度回调函数 (current, total) => {}
   * @param {Function} options.onComplete - 完成回调函数
   * @returns {Promise<string[]>} 返回所有导出帧的文件路径数组
   */
  async exportFrames(layers, options = {}) {
    const {
      amount,
      directory = './frames',
      fps = this.fps || 30,
      startTime = 0,
      endTime,
      backgroundColor = '#000000',
      onProgress,
      onComplete,
    } = options;

    if (!this.initialized) {
      await this.init();
    }

    // 确保目录存在
    await fs.ensureDir(directory);

    // 计算实际帧数和时间范围
    let totalFrames = amount;
    let actualEndTime = endTime;
    
    if (endTime !== undefined) {
      // 如果指定了结束时间，根据帧率计算帧数
      totalFrames = Math.ceil((endTime - startTime) * fps);
    } else if (amount === undefined) {
      // 如果都没有指定，使用默认值
      totalFrames = 30; // 默认 1 秒
      actualEndTime = startTime + 1;
    } else {
      // 如果只指定了帧数，计算结束时间
      actualEndTime = startTime + totalFrames / fps;
    }

    const framePaths = [];

    // 按 zIndex 排序图层
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = startTime + frame / fps;
      const frameNumber = frame + 1;

      // 渲染帧
      await this.renderFrame(sortedLayers, time, backgroundColor);

      // 保存帧
      const framePath = path.join(directory, `frame_${frameNumber.toString().padStart(4, '0')}.png`);
      const buffer = this.getCanvasBuffer();
      await fs.writeFile(framePath, buffer);
      framePaths.push(framePath);

      // 调用进度回调
      if (onProgress && typeof onProgress === 'function') {
        onProgress(frameNumber, totalFrames);
      }
    }

    // 调用完成回调
    if (onComplete && typeof onComplete === 'function') {
      onComplete(framePaths);
    }

    return framePaths;
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    // 清理 Paper.js 项目
    if (this.project) {
      try {
        this.project.clear();
        // 移除所有图层和项目
        if (this.project.activeLayer) {
          this.project.activeLayer.removeChildren();
        }
        // 移除项目
        if (this.project && this.project.remove) {
          this.project.remove();
        }
      } catch (error) {
        // 忽略清理错误
      }
    }
    
    // 清理 Canvas
    if (this.canvas) {
      try {
        // 清空 canvas 内容
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      } catch (error) {
        // 忽略清理错误
      }
      this.canvas = null;
    }
    
    this.project = null;
    this.initialized = false;
  }
}

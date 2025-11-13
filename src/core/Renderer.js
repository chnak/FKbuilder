import paper from 'paper-jsdom-canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { createCanvas, registerFont } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化默认字体（必须在创建Canvas之前注册）
let fontsInitialized = false;
export function initFonts() {
  if (fontsInitialized) return;
  
  const defaultFontPath = path.join(__dirname, '../fonts/PatuaOne-Regular.ttf');
  if (fs.pathExistsSync(defaultFontPath)) {
    try {
      registerFont(defaultFontPath, { family: 'PatuaOne' });
      fontsInitialized = true;
      console.log('默认字体已注册: PatuaOne');
    } catch (error) {
      console.warn('注册默认字体失败:', error.message);
    }
  } else {
    console.warn(`默认字体文件不存在: ${defaultFontPath}`);
  }
}

// 立即初始化字体
initFonts();

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
    this.initialized = false;
  }

  /**
   * 初始化渲染器
   */
  async init() {
    if (this.initialized) return;

    // 创建离屏 Canvas（用于最终输出）
    this.canvas = paper.createCanvas(this.width, this.height);
    
    // 初始化 Paper.js（使用全局 paper，因为所有元素类都使用全局 paper）
    // 注意：在多层嵌套时，需要确保每个 Renderer 在渲染时使用正确的 project
    paper.setup(this.canvas);

    // 保存 project 引用
    this.project = paper.project;

    this.initialized = true;
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
      this.project.view.viewSize = new paper.Size(width, height);
    }
  }

  /**
   * 清空场景
   */
  clear() {
    // 重新 setup 后，project 可能已经改变，需要重新获取
    if (paper.project && paper.project.activeLayer) {
      paper.project.activeLayer.removeChildren();
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

    // 重新初始化 Paper.js（确保使用当前 canvas）
    // 这样可以避免多个 Renderer 之间的全局状态冲突
    paper.setup(this.canvas);
    this.project = paper.project;

    // 清空 Paper.js 场景（在 setup 之后）
    if (this.project && this.project.activeLayer) {
      this.project.activeLayer.removeChildren();
    }
    
    // 绘制背景（使用 Paper.js）
    // 只有当背景不是透明时才绘制
    if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0,0,0,0)') {
      const bgRect = new paper.Path.Rectangle({
        rectangle: new paper.Rectangle(0, 0, this.width, this.height),
        fillColor: backgroundColor,
      });
      bgRect.sendToBack();
    }

    // 按 zIndex 排序图层
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    
    // 渲染所有图层到 Paper.js
    for (const layer of sortedLayers) {
      if (layer.isActiveAtTime(time)) {
        // 使用 Paper.js 渲染（支持异步）
        // 确保使用当前 project 的 activeLayer
        const result = layer.render(this.project.activeLayer, time);
        if (result && typeof result.then === 'function') {
          await result;
        }
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
   * 获取 Canvas 缓冲区
   */
  getCanvasBuffer() {
    if (!this.canvas) return null;
    return this.canvas.toBuffer('image/png');
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
    if (this.project) {
      this.project.clear();
    }
    this.canvas = null;
    this.project = null;
    this.initialized = false;
  }
}

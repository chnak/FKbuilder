import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import fs from 'fs-extra';
import path from 'path';
import paper from 'paper-jsdom-canvas';

/**
 * JSON 元素 - 支持导入 Paper.js JSON 格式
 * 可以用于导入从 Adobe Illustrator 或其他工具导出的 Paper.js JSON 格式
 */
export class JSONElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.JSON;
    // 重新合并配置
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    
    // JSON 文件路径或 JSON 对象/字符串
    this.src = config.src || config.path || '';
    this.jsonData = config.jsonData || null;
    this.jsonString = config.jsonString || null;
    
    // 加载状态
    this.loaded = false;
    this.loading = false;
    this.jsonItem = null;
    
    // 尺寸和位置
    this.width = config.width || 100;
    this.height = config.height || 100;
    
    // 缩放和适配
    this.fit = config.fit || 'contain'; // contain, cover, fill, scale-down, none
    this.preserveAspectRatio = config.preserveAspectRatio !== undefined ? config.preserveAspectRatio : true;
  }

  /**
   * 加载 JSON 文件或解析 JSON 字符串
   */
  async load() {
    if (this.loaded || this.loading) {
      return;
    }

    this.loading = true;

    try {
      // 如果提供了 JSON 对象，直接使用
      if (this.jsonData && typeof this.jsonData === 'object') {
        // JSON 对象已提供
      } else if (this.jsonString) {
        // 解析 JSON 字符串
        this.jsonData = JSON.parse(this.jsonString);
      } else if (this.src) {
        // 从文件加载
        const jsonPath = path.isAbsolute(this.src) ? this.src : path.resolve(this.src);
        if (await fs.pathExists(jsonPath)) {
          const jsonContent = await fs.readFile(jsonPath, 'utf-8');
          this.jsonData = JSON.parse(jsonContent);
        } else {
          throw new Error(`JSON 文件不存在: ${jsonPath}`);
        }
      } else {
        throw new Error('JSON 元素需要提供 src、jsonString 或 jsonData');
      }

      this.loaded = true;
      this.loading = false;
      
      // 调用 onLoaded 回调
      this._callOnLoaded(this.startTime || 0);
    } catch (error) {
      this.loading = false;
      console.error('[JSONElement] 加载 JSON 失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized() {
    return this.loaded && this.jsonData !== null;
  }

  /**
   * 初始化 JSON（同步方式，在渲染时调用）
   */
  async initialize() {
    if (!this.loaded) {
      await this.load();
    }
  }

  /**
   * 渲染 JSON 元素（使用 Paper.js）
   */
  async render(layer, time) {
    if (!this.visible) return null;

    // 检查时间范围
    if (!this.isActiveAtTime(time)) {
      return null;
    }

    // 如果还没加载，尝试加载
    if (!this.loaded) {
      await this.initialize();
    }

    if (!this.jsonData) {
      return null;
    }

    // 优先使用元素的 canvasWidth/canvasHeight，如果没有则使用 paper.view.viewSize
    const viewSize = paper.view.viewSize;
    const context = { 
      width: this.canvasWidth || viewSize.width, 
      height: this.canvasHeight || viewSize.height 
    };
    const state = this.getStateAtTime(time, context);

    // 转换位置和尺寸单位
    let x = state.x;
    let y = state.y;
    let width = state.width || this.width;
    let height = state.height || this.height;

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

    try {
      // 使用 Paper.js 导入 JSON
      // 注意：paper.project.importJSON 可能不存在，需要手动创建
      let jsonItem;
      
      // 检查 JSON 数据的格式
      // Paper.js JSON 格式通常包含 children 数组或其他项目数据
      if (typeof paper.project.importJSON === 'function') {
        try {
          // 方法1：使用 importJSON（如果可用）
          jsonItem = paper.project.importJSON(this.jsonData);
          // 验证返回的对象是否是有效的 Paper.js 项目
          if (!jsonItem || typeof jsonItem._remove !== 'function') {
            jsonItem = null;
          }
        } catch (e) {
          console.warn('[JSONElement] importJSON 失败，尝试手动创建:', e.message);
          jsonItem = null;
        }
      }
      
      // 如果 importJSON 不可用或失败，手动创建
      if (!jsonItem) {
        if (this.jsonData.children && Array.isArray(this.jsonData.children)) {
          // 方法2：手动创建项目（如果 importJSON 不可用）
          // 尝试从 JSON 数据中恢复项目
          jsonItem = this._createItemFromJSON(this.jsonData);
        } else if (this.jsonData.svg) {
          // 方法3：如果 JSON 包含 SVG 数据，使用 SVG 导入
          if (typeof paper.project.importSVG === 'function') {
            try {
              jsonItem = paper.project.importSVG(this.jsonData.svg);
            } catch (e) {
              console.warn('[JSONElement] SVG 导入失败:', e.message);
            }
          }
        } else {
          // 方法4：尝试直接创建路径（如果 JSON 包含路径数据）
          jsonItem = this._createItemFromJSON(this.jsonData);
        }
      }

      // 验证创建的对象是否是有效的 Paper.js 项目
      if (!jsonItem || typeof jsonItem._remove !== 'function') {
        console.warn('[JSONElement] JSON 导入失败：创建的对象不是有效的 Paper.js 项目');
        return null;
      }

      // 获取 JSON 项目的原始尺寸
      // 检查 bounds 是否存在且有效
      let jsonWidth = width;
      let jsonHeight = height;
      
      if (jsonItem.bounds && typeof jsonItem.bounds.width === 'number' && typeof jsonItem.bounds.height === 'number') {
        jsonWidth = jsonItem.bounds.width;
        jsonHeight = jsonItem.bounds.height;
      } else {
        // 如果 bounds 无效，尝试获取内部尺寸
        try {
          if (jsonItem.children && jsonItem.children.length > 0) {
            // 如果是 Group，计算所有子元素的边界
            const groupBounds = jsonItem.children.reduce((bounds, child) => {
              if (child.bounds) {
                return bounds ? bounds.unite(child.bounds) : child.bounds;
              }
              return bounds;
            }, null);
            if (groupBounds) {
              jsonWidth = groupBounds.width;
              jsonHeight = groupBounds.height;
            }
          }
        } catch (e) {
          console.warn('[JSONElement] 无法获取 JSON 项目尺寸，使用默认尺寸:', e.message);
        }
      }
      
      // 确保尺寸有效
      if (!jsonWidth || jsonWidth <= 0) jsonWidth = width;
      if (!jsonHeight || jsonHeight <= 0) jsonHeight = height;

      // 根据 fit 模式计算缩放
      let scaleX = 1;
      let scaleY = 1;

      if (this.fit === 'contain') {
        // 保持宽高比，完整显示
        const scale = Math.min(width / jsonWidth, height / jsonHeight);
        scaleX = scaleY = scale;
      } else if (this.fit === 'cover') {
        // 保持宽高比，填充整个区域
        const scale = Math.max(width / jsonWidth, height / jsonHeight);
        scaleX = scaleY = scale;
      } else if (this.fit === 'fill') {
        // 拉伸填充
        scaleX = width / jsonWidth;
        scaleY = height / jsonHeight;
      } else if (this.fit === 'scale-down') {
        // 如果 JSON 项目比容器大，则缩小；否则保持原尺寸
        const scale = Math.min(1, Math.min(width / jsonWidth, height / jsonHeight));
        scaleX = scaleY = scale;
      }
      // 'none' 模式保持原始尺寸

      // 应用缩放
      if (scaleX !== 1 || scaleY !== 1) {
        jsonItem.scale(scaleX, scaleY);
      }

      // 计算位置（考虑 anchor）
      const scaledWidth = jsonWidth * scaleX;
      const scaledHeight = jsonHeight * scaleY;
      const itemX = rectX + width * anchor[0] - scaledWidth * 0.5;
      const itemY = rectY + height * anchor[1] - scaledHeight * 0.5;

      jsonItem.position = new paper.Point(itemX + scaledWidth / 2, itemY + scaledHeight / 2);

      // 应用变换（旋转、缩放等，位置已经设置了）
      this.applyTransform(jsonItem, state, {
        applyPosition: false, // 位置已经设置了
      });

      // 添加到 layer
      layer.addChild(jsonItem);

      // 保存引用以便后续清理
      this.jsonItem = jsonItem;

      // 调用 onRender 回调
      this._callOnRender(time);

      return jsonItem;
    } catch (error) {
      console.error('[JSONElement] 渲染 JSON 失败:', error);
      return null;
    }
  }

  /**
   * 从 JSON 数据创建 Paper.js 项目（辅助方法）
   * 支持 Paper.js JSON 格式和简化的路径格式
   */
  _createItemFromJSON(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
      return null;
    }
    
    // 如果包含 children 数组，创建 Group
    if (jsonData.children && Array.isArray(jsonData.children)) {
      const group = new paper.Group();
      
      // 递归处理子元素
      for (const childData of jsonData.children) {
        const childItem = this._createItemFromJSON(childData);
        if (childItem && typeof childItem._remove === 'function') {
          group.addChild(childItem);
        }
      }
      
      // 如果 Group 有子元素，返回它
      if (group.children.length > 0) {
        return group;
      } else {
        group.remove();
        return null;
      }
    }
    
    // 如果包含 className 和 data，尝试创建对应的 Paper.js 对象
    if (jsonData.className && jsonData.data) {
      return this._createItemFromClassData(jsonData.className, jsonData.data);
    }
    
    // 如果包含 segments 或 points，创建路径
    if (jsonData.segments || jsonData.points) {
      return this._createPathFromData(jsonData);
    }
    
    return null;
  }

  /**
   * 根据 className 和 data 创建 Paper.js 对象
   */
  _createItemFromClassData(className, data) {
    if (className === 'Path' || className === 'path') {
      return this._createPathFromData(data);
    } else if (className === 'Group' || className === 'group') {
      if (data.children && Array.isArray(data.children)) {
        const group = new paper.Group();
        for (const childData of data.children) {
          const childItem = this._createItemFromJSON(childData);
          if (childItem && typeof childItem._remove === 'function') {
            group.addChild(childItem);
          }
        }
        return group.children.length > 0 ? group : null;
      }
    } else if (className === 'Circle' || className === 'circle') {
      if (data.center && data.radius) {
        const center = new paper.Point(data.center[0] || data.center.x, data.center[1] || data.center.y);
        const circle = new paper.Path.Circle(center, data.radius);
        this._applyStyleToItem(circle, data);
        return circle;
      }
    } else if (className === 'Rectangle' || className === 'rect') {
      if (data.rectangle || data.rect) {
        const rect = data.rectangle || data.rect;
        const rectangle = new paper.Rectangle(
          rect.x || rect[0] || 0,
          rect.y || rect[1] || 0,
          rect.width || rect[2] || 100,
          rect.height || rect[3] || 100
        );
        const path = new paper.Path.Rectangle(rectangle);
        this._applyStyleToItem(path, data);
        return path;
      }
    }
    
    return null;
  }

  /**
   * 从数据创建路径
   */
  _createPathFromData(data) {
    const path = new paper.Path();
    
    // 处理 segments 或 points
    if (data.segments && Array.isArray(data.segments)) {
      // segments 格式：[[x, y], [x, y], ...] 或 [[x, y, handleIn, handleOut], ...]
      for (const segment of data.segments) {
        if (Array.isArray(segment) && segment.length >= 2) {
          const point = new paper.Point(segment[0], segment[1]);
          if (segment.length >= 6) {
            // 有控制点
            const handleIn = new paper.Point(segment[2], segment[3]);
            const handleOut = new paper.Point(segment[4], segment[5]);
            path.add(new paper.Segment(point, handleIn, handleOut));
          } else {
            path.add(point);
          }
        }
      }
    } else if (data.points && Array.isArray(data.points)) {
      // points 格式：[[x, y], [x, y], ...] 或 [{x, y}, {x, y}, ...]
      for (const pointData of data.points) {
        let point;
        if (Array.isArray(pointData)) {
          point = new paper.Point(pointData[0], pointData[1]);
        } else if (pointData && typeof pointData.x === 'number' && typeof pointData.y === 'number') {
          point = new paper.Point(pointData.x, pointData.y);
        }
        if (point) {
          path.add(point);
        }
      }
    }
    
    // 应用样式
    this._applyStyleToPath(path, data);
    
    // 如果路径没有点，返回 null
    if (path.segments.length === 0) {
      path.remove();
      return null;
    }
    
    return path;
  }

  /**
   * 应用样式到路径
   */
  _applyStyleToPath(path, data) {
    // 闭合路径
    if (data.closed === true) {
      path.closePath();
    }
    
    // 平滑路径
    if (data.smooth === true) {
      path.smooth();
    }
    
    // 应用样式
    this._applyStyleToItem(path, data);
  }

  /**
   * 应用样式到 Paper.js 项目
   */
  _applyStyleToItem(item, data) {
    // 填充颜色
    if (data.fillColor) {
      if (typeof data.fillColor === 'string') {
        item.fillColor = data.fillColor;
      } else if (data.fillColor.hue !== undefined) {
        // HSL 格式
        item.fillColor = {
          hue: data.fillColor.hue,
          saturation: data.fillColor.saturation || 1,
          brightness: data.fillColor.brightness || 1,
          alpha: data.fillColor.alpha !== undefined ? data.fillColor.alpha : 1,
        };
      } else if (data.fillColor.r !== undefined) {
        // RGB 格式
        item.fillColor = {
          r: data.fillColor.r,
          g: data.fillColor.g,
          b: data.fillColor.b,
          alpha: data.fillColor.alpha !== undefined ? data.fillColor.alpha : 1,
        };
      }
    } else if (data.fillColor === null) {
      item.fillColor = null;
    }
    
    // 描边颜色
    if (data.strokeColor) {
      if (typeof data.strokeColor === 'string') {
        item.strokeColor = data.strokeColor;
      } else if (data.strokeColor.hue !== undefined) {
        item.strokeColor = {
          hue: data.strokeColor.hue,
          saturation: data.strokeColor.saturation || 1,
          brightness: data.strokeColor.brightness || 1,
          alpha: data.strokeColor.alpha !== undefined ? data.strokeColor.alpha : 1,
        };
      } else if (data.strokeColor.r !== undefined) {
        item.strokeColor = {
          r: data.strokeColor.r,
          g: data.strokeColor.g,
          b: data.strokeColor.b,
          alpha: data.strokeColor.alpha !== undefined ? data.strokeColor.alpha : 1,
        };
      }
    }
    
    // 描边宽度
    if (typeof data.strokeWidth === 'number') {
      item.strokeWidth = data.strokeWidth;
    }
    
    // 不透明度
    if (typeof data.opacity === 'number') {
      item.opacity = data.opacity;
    }
  }

  /**
   * 销毁元素
   */
  destroy() {
    if (this.jsonItem) {
      this.jsonItem.remove();
      this.jsonItem = null;
    }
    this.jsonData = null;
    this.loaded = false;
    this.loading = false;
    super.destroy();
  }
}


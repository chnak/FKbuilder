import { BaseElement } from './BaseElement.js';
import { DEFAULT_ELEMENT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { ElementType } from '../types/enums.js';
import { toPixels } from '../utils/unit-converter.js';
import paper from 'paper';

/**
 * 路径元素 - 支持自定义路径、贝塞尔曲线等
 */
export class PathElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    this.type = ElementType.PATH;
    // 重新合并配置
    this.config = deepMerge({}, DEFAULT_ELEMENT_CONFIG, config);
    
    // 路径点数组，支持多种格式：
    // 1. [{x: 100, y: 100}, {x: 200, y: 200}, ...]
    // 2. [100, 100, 200, 200, ...] (x, y 交替)
    // 3. [[100, 100], [200, 200], ...]
    this.points = config.points || [];
    
    // 是否闭合路径
    this.closed = config.closed !== undefined ? config.closed : false;
    
    // 是否平滑路径
    this.smooth = config.smooth !== undefined ? config.smooth : false;
    
    // 是否使用贝塞尔曲线（如果为 true，points 需要包含控制点）
    this.bezier = config.bezier !== undefined ? config.bezier : false;
    
    // 填充和描边
    this.fillColor = config.fillColor || config.bgcolor || null;
    this.strokeColor = config.strokeColor || config.borderColor || '#000000';
    this.strokeWidth = config.strokeWidth || config.borderWidth || 1;
    
    // 路径样式
    this.strokeCap = config.strokeCap || 'round';
    this.strokeJoin = config.strokeJoin || 'round';
    this.dashArray = config.dashArray || null;
    this.dashOffset = config.dashOffset || 0;
  }

  /**
   * 设置路径点
   * @param {Array} points - 路径点数组
   */
  setPoints(points) {
    this.points = points;
  }

  /**
   * 添加路径点
   * @param {number|Object} x - X坐标或点对象
   * @param {number} y - Y坐标（如果第一个参数是数字）
   */
  addPoint(x, y) {
    if (typeof x === 'object' && x !== null) {
      this.points.push(x);
    } else {
      this.points.push({ x, y });
    }
  }

  /**
   * 设置是否闭合路径
   */
  setClosed(closed) {
    this.closed = closed;
  }

  /**
   * 设置是否平滑路径
   */
  setSmooth(smooth) {
    this.smooth = smooth;
  }

  /**
   * 规范化路径点数组
   * 将各种格式转换为统一的 {x, y} 格式
   */
  _normalizePoints(points) {
    if (!points || points.length === 0) {
      return [];
    }

    const normalized = [];
    
    // 如果是数字数组 [x, y, x, y, ...]
    if (typeof points[0] === 'number') {
      for (let i = 0; i < points.length; i += 2) {
        if (i + 1 < points.length) {
          normalized.push({ x: points[i], y: points[i + 1] });
        }
      }
    }
    // 如果是二维数组 [[x, y], [x, y], ...]
    else if (Array.isArray(points[0])) {
      for (const point of points) {
        if (Array.isArray(point) && point.length >= 2) {
          normalized.push({ x: point[0], y: point[1] });
        }
      }
    }
    // 如果已经是对象数组 [{x, y}, {x, y}, ...]
    else if (typeof points[0] === 'object') {
      for (const point of points) {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
          normalized.push({ x: point.x, y: point.y });
        }
      }
    }

    return normalized;
  }

  /**
   * 渲染路径元素（使用 Paper.js）
   * @param {paper.Layer} layer - Paper.js 图层
   * @param {number} time - 当前时间（秒）
   * @param {Object} paperInstance - Paper.js 实例 { project, paper }
   */
  render(layer, time, paperInstance = null) {
    if (!this.visible) return null;

    // 获取 Paper.js 实例
    const { paper: p, project } = this.getPaperInstance(paperInstance);

    const viewSize = project && project.view && project.view.viewSize 
      ? project.view.viewSize 
      : { width: 1920, height: 1080 };
    const context = { width: viewSize.width, height: viewSize.height };
    const state = this.getStateAtTime(time, context);

    // 规范化路径点
    const normalizedPoints = this._normalizePoints(this.points);
    
    if (normalizedPoints.length === 0) {
      return null;
    }

    // 使用 BaseElement 的通用方法转换位置
    // state.x 和 state.y 已经在 getStateAtTime 中转换了单位
    const { x, y } = this.convertPosition(state.x, state.y, context);

    // 处理 anchor
    const anchor = state.anchor || [0, 0];
    
    // 创建路径
    let path;
    
    if (this.bezier && normalizedPoints.length >= 4) {
      // 贝塞尔曲线路径
      path = new p.Path();
      
      // 第一个点作为起点
      const firstPoint = normalizedPoints[0];
      path.moveTo(new p.Point(
        x + firstPoint.x - (this.width || 0) * anchor[0],
        y + firstPoint.y - (this.height || 0) * anchor[1]
      ));
      
      // 每三个点为一组：控制点1、控制点2、终点
      for (let i = 1; i < normalizedPoints.length; i += 3) {
        if (i + 2 < normalizedPoints.length) {
          const cp1 = normalizedPoints[i];
          const cp2 = normalizedPoints[i + 1];
          const end = normalizedPoints[i + 2];
          
          path.cubicCurveTo(
            new p.Point(
              x + cp1.x - (this.width || 0) * anchor[0],
              y + cp1.y - (this.height || 0) * anchor[1]
            ),
            new p.Point(
              x + cp2.x - (this.width || 0) * anchor[0],
              y + cp2.y - (this.height || 0) * anchor[1]
            ),
            new p.Point(
              x + end.x - (this.width || 0) * anchor[0],
              y + end.y - (this.height || 0) * anchor[1]
            )
          );
        }
      }
    } else {
      // 普通路径
      path = new p.Path();
      
      for (let i = 0; i < normalizedPoints.length; i++) {
        const point = normalizedPoints[i];
        const paperPoint = new p.Point(
          x + point.x - (this.width || 0) * anchor[0],
          y + point.y - (this.height || 0) * anchor[1]
        );
        
        if (i === 0) {
          path.moveTo(paperPoint);
        } else {
          path.lineTo(paperPoint);
        }
      }
    }

    // 是否闭合路径
    if (this.closed) {
      path.closePath();
    }

    // 是否平滑路径
    if (this.smooth && path.segments.length > 2) {
      path.smooth();
    }

    // 设置填充
    if (this.fillColor) {
      path.fillColor = this.fillColor;
    } else {
      path.fillColor = null;
    }

    // 设置描边
    if (this.strokeColor && this.strokeWidth > 0) {
      path.strokeColor = this.strokeColor;
      path.strokeWidth = this.strokeWidth;
      path.strokeCap = this.strokeCap;
      path.strokeJoin = this.strokeJoin;
      
      if (this.dashArray) {
        path.dashArray = this.dashArray;
        path.dashOffset = this.dashOffset;
      }
    }

    // 添加到 layer
    layer.addChild(path);
    
    // 保存 Paper.js 项目引用（用于 onFrame 回调）
    this._paperItem = path;
    
    // 调用 onRender 回调，传递 Paper.js 项目引用和 paperInstance
    this._callOnRender(time, path, paperInstance);
    
    return path;
  }
}


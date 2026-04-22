import { generateId } from '../utils/helpers.js';
import { LayerType } from '../types/enums.js';

/**
 * 图层基类
 */
export class BaseLayer {
  constructor(config = {}) {
    this.id = generateId('layer');
    this.type = LayerType.ELEMENT;
    this.config = config;
    this.elements = [];
    this.visible = true;
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    this.zIndex = config.zIndex !== undefined ? config.zIndex : 0;
    this.startTime = config.startTime || 0;
    this.endTime = config.endTime || Infinity;
  }

  /**
   * 获取图层类型
   */
  getType() {
    return this.type;
  }

  /**
   * 添加元素
   */
  addElement(element) {
    if (!this.elements.includes(element)) {
      this.elements.push(element);
      element.parent = this;
    }
  }

  /**
   * 移除元素
   */
  removeElement(element) {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
      element.parent = null;
    }
  }

  /**
   * 获取所有元素
   */
  getElements() {
    return [...this.elements];
  }

  /**
   * 清空元素
   */
  clearElements() {
    this.elements.forEach(element => {
      element.parent = null;
    });
    this.elements = [];
  }

  /**
   * 设置可见性
   */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
   * 设置透明度
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * 设置层级
   */
  setZIndex(zIndex) {
    this.zIndex = zIndex;
  }

  /**
   * 判断图层在指定时间是否激活
   */
  isActiveAtTime(time) {
    return this.visible && time >= this.startTime && time < this.endTime;
  }

  /**
   * 渲染图层（子类实现）
   */
  render(scene, time) {
    // 子类实现具体渲染逻辑
    throw new Error('render method must be implemented by subclass');
  }

  /**
   * 销毁图层
   */
  destroy() {
    this.elements.forEach(element => element.destroy());
    this.elements = [];
  }
}


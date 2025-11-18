import { Readable } from 'stream';

/**
 * 帧流类 - 实现"池塘-井-桶"机制（参考 FFCreator）
 * 
 * 工作原理：
 * 1. 从"池塘"（渲染函数）中"打水"（渲染帧）
 * 2. 将"水"倒入"井"（缓冲区）
 * 3. 从"井"中"打水"（读取数据）倒入"桶"（FFmpeg 管道）
 * 4. 如果"井"空了，再从"池塘"中"打水"
 * 
 * 优势：
 * - 支持并行渲染多帧
 * - 自动管理缓冲区大小
 * - 减少内存占用和延迟
 */
export class FrameStream extends Readable {
  constructor(options = {}) {
    super({
      highWaterMark: options.highWaterMark || options.size || 1024 * 1024, // 默认 1MB
    });

    this.size = options.size || 1024 * 1024; // 每次读取的数据大小（字节）
    this.parallel = options.parallel || 1; // 并行渲染的帧数
    this.pullFunc = null; // 拉取帧数据的函数
    this.data = null; // 当前缓冲区数据
    this.cursor = 0; // 当前读取位置
    this.index = 0; // 当前帧索引
    this.fillTime = 0; // 填充数据的总耗时（用于性能统计）
  }

  /**
   * 设置拉取帧数据的函数
   * @param {Function} func - 返回 Promise<Buffer> 的函数
   */
  addPullFunc(func) {
    this.pullFunc = func;
  }

  /**
   * 填充新数据（并行渲染多帧）
   * @returns {Promise<Buffer>} 合并后的缓冲区
   */
  async fillNewData() {
    const { parallel } = this;
    const buffs = [];

    // 并行渲染多帧
    for (let i = 0; i < parallel; i++) {
      const buff = await this.pullFunc();
      if (buff && buff.length > 0) {
        buffs.push(buff);
      }
    }

    // 如果只渲染一帧，直接返回；否则合并所有帧
    return parallel === 1 ? buffs[0] : Buffer.concat(buffs);
  }

  /**
   * 读取数据（Stream 内部调用）
   * @private
   */
  async _read() {
    const { size } = this;

    // 如果缓冲区为空，填充新数据
    if (!this.data) {
      try {
        const startTime = Date.now();
        this.data = await this.fillNewData();
        this.fillTime += Date.now() - startTime;
      } catch (e) {
        console.error('[FrameStream] 填充数据失败:', e);
        this.push(null); // 结束流
        return;
      }
    }

    // 检查数据是否为空
    if (this.isEmpty(this.data)) {
      this.push(null); // 结束流
      return;
    }

    // 从缓冲区中读取指定大小的数据
    let end = size + this.cursor;
    if (end > this.data.length) {
      // 读取剩余的所有数据
      end = this.data.length;
      this.push(this.data.slice(this.cursor, end));
      this.cursor = 0;
      this.data = null; // 清空缓冲区，下次重新填充
    } else {
      // 读取指定大小的数据
      this.push(this.data.slice(this.cursor, end));
      this.cursor = end;
    }
  }

  /**
   * 检查数据是否为空
   * @param {Buffer} data - 数据
   * @returns {boolean}
   */
  isEmpty(data) {
    if (!data) return true;
    return !data.length || data.length === 0;
  }

  /**
   * 销毁流
   */
  destroy() {
    super.destroy();
    this.unpipe();
    this.removeAllListeners();
    this.pullFunc = null;
    this.data = null;
  }
}


/**
 * DOM Polyfill for Node.js environment
 */
import { createCanvas } from 'node-canvas-webgl';

// 创建全局document和window对象
// 确保在全局作用域中可用（不仅限于 global）
if (typeof globalThis !== 'undefined') {
  if (!globalThis.document) {
    globalThis.document = {
      createElement: (tagName) => {
        if (tagName === 'canvas') {
          return createCanvas(1920, 1080);
        }
        return {
          appendChild: () => {},
          removeChild: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          setAttribute: () => {},
          getAttribute: () => null,
          style: {},
        };
      },
      createElementNS: (ns, tagName) => {
        return globalThis.document.createElement(tagName);
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };

    globalThis.window = {
      document: globalThis.document,
      addEventListener: () => {},
      removeEventListener: () => {},
      requestAnimationFrame: (cb) => setTimeout(cb, 16),
      cancelAnimationFrame: (id) => clearTimeout(id),
      devicePixelRatio: 1,
      innerWidth: 1920,
      innerHeight: 1080,
    };
  }
}

// 同时设置到 global（兼容旧版本 Node.js）
if (typeof global !== 'undefined') {
  if (!global.document) {
    global.document = globalThis.document;
    global.window = globalThis.window;
  }
}

// 确保在模块作用域中也可用
if (typeof document === 'undefined') {
  globalThis.document = globalThis.document || global.document;
  globalThis.window = globalThis.window || global.window;
}


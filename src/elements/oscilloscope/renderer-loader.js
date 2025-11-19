import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 渲染器注册表
 */
const renderers = new Map();

/**
 * 自动加载所有渲染器
 */
export async function loadRenderers() {
  const renderersDir = path.join(__dirname, 'renderers');
  
  if (!await fs.pathExists(renderersDir)) {
    console.warn(`[OscilloscopeRenderer] 渲染器目录不存在: ${renderersDir}`);
    return;
  }

  const files = await fs.readdir(renderersDir);
  // 支持 .js 和 .cjs 文件（构建后可能是 .cjs）
  const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.cjs'));

  // 尝试多种方式加载 require
  let localRequire = null;
  
  // 方法1: 直接使用 require（CommonJS 环境）
  try {
    if (typeof require !== 'undefined') {
      localRequire = require;
    }
  } catch (e) {
    // require 不可用
  }
  
  // 方法2: 使用 createRequire（ESM 环境）
  if (!localRequire) {
    try {
      const { createRequire } = await import('module');
      localRequire = createRequire(import.meta.url);
    } catch (e) {
      // createRequire 不可用
    }
  }

  for (const file of jsFiles) {
    try {
      const fileBaseName = path.basename(file, path.extname(file));
      let renderer = null;
      
      if (localRequire) {
        // 使用 require 加载
        const rendererPath = path.join(renderersDir, file);
        const rendererModule = localRequire(rendererPath);
        // CommonJS 模块可能使用 exports.default 或直接导出
        renderer = rendererModule.default || rendererModule;
      } else {
        // ESM 环境：使用动态 import
        const rendererPath = `./renderers/${fileBaseName}`;
        const rendererModule = await import(rendererPath);
        renderer = rendererModule.default;
      }
      
      if (renderer && typeof renderer === 'function') {
        const styleName = renderer.style || fileBaseName;
        renderers.set(styleName, renderer);
        // 如果文件名是 particles，也注册为 dots
        if (styleName === 'particles') {
          renderers.set('dots', renderer);
        }
      }
    } catch (error) {
      // 如果第一种方式失败，尝试另一种方式
      if (!localRequire && (error.code === 'ERR_UNSUPPORTED_DIR_IMPORT' || error.message.includes('Cannot find module'))) {
        try {
          // 尝试使用 require（CommonJS 环境）
          const rendererPath = path.join(renderersDir, file);
          const rendererModule = require(rendererPath);
          const renderer = rendererModule.default || rendererModule;
          if (renderer && typeof renderer === 'function') {
            const styleName = renderer.style || path.basename(file, path.extname(file));
            renderers.set(styleName, renderer);
            if (styleName === 'particles') {
              renderers.set('dots', renderer);
            }
          }
        } catch (requireError) {
          // 忽略错误
        }
      }
    }
  }
}

/**
 * 获取渲染器
 * @param {string} style - 样式名称
 * @returns {Function|null} 渲染器函数
 */
export function getRenderer(style) {
  return renderers.get(style) || null;
}

/**
 * 注册渲染器
 * @param {string} style - 样式名称
 * @param {Function} renderer - 渲染器函数
 */
export function registerRenderer(style, renderer) {
  renderers.set(style, renderer);
}

/**
 * 获取所有已注册的渲染器名称
 * @returns {string[]} 渲染器名称数组
 */
export function getRegisteredStyles() {
  return Array.from(renderers.keys());
}

// 自动加载渲染器（延迟加载，避免循环依赖）
let loadPromise = null;
let renderersLoaded = false;

export function ensureRenderersLoaded() {
  if (renderersLoaded) {
    return Promise.resolve();
  }
  if (!loadPromise) {
    loadPromise = loadRenderers().then(() => {
      renderersLoaded = true;
    });
  }
  return loadPromise;
}

// 在模块加载时预加载渲染器（非阻塞）
if (typeof window === 'undefined') {
  // Node.js 环境：立即开始加载
  ensureRenderersLoaded().catch(err => {
    console.warn('[OscilloscopeRenderer] 预加载渲染器失败:', err.message);
  });
}


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

  console.log(`[OscilloscopeRenderer] 开始加载渲染器，找到 ${jsFiles.length} 个文件:`, jsFiles.join(', '));
  console.log(`[OscilloscopeRenderer] 渲染器目录: ${renderersDir}`);

  // 尝试多种方式加载 require
  let localRequire = null;
  
  // 方法1: 直接使用 require（CommonJS 环境）
  try {
    if (typeof require !== 'undefined') {
      localRequire = require;
      console.log(`[OscilloscopeRenderer] 使用标准 require`);
    }
  } catch (e) {
    // require 不可用
  }
  
  // 方法2: 使用 createRequire（ESM 环境）
  if (!localRequire) {
    try {
      const { createRequire } = await import('module');
      localRequire = createRequire(import.meta.url);
      console.log(`[OscilloscopeRenderer] 使用 createRequire`);
    } catch (e) {
      console.warn(`[OscilloscopeRenderer] createRequire 不可用:`, e.message);
    }
  }

  for (const file of jsFiles) {
    try {
      const fileBaseName = path.basename(file, path.extname(file));
      let renderer = null;
      
      if (localRequire) {
        // 使用 require 加载
        const rendererPath = path.join(renderersDir, file);
        console.log(`[OscilloscopeRenderer] 尝试加载: ${rendererPath}`);
        const rendererModule = localRequire(rendererPath);
        console.log(`[OscilloscopeRenderer] 模块加载成功，keys:`, Object.keys(rendererModule));
        // CommonJS 模块可能使用 exports.default 或直接导出
        renderer = rendererModule.default || rendererModule;
        console.log(`[OscilloscopeRenderer] 提取的渲染器类型:`, typeof renderer);
      } else {
        // ESM 环境：使用动态 import
        const rendererPath = `./renderers/${fileBaseName}`;
        console.log(`[OscilloscopeRenderer] 尝试动态导入: ${rendererPath}`);
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
        console.log(`[OscilloscopeRenderer] ✅ 成功加载渲染器: ${styleName}`);
      } else {
        console.warn(`[OscilloscopeRenderer] ❌ 渲染器 ${file} 导出格式不正确，期望函数，得到:`, typeof renderer);
        if (renderer) {
          console.warn(`  渲染器内容:`, renderer);
        }
      }
    } catch (error) {
      console.warn(`[OscilloscopeRenderer] ❌ 加载渲染器失败 ${file}:`, error.message);
      if (error.stack) {
        console.warn(`  堆栈:`, error.stack.split('\n').slice(0, 5).join('\n'));
      }
      // 如果第一种方式失败，尝试另一种方式
      if (!localRequire && (error.code === 'ERR_UNSUPPORTED_DIR_IMPORT' || error.message.includes('Cannot find module'))) {
        try {
          // 尝试使用 require（CommonJS 环境）
          const rendererPath = path.join(renderersDir, file);
          console.log(`[OscilloscopeRenderer] 尝试备用方法加载: ${rendererPath}`);
          const rendererModule = require(rendererPath);
          const renderer = rendererModule.default || rendererModule;
          if (renderer && typeof renderer === 'function') {
            const styleName = renderer.style || path.basename(file, path.extname(file));
            renderers.set(styleName, renderer);
            if (styleName === 'particles') {
              renderers.set('dots', renderer);
            }
            console.log(`[OscilloscopeRenderer] ✅ 使用备用方法成功加载渲染器: ${styleName}`);
          }
        } catch (requireError) {
          console.warn(`[OscilloscopeRenderer] ❌ 使用备用方法也失败 ${file}:`, requireError.message);
        }
      }
    }
  }
  
  console.log(`[OscilloscopeRenderer] 📊 已加载 ${renderers.size} 个渲染器:`, Array.from(renderers.keys()).join(', '));
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


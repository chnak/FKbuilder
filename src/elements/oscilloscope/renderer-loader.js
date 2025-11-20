import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

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

  // 检测是否是ESM环境（有import.meta.url）
  const isESM = typeof import.meta !== 'undefined' && import.meta.url;

  for (const file of jsFiles) {
    try {
      const fileBaseName = path.basename(file, path.extname(file));
      let renderer = null;
      
      if (isESM) {
        // ESM 环境：使用动态 import
        // 使用相对于当前文件的路径
        const rendererPath = `./renderers/${fileBaseName}.js`;
        try {
          const rendererModule = await import(rendererPath);
          renderer = rendererModule.default;
        } catch (importError) {
          // 如果相对路径失败，尝试使用绝对路径（file:// URL）
          try {
            const absolutePath = path.join(renderersDir, fileBaseName + '.js');
            // 转换为 file:// URL
            const fileUrl = pathToFileURL(absolutePath).href;
            const rendererModule = await import(fileUrl);
            renderer = rendererModule.default;
          } catch (absoluteError) {
            // 如果还是失败，记录错误但继续
            console.warn(`[OscilloscopeRenderer] 无法加载渲染器 ${fileBaseName}:`, importError.message);
          }
        }
      } else {
        // CommonJS 环境：使用 require
        try {
          const rendererPath = path.join(renderersDir, file);
          const rendererModule = require(rendererPath);
          // CommonJS 模块可能使用 exports.default 或直接导出
          renderer = rendererModule.default || rendererModule;
        } catch (requireError) {
          console.warn(`[OscilloscopeRenderer] 无法加载渲染器 ${fileBaseName}:`, requireError.message);
        }
      }
      
      if (renderer && typeof renderer === 'function') {
        const styleName = renderer.style || fileBaseName;
        renderers.set(styleName, renderer);
        // 如果文件名是 particles，也注册为 dots
        if (styleName === 'particles') {
          renderers.set('dots', renderer);
        }
      } else {
        console.warn(`[OscilloscopeRenderer] 渲染器 ${fileBaseName} 不是有效的函数`);
      }
    } catch (error) {
      console.warn(`[OscilloscopeRenderer] 加载渲染器 ${file} 时出错:`, error.message);
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


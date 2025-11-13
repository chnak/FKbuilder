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
  const jsFiles = files.filter(f => f.endsWith('.js'));

  for (const file of jsFiles) {
    try {
      // 使用相对路径导入，避免路径问题
      const rendererModule = await import(`./renderers/${file}`);
      
      if (rendererModule.default && typeof rendererModule.default === 'function') {
        const renderer = rendererModule.default;
        const styleName = renderer.style || path.basename(file, '.js');
        renderers.set(styleName, renderer);
        // 如果文件名是 particles.js，也注册为 dots
        if (styleName === 'particles') {
          renderers.set('dots', renderer);
        }
        console.log(`[OscilloscopeRenderer] 已加载渲染器: ${styleName}`);
      }
    } catch (error) {
      console.warn(`[OscilloscopeRenderer] 加载渲染器失败 ${file}:`, error.message);
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
export function ensureRenderersLoaded() {
  if (!loadPromise) {
    loadPromise = loadRenderers();
  }
  return loadPromise;
}


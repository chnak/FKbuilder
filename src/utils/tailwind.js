/**
 * Tailwind CSS 提供器(轻量,不做编译)
 *
 * 三个来源:
 *   1. 打包的通用 Tailwind CSS (src/assets/tailwind-defaults.css, 158KB, 1000+ utility)
 *   2. 用户传入的 CSS 字符串 (tailwind: { css: '...' })
 *   3. 用户指定的 CSS 文件路径 (tailwind: { input: '/path/to.css' })
 *
 * 不调任何 CLI、不开子进程、不写缓存目录。
 * 想要自定义主题 → 自己 npx tailwindcss 预编译,然后通过 input 或 css 传进来。
 */
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_CSS_PATH = path.resolve(__dirname, '..', 'assets', 'tailwind-defaults.css');

let _bundledCache = null;

function getBundledCss() {
  if (!_bundledCache) {
    if (!fs.existsSync(BUNDLED_CSS_PATH)) {
      throw new Error(
        `[tailwind] 通用 Tailwind CSS 找不到: ${BUNDLED_CSS_PATH}\n` +
        `请重新安装 fkbuilder,或在 addHtml({tailwind:{input:'./your.css'}}) 指定预编译好的 CSS`
      );
    }
    _bundledCache = fs.readFileSync(BUNDLED_CSS_PATH, 'utf8');
  }
  return _bundledCache;
}

/**
 * 获取 Tailwind CSS 文本
 *
 * @param {boolean|object} [config]
 *   - `true`: 返回打包的通用 CSS
 *   - `{ css: '...' }`: 返回传入的 CSS 字符串
 *   - `{ input: '/path.css' }`: 读取本地 CSS 文件
 *
 * @returns {string} CSS 文本
 */
export function getTailwindCss(config = {}) {
  if (typeof config === 'boolean') {
    return config ? getBundledCss() : '';
  }

  if (config.css && typeof config.css === 'string') {
    return config.css;
  }

  if (config.input) {
    const p = path.resolve(config.input);
    if (!fs.existsSync(p)) {
      throw new Error(`[tailwind] CSS 文件不存在: ${p}`);
    }
    return fs.readFileSync(p, 'utf8');
  }

  return getBundledCss();
}

/**
 * 清空内存缓存(用于测试或强制重读)
 */
export function clearTailwindCache() {
  _bundledCache = null;
}
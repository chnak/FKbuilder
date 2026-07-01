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

/**
 * 多个候选路径,按优先级查找(应对 dev/dist/打包后不同位置):
 *   1. <this>/../assets/tailwind-defaults.css        (dist/esm/utils/ → dist/esm/assets/)
 *   2. <this>/../../src/assets/...                     (dist/esm/utils/ → src/assets/,build 没复制时回退)
 *   3. <this>/../../assets/...                         (src/utils/ → src/assets/, dev 模式)
 */
function resolveBundledCssPath() {
  const candidates = [
    path.resolve(__dirname, '..', 'assets', 'tailwind-defaults.css'),
    path.resolve(__dirname, '..', '..', 'src', 'assets', 'tailwind-defaults.css'),
    path.resolve(__dirname, '..', '..', 'assets', 'tailwind-defaults.css'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0]; // fallback,文件找不到时下面的错误信息会用这个路径
}

let _bundledCache = null;
let _bundledPath = null;

function getBundledCss() {
  if (!_bundledCache) {
    const p = _bundledPath || (_bundledPath = resolveBundledCssPath());
    if (!fs.existsSync(p)) {
      throw new Error(
        `[tailwind] 通用 Tailwind CSS 找不到: ${p}\n` +
        `请重新安装 fkbuilder (确保 dist/{esm,cjs}/assets/tailwind-defaults.css 存在),` +
        `或在 addHtml({tailwind:{input:'./your.css'}}) 指定预编译好的 CSS`
      );
    }
    _bundledCache = fs.readFileSync(p, 'utf8');
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
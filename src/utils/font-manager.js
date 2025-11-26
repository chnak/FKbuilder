/**
 * 字体管理器
 */
import { registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 默认字体路径
const DEFAULT_FONT_PATH = path.join(__dirname, '../fonts/PatuaOne-Regular.ttf');
const DEFAULT_FONT_FAMILY = 'PatuaOne'; // 使用无空格的字体名称

// 已注册的字体
const registeredFonts = new Map();

/**
 * 获取所有已注册的字体信息
 * @returns {Array<{fontFamily: string, path: string, options: Object}>}
 */
export function getRegisteredFonts() {
  return Array.from(registeredFonts.entries()).map(([fontFamily, info]) => ({
    fontFamily,
    path: info.path,
    options: info.options,
  }));
}

/**
 * 注册字体
 * @param {string} fontPath - 字体文件路径
 * @param {string} fontFamily - 字体族名称
 * @param {Object} options - 选项 { weight, style }
 */
export function registerFontFile(fontPath, fontFamily, options = {}) {
  if (registeredFonts.has(fontFamily)) {
    return; // 已注册，跳过
  }

  try {
    const resolvedPath = path.isAbsolute(fontPath) 
      ? fontPath 
      : path.resolve(process.cwd(), fontPath);

    if (!fs.pathExistsSync(resolvedPath)) {
      console.warn(`字体文件不存在: ${resolvedPath}`);
      return;
    }

    // 注册字体（必须在创建Canvas之前）
    registerFont(resolvedPath, {
      family: fontFamily,
      weight: options.weight || 'normal',
      style: options.style || 'normal',
    });
    
    // 确保字体已注册（node-canvas的registerFont是同步的）

    registeredFonts.set(fontFamily, {
      path: resolvedPath,
      ...options,
    });

    // console.log(`字体已注册: ${fontFamily} (${resolvedPath})`);
  } catch (error) {
    console.error(`注册字体失败: ${fontFamily}`, error);
  }
}

/**
 * 初始化默认字体
 */
export function initDefaultFont() {
  // 注册默认字体
  if (fs.pathExistsSync(DEFAULT_FONT_PATH)) {
    // 注册主名称
    registerFontFile(DEFAULT_FONT_PATH, DEFAULT_FONT_FAMILY);

    // 注册常见别名和变体，覆盖大小写/空格差异以及 Bold 变体（使用同一个文件作为替代）
    const aliases = [
      'Patua One',
      'patuaone',
      'patuaone Bold',
      'PatuaOne Bold',
      'PatuaOne-Regular',
    ];

    for (const alias of aliases) {
      try {
        if (alias.toLowerCase().includes('bold')) {
          registerFontFile(DEFAULT_FONT_PATH, alias, { weight: 'bold' });
        } else {
          registerFontFile(DEFAULT_FONT_PATH, alias);
        }
      } catch (e) {
        // 忽略单个别名注册失败
      }
    }
  } else {
    console.warn(`默认字体文件不存在: ${DEFAULT_FONT_PATH}`);
  }
}

/**
 * 获取默认字体族名称
 */
export function getDefaultFontFamily() {
  return DEFAULT_FONT_FAMILY;
}

/**
 * 检查字体是否已注册
 */
export function isFontRegistered(fontFamily) {
  return registeredFonts.has(fontFamily);
}

/**
 * 获取已注册的字体名称列表（仅返回名称）
 */
export function getRegisteredFontNames() {
  return Array.from(registeredFonts.keys());
}


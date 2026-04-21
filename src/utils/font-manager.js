/**
 * 字体管理器
 */
import { GlobalFonts } from 'canvas';
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

    // 注册字体（@napi-rs/canvas 使用 GlobalFonts.registerFromPath）
    GlobalFonts.registerFromPath(resolvedPath, fontFamily);

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
  // 注册系统回退字体（Windows）
  const systemFonts = [
    // 核心字体
    { path: 'C:/Windows/Fonts/segoeui.ttf', family: 'SegoeUI' },
    { path: 'C:/Windows/Fonts/seguiemj.ttf', family: 'Segoe UI Emoji' },
    { path: 'C:/Windows/Fonts/seguisb.ttf', family: 'Segoe UI Semibold' },
    { path: 'C:/Windows/Fonts/seguisbi.ttf', family: 'Segoe UI Semibold Italic' },
    { path: 'C:/Windows/Fonts/seguii.ttf', family: 'Segoe UI Italic' },
    { path: 'C:/Windows/Fonts/segouil.ttf', family: 'Segoe UI Light' },
    { path: 'C:/Windows/Fonts/seguiubi.ttf', family: 'Segoe UI' },
    { path: 'C:/Windows/Fonts/segoeprb.ttf', family: 'Segoe Print' },
    { path: 'C:/Windows/Fonts/segoesc.ttf', family: 'Segoe Script' },
    // 中文字体
    { path: 'C:/Windows/Fonts/msyh.ttc', family: 'Microsoft YaHei' },
    { path: 'C:/Windows/Fonts/simhei.ttf', family: 'SimHei' },
    { path: 'C:/Windows/Fonts/simsun.ttc', family: 'SimSun' },
    // 英文字体
    { path: 'C:/Windows/Fonts/arial.ttf', family: 'Arial' },
    { path: 'C:/Windows/Fonts/ariali.ttf', family: 'Arial', style: 'italic' },
    { path: 'C:/Windows/Fonts/arialbd.ttf', family: 'Arial', weight: 'bold' },
    { path: 'C:/Windows/Fonts/arialbi.ttf', family: 'Arial', weight: 'bold', style: 'italic' },
    { path: 'C:/Windows/Fonts/times.ttf', family: 'Times New Roman' },
    { path: 'C:/Windows/Fonts/consola.ttf', family: 'Consolas' },
  ];

  // 注册系统字体
  for (const font of systemFonts) {
    if (fs.pathExistsSync(font.path)) {
      registerFontFile(font.path, font.family, {
        weight: font.weight || 'normal',
        style: font.style || 'normal',
      });
    }
  }

  // 注册默认字体
  if (fs.pathExistsSync(DEFAULT_FONT_PATH)) {
    registerFontFile(DEFAULT_FONT_PATH, DEFAULT_FONT_FAMILY);

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
 * 获取字体回退链
 * @param {string} fontFamily - 首选字体
 * @returns {string} 包含回退字体的字体族字符串
 */
export function getFontFallbackChain(fontFamily) {
  // 完整的回退字体链
  const allFallbacks = [
    fontFamily,                    // 首选字体
    'SegoeUI',                     // Segoe UI
    'Segoe UI',                    // Segoe UI 空格版本
    'Microsoft YaHei',             // 微软雅黑
    'Arial',                       // Arial
    'Segoe UI Emoji',              // Emoji 字体（关键！）
    'sans-serif',                  // 最终回退
  ];

  // 过滤掉未注册的字体
  const availableFonts = allFallbacks.filter(name => {
    if (!name) return false;
    const normalizedName = name.replace(/\s+/g, '').toLowerCase();
    return registeredFonts.has(name) ||
           registeredFonts.has(normalizedName) ||
           Array.from(registeredFonts.keys()).some(key =>
             key.replace(/\s+/g, '').toLowerCase() === normalizedName
           );
  });

  // 如果只有原始字体，直接返回
  if (availableFonts.length <= 1) {
    return fontFamily;
  }

  return availableFonts.join(', ');
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

/**
 * 反注册字体（清理 Worker 中的字体引用）
 * @param {string} fontFamily - 字体族名称
 */
export function unregisterFont(fontFamily) {
  if (registeredFonts.has(fontFamily)) {
    registeredFonts.delete(fontFamily);
  }
}

/**
 * 清空所有已注册的字体
 */
export function clearAllFonts() {
  registeredFonts.clear();
}


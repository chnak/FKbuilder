/**
 * Rollup 构建器
 */
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { config } from './config.js';
import { getAllFiles, ensureDir, copyDir, removeFiles, existsSync } from './file-utils.js';
import { fixRequirePaths, fixFilenameDeclarations, removeDuplicateJSFiles, addFileAPIPolyfill } from './post-process.js';
import { join, relative } from 'path';

/**
 * 创建入口点映射
 * @param {string[]} files - 源文件列表
 * @returns {Object} 入口点映射 { relativePath: absolutePath }
 */
function createEntryPoints(files) {
  const entryPoints = {};
  const entryPointPaths = new Set();
  
  files.forEach(filePath => {
    // 跳过 .cjs 文件（这些文件会直接复制）
    if (filePath.endsWith('.cjs')) {
      return;
    }
    
    // 计算相对路径（相对于 src 目录）
    const relativePath = relative(config.srcDir, filePath).replace(/\.js$/, '');
    entryPoints[relativePath] = filePath;
    entryPointPaths.add(filePath.replace(/\\/g, '/'));
  });
  
  // 创建自定义 external 函数，确保入口文件不被标记为 external
  const originalExternal = config.external;
  config.external = (id, importer) => {
    // 如果 id 是入口文件的绝对路径，不应该被标记为 external
    const normalizedId = id.replace(/\\/g, '/');
    if (entryPointPaths.has(normalizedId)) {
      return false;
    }
    
    // 调用原始 external 函数
    return originalExternal(id, importer);
  };
  
  return entryPoints;
}

/**
 * 构建 ESM 格式
 * @param {Object} entryPoints - 入口点映射
 * @returns {Promise<void>}
 */
async function buildESM(entryPoints) {
  console.log('📦 构建 ESM 格式...');
  
  const build = await rollup({
    input: entryPoints,
    external: config.external,
    plugins: [
      nodeResolve(config.plugins.nodeResolve),
      commonjs(config.plugins.commonjs),
    ],
  });
  
  await build.write({
    dir: config.distESMDir,
    ...config.output.esm,
  });
  
  await build.close();
  console.log('✅ ESM 构建完成\n');
}

/**
 * 构建 CommonJS 格式
 * @param {Object} entryPoints - 入口点映射
 * @returns {Promise<void>}
 */
async function buildCJS(entryPoints) {
  console.log('📦 构建 CommonJS 格式...');
  
  const build = await rollup({
    input: entryPoints,
    external: config.external,
    plugins: [
      nodeResolve(config.plugins.nodeResolve),
      commonjs(config.plugins.commonjs),
    ],
  });
  
  await build.write({
    dir: config.distCJSDir,
    ...config.output.cjs,
  });
  
  await build.close();
  
  // 后处理
  console.log('🔧 修复 CommonJS 文件中的 require 路径...');
  fixRequirePaths(config.distCJSDir, config.postProcess.requirePathExtensions);
  
  console.log('🔧 修复 CommonJS 文件中的 __filename/__dirname 声明...');
  fixFilenameDeclarations(config.distCJSDir, config.postProcess.filenameDeclarationsExtensions);
  
  console.log('🧹 清理多余的 .js 文件...');
  removeDuplicateJSFiles(config.distCJSDir);
  
  console.log('🔧 添加 File API polyfill...');
  addFileAPIPolyfill(join(config.distCJSDir, 'index.cjs'));
  
  console.log('✅ CommonJS 构建完成\n');
}

/**
 * 复制资源文件
 */
function copyAssets() {
  console.log('📁 复制资源文件...');

  // 复制字体文件
  if (config.assets.fonts.src) {
    copyDir(config.assets.fonts.src, config.assets.fonts.destESM);
    copyDir(config.assets.fonts.src, config.assets.fonts.destCJS);
  }

  // 复制 Tailwind 默认 CSS(通用打包 CSS,运行时 fallback 读取)
  if (config.assets.tailwind.src) {
    copyDir(config.assets.tailwind.src, config.assets.tailwind.destESM);
    copyDir(config.assets.tailwind.src, config.assets.tailwind.destCJS);
  }

  console.log('✅ 资源文件复制完成\n');
}

/**
 * 清理构建目录
 */
export function clean() {
  console.log('🧹 清理构建目录...');
  
  // 清理 dist 目录
  if (existsSync(config.distDir)) {
    removeFiles(config.distDir, () => true);
  }
  
  console.log('✅ 清理完成\n');
}

/**
 * 执行构建
 * @param {Object} options - 构建选项
 * @returns {Promise<void>}
 */
export async function build(options = {}) {
  const {
    clean: shouldClean = false,
    watch = false,
  } = options;
  
  try {
    // 清理
    if (shouldClean) {
      clean();
    }
    
    // 确保输出目录存在
    ensureDir(config.distESMDir);
    ensureDir(config.distCJSDir);
    
    // 获取所有源文件
    const allFiles = getAllFiles(config.srcDir, [], {
      excludeDirs: ['node_modules', 'dist', 'output', '.git'],
      includeExtensions: ['.js'],
      excludePatterns: [/\.test\.js$/],
    });
    
    console.log(`📦 找到 ${allFiles.length} 个源文件\n`);
    
    // 创建入口点映射
    const entryPoints = createEntryPoints(allFiles);
    
    // 构建 ESM
    await buildESM(entryPoints);
    
    // 构建 CommonJS
    await buildCJS(entryPoints);
    
    // 复制资源文件
    copyAssets();
    
    console.log('🎉 构建完成！');
    console.log(`   ESM: ${config.distESMDir}/`);
    console.log(`   CJS: ${config.distCJSDir}/`);
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}


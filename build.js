/**
 * 构建脚本 - 将 ESM 源代码编译为 CommonJS 和 ESM 两种格式
 * 使用 esbuild 进行编译
 */

import { build } from 'esbuild';
import { readdirSync, statSync, existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 递归获取所有源文件
 */
function getAllFiles(dir, fileList = []) {
  if (!existsSync(dir)) {
    return fileList;
  }
  
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      // 跳过 node_modules 和输出目录
      if (file !== 'node_modules' && file !== 'dist' && file !== 'output') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.endsWith('.test.js')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

/**
 * 修复 CommonJS 文件中的 require 路径
 * 将 require('./xxx.js') 和 require('../xxx.js') 改为 require('./xxx.cjs') 和 require('../xxx.cjs')
 */
function fixRequirePaths(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = join(dir, file.name);
    
    if (file.isDirectory()) {
      fixRequirePaths(filePath);
    } else if (file.name.endsWith('.cjs')) {
      let content = readFileSync(filePath, 'utf8');
      // 匹配所有相对路径的 require('./xxx.js') 或 require('../xxx.js')
      // 排除 node_modules 和外部依赖
      content = content.replace(/require\((['"])(\.\.?\/[^'"]+)\.js\1\)/g, (match, quote, path) => {
        // 跳过 node_modules 路径和绝对路径
        if (path.includes('node_modules') || path.startsWith('/')) {
          return match;
        }
        // 只处理相对路径（以 ./ 或 ../ 开头）
        if (path.startsWith('./') || path.startsWith('../')) {
          return `require(${quote}${path}.cjs${quote})`;
        }
        return match;
      });
      writeFileSync(filePath, content, 'utf8');
    }
  }
}

/**
 * 修复 CommonJS 文件中的 __filename 和 __dirname 重复声明
 * 在 CommonJS 环境中，这些变量已经存在，不需要声明
 */
function fixFilenameDeclarations(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = join(dir, file.name);
    
    if (file.isDirectory()) {
      fixFilenameDeclarations(filePath);
    } else if (file.name.endsWith('.cjs')) {
      let content = readFileSync(filePath, 'utf8');
      
      // 移除 const __filename = fileURLToPath(import_meta.url) 声明
      // 因为 CommonJS 中 __filename 已经存在
      // 匹配格式：const __filename = (0, import_url.fileURLToPath)(import_meta.url);
      content = content.replace(
        /const __filename = \(0,\s*import_url\.fileURLToPath\)\(import_meta\.url\);/g,
        '// __filename is available in CommonJS'
      );
      
      // 也匹配其他可能的格式
      content = content.replace(
        /const __filename = [^=]*fileURLToPath\(import_meta\.url\);/g,
        '// __filename is available in CommonJS'
      );
      
      // 移除 const __dirname = dirname(__filename) 声明
      // 因为 CommonJS 中 __dirname 已经存在
      content = content.replace(
        /const __dirname = [^;]*dirname\(__filename\);/g,
        '// __dirname is available in CommonJS'
      );
      
      // 如果 import_meta 只用于 __filename，也可以移除
      // 但为了安全，先只移除声明
      
      // 修复 execa 的 require（execa v9 是纯 ES Module）
      // 将 require("execa") 改为动态 import 的包装
      if (content.includes('require("execa")') || content.includes("require('execa')")) {
        // 创建 execa 的异步包装器
        // execa v9 导出的是 { execa } 或 default
        content = content.replace(
          /var import_execa = require\(["']execa["']\);/g,
          `// execa is ES Module, using dynamic import
let _execaModule = null;
async function getExeca() {
  if (!_execaModule) {
    _execaModule = await import("execa");
  }
  // execa v9 可能是 { execa } 或 default
  return _execaModule.execa || _execaModule.default || _execaModule;
}
// 预加载 execa 模块（在第一次调用时）
let _execaLoaded = false;
let _execaLoadPromise = null;

function ensureExecaLoaded() {
  if (!_execaLoadPromise) {
    _execaLoadPromise = getExeca().then(execaFn => {
      _execaLoaded = true;
      return execaFn;
    });
  }
  return _execaLoadPromise;
}

var import_execa = {
  execa: function(...args) {
    // 如果 execa 已经加载，直接调用
    if (_execaLoaded && _execaModule) {
      const execaFn = _execaModule.execa || _execaModule.default || _execaModule;
      if (typeof execaFn === 'function') {
        return execaFn(...args);
      } else if (execaFn && typeof execaFn.execa === 'function') {
        return execaFn.execa(...args);
      }
    }
    
    // 否则，需要先加载 execa
    const execaPromise = ensureExecaLoaded().then(execaFn => {
      // execa 可能是函数本身，或者需要调用
      if (typeof execaFn === 'function') {
        return execaFn(...args);
      } else if (execaFn && typeof execaFn.execa === 'function') {
        return execaFn.execa(...args);
      }
      throw new Error('Failed to load execa');
    });
    
    // 创建一个代理对象，立即设置 stdin/stdout/stderr
    // 这些属性会在 execa 加载后可用
    const proxy = {
      then: execaPromise.then.bind(execaPromise),
      catch: execaPromise.catch.bind(execaPromise),
      finally: execaPromise.finally.bind(execaPromise),
    };
    
    // 异步设置 stdin/stdout/stderr
    execaPromise.then(process => {
      if (process) {
        proxy.stdin = process.stdin;
        proxy.stdout = process.stdout;
        proxy.stderr = process.stderr;
        // 复制其他属性和方法
        Object.keys(process).forEach(key => {
          if (!(key in proxy)) {
            proxy[key] = process[key];
          }
        });
      }
    }).catch(() => {});
    
    return proxy;
  }
};`
        );
        
        // 修复 execa 的调用方式
        // 将 (0, import_execa.execa) 改为 await import_execa.execa
        // 但需要确保调用者已经使用了 await
        // 实际上，由于 import_execa.execa 已经是异步函数，应该可以正常工作
      }
      
      // 如果文件使用了 fetch，确保 File API polyfill 已加载
      // 在文件开头添加 File API polyfill（如果还没有）
      if ((content.includes('fetch(') || content.includes('await fetch')) && !content.includes('File API polyfill')) {
        const filePolyfill = `// Ensure File API is available for fetch
if (typeof globalThis.File === 'undefined') {
  try {
    const undici = require('undici');
    if (undici.File) {
      globalThis.File = undici.File;
    } else {
      globalThis.File = class File {
        constructor(bits, name, options = {}) {
          this.name = name;
          this.size = bits.length || bits.byteLength || 0;
          this.type = options.type || '';
          this.lastModified = options.lastModified || Date.now();
        }
      };
    }
  } catch (e) {
    globalThis.File = class File {
      constructor(bits, name, options = {}) {
        this.name = name;
        this.size = bits.length || bits.byteLength || 0;
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
      }
    };
  }
}

`;
        // 在第一个 require 或 import 之前插入
        const firstRequireIndex = content.search(/var import_|require\(/);
        if (firstRequireIndex > 0) {
          content = content.slice(0, firstRequireIndex) + filePolyfill + content.slice(firstRequireIndex);
        } else {
          content = filePolyfill + content;
        }
      }
      
      // 修复动态 import() 中的 .js 路径，改为 .cjs
      // 匹配 await import("./xxx.js") 或 import("./xxx.js")
      content = content.replace(
        /(await\s+)?import\((['"])(\.\.?\/[^'"]+)\.js\2\)/g,
        (match, awaitKeyword, quote, path) => {
          // 跳过 node_modules 路径
          if (path.includes('node_modules')) {
            return match;
          }
          // 只处理相对路径（以 ./ 或 ../ 开头）
          if (path.startsWith('./') || path.startsWith('../')) {
            return `${awaitKeyword || ''}import(${quote}${path}.cjs${quote})`;
          }
          return match;
        }
      );
      
      writeFileSync(filePath, content, 'utf8');
    }
  }
}

/**
 * 复制字体文件到 dist 目录
 */
function copyFontFiles(outDirESM, outDirCJS) {
  const srcFontsDir = 'src/fonts';
  if (!existsSync(srcFontsDir)) {
    return;
  }
  
  const fonts = readdirSync(srcFontsDir);
  fonts.forEach(font => {
    const srcPath = join(srcFontsDir, font);
    if (statSync(srcPath).isFile()) {
      // 复制到 ESM 目录
      const esmFontsDir = join(outDirESM, 'fonts');
      if (!existsSync(esmFontsDir)) {
        mkdirSync(esmFontsDir, { recursive: true });
      }
      copyFileSync(srcPath, join(esmFontsDir, font));
      
      // 复制到 CJS 目录
      const cjsFontsDir = join(outDirCJS, 'fonts');
      if (!existsSync(cjsFontsDir)) {
        mkdirSync(cjsFontsDir, { recursive: true });
      }
      copyFileSync(srcPath, join(cjsFontsDir, font));
    }
  });
}

/**
 * 添加 File API polyfill 到 CommonJS 入口文件
 * 解决 undici/fetch 在 CommonJS 环境中需要 File API 的问题
 */
function addFileAPIPolyfill(indexPath) {
  if (!existsSync(indexPath)) {
    return;
  }
  
  let content = readFileSync(indexPath, 'utf8');
  
  // 检查是否已经添加了 polyfill
  if (content.includes('File API polyfill')) {
    return;
  }
  
  // 在文件开头添加 File API polyfill
  // Node.js 18+ 有全局 fetch，但 File API 需要 polyfill
  const polyfill = `// File API polyfill for CommonJS (required by undici/fetch)
if (typeof globalThis.File === 'undefined') {
  // 尝试从 undici 获取 File（Node.js 20+）
  try {
    const undici = require('undici');
    if (undici.File) {
      globalThis.File = undici.File;
    } else {
      // 简单的 File polyfill
      globalThis.File = class File {
        constructor(bits, name, options = {}) {
          this.name = name;
          this.size = bits.length || bits.byteLength || 0;
          this.type = options.type || '';
          this.lastModified = options.lastModified || Date.now();
          this._bits = bits;
        }
        async arrayBuffer() {
          if (this._bits instanceof ArrayBuffer) return this._bits;
          if (Buffer.isBuffer(this._bits)) {
            return this._bits.buffer.slice(this._bits.byteOffset, this._bits.byteOffset + this._bits.byteLength);
          }
          return new ArrayBuffer(0);
        }
        async text() {
          if (Buffer.isBuffer(this._bits)) return this._bits.toString('utf8');
          return String(this._bits);
        }
      };
    }
  } catch (e) {
    // 如果 undici 不可用，使用简单 polyfill
    globalThis.File = class File {
      constructor(bits, name, options = {}) {
        this.name = name;
        this.size = bits.length || bits.byteLength || 0;
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
        this._bits = bits;
      }
      async arrayBuffer() {
        if (this._bits instanceof ArrayBuffer) return this._bits;
        if (Buffer.isBuffer(this._bits)) {
          return this._bits.buffer.slice(this._bits.byteOffset, this._bits.byteOffset + this._bits.byteLength);
        }
        return new ArrayBuffer(0);
      }
      async text() {
        if (Buffer.isBuffer(this._bits)) return this._bits.toString('utf8');
        return String(this._bits);
      }
    };
  }
}
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.error = null;
      this.readyState = 0; // EMPTY
    }
    readAsArrayBuffer(file) {
      // Simple implementation
      this.result = file;
      this.readyState = 2; // DONE
      if (this.onload) this.onload({ target: this });
    }
  };
}

`;
  
  content = polyfill + content;
  writeFileSync(indexPath, content, 'utf8');
}

/**
 * 删除 CommonJS 目录中多余的 .js 文件（保留对应的 .cjs 文件）
 */
function removeDuplicateJSFiles(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = join(dir, file.name);
    
    if (file.isDirectory()) {
      removeDuplicateJSFiles(filePath);
    } else if (file.name.endsWith('.js') && !file.name.includes('.cjs')) {
      // 检查是否存在对应的 .cjs 文件
      const cjsPath = filePath.replace(/\.js$/, '.cjs');
      if (existsSync(cjsPath)) {
        // 删除 .js 文件（保留 .cjs 文件）
        try {
          unlinkSync(filePath);
          // 同时删除对应的 .js.map 文件（如果存在）
          const mapPath = filePath + '.map';
          if (existsSync(mapPath)) {
            unlinkSync(mapPath);
          }
        } catch (err) {
          // 忽略删除错误
        }
      }
    }
  }
}

/**
 * 构建函数
 */
async function buildPackage() {
  console.log('🚀 开始构建...\n');

  const entryPoint = 'src/index.js';
  const outDirESM = 'dist/esm';
  const outDirCJS = 'dist/cjs';

  // 确保输出目录存在
  if (!existsSync(outDirESM)) {
    mkdirSync(outDirESM, { recursive: true });
  }
  if (!existsSync(outDirCJS)) {
    mkdirSync(outDirCJS, { recursive: true });
  }

  // 获取所有源文件
  const allFiles = getAllFiles('src');
  console.log(`📦 找到 ${allFiles.length} 个源文件\n`);

  // 构建选项
  // 注意：当 bundle: false 时，不需要 external，因为不会打包依赖
  // esbuild 只会转换模块格式（ESM <-> CJS），保持 import/require 语句不变
  const baseOptions = {
    platform: 'node',
    target: 'node16',
    sourcemap: true,
    keepNames: true,
    bundle: false, // 不打包，保持文件结构，只转换格式
  };

  try {
    // 1. 构建 ESM 格式
    console.log('📦 构建 ESM 格式...');
    await build({
      ...baseOptions,
      entryPoints: allFiles,
      format: 'esm',
      outdir: outDirESM,
      outbase: 'src',
    });
    console.log('✅ ESM 构建完成\n');

    // 2. 构建 CommonJS 格式
    console.log('📦 构建 CommonJS 格式...');
    await build({
      ...baseOptions,
      entryPoints: allFiles,
      format: 'cjs',
      outdir: outDirCJS,
      outbase: 'src',
      outExtension: {
        '.js': '.cjs'  // CommonJS 文件使用 .cjs 扩展名
      },
    });
    
    // 后处理：将 CommonJS 文件中的 require('.js') 改为 require('.cjs')
    console.log('🔧 修复 CommonJS 文件中的 require 路径...');
    fixRequirePaths(outDirCJS);
    
    // 修复 CommonJS 文件中的 __filename 和 __dirname 重复声明问题
    console.log('🔧 修复 CommonJS 文件中的 __filename/__dirname 声明...');
    fixFilenameDeclarations(outDirCJS);
    
    // 删除多余的 .js 文件（只保留 .cjs 文件）
    console.log('🧹 清理多余的 .js 文件...');
    removeDuplicateJSFiles(outDirCJS);
    
    // 复制字体文件到 dist 目录
    console.log('📁 复制字体文件...');
    copyFontFiles(outDirESM, outDirCJS);
    
    // 添加 File API polyfill 到 CommonJS 入口文件
    console.log('🔧 添加 File API polyfill...');
    addFileAPIPolyfill(join(outDirCJS, 'index.cjs'));
    
    console.log('✅ CommonJS 构建完成\n');

    console.log('🎉 构建完成！');
    console.log(`   ESM: ${outDirESM}/`);
    console.log(`   CJS: ${outDirCJS}/`);

  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 运行构建
buildPackage().catch(console.error);


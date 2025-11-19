/**
 * 后处理工具函数
 */
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { readFile, writeFile, existsSync } from './file-utils.js';

/**
 * 修复 CommonJS 文件中的 require 路径
 * 将 require('./xxx.js') 改为 require('./xxx.cjs')
 * @param {string} dir - 目录路径
 * @param {string[]} extensions - 需要处理的文件扩展名
 */
export function fixRequirePaths(dir, extensions = ['.cjs']) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = join(dir, file.name);
    
    if (file.isDirectory()) {
      fixRequirePaths(filePath, extensions);
    } else if (file.isFile()) {
      const shouldProcess = extensions.some(ext => file.name.endsWith(ext));
      if (!shouldProcess) {
        continue;
      }
      
      let content = readFile(filePath);
      let modified = false;
      
      // 匹配所有相对路径的 require('./xxx.js') 或 require('../xxx.js')
      const newContent = content.replace(
        /require\((['"])(\.\.?\/[^'"]+)\.js\1\)/g,
        (match, quote, path) => {
          // 跳过 node_modules 路径和绝对路径
          if (path.includes('node_modules') || path.startsWith('/')) {
            return match;
          }
          // 只处理相对路径（以 ./ 或 ../ 开头）
          if (path.startsWith('./') || path.startsWith('../')) {
            modified = true;
            return `require(${quote}${path}.cjs${quote})`;
          }
          return match;
        }
      );
      
      if (modified) {
        writeFile(filePath, newContent);
      }
    }
  }
}

/**
 * 修复 CommonJS 文件中的 __filename 和 __dirname 重复声明
 * @param {string} dir - 目录路径
 * @param {string[]} extensions - 需要处理的文件扩展名
 */
export function fixFilenameDeclarations(dir, extensions = ['.cjs']) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = join(dir, file.name);
    
    if (file.isDirectory()) {
      fixFilenameDeclarations(filePath, extensions);
    } else if (file.isFile()) {
      const shouldProcess = extensions.some(ext => file.name.endsWith(ext));
      if (!shouldProcess) {
        continue;
      }
      
      let content = readFile(filePath);
      let modified = false;
      
      // 移除所有 const __filename = ... 声明（CommonJS 中 __filename 是内置的）
      // 匹配多行模式，因为 Rollup 生成的代码可能跨多行
      // 使用非贪婪匹配，匹配到第一个分号为止
      const filenamePattern = /const __filename\s*=\s*[^;]+?;/gs;
      if (filenamePattern.test(content)) {
        content = content.replace(filenamePattern, '// __filename is available in CommonJS');
        modified = true;
      }
      
      // 移除所有 const __dirname = ... 声明（CommonJS 中 __dirname 是内置的）
      const dirnamePattern = /const __dirname\s*=\s*[^;]+?;/gs;
      if (dirnamePattern.test(content)) {
        content = content.replace(dirnamePattern, '// __dirname is available in CommonJS');
        modified = true;
      }
      
      if (modified) {
        writeFile(filePath, content);
      }
    }
  }
}

/**
 * 删除多余的 .js 文件（保留对应的 .cjs 文件）
 * @param {string} dir - 目录路径
 */
export function removeDuplicateJSFiles(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = join(dir, file.name);
    
    if (file.isDirectory()) {
      removeDuplicateJSFiles(filePath);
    } else if (file.isFile() && file.name.endsWith('.js') && !file.name.includes('.cjs')) {
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
 * 添加 File API polyfill 到 CommonJS 入口文件
 * @param {string} indexPath - 入口文件路径
 */
export function addFileAPIPolyfill(indexPath) {
  if (!existsSync(indexPath)) {
    return;
  }
  
  let content = readFile(indexPath);
  
  // 检查是否已经添加了 polyfill
  if (content.includes('File API polyfill')) {
    return;
  }
  
  // 在文件开头添加 File API polyfill
  const polyfill = `// File API polyfill for CommonJS (required by undici/fetch)
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
      this.readyState = 0;
    }
    readAsArrayBuffer(file) {
      this.result = file;
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
    }
  };
}

`;
  
  content = polyfill + content;
  writeFile(indexPath, content);
}


/**
 * 构建配置
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

export const config = {
  // 路径配置
  rootDir,
  srcDir: join(rootDir, 'src'),
  distDir: join(rootDir, 'dist'),
  distESMDir: join(rootDir, 'dist', 'esm'),
  distCJSDir: join(rootDir, 'dist', 'cjs'),
  
  // 入口文件
  entryPoint: join(rootDir, 'src', 'index.js'),
  
  // 需要复制的资源目录
  assets: {
    fonts: {
      src: join(rootDir, 'src', 'fonts'),
      destESM: join(rootDir, 'dist', 'esm', 'fonts'),
      destCJS: join(rootDir, 'dist', 'cjs', 'fonts'),
    },
  },
  
  // 外部依赖（不打包）
  external: (id) => {
    // Node.js 内置模块
    if (id.startsWith('node:') || [
      'path', 'fs', 'os', 'url', 'util', 'stream', 'buffer', 
      'events', 'worker_threads', 'child_process', 'module', 
      'crypto', 'http', 'https', 'net', 'tls', 'dns', 'zlib'
    ].includes(id)) {
      return true;
    }
    // 不处理 node_modules 中的包（全部作为外部依赖）
    // 但相对路径（./ 或 ../）和绝对路径（/）应该被打包
    if (!id.startsWith('.') && !id.startsWith('/')) {
      return true;
    }
    return false;
  },
  
  // Rollup 插件配置
  plugins: {
    nodeResolve: {
      preferBuiltins: true,
      exportConditions: ['node', 'default'],
    },
    commonjs: {
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto',
      // 支持动态 require（用于示波器渲染器加载）
      // 忽略动态 require 检查，让运行时动态 require 正常工作
      ignoreDynamicRequires: true,
    },
  },
  
  // 输出配置
  output: {
    esm: {
      format: 'es',
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    cjs: {
      format: 'cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name]-[hash].cjs',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      exports: 'named',
    },
  },
  
  // 后处理配置
  postProcess: {
    // 需要修复 require 路径的文件扩展名
    requirePathExtensions: ['.cjs'],
    // 需要修复 __filename/__dirname 的文件扩展名
    filenameDeclarationsExtensions: ['.cjs'],
  },
};


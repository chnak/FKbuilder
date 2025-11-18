/**
 * Paper.js - Node.js 版本入口文件
 * 使用 vendor/node 下的代码来初始化 paper.js
 * 
 * 这个文件替代了 paper-jsdom-canvas，使用项目本地的 vendor/node 代码
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 1. 首先设置 jsdom 环境（self.js）
// 必须在导入 paper 之前设置，因为 paper.js 在加载时会检查全局的 self
import self from './node/self.js';

// 2. 设置全局环境（将 self 设置为全局）
// Paper.js 需要访问全局的 document, window 等对象
// 必须在 require('paper') 之前设置，因为 paper.js 在初始化时会检查这些全局变量
if (typeof global !== 'undefined') {
    global.self = self;
    global.window = self;
    global.document = self.document;
    global.navigator = self.navigator;
    if (self.HTMLCanvasElement) {
        global.HTMLCanvasElement = self.HTMLCanvasElement;
    }
    if (self.XMLSerializer) {
        global.XMLSerializer = self.XMLSerializer;
    }
}

// 3. 导入 paper 模块（CommonJS）
// paper.js 在加载时会检查全局的 self，如果存在就使用它
const paper = require('paper');

// 4. 扩展 Paper.js（extend.js）
// 这会添加 Node.js 特定的功能，如 createCanvas, exportFrames 等
import extendPaper from './node/extend.js';
extendPaper(paper);

// 导出 paper 对象
export default paper;

// 同时支持命名导出
export { paper };


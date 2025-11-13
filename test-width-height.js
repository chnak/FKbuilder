/**
 * 测试宽高度计算
 */
import { TextElement } from './src/index.js';

// 测试1: 默认配置
console.log('测试1: 默认配置');
const text1 = new TextElement({
  text: '测试',
});
const state1 = text1.getStateAtTime(0, { width: 1920, height: 1080 });
console.log('默认状态:', {
  x: state1.x,
  y: state1.y,
  width: state1.width,
  height: state1.height,
});

// 测试2: 指定宽高度
console.log('\n测试2: 指定宽高度');
const text2 = new TextElement({
  text: '测试',
  x: 960,
  y: 540,
  width: 1920,
  height: 100,
});
const state2 = text2.getStateAtTime(0, { width: 1920, height: 1080 });
console.log('指定宽高度状态:', {
  x: state2.x,
  y: state2.y,
  width: state2.width,
  height: state2.height,
});

// 测试3: 使用单位
console.log('\n测试3: 使用单位');
const text3 = new TextElement({
  text: '测试',
  x: '50vw',
  y: '50vh',
  width: '100vw',
  height: '10vh',
});
const state3 = text3.getStateAtTime(0, { width: 1920, height: 1080 });
console.log('使用单位状态:', {
  x: state3.x,
  y: state3.y,
  width: state3.width,
  height: state3.height,
  '期望x': 1920 * 0.5,
  '期望y': 1080 * 0.5,
  '期望width': 1920,
  '期望height': 1080 * 0.1,
});

// 测试4: 检查配置
console.log('\n测试4: 检查配置');
console.log('text2.config:', {
  x: text2.config.x,
  y: text2.config.y,
  width: text2.config.width,
  height: text2.config.height,
});



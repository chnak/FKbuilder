import { createCanvas } from 'canvas';
import paper from '@chnak/paper';
import { initDefaultFont } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';
initDefaultFont();

const canvas = createCanvas(1920, 1080);
paper.setup(canvas);

const config = {
  text: 'Fubuilder',
  x: '50%',
  y: '50%',
  fontSize: 120,
  fontFamily: 'PatuaOne',
  color: '#000000',
  textAlign: 'center',
  anchor: [0.5, 0.5],
  duration: 3,
  startTime: 0,
  split: 'letter',
};

const element = new TextElement(config);
const layer = new paper.Layer();

console.log('=== 测试 applyTransform ===');

// 直接测试 segment.render
const seg0 = element.segments[0];
const state = seg0.getStateAtTime(1.5, { width: 1920, height: 1080, baseFontSize: 16 });

console.log('State:');
console.log('  x:', state.x);
console.log('  y:', state.y);
console.log('  textAlign:', state.textAlign);
console.log('  anchor:', state.anchor);

// 直接调用 segment.render
seg0.render(layer, 1.5, { paper });

console.log('\nRendered item:');
const item = layer.children[0];
console.log('  position.x:', item.position.x);
console.log('  bounds.x:', item.bounds.x);
console.log('  bounds.width:', item.bounds.width);
console.log('  bounds.center:', item.bounds.x + item.bounds.width/2);
console.log('  justification:', item.justification);

// 验证 applyTransform 做了什么
console.log('\n=== 检查 applyTransform ===');
console.log('applyTransform 被调用时 applyPosition=false');
console.log('所以 position 不应该被 applyTransform 改变');

// 但实际渲染结果显示 position.x=706.02，bounds.center=706.02
// 说明 position 在设置时被改变了

// 检查 TextElement.render 中的完整流程

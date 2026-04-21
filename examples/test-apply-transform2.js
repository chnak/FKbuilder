import { createCanvas } from 'canvas';
import paper from 'paper';
import { initDefaultFont } from '../src/index.js';
import { TextElement } from '../src/elements/TextElement.js';
import { BaseElement } from '../src/elements/BaseElement.js';
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

const seg0 = element.segments[0];
const time = 1.5;
const context = { width: 1920, height: 1080, baseFontSize: 16 };

const state = seg0.getStateAtTime(time, context);

console.log('=== applyTransform 测试 ===');
console.log('state.x:', state.x);
console.log('state.y:', state.y);

// 创建 PointText 模拟 render 中的行为
const x = 706.02;  // 这是 calculateSegmentPosition 返回的值
const y = 468;

const pointText = new paper.PointText(new paper.Point(x, y));
pointText.content = 'F';
pointText.fontSize = 120;
pointText.fontFamily = 'PatuaOne';
pointText.fillColor = '#000000';
pointText.justification = 'left';

// 这是 render 中的 position 设置
pointText.position = new paper.Point(x, y);

console.log('\n设置 position 之后:');
console.log('  position.x:', pointText.position.x);
console.log('  bounds.center:', pointText.bounds.x + pointText.bounds.width/2);

// 现在测试 applyTransform
console.log('\n=== 调用 applyTransform(applyPosition=false) ===');
seg0.applyTransform(pointText, state, {
  applyPosition: false,
  paperInstance: { paper },
});

console.log('applyTransform 之后:');
console.log('  position.x:', pointText.position.x);
console.log('  bounds.center:', pointText.bounds.x + pointText.bounds.width/2);

// 如果 applyPosition=false 但 state.x/state.y 存在，某些情况下还是会应用位置
// 让我直接检查 needsPosition 的值
const applyPosition = false;
const needsPosition = applyPosition && state.x !== undefined && typeof state.x === 'number' && state.y !== undefined && typeof state.y === 'number';
console.log('\nneedsPosition:', needsPosition);
console.log('(因为 applyPosition=false，所以 needsPosition=false)');

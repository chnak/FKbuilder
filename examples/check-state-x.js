import { createCanvas } from 'canvas';
import paper from 'paper';
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

// 手动模拟 TextElement.render 的完整流程
const seg0 = element.segments[0];
const time = 1.5;
const context = { width: 1920, height: 1080, baseFontSize: 16 };

const state = seg0.getStateAtTime(time, context);
console.log('getStateAtTime returned state:');
console.log('  x:', state.x);
console.log('  y:', state.y);

// 检查 state.x 是不是父元素的位置（960）
// 然后看看 calculateSegmentPosition 实际返回了什么
const segPos = seg0.calculateSegmentPosition(state, context, {
  parentX: seg0.config.parentX,
  parentY: seg0.config.parentY,
  parentAnchor: seg0.config.parentAnchor,
  parentTextAlign: seg0.config.parentTextAlign,
  totalTextWidth: seg0.config.totalTextWidth,
  totalTextHeight: seg0.config.totalTextHeight,
  segmentOffsetX: seg0.config.segmentOffsetX,
  segmentOffsetY: seg0.config.segmentOffsetY,
});

console.log('\ncalculateSegmentPosition returned:');
console.log('  x:', segPos.x);
console.log('  y:', segPos.y);

// 在 TextElement.render 中，x 会被赋值为 segmentPos.x
// 然后用这个 x 创建 PointText
console.log('\n在 TextElement.render 中:');
console.log('  x = segmentPos.x =', segPos.x);
console.log('  然后创建 PointText(new Point(x, y))');

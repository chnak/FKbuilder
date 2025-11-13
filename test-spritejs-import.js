/**
 * 测试 SpriteJS 的导入
 */
import spritejs from 'spritejs';

console.log('SpriteJS 默认导出:', typeof spritejs);
console.log('SpriteJS 导出内容:', Object.keys(spritejs || {}));

// 尝试解构
try {
  const { Circle, Rect, Label, Sprite, Group } = spritejs;
  console.log('\n解构结果:');
  console.log('Circle:', typeof Circle, Circle);
  console.log('Rect:', typeof Rect, Rect);
  console.log('Label:', typeof Label, Label);
  console.log('Sprite:', typeof Sprite, Sprite);
  console.log('Group:', typeof Group, Group);
} catch (error) {
  console.error('解构失败:', error);
}

// 尝试直接访问
try {
  console.log('\n直接访问:');
  console.log('spritejs.Circle:', typeof spritejs.Circle, spritejs.Circle);
  console.log('spritejs.Rect:', typeof spritejs.Rect, spritejs.Rect);
  console.log('spritejs.Label:', typeof spritejs.Label, spritejs.Label);
} catch (error) {
  console.error('直接访问失败:', error);
}



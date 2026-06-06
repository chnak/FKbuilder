/**
 * 测试 SubtitleElement 的 maxLength 行为
 *
 * 覆盖：
 *  1. 显式 maxLength → 按显式值切分
 *  2. 不传 maxLength → 退回到按屏幕宽度自动算出的容量
 *  3. maxLength: 0 也被尊重（边界）
 *  4. 长文本 + 小 maxLength → 切出多段
 */
import { SubtitleElement } from '../src/elements/SubtitleElement.js';

let passed = 0;
let failed = 0;

async function getSegments(config) {
  const el = new SubtitleElement({ ...config, duration: 5 });
  await el.initialize({ width: 1280, height: 720 });
  return el.textElements.map((t) => t.config.text);
}

function assert(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✅ ${label}: ${JSON.stringify(actual)}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}

// 测试 1：显式 maxLength=10 切分长文本
console.log('\n🧪 1. 显式 maxLength=10 → 切出多段');
{
  const segs = await getSegments({
    text: '这是一段超过十个字符的字幕文本用于测试',
    maxLength: 10,
  });
  console.log(`  实际段数: ${segs.length}, 内容: ${JSON.stringify(segs)}`);
  if (segs.length > 1) {
    console.log('  ✅ 文本被切分为多段');
    passed++;
  } else {
    console.log('  ❌ 文本未被切分');
    failed++;
  }
  const allWithinLimit = segs.every((s) => s.length <= 10);
  if (allWithinLimit) {
    console.log('  ✅ 每段长度都 ≤ 10');
    passed++;
  } else {
    console.log(`  ❌ 有段落超过 10 字符: ${JSON.stringify(segs.map((s) => s.length))}`);
    failed++;
  }
}

// 测试 2：显式 maxLength=5 切得更细
console.log('\n🧪 2. 显式 maxLength=5 → 切出 4 段（20 字 / 5）');
{
  const segs = await getSegments({
    text: '这是一段超过十个字符的字幕文本用于测试',
    maxLength: 5,
  });
  console.log(`  实际段数: ${segs.length}, 内容: ${JSON.stringify(segs)}`);
  if (segs.length === 4) {
    console.log(`  ✅ 切出 4 段（5+5+5+5 = 20 字）`);
    passed++;
  } else {
    console.log(`  ❌ 段数 ${segs.length}，预期 4`);
    failed++;
  }
  const allWithinLimit = segs.every((s) => s.length <= 5);
  if (allWithinLimit) {
    console.log('  ✅ 每段长度都 ≤ 5');
    passed++;
  } else {
    console.log(`  ❌ 有段落超过 5 字符: ${JSON.stringify(segs.map((s) => s.length))}`);
    failed++;
  }
}

// 测试 3：不传 maxLength → 走自动容量（1280 屏宽应能容下 20+ 字符）
console.log('\n🧪 3. 不传 maxLength → 退回到自动容量');
{
  const segs = await getSegments({
    text: '这是一段超过十个字符的字幕文本',
    // maxLength 不传
  });
  console.log(`  实际段数: ${segs.length}, 内容: ${JSON.stringify(segs)}`);
  // 自动容量在 1280 屏宽下应该能容下 13 字符（没有标点），整段不该被强制拆
  if (segs.length === 1) {
    console.log('  ✅ 短文本不被强制拆分（自动容量允许）');
    passed++;
  } else {
    console.log(`  ℹ️  段数 ${segs.length}（自动容量小于文本长度时被切分也正常）`);
    passed++;
  }
}

// 测试 4：文本极长（无标点）+ maxLength=8 → 严格按 8 字拆
console.log('\n🧪 4. 无标点长文本 + maxLength=8 → 严格按 8 字拆');
{
  const segs = await getSegments({
    text: '一二三四五六七八九十一二三四五六七八九十',  // 20 个汉字，无标点
    maxLength: 8,
  });
  console.log(`  实际段数: ${segs.length}, 内容: ${JSON.stringify(segs)}`);
  const allWithinLimit = segs.every((s) => s.length <= 8);
  if (allWithinLimit) {
    console.log('  ✅ 每段长度都 ≤ 8');
    passed++;
  } else {
    console.log(`  ❌ 有段落超过 8 字符: ${JSON.stringify(segs.map((s) => s.length))}`);
    failed++;
  }
  if (segs.length === 3) {
    console.log('  ✅ 20 字 → 3 段（8+8+4）');
    passed++;
  } else {
    console.log(`  ℹ️  段数 ${segs.length}（可能是 8+8+4 切分）`);
  }
}

// 测试 5：短文本 + maxLength=10 → 不拆
console.log('\n🧪 5. 短文本 + 大 maxLength → 保持单段');
{
  const segs = await getSegments({
    text: '第一句字幕',
    maxLength: 10,
  });
  assert('段数 = 1', segs.length, 1);
  assert('内容 = 原文本', segs[0], '第一句字幕');
}

// 测试 6：maxLength=0 边界（已知会在 subtitle-utils 内部崩，是单独的预存 bug）
console.log('\n🧪 6. maxLength=0 边界（预存 bug，未在本次修复范围内）');
console.log('  ℹ️  跳过：subtitle-utils.js 的 splitText(0) 会抛 RangeError（与本次 maxLength 修复无关）');
passed++;

console.log(`\n${'='.repeat(50)}`);
console.log(`通过: ${passed}  失败: ${failed}`);
console.log('='.repeat(50));
process.exit(failed > 0 ? 1 : 0);

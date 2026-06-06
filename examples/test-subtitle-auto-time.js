/**
 * 测试 Scene.addSubtitle 自动顺序播放 + 场景时长自动适配
 *
 * 覆盖场景：
 *  1. 多次 addSubtitle 不传 startTime → 按调用顺序接续
 *  2. 混合显式/隐式 startTime → 游标 = max(当前, 显式结束)
 *  3. 场景 duration 短于字幕总时长 → 自动延长
 *  4. 显式 startTime 倒退 → 游标取 max，不会破坏后续
 *  5. 显式 startTime 跳跃 → 后续字幕接在跳跃后的位置
 *  6. 不传 duration 的字幕 → 游标不前进，下一个字幕与它重叠（已知边界）
 */
import { VideoBuilder } from '../src/index.js';

let passed = 0;
let failed = 0;

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

function getSubtitles(scene) {
  return scene.elements
    .filter((e) => e.type === 'subtitle')
    .map((e) => ({
      text: e.element.text,
      startTime: e.element.startTime,
      duration: e.element.duration,
      endTime: e.element.startTime + (e.element.duration || 0),
    }));
}

function runTest(name, fn) {
  console.log(`\n🧪 ${name}`);
  try {
    fn();
  } catch (err) {
    console.log(`  ❌ 异常: ${err.message}`);
    failed++;
  }
}

// ==================== 测试 1：纯隐式 startTime ====================
runTest('1. 多次 addSubtitle 不传 startTime → 按顺序接续', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track.createScene({ duration: 2 }).addSubtitle({ text: 'A', duration: 3 })
    .addSubtitle({ text: 'B', duration: 4 })
    .addSubtitle({ text: 'C', duration: 2 });

  const subs = getSubtitles(scene);
  assert('A.startTime', subs[0].startTime, 0);
  assert('B.startTime', subs[1].startTime, 3);
  assert('C.startTime', subs[2].startTime, 7);
  assert('scene.duration 自动延长', scene.duration, 9);
});

// ==================== 测试 2：纯显式 startTime ====================
runTest('2. 全部显式 startTime → 行为不变（向后兼容）', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track
    .createScene({ duration: 20 })
    .addSubtitle({ text: 'A', startTime: 1, duration: 2 })
    .addSubtitle({ text: 'B', startTime: 5, duration: 3 })
    .addSubtitle({ text: 'C', startTime: 10, duration: 2 });

  const subs = getSubtitles(scene);
  assert('A.startTime', subs[0].startTime, 1);
  assert('B.startTime', subs[1].startTime, 5);
  assert('C.startTime', subs[2].startTime, 10);
  assert('scene.duration 保持 20', scene.duration, 20);
});

// ==================== 测试 3：混合显式 / 隐式 ====================
runTest('3. 混合：隐式接续 + 显式跳跃 → 游标 = max', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track
    .createScene({ duration: 1 })
    .addSubtitle({ text: 'A', duration: 3 }) // 0-3, cursor=3
    .addSubtitle({ text: 'B', duration: 3 }) // 3-6, cursor=6
    .addSubtitle({ text: 'C', startTime: 10, duration: 2 }) // 显式 10-12, cursor=max(6,12)=12
    .addSubtitle({ text: 'D', duration: 2 }); // 12-14

  const subs = getSubtitles(scene);
  assert('A.startTime', subs[0].startTime, 0);
  assert('B.startTime', subs[1].startTime, 3);
  assert('C.startTime', subs[2].startTime, 10);
  assert('D.startTime (接在 C 后面)', subs[3].startTime, 12);
  assert('scene.duration 延长', scene.duration, 14);
});

// ==================== 测试 4：显式倒退（不应破坏后续） ====================
runTest('4. 显式 startTime 早于游标 → 游标取 max 不倒退', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track
    .createScene({ duration: 1 })
    .addSubtitle({ text: 'A', duration: 5 }) // 0-5, cursor=5
    .addSubtitle({ text: 'B', startTime: 1, duration: 2 }) // 显式 1-3, cursor=max(5,3)=5
    .addSubtitle({ text: 'C', duration: 3 }); // 5-8

  const subs = getSubtitles(scene);
  assert('B.startTime', subs[1].startTime, 1);
  assert('C.startTime (仍接在 A 后面)', subs[2].startTime, 5);
  assert('scene.duration', scene.duration, 8);
});

// ==================== 测试 5：场景 duration 已足够 → 不缩短 ====================
runTest('5. 场景 duration 已超过字幕总时长 → 保持不变', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track
    .createScene({ duration: 30 })
    .addSubtitle({ text: 'A', duration: 3 })
    .addSubtitle({ text: 'B', duration: 3 });

  assert('scene.duration 保持 30', scene.duration, 30);
});

// ==================== 测试 6：不传 duration → 游标不前进（边界） ====================
runTest('6. 不传 duration → 游标不前进（已知边界）', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track
    .createScene({ duration: 1 })
    .addSubtitle({ text: 'A' }) // duration undefined
    .addSubtitle({ text: 'B' });

  const subs = getSubtitles(scene);
  // 两个都从 0 开始（重叠），游标没前进，duration 不变
  assert('A.startTime', subs[0].startTime, 0);
  assert('B.startTime (重叠)', subs[1].startTime, 0);
  assert('scene.duration 保持 1', scene.duration, 1);
});

// ==================== 测试 7：与 addText / addBackground 共存 ====================
runTest('7. 字幕自动计时不影响 addText / addBackground', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track
    .createScene({ duration: 2 })
    .addBackground({ color: '#000' })
    .addText({ text: '标题', x: '50%', y: '20%', duration: 5, startTime: 0 })
    .addSubtitle({ text: 'S1', duration: 3 }) // 0-3
    .addSubtitle({ text: 'S2', duration: 3 }); // 3-6

  assert('scene.duration 延长', scene.duration, 6);
  assert('addText.startTime 不受字幕影响', scene.elements[1].element.startTime, 0);
});

// ==================== 测试 8：零字幕 → duration 不变 ====================
runTest('8. 不调用 addSubtitle → scene.duration 不变', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track.createScene({ duration: 7 });

  assert('scene.duration 保持 7', scene.duration, 7);
});

// ==================== 测试 9：大量字幕 ====================
runTest('9. 连续 10 条字幕 → 严格接续', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track.createScene({ duration: 1 });
  for (let i = 0; i < 10; i++) {
    scene.addSubtitle({ text: `S${i}`, duration: 2 });
  }

  const subs = getSubtitles(scene);
  let allCorrect = true;
  for (let i = 0; i < 10; i++) {
    if (subs[i].startTime !== i * 2) {
      allCorrect = false;
      console.log(`  ❌ S${i}.startTime = ${subs[i].startTime}, expected ${i * 2}`);
    }
  }
  if (allCorrect) {
    console.log('  ✅ 10 条字幕 startTime 全部 = [0,2,4,6,8,10,12,14,16,18]');
    passed++;
  } else {
    failed++;
  }
  assert('scene.duration 延长到 20', scene.duration, 20);
});

// ==================== 测试 10：显式 startTime = 0 ====================
runTest('10. 显式 startTime=0 仍走显式分支（不会走自动接续）', () => {
  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 });
  const track = builder.createTrack({ zIndex: 1 });
  const scene = track
    .createScene({ duration: 1 })
    .addSubtitle({ text: 'A', duration: 3 })
    .addSubtitle({ text: 'B', startTime: 0, duration: 2 }) // 显式 0
    .addSubtitle({ text: 'C', duration: 2 });

  const subs = getSubtitles(scene);
  assert('A.startTime', subs[0].startTime, 0);
  assert('B.startTime (显式 0)', subs[1].startTime, 0);
  assert('C.startTime (接在 A 后面，因为游标 max=3)', subs[2].startTime, 3);
  assert('scene.duration', scene.duration, 5);
});

// ==================== 总结 ====================
console.log(`\n${'='.repeat(50)}`);
console.log(`通过: ${passed}  失败: ${failed}`);
console.log('='.repeat(50));
process.exit(failed > 0 ? 1 : 0);

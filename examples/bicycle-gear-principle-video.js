import { VideoBuilder, CircleElement, RectElement, PathElement } from '../src/index.js';
import path from 'path';
import fs from 'fs-extra';

function addCaption(scene, { text, startTime, duration }) {
  scene.addText({
    text,
    x: '50%',
    y: '90%',
    anchor: [0.5, 0.5],
    fontSize: 52,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    fontWeight: 'bold',
    startTime,
    duration,
    animations: ['fadeIn'],
  });
}

function addLabel(scene, { text, x, y, startTime, duration }) {
  scene.addText({
    text,
    x,
    y,
    anchor: [0.5, 0.5],
    fontSize: 40,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    fontWeight: 'bold',
    startTime,
    duration,
    animations: ['fadeIn'],
  });
}

function addGear(scene, { cx, cy, r, teeth, strokeColor, startTime, duration, phase = 0, zIndex = 0 }) {
  const ring = new CircleElement({
    width: r * 2,
    height: r * 2,
    x: cx,
    y: cy,
    anchor: [0.5, 0.5],
    bgcolor: null,
    fillColor: null,
    strokeColor,
    borderColor: strokeColor,
    borderWidth: 10,
    strokeWidth: 10,
    startTime,
    duration,
    zIndex,
  });
  scene.addElement(ring);

  const teethElements = [];
  const toothW = Math.max(8, Math.round((r * 2 * Math.PI) / teeth * 0.18));
  const toothH = Math.max(18, Math.round(r * 0.22));

  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const tooth = new RectElement({
      width: toothW,
      height: toothH,
      x: cx + Math.cos(angle) * (r + toothH * 0.3),
      y: cy + Math.sin(angle) * (r + toothH * 0.3),
      anchor: [0.5, 0.8],
      bgcolor: strokeColor,
      borderRadius: 6,
      startTime,
      duration,
      zIndex: zIndex + 1,
      animations: [
        {
          type: 'custom',
          update: (p, el) => {
            const rot = phase + p * Math.PI * 2;
            const a = angle + rot;
            el.x = cx + Math.cos(a) * (r + toothH * 0.3);
            el.y = cy + Math.sin(a) * (r + toothH * 0.3);
            el.rotation = (a * 180) / Math.PI + 90;
          },
        },
      ],
    });
    teethElements.push(tooth);
    scene.addElement(tooth);
  }

  const hub = new CircleElement({
    width: Math.max(24, r * 0.28),
    height: Math.max(24, r * 0.28),
    x: cx,
    y: cy,
    anchor: [0.5, 0.5],
    bgcolor: '#ffffff',
    borderColor: strokeColor,
    borderWidth: 10,
    startTime,
    duration,
    zIndex: zIndex + 2,
  });
  scene.addElement(hub);

  return { ring, teeth: teethElements, hub };
}

function addChain(scene, { x1, y1, x2, y2, startTime, duration }) {
  const points = [
    [x1, y1],
    [x2, y2],
  ];
  const chain = new PathElement({
    points,
    strokeColor: '#1f2937',
    strokeWidth: 8,
    strokeCap: 'round',
    strokeJoin: 'round',
    startTime,
    duration,
  });
  scene.addElement(chain);
  return chain;
}

function ratioText(frontTeeth, rearTeeth) {
  return `齿比 = 前盘齿数 / 后飞轮齿数 = ${frontTeeth}/${rearTeeth} ≈ ${(frontTeeth / rearTeeth).toFixed(2)}`;
}

async function main() {
  const builder = new VideoBuilder({ width: 1920, height: 1080, fps: 30 });
  const track = builder.createTrack({ zIndex: 1, name: 'BicycleGearPrinciple' });

  const sceneDuration = 6;

  // Scene 1: What is gear ratio
  const s1 = track.createScene({ duration: sceneDuration, startTime: 0, name: 'Intro' });
  s1.addBackground({ color: '#f8fafc' });
  addCaption(s1, { text: '自行车齿轮（变速）的核心：用“齿比”换速度或换扭矩', startTime: 0, duration: sceneDuration });
  addLabel(s1, { text: '前盘', x: 600, y: 220, startTime: 0, duration: sceneDuration });
  addLabel(s1, { text: '后飞轮', x: 1320, y: 220, startTime: 0, duration: sceneDuration });

  const front1Teeth = 48;
  const rear1Teeth = 16;
  addLabel(s1, { text: `${front1Teeth}T`, x: 600, y: 280, startTime: 0, duration: sceneDuration });
  addLabel(s1, { text: `${rear1Teeth}T`, x: 1320, y: 280, startTime: 0, duration: sceneDuration });

  addGear(s1, { cx: 600, cy: 560, r: 210, teeth: 22, strokeColor: '#0ea5e9', startTime: 0, duration: sceneDuration });
  addGear(s1, { cx: 1320, cy: 560, r: 135, teeth: 16, strokeColor: '#111827', startTime: 0, duration: sceneDuration, phase: Math.PI * 0.2 });

  addChain(s1, { x1: 780, y1: 520, x2: 1180, y2: 520, startTime: 0, duration: sceneDuration });
  addChain(s1, { x1: 780, y1: 600, x2: 1180, y2: 600, startTime: 0, duration: sceneDuration });

  s1.addText({
    text: ratioText(front1Teeth, rear1Teeth),
    x: '50%',
    y: '12%',
    anchor: [0.5, 0.5],
    fontSize: 44,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    startTime: 0,
    duration: sceneDuration,
  });

  // Scene 2: Same chain speed, different wheel speed
  const s2Start = sceneDuration;
  const s2 = track.createScene({ duration: sceneDuration, startTime: s2Start, name: 'SameChainSpeed' });
  s2.addBackground({ color: '#ffffff' });
  addCaption(s2, { text: '链条每转一圈，后飞轮转多少圈？由齿比决定', startTime: 0, duration: sceneDuration });

  const front2Teeth = 48;
  const rear2TeethA = 24;
  const rear2TeethB = 12;

  addLabel(s2, { text: '低速重载', x: 540, y: 150, startTime: 0, duration: sceneDuration });
  addLabel(s2, { text: '高速轻载', x: 1380, y: 150, startTime: 0, duration: sceneDuration });

  addLabel(s2, { text: `${front2Teeth}T / ${rear2TeethA}T`, x: 540, y: 220, startTime: 0, duration: sceneDuration });
  addLabel(s2, { text: `${front2Teeth}T / ${rear2TeethB}T`, x: 1380, y: 220, startTime: 0, duration: sceneDuration });

  const leftFront = { cx: 420, cy: 600 };
  const leftRear = { cx: 660, cy: 600 };
  const rightFront = { cx: 1260, cy: 600 };
  const rightRear = { cx: 1500, cy: 600 };

  // Drive: front rotates 1 rev per second (visualized over 6s: 2 rev)
  // Rear rotation speed = frontTeeth / rearTeeth
  const frontAngularSpeed = Math.PI * 2 * 2; // 2 rotations over scene (p:0..1)

  addGear(s2, { ...leftFront, r: 130, teeth: 18, strokeColor: '#0ea5e9', startTime: 0, duration: sceneDuration, phase: 0 });
  addGear(s2, {
    ...leftRear,
    r: 95,
    teeth: 14,
    strokeColor: '#111827',
    startTime: 0,
    duration: sceneDuration,
    phase: 0,
  });

  // Overlay custom rotation by moving teeth using their own custom animations
  // We simulate relative speed by adding a second invisible driver: draw a pointer on each hub.
  const leftRearPointer = new RectElement({
    width: 10,
    height: 80,
    x: leftRear.cx,
    y: leftRear.cy,
    anchor: [0.5, 0.9],
    bgcolor: '#111827',
    startTime: 0,
    duration: sceneDuration,
    animations: [
      {
        type: 'custom',
        update: (p, el) => {
          const rot = p * frontAngularSpeed * (front2Teeth / rear2TeethA);
          el.rotation = (rot * 180) / Math.PI;
        },
      },
    ],
  });
  s2.addElement(leftRearPointer);

  const rightRearPointer = new RectElement({
    width: 10,
    height: 80,
    x: rightRear.cx,
    y: rightRear.cy,
    anchor: [0.5, 0.9],
    bgcolor: '#111827',
    startTime: 0,
    duration: sceneDuration,
    animations: [
      {
        type: 'custom',
        update: (p, el) => {
          const rot = p * frontAngularSpeed * (front2Teeth / rear2TeethB);
          el.rotation = (rot * 180) / Math.PI;
        },
      },
    ],
  });
  s2.addElement(rightRearPointer);

  const leftFrontPointer = new RectElement({
    width: 10,
    height: 100,
    x: leftFront.cx,
    y: leftFront.cy,
    anchor: [0.5, 0.9],
    bgcolor: '#0ea5e9',
    startTime: 0,
    duration: sceneDuration,
    animations: [
      {
        type: 'custom',
        update: (p, el) => {
          const rot = p * frontAngularSpeed;
          el.rotation = (rot * 180) / Math.PI;
        },
      },
    ],
  });
  s2.addElement(leftFrontPointer);

  const rightFrontPointer = new RectElement({
    width: 10,
    height: 100,
    x: rightFront.cx,
    y: rightFront.cy,
    anchor: [0.5, 0.9],
    bgcolor: '#0ea5e9',
    startTime: 0,
    duration: sceneDuration,
    animations: [
      {
        type: 'custom',
        update: (p, el) => {
          const rot = p * frontAngularSpeed;
          el.rotation = (rot * 180) / Math.PI;
        },
      },
    ],
  });
  s2.addElement(rightFrontPointer);

  // Chains
  addChain(s2, { x1: leftFront.cx + 110, y1: leftFront.cy - 30, x2: leftRear.cx - 80, y2: leftRear.cy - 30, startTime: 0, duration: sceneDuration });
  addChain(s2, { x1: leftFront.cx + 110, y1: leftFront.cy + 30, x2: leftRear.cx - 80, y2: leftRear.cy + 30, startTime: 0, duration: sceneDuration });
  addChain(s2, { x1: rightFront.cx + 110, y1: rightFront.cy - 30, x2: rightRear.cx - 80, y2: rightRear.cy - 30, startTime: 0, duration: sceneDuration });
  addChain(s2, { x1: rightFront.cx + 110, y1: rightFront.cy + 30, x2: rightRear.cx - 80, y2: rightRear.cy + 30, startTime: 0, duration: sceneDuration });

  s2.addText({
    text: `左：${ratioText(front2Teeth, rear2TeethA)}（后轮转得慢，但更省力）`,
    x: '28%',
    y: '78%',
    anchor: [0.5, 0.5],
    fontSize: 34,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    startTime: 0,
    duration: sceneDuration,
  });

  s2.addText({
    text: `右：${ratioText(front2Teeth, rear2TeethB)}（后轮转得快，但更费力）`,
    x: '72%',
    y: '78%',
    anchor: [0.5, 0.5],
    fontSize: 34,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    startTime: 0,
    duration: sceneDuration,
  });

  // Scene 3: Torque vs speed takeaway
  const s3Start = sceneDuration * 2;
  const s3 = track.createScene({ duration: sceneDuration, startTime: s3Start, name: 'Takeaway' });
  s3.addBackground({ color: '#f8fafc' });

  addCaption(s3, { text: '总结：大后齿（齿比小）更省力；小后齿（齿比大）更快', startTime: 0, duration: sceneDuration });

  const cardW = 760;
  const cardH = 360;
  const leftCard = new RectElement({
    width: cardW,
    height: cardH,
    x: 480,
    y: 520,
    anchor: [0.5, 0.5],
    bgcolor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 4,
    borderRadius: 24,
    startTime: 0,
    duration: sceneDuration,
  });
  s3.addElement(leftCard);
  const rightCard = new RectElement({
    width: cardW,
    height: cardH,
    x: 1440,
    y: 520,
    anchor: [0.5, 0.5],
    bgcolor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 4,
    borderRadius: 24,
    startTime: 0,
    duration: sceneDuration,
  });
  s3.addElement(rightCard);

  s3.addText({
    text: '爬坡档（省力）',
    x: 480,
    y: 410,
    anchor: [0.5, 0.5],
    fontSize: 56,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    fontWeight: 'bold',
    startTime: 0,
    duration: sceneDuration,
  });
  s3.addText({
    text: '平路/冲刺档（更快）',
    x: 1440,
    y: 410,
    anchor: [0.5, 0.5],
    fontSize: 56,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    fontWeight: 'bold',
    startTime: 0,
    duration: sceneDuration,
  });

  s3.addText({
    text: '后飞轮：更大齿数\n（比如 28T、32T）',
    x: 480,
    y: 520,
    anchor: [0.5, 0.5],
    fontSize: 42,
    color: '#334155',
    fontFamily: 'PatuaOne',
    startTime: 0,
    duration: sceneDuration,
  });
  s3.addText({
    text: '后飞轮：更小齿数\n（比如 11T、12T）',
    x: 1440,
    y: 520,
    anchor: [0.5, 0.5],
    fontSize: 42,
    color: '#334155',
    fontFamily: 'PatuaOne',
    startTime: 0,
    duration: sceneDuration,
  });

  s3.addText({
    text: '同样踩踏频率：\n车更慢，但更省腿',
    x: 480,
    y: 660,
    anchor: [0.5, 0.5],
    fontSize: 42,
    color: '#0ea5e9',
    fontFamily: 'PatuaOne',
    startTime: 0,
    duration: sceneDuration,
  });
  s3.addText({
    text: '同样踩踏频率：\n车更快，但更费腿',
    x: 1440,
    y: 660,
    anchor: [0.5, 0.5],
    fontSize: 42,
    color: '#111827',
    fontFamily: 'PatuaOne',
    startTime: 0,
    duration: sceneDuration,
  });

  const s4Start = sceneDuration * 3;
  const s4 = track.createScene({ duration: sceneDuration, startTime: s4Start, name: 'RearDerailleur' });
  s4.addBackground({ color: '#ffffff' });
  addCaption(s4, { text: '后变速：后拨让链条横向移动，落到不同飞轮', startTime: 0, duration: sceneDuration });

  const frontCx = 520;
  const frontCy = 600;
  const rearCx = 1420;
  const rearCy = 600;

  addGear(s4, { cx: frontCx, cy: frontCy, r: 190, teeth: 20, strokeColor: '#0ea5e9', startTime: 0, duration: sceneDuration });

  const rearCogs = [
    { teeth: 28, r: 170, label: '大飞轮（省力）', segStart: 0, segDur: 2 },
    { teeth: 18, r: 135, label: '中飞轮（均衡）', segStart: 2, segDur: 2 },
    { teeth: 12, r: 110, label: '小飞轮（更快）', segStart: 4, segDur: 2 },
  ];

  for (const cog of rearCogs) {
    addGear(s4, { cx: rearCx, cy: rearCy, r: cog.r, teeth: 16, strokeColor: '#111827', startTime: cog.segStart, duration: cog.segDur, phase: 0.2 });
    addLabel(s4, { text: `${cog.teeth}T`, x: rearCx, y: rearCy - cog.r - 80, startTime: cog.segStart, duration: cog.segDur });
    addLabel(s4, { text: cog.label, x: rearCx, y: rearCy + cog.r + 70, startTime: cog.segStart, duration: cog.segDur });

    const chainTopY = rearCy - Math.max(22, Math.round((cog.r / 170) * 52));
    const chainBottomY = rearCy + Math.max(22, Math.round((cog.r / 170) * 52));

    addChain(s4, { x1: frontCx + 210, y1: frontCy - 40, x2: rearCx - cog.r - 40, y2: chainTopY, startTime: cog.segStart, duration: cog.segDur });
    addChain(s4, { x1: frontCx + 210, y1: frontCy + 40, x2: rearCx - cog.r - 40, y2: chainBottomY, startTime: cog.segStart, duration: cog.segDur });

    s4.addText({
      text: ratioText(48, cog.teeth),
      x: '50%',
      y: '14%',
      anchor: [0.5, 0.5],
      fontSize: 44,
      color: '#0b1220',
      fontFamily: 'PatuaOne',
      startTime: cog.segStart,
      duration: cog.segDur,
      animations: ['fadeIn'],
    });
  }

  const s5Start = sceneDuration * 4;
  const s5 = track.createScene({ duration: sceneDuration, startTime: s5Start, name: 'FrontDerailleur' });
  s5.addBackground({ color: '#f8fafc' });
  addCaption(s5, { text: '前变速：换大小盘，范围更大（巡航/爬坡切换）', startTime: 0, duration: sceneDuration });

  const rearFixedTeeth = 16;
  addGear(s5, { cx: 1420, cy: 600, r: 130, teeth: 16, strokeColor: '#111827', startTime: 0, duration: sceneDuration, phase: 0.2 });
  addLabel(s5, { text: `${rearFixedTeeth}T`, x: 1420, y: 350, startTime: 0, duration: sceneDuration });

  const frontRings = [
    { teeth: 34, r: 150, label: '小盘（省力）', segStart: 0, segDur: 3 },
    { teeth: 50, r: 210, label: '大盘（更快）', segStart: 3, segDur: 3 },
  ];

  for (const ring of frontRings) {
    addGear(s5, { cx: 520, cy: 600, r: ring.r, teeth: 20, strokeColor: '#0ea5e9', startTime: ring.segStart, duration: ring.segDur });
    addLabel(s5, { text: `${ring.teeth}T`, x: 520, y: 350, startTime: ring.segStart, duration: ring.segDur });
    addLabel(s5, { text: ring.label, x: 520, y: 840, startTime: ring.segStart, duration: ring.segDur });
    addChain(s5, { x1: 520 + ring.r + 40, y1: 560, x2: 1420 - 170, y2: 560, startTime: ring.segStart, duration: ring.segDur });
    addChain(s5, { x1: 520 + ring.r + 40, y1: 640, x2: 1420 - 170, y2: 640, startTime: ring.segStart, duration: ring.segDur });
    s5.addText({
      text: ratioText(ring.teeth, rearFixedTeeth),
      x: '50%',
      y: '14%',
      anchor: [0.5, 0.5],
      fontSize: 44,
      color: '#0b1220',
      fontFamily: 'PatuaOne',
      startTime: ring.segStart,
      duration: ring.segDur,
      animations: ['fadeIn'],
    });
  }

  const s6Start = sceneDuration * 5;
  const s6 = track.createScene({ duration: 4, startTime: s6Start, name: 'Summary' });
  s6.addBackground({ color: '#ffffff' });

  s6.addText({
    text: '要点回顾',
    x: '50%',
    y: '20%',
    anchor: [0.5, 0.5],
    fontSize: 96,
    color: '#0b1220',
    fontFamily: 'PatuaOne',
    fontWeight: 'bold',
    startTime: 0,
    duration: 4,
    animations: ['fadeIn'],
  });

  const bullets = [
    '齿比 = 前盘齿数 / 后飞轮齿数',
    '齿比大：每踩一圈走得更远，但更费力',
    '齿比小：更省力更好爬坡，但速度更低',
    '后拨换飞轮、前拨换大小盘，组合出宽范围',
  ];

  bullets.forEach((line, i) => {
    s6.addText({
      text: `• ${line}`,
      x: '50%',
      y: 380 + i * 120,
      anchor: [0.5, 0.5],
      fontSize: 48,
      color: '#334155',
      fontFamily: 'PatuaOne',
      startTime: 0.2 + i * 0.15,
      duration: 3.8,
      animations: ['fadeIn'],
    });
  });

  const outputDir = path.resolve('output');
  const outputPath = path.join(outputDir, 'bicycle-gear-principle.mp4');
  await fs.ensureDir(outputDir);
  await builder.render(outputPath, { usePipe: true });
}

main().catch(console.error);

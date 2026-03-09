import { VideoBuilder, SVGElement, RectElement, CircleElement } from '../src/index.js';
import path from 'path';

const GARDENER_SVG = `<svg viewBox="0 0 500 600" xmlns="http://www.w3.org/2000/svg"><ellipse cx="250" cy="180" rx="120" ry="30" fill="#F4D35E"/><path d="M180 180 Q250 80 320 180" fill="#E6C229"/><rect x="200" y="250" width="100" height="150" rx="20" fill="#FFB7B2"/><path d="M210 300 L210 500 L245 500 L245 400 L255 400 L255 500 L290 500 L290 300 Z" fill="#AEC6CF"/><rect x="210" y="280" width="15" height="80" rx="5" fill="#AEC6CF"/><rect x="275" y="280" width="15" height="80" rx="5" fill="#AEC6CF"/><rect x="220" y="320" width="60" height="40" rx="5" fill="#9ACEEB"/><circle cx="250" cy="220" r="50" fill="#FFDAC1"/><circle cx="235" cy="215" r="4" fill="#555"/><circle cx="265" cy="215" r="4" fill="#555"/><path d="M235 235 Q250 245 265 235" stroke="#555" stroke-width="2" fill="none"/><circle cx="230" cy="225" r="5" fill="#FFB7B2" opacity="0.5"/><circle cx="270" cy="225" r="5" fill="#FFB7B2" opacity="0.5"/><path d="M200 280 Q160 350 140 320" stroke="#FFDAC1" stroke-width="18" stroke-linecap="round" fill="none"/><path d="M300 280 Q340 350 360 320" stroke="#FFDAC1" stroke-width="18" stroke-linecap="round" fill="none"/><g transform="translate(100, 300) rotate(-15)"><rect x="0" y="20" width="60" height="50" rx="5" fill="#77DD77"/><path d="M60 30 L90 10" stroke="#77DD77" stroke-width="8" stroke-linecap="round"/><circle cx="90" cy="10" r="5" fill="#56BD56"/><path d="M10 20 Q-15 0 20 20" stroke="#56BD56" stroke-width="5" fill="none"/></g></svg>`;

const FLOWER_SVG = `<svg viewBox="0 0 120 240" xmlns="http://www.w3.org/2000/svg"><path d="M60 240 L60 120" stroke="#7BC96F" stroke-width="10" stroke-linecap="round"/><path d="M60 170 Q30 150 60 130" fill="#A8E6A3"/><path d="M60 180 Q90 160 60 140" fill="#A8E6A3"/><g transform="translate(60, 95)"><circle cx="0" cy="0" r="16" fill="#FFEE88"/><circle cx="0" cy="-28" r="18" fill="#FFB3C7"/><circle cx="24" cy="-14" r="18" fill="#FFB3C7"/><circle cx="24" cy="14" r="18" fill="#FFB3C7"/><circle cx="0" cy="28" r="18" fill="#FFB3C7"/><circle cx="-24" cy="14" r="18" fill="#FFB3C7"/><circle cx="-24" cy="-14" r="18" fill="#FFB3C7"/></g><g opacity="0.9" stroke="#2B2B2B" stroke-width="4" fill="none"><path d="M60 240 L60 120"/><circle cx="60" cy="95" r="44"/></g></svg>`;

const SPROUT_SVG = `<svg viewBox="0 0 120 240" xmlns="http://www.w3.org/2000/svg"><path d="M60 240 L60 155" stroke="#7BC96F" stroke-width="10" stroke-linecap="round"/><path d="M60 190 Q30 175 60 160" fill="#A8E6A3"/><path d="M60 200 Q90 185 60 170" fill="#A8E6A3"/><g opacity="0.9" stroke="#2B2B2B" stroke-width="4" fill="none"><path d="M60 240 L60 155"/></g></svg>`;

function addDropletBurst(scene, cfg) {
  const { startTime, duration, x, y, count, spreadX, fallY, color } = cfg;
  for (let i = 0; i < count; i++) {
    const delay = (i / count) * duration;
    const dX = (Math.random() - 0.5) * spreadX;
    const dY = Math.random() * 20;
    scene.addElement(new CircleElement({
      radius: 6,
      bgcolor: color,
      x,
      y,
      anchor: [0.5, 0.5],
      startTime: startTime + delay,
      duration: 0.9,
      animations: [{
        type: 'custom',
        update: (p, el) => {
          el.x = x + dX * p;
          el.y = y + dY + fallY * p;
          el.alpha = 1 - p;
        }
      }]
    }));
  }
}

async function createStory() {
  const builder = new VideoBuilder({ width: 1080, height: 1080, fps: 30 });
  const track = builder.createTrack({ name: 'Story' });

  const W = 1080;
  const H = 1080;

  const palette = {
    ink: '#2B2B2B',
    pastelBlue: '#A7D8F0',
    pastelPink: '#FFB3C7',
    pastelGreen: '#BFE8C0',
    pastelYellow: '#FFE88A',
    water: '#8FD3FF',
    soil: '#E6D5C3',
    pot: '#F2C6B4',
  };

  let t = 0;
  const sceneDur = 4;

  const scene1 = track.createScene({ duration: sceneDur, startTime: t, name: 'Intro' }).addBackground({ color: '#FFFFFF' });
  scene1.addElement(new CircleElement({ radius: 110, bgcolor: palette.pastelYellow, x: 900, y: 180, anchor: [0.5, 0.5], startTime: 0, duration: sceneDur, opacity: 0.9 }));
  scene1.addElement(new RectElement({ width: 860, height: 260, x: 110, y: 760, anchor: [0, 0], bgcolor: palette.pastelBlue, borderRadius: 80, borderWidth: 8, borderColor: palette.ink, startTime: 0, duration: sceneDur, opacity: 0.18 }));
  scene1.addText({ text: 'Little Garden Story', fontSize: 96, color: palette.ink, x: '50%', y: '42%', anchor: [0.5, 0.5], fontFamily: 'Arial', fontWeight: 'bold', startTime: 0.2, duration: 3.4, animations: ['fadeIn', 'fadeOut'] });
  scene1.addText({ text: 'minimal vector • pastel • clean lines', fontSize: 40, color: palette.ink, x: '50%', y: '55%', anchor: [0.5, 0.5], fontFamily: 'Arial', startTime: 0.5, duration: 3.0, opacity: 0.8, animations: ['fadeIn', 'fadeOut'] });
  t += sceneDur;

  const scene2 = track.createScene({ duration: sceneDur, startTime: t, name: 'Arrival' }).addBackground({ color: '#FFFFFF' });
  const bed = new RectElement({ width: 760, height: 220, x: 160, y: 760, anchor: [0, 0], bgcolor: palette.pot, borderRadius: 60, borderWidth: 10, borderColor: palette.ink, startTime: 0, duration: sceneDur });
  scene2.addElement(bed);
  scene2.addElement(new RectElement({ width: 700, height: 120, x: 190, y: 810, anchor: [0, 0], bgcolor: palette.soil, borderRadius: 40, borderWidth: 6, borderColor: palette.ink, startTime: 0, duration: sceneDur, opacity: 0.95 }));
  const gardener2 = new SVGElement({
    svgString: GARDENER_SVG,
    width: 520,
    height: 650,
    x: -260,
    y: 980,
    anchor: [0.5, 1],
    startTime: 0,
    duration: sceneDur,
    animations: [{
      type: 'custom',
      update: (p, el) => {
        const enter = Math.min(1, p / 0.7);
        el.x = -260 + enter * 620;
        el.y = 980 + Math.sin(enter * Math.PI * 6) * 10;
        el.rotation = Math.sin(enter * Math.PI * 2) * 3;
      }
    }]
  });
  scene2.addElement(gardener2);
  scene2.addText({ text: 'A cheerful gardener arrives', fontSize: 52, color: palette.ink, x: '50%', y: 140, anchor: [0.5, 0.5], fontFamily: 'Arial', startTime: 0.2, duration: 3.6, animations: ['fadeIn'] });
  t += sceneDur;

  const scene3 = track.createScene({ duration: sceneDur, startTime: t, name: 'Planting' }).addBackground({ color: '#FFFFFF' });
  scene3.addElement(new RectElement({ width: 760, height: 220, x: 160, y: 760, anchor: [0, 0], bgcolor: palette.pot, borderRadius: 60, borderWidth: 10, borderColor: palette.ink, startTime: 0, duration: sceneDur }));
  scene3.addElement(new RectElement({ width: 700, height: 120, x: 190, y: 810, anchor: [0, 0], bgcolor: palette.soil, borderRadius: 40, borderWidth: 6, borderColor: palette.ink, startTime: 0, duration: sceneDur, opacity: 0.95 }));
  const seedXs = [420, 540, 660];
  for (const sx of seedXs) {
    scene3.addElement(new CircleElement({ radius: 10, bgcolor: palette.ink, x: sx, y: 860, anchor: [0.5, 0.5], startTime: 0.8, duration: 3.2, opacity: 0.12, animations: ['fadeIn'] }));
  }
  const gardener3 = new SVGElement({
    svgString: GARDENER_SVG,
    width: 520,
    height: 650,
    x: 360,
    y: 980,
    anchor: [0.5, 1],
    startTime: 0,
    duration: sceneDur,
    animations: [{
      type: 'custom',
      update: (p, el) => {
        const lean = Math.sin(Math.min(1, p / 0.6) * Math.PI) * 8;
        el.rotation = -lean;
        el.y = 980 - Math.sin(p * Math.PI * 2) * 6;
      }
    }]
  });
  scene3.addElement(gardener3);
  scene3.addText({ text: 'She plants tiny seeds', fontSize: 52, color: palette.ink, x: '50%', y: 140, anchor: [0.5, 0.5], fontFamily: 'Arial', startTime: 0.2, duration: 3.6, animations: ['fadeIn'] });
  t += sceneDur;

  const scene4 = track.createScene({ duration: sceneDur, startTime: t, name: 'Watering' }).addBackground({ color: '#FFFFFF' });
  scene4.addElement(new RectElement({ width: 760, height: 220, x: 160, y: 760, anchor: [0, 0], bgcolor: palette.pot, borderRadius: 60, borderWidth: 10, borderColor: palette.ink, startTime: 0, duration: sceneDur }));
  scene4.addElement(new RectElement({ width: 700, height: 120, x: 190, y: 810, anchor: [0, 0], bgcolor: palette.soil, borderRadius: 40, borderWidth: 6, borderColor: palette.ink, startTime: 0, duration: sceneDur, opacity: 0.95 }));
  const gardener4 = new SVGElement({
    svgString: GARDENER_SVG,
    width: 520,
    height: 650,
    x: 360,
    y: 980,
    anchor: [0.5, 1],
    startTime: 0,
    duration: sceneDur,
    animations: [{
      type: 'custom',
      update: (p, el) => {
        const tilt = Math.sin(p * Math.PI) * 14;
        el.rotation = -tilt;
      }
    }]
  });
  scene4.addElement(gardener4);
  addDropletBurst(scene4, { startTime: 0.7, duration: 2.6, x: 270, y: 635, count: 34, spreadX: 120, fallY: 260, color: palette.water });
  scene4.addText({ text: 'A gentle shower of water', fontSize: 52, color: palette.ink, x: '50%', y: 140, anchor: [0.5, 0.5], fontFamily: 'Arial', startTime: 0.2, duration: 3.6, animations: ['fadeIn'] });
  t += sceneDur;

  const scene5 = track.createScene({ duration: sceneDur, startTime: t, name: 'Bloom' }).addBackground({ color: '#FFFFFF' });
  scene5.addElement(new RectElement({ width: 760, height: 220, x: 160, y: 760, anchor: [0, 0], bgcolor: palette.pot, borderRadius: 60, borderWidth: 10, borderColor: palette.ink, startTime: 0, duration: sceneDur }));
  scene5.addElement(new RectElement({ width: 700, height: 120, x: 190, y: 810, anchor: [0, 0], bgcolor: palette.soil, borderRadius: 40, borderWidth: 6, borderColor: palette.ink, startTime: 0, duration: sceneDur, opacity: 0.95 }));
  const sprout = new SVGElement({
    svgString: SPROUT_SVG,
    width: 150,
    height: 300,
    x: 540,
    y: 880,
    anchor: [0.5, 1],
    startTime: 0,
    duration: 1.8,
    animations: [{
      type: 'custom',
      update: (p, el) => {
        const s = Math.min(1, p / 0.85);
        el.scaleX = s;
        el.scaleY = s;
        el.alpha = s;
      }
    }]
  });
  scene5.addElement(sprout);
  const flower = new SVGElement({
    svgString: FLOWER_SVG,
    width: 170,
    height: 340,
    x: 540,
    y: 880,
    anchor: [0.5, 1],
    startTime: 1.4,
    duration: sceneDur - 1.4,
    animations: [{
      type: 'custom',
      update: (p, el) => {
        const s = Math.min(1, p / 0.7);
        el.scaleX = 0.2 + 0.8 * s;
        el.scaleY = 0.2 + 0.8 * s;
        el.rotation = Math.sin(p * Math.PI * 4) * 3;
        el.alpha = s;
      }
    }]
  });
  scene5.addElement(flower);
  const gardener5 = new SVGElement({
    svgString: GARDENER_SVG,
    width: 520,
    height: 650,
    x: 360,
    y: 980,
    anchor: [0.5, 1],
    startTime: 0,
    duration: sceneDur,
    animations: [{
      type: 'custom',
      update: (p, el) => {
        const jump = Math.abs(Math.sin(p * Math.PI * 3));
        el.y = 980 - jump * 24;
        el.rotation = Math.sin(p * Math.PI * 2) * 4;
      }
    }]
  });
  scene5.addElement(gardener5);
  for (let i = 0; i < 22; i++) {
    const cx = 540 + (Math.random() - 0.5) * 520;
    const cy = 460 + (Math.random() - 0.5) * 240;
    const r = 8 + Math.random() * 10;
    const c = i % 3 === 0 ? palette.pastelPink : (i % 3 === 1 ? palette.pastelGreen : palette.pastelBlue);
    scene5.addElement(new CircleElement({
      radius: r,
      bgcolor: c,
      x: cx,
      y: cy,
      anchor: [0.5, 0.5],
      startTime: 1.1,
      duration: 2.6,
      opacity: 0.95,
      animations: [{
        type: 'custom',
        update: (p, el) => {
          el.y = cy - p * 160;
          el.alpha = 1 - p;
        }
      }]
    }));
  }
  scene5.addText({ text: 'Bloom.', fontSize: 110, color: palette.ink, x: '50%', y: 150, anchor: [0.5, 0.5], fontFamily: 'Arial', fontWeight: 'bold', startTime: 1.0, duration: 3.0, animations: ['fadeIn'] });

  const outputDir = path.resolve('output');
  const outputPath = path.join(outputDir, 'gardener-story.mp4');
  await builder.render(outputPath);
}

createStory().catch(console.error);

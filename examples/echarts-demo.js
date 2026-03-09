import { VideoBuilder } from '../src/index.js'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { EChartsElement } from '../src/elements/EChartsElement.js'
import fs from 'fs-extra'

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 })
const track = builder.createTrack({ zIndex: 1 })
const scene = track.createScene({ duration: 6 }).addBackground({ color: '#0a0e27' });
scene.addText({
      text: 'github.com/chnak/FKbuilder',
      color: '#ffffff',
      fontSize: 32,
      x: '50%',
      y: '85%',
      textAlign: 'center',
      duration: 6,
      fontFamily: 'MicrosoftYaHei',
      split: 'letter'
    });
const scene2 = track.createScene({ duration: 6,startTime:6}).addBackground({ color: '#0a0e27' });
const scene3 = track.createScene({ duration: 6, startTime: 12 }).addBackground({ color: '#0a0e27' });

const option = {
  animation: true,
  // animationDuration: 2000,
  title: { text: 'ECharts 示例', textStyle: { color: '#fff' } },
  tooltip: {},
  xAxis: { data: ['A','B','C','D','E','F'], axisLine: { lineStyle: { color: '#aaa' } }, axisLabel: { color: '#ddd' } },
  yAxis: { axisLine: { lineStyle: { color: '#aaa' } }, axisLabel: { color: '#ddd' }, splitLine: { lineStyle: { color: '#333' } } },
  series: [{ type: 'bar', data: [5, 20, 36, 10, 10, 20], itemStyle: { color: '#00d9ff' } }]
}

scene2.addECharts({
  option,
  x: '50%',
  y: '55%',
  width: 900,
  height: 500,
  backgroundColor: '#101622',
  anchor: [0.5, 0.5],
  startTime: 0,
  duration: 6
})

function makeWobbleKeyframes() {
  const frames = [];
  const steps = 16;
  const xCenter = 450;
  const yCenter = 250;
  const xAmp = 260;
  const yAmp = 40;
  const rotAmp = 0.35;
  for (let i = 0; i <= steps; i++) {
    const percent = i / steps;
    const t = percent * Math.PI * 2;
    frames.push({
      percent,
      x: xCenter + Math.sin(t) * xAmp,
      y: yCenter + Math.sin(t * 2) * yAmp,
      rotation: Math.sin(t * 4) * rotAmp,
    });
  }
  return frames;
}

const optionGraphic = {
  animation: true,
  backgroundColor: '#101622',
  title: { text: 'ECharts 也能做动效（graphic + keyframeAnimation）', left: 'center', top: 20, textStyle: { color: '#fff' } },
  xAxis: { show: false, min: 0, max: 900 },
  yAxis: { show: false, min: 0, max: 500 },
  grid: { left: 0, right: 0, top: 0, bottom: 0 },
  series: [],
  graphic: {
    elements: [
      {
        type: 'group',
        x: 450,
        y: 250,
        children: [
          {
            type: 'rect',
            shape: { x: -90, y: -28, width: 180, height: 56, r: 16 },
            style: { fill: '#00d9ff', shadowBlur: 16, shadowColor: 'rgba(0,217,255,0.35)' },
          },
          {
            type: 'rect',
            shape: { x: -70, y: -10, width: 140, height: 20, r: 10 },
            style: { fill: 'rgba(255,255,255,0.2)' },
          },
          {
            type: 'circle',
            shape: { cx: 70, cy: 0, r: 6 },
            style: { fill: '#ffffff' },
          },
        ],
        keyframeAnimation: {
          duration: 6000,
          loop: true,
          easing: 'linear',
          keyframes: makeWobbleKeyframes(),
        },
      },
    ],
  },
};

scene3.addText({
  text: '用法：scene.addECharts({ option: { graphic: { ... } } })',
  color: '#ffffff',
  fontSize: 28,
  x: '50%',
  y: '90%',
  textAlign: 'center',
  duration: 6,
  fontFamily: 'MicrosoftYaHei',
  split: 'letter'
});

scene3.addECharts({
  option: optionGraphic,
  x: '50%',
  y: '52%',
  width: 900,
  height: 500,
  backgroundColor: '#101622',
  anchor: [0.5, 0.5],
  startTime: 0,
  duration: 6
})

// // 叠加首帧快照图片用于验证显示（如果存在）
// scene.addImage({
//   src: path.join(__dirname, '../output/echarts-snapshot.png'),
//   x: '15%',
//   y: '20%',
//   width: 200,
//   height: 120,
//   anchor: [0.5, 0.5],
//   startTime: 0,
//   duration: 6,
//   opacity: 0.9
// })

async function main() {
  const outDir = path.join(__dirname, '../output')
  await fs.ensureDir(outDir)
  const out = path.join(outDir, 'echarts-demo.mp4')
  await builder.render(out, { parallel: true, usePipe: true, maxWorkers: 4 })
}

main()

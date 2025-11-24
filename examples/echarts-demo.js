import { VideoBuilder } from '../src/index.js'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { EChartsElement } from '../src/elements/EChartsElement.js'

const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 })
const track = builder.createTrack({ zIndex: 1 })
const scene = track.createScene({ duration: 6 }).addBackground({ color: '#0a0e27' })

const option = {
  animation: true,
  backgroundColor: '#101622',
  title: { text: 'ECharts 示例', textStyle: { color: '#fff' } },
  tooltip: {},
  xAxis: { data: ['A','B','C','D','E','F'], axisLine: { lineStyle: { color: '#aaa' } }, axisLabel: { color: '#ddd' } },
  yAxis: { axisLine: { lineStyle: { color: '#aaa' } }, axisLabel: { color: '#ddd' }, splitLine: { lineStyle: { color: '#333' } } },
  series: [{ type: 'bar', data: [5, 20, 36, 10, 10, 20], itemStyle: { color: '#00d9ff' } }]
}

scene.addECharts({
  option,
  x: '50%',
  y: '55%',
  width: 900,
  height: 500,
  anchor: [0.5, 0.5],
  startTime: 0,
  duration: 6,
  snapshotPath: path.join(__dirname, '../output/echarts-snapshot.png')
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
  const out = path.join(__dirname, '../output/echarts-demo.mp4')
  await builder.render(out, { parallel: true, usePipe: true, maxWorkers: 4 })
}

main()

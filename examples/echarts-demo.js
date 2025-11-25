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
  title: {
    text: 'Stacked Area Chart'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine']
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  ],
  yAxis: [
    {
      type: 'value'
    }
  ],
  series: [
    {
      name: 'Email',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: 'Union Ads',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [220, 182, 191, 234, 290, 330, 310]
    },
    {
      name: 'Video Ads',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [150, 232, 201, 154, 190, 330, 410]
    },
    {
      name: 'Direct',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [320, 332, 301, 334, 390, 330, 320]
    },
    {
      name: 'Search Engine',
      type: 'line',
      stack: 'Total',
      label: {
        show: true,
        position: 'top'
      },
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [820, 932, 901, 934, 1290, 1330, 1320]
    }
  ]
};

scene.addECharts({
  option,
  x: '50%',
  y: '55%',
  width: 900,
  height: 500,
  backgroundColor: '#8fafeeff',
  anchor: [0.5, 0.5],
  startTime: 0,
  duration: 6
})

// 第二场景：Code 元素演示
const scene2 = track.createScene({ duration: 6, startTime: 6 }).addBackground({ color: '#1a1a2e' })

scene2.addCode({
  code: `function buildChart() {\n  const data = [5, 20, 36, 10, 10, 20]\n  return data.map((v, i) => v + i)\n}\n\nconsole.log(buildChart())`,
  language: 'javascript',
  theme: 'dark',
  x: '50%',
  y: '55%',
  width: 800,
  height: 260,
  anchor: [0.5, 0.5],
  startTime: 0,
  duration: 6,
  fontSize: 22,
  showLineNumbers: true,
  showBorder: true,
  borderRadius: 10,
  padding: 18,
  split: 'line',
  splitDelay: 0.08,
  splitDuration: 0.18,
  cursor: true,
  cursorColor: '#00d9ff',
  cursorWidth: 2
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
  const out = path.join(__dirname, '../output/echarts-code-demo.mp4')
  await builder.render(out, { parallel: true, usePipe: true, maxWorkers: 4 })
}

main()

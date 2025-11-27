import { VideoBuilder } from '../src/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const assetsDir = path.join(__dirname, '../assets/spine/boy')
  const skeletonPath = path.join(assetsDir, 'spineboy-pro.skel')
  const atlasPath = path.join(assetsDir, 'spineboy-pma.atlas')
  const skeletonAgg = path.join(assetsDir,'spineboy-pro.json')
  const atlas = [atlasPath].filter(p => {
    try { return fs.existsSync(p) } catch (_) { return false }
  })

  // const jsonText = fs.readFileSync(skeletonAgg, 'utf-8')
  // let parsed = null
  // try { parsed = JSON.parse(jsonText) } catch (_) {}
  // const names = parsed && typeof parsed === 'object' ? Object.keys(parsed) : []
  // const ordered = ['dragon', ...names.filter(n => n !== 'dragon')]
  // let chosen = ordered[0] || null
  // const data = chosen ? parsed[chosen] : null
  // if (!data) throw new Error('未找到骨骼数据')
  // const animNames = data && data.animations ? Object.keys(data.animations) : []
  // console.log('骨骼名称列表:', names)
  // console.log('选择骨骼:', chosen)
  // console.log('动画名称列表:', animNames)

  const builder = new VideoBuilder({ width: 1280, height: 720, fps: 30 })
  const track = builder.createTrack({ zIndex: 1 })
  track.createScene({ duration: 30 })
    .addBackground({ color: '#202020' })
    .addSpine({
      skeleton: skeletonPath,
      atlas,
      timeline: [
        { name: 'walk', loop: true },
        { name: 'aim', track: 2, at: 1, duration: 1.0, mix: 0.15 },
        { name: 'death', track: 3, at: 5, duration: 1, mix: 0.2 },
        { name: 'hoverboard', track: 4, at: 6, duration: 1, mix: 0.2 },
        { name: 'idle', track: 5, at: 8, duration: 1, mix: 0.2 }

        //aim, death, hoverboard, idle, idle-turn, jump, portal, run, run-to-idle, shoot, walk
      ],
      loop: true,
      width: '50%',
      height: '50%',
      x: '50%',
      y: '60%',
      duration: 30,
      fit:'contain',
      valign: 'bottom'
    })

  const videoMaker = builder.build()
  const outputDir = path.join(__dirname, '../output')
  await fs.promises.mkdir(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, 'test-spine-demos.mp4')
  await videoMaker.export(outputPath, { usePipe: true })
  console.log('输出文件:', outputPath)
  videoMaker.destroy()
  builder.destroy()
}

main().catch(err => {
  console.error('运行失败:', err)
  process.exit(1)
})

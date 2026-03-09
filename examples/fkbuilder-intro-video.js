import { VideoBuilder, getAudioDuration } from '../src/index.js'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const assetsDir = path.join(__dirname, '../assets')
  const outputDir = path.join(__dirname, '../output')
  await fs.ensureDir(outputDir)

  const builder = new VideoBuilder({ width: 1920, height: 1080, fps: 30 })
  const track = builder.createTrack({ zIndex: 1, name: 'Intro' })

  const scene1 = track.createScene({ duration: 3, startTime: 0 }).addBackground({ color: '#0a0e27' })
  scene1.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '42%',
    fontSize: 140,
    color: '#00d9ff',
    textAlign: 'center',
    fontFamily: 'Arial',
    duration: 3,
    startTime: 0,
    animations: ['bigIn'],
    textShadow: true,
    textShadowColor: '#000000',
    textShadowBlur: 28,
  })
  scene1.addText({
    text: '程序化视频生成库',
    x: '50%',
    y: '60%',
    fontSize: 56,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: '微软雅黑',
    duration: 3,
    startTime: 0.4,
    animations: ['fadeIn'],
    opacity: 0.95,
  })

  const scene2Start = 3
  const scene2 = track.createScene({ duration: 4, startTime: scene2Start }).addBackground({ color: '#101622' })
  scene2.addText({
    text: '用代码搭建视频：轨道 · 场景 · 元素',
    x: '50%',
    y: '18%',
    fontSize: 64,
    color: '#00ff88',
    textAlign: 'center',
    fontFamily: '微软雅黑',
    duration: 4,
    startTime: 0,
    animations: ['fadeIn'],
  })
  const blocks = [
    { x: '25%', label: 'Track', color: '#00d9ff' },
    { x: '50%', label: 'Scene', color: '#ff6b9d' },
    { x: '75%', label: 'Element', color: '#ffd700' },
  ]
  blocks.forEach((b, i) => {
    scene2.addRect({
      x: b.x,
      y: '55%',
      width: 420,
      height: 220,
      bgcolor: '#1a2638',
      borderRadius: 22,
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.2 + i * 0.1,
      animations: ['fadeIn'],
      borderWidth: 3,
      borderColor: b.color,
      shadowBlur: 20,
      shadowColor: '#000000',
      shadowOffsetX: 0,
      shadowOffsetY: 10,
      opacity: 0.9,
    })
    scene2.addText({
      text: b.label,
      x: b.x,
      y: '55%',
      fontSize: 72,
      color: b.color,
      textAlign: 'center',
      fontFamily: 'Arial',
      anchor: [0.5, 0.5],
      duration: 4,
      startTime: 0.3 + i * 0.1,
      animations: ['fadeIn'],
    })
  })

  const scene3Start = scene2Start + 4
  const scene3 = track.createScene({ duration: 5, startTime: scene3Start }).addBackground({ color: '#0f1419' })
  scene3.addText({
    text: '元素生态：文本 · 图片 · Sprite · SVG · 音频 · 视频…',
    x: '50%',
    y: '16%',
    fontSize: 58,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: '微软雅黑',
    duration: 5,
    startTime: 0,
    animations: ['fadeIn'],
  })

  const spriteDir = path.join(assetsDir, 'sprite')
  const spriteDirExists = await fs.pathExists(spriteDir)
  if (spriteDirExists) {
    scene3.addSprite({
      srcDir: spriteDir,
      x: '25%',
      y: '58%',
      width: 720,
      height: 720,
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.2,
      frameRate: 12,
      loop: true,
      autoplay: true,
      playMode: 'forward',
      fit: 'contain',
      borderWidth: 6,
      borderColor: '#00ff88',
      borderRadius: 28,
      shadowBlur: 24,
      shadowColor: '#000000',
      shadowOffsetY: 14,
    })
    scene3.addText({
      text: 'Sprite 序列帧',
      x: '25%',
      y: '88%',
      fontSize: 44,
      color: '#00ff88',
      textAlign: 'center',
      fontFamily: '微软雅黑',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.6,
      animations: ['fadeIn'],
    })
  }

  const assetFiles = (await fs.pathExists(assetsDir)) ? await fs.readdir(assetsDir) : []
  const imageFiles = assetFiles.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
  const chosenImage = imageFiles.length > 0 ? path.join(assetsDir, imageFiles[0]) : null
  if (chosenImage) {
    scene3.addImage({
      src: chosenImage,
      x: '75%',
      y: '58%',
      width: 720,
      height: 720,
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.2,
      fit: 'cover',
      borderWidth: 6,
      borderColor: '#ff6b9d',
      borderRadius: 28,
      shadowBlur: 24,
      shadowColor: '#000000',
      shadowOffsetY: 14,
    })
    scene3.addText({
      text: 'Image',
      x: '75%',
      y: '88%',
      fontSize: 44,
      color: '#ff6b9d',
      textAlign: 'center',
      fontFamily: 'Arial',
      anchor: [0.5, 0.5],
      duration: 5,
      startTime: 0.6,
      animations: ['fadeIn'],
    })
  }

  const scene4Start = scene3Start + 5
  const scene4 = track.createScene({ duration: 5, startTime: scene4Start }).addBackground({ color: '#1a0f2e' })
  const quickCode = `import { VideoBuilder } from 'fkbuilder'

const builder = new VideoBuilder({ width: 1920, height: 1080, fps: 30 })
const track = builder.createTrack({ zIndex: 1 })

track.createScene({ duration: 5 })
  .addBackground({ color: '#0a0e27' })
  .addText({ text: 'Hello FKbuilder', x: '50%', y: '50%', fontSize: 90, textAlign: 'center', color: '#00d9ff' })

await builder.render('./output/intro.mp4', { parallel: true, usePipe: true })`
  scene4.addText({
    text: '快速开始：几行代码生成视频',
    x: '50%',
    y: '16%',
    fontSize: 64,
    color: '#ffd700',
    textAlign: 'center',
    fontFamily: '微软雅黑',
    duration: 5,
    startTime: 0,
    animations: ['fadeIn'],
  })
  scene4.addCode({
    code: quickCode,
    language: 'javascript',
    theme: 'dark',
    fontFamily: 'Consolas',
    x: '50%',
    y: '60%',
    width: 1500,
    height: 560,
    anchor: [0.5, 0.5],
    startTime: 0.2,
    duration: 4.8,
    fontSize: 30,
    showLineNumbers: true,
    showBorder: true,
    borderRadius: 18,
    cursor: true,
    split: 'letter',
    splitDelay: 0.01,
    splitDuration: 0.03,
    autoScroll: true,
    padding: 22,
    paddingBottom: 30,
    scrollPaddingBottom: 28,
  })

  const scene5Start = scene4Start + 5
  const scene5 = track.createScene({ duration: 4, startTime: scene5Start }).addBackground({ color: '#000000' })
  scene5.addText({
    text: '安装与运行',
    x: '50%',
    y: '30%',
    fontSize: 88,
    color: '#00d9ff',
    textAlign: 'center',
    fontFamily: '微软雅黑',
    duration: 4,
    startTime: 0,
    animations: ['fadeIn'],
  })
  scene5.addCode({
    code: `npm i fkbuilder\nnode examples/fkbuilder-intro-video.js`,
    language: 'bash',
    theme: 'dark',
    fontFamily: 'Consolas',
    x: '50%',
    y: '62%',
    width: 1120,
    height: 220,
    anchor: [0.5, 0.5],
    startTime: 0.2,
    duration: 3.8,
    fontSize: 40,
    showLineNumbers: false,
    showBorder: true,
    borderRadius: 18,
    padding: 22,
    split: 'letter',
    splitDelay: 0.05,
  })
  scene5.addText({
    text: 'github.com/chnak/FKbuilder',
    x: '50%',
    y: '86%',
    fontSize: 40,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Arial',
    duration: 4,
    startTime: 0.6,
    animations: ['fadeIn'],
    opacity: 0.9,
  })

  track.addTransition({ name: 'CrossZoom', duration: 1 })
  track.addTransition({ name: 'Swirl', duration: 1 })
  track.addTransition({ name: 'GridFlip', duration: 1 })
  track.addTransition({ name: 'Dreamy', duration: 1 })

  const totalDuration = builder.getTotalDuration()
  console.log('Total duration (s):', totalDuration)

  const audioFiles = assetFiles.filter(f => /\.(mp3|m4a|wav|ogg)$/i.test(f))
  if (audioFiles.length > 0) {
    const audioPath = path.join(assetsDir, audioFiles[0])
    const audioLen = await getAudioDuration(audioPath)
    if (audioLen > 0) {
      let t = 0
      while (t < totalDuration) {
        const remaining = totalDuration - t
        const seg = Math.min(audioLen, remaining)
        scene1.addAudio({
          src: audioPath,
          startTime: t,
          duration: seg,
          cutFrom: 0,
          cutTo: seg,
          volume: 0.5,
          fadeIn: t === 0 ? 0.6 : 0,
          fadeOut: t + seg >= totalDuration ? 0.8 : 0,
        })
        t += seg
      }
    }
  }

  const outputPath = path.join(outputDir, 'fkbuilder-intro-video.mp4')
  await builder.render(outputPath, { parallel: true, usePipe: true, maxWorkers: 4 })
}

main().catch(console.error)

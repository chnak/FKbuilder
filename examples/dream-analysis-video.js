import { VideoBuilder, getAudioDuration } from '../src/index.js'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function addTitle(scene, { title, subtitle, note, duration }) {
  scene.addText({
    text: title,
    x: '50%',
    y: '32%',
    anchor: [0.5, 0.5],
    fontSize: 96,
    color: '#eaf2ff',
    textAlign: 'center',
    fontFamily: 'MicrosoftYaHei',
    fontWeight: 'bold',
    duration,
    startTime: 0,
    animations: ['fadeIn'],
    textShadow: true,
    textShadowColor: '#000000',
    textShadowBlur: 24,
  })

  scene.addRect({
    x: '50%',
    y: '48%',
    width: 1260,
    height: 4,
    anchor: [0.5, 0.5],
    fillColor: 'rgba(255,255,255,0.18)',
    duration,
    startTime: 0.2,
    animations: ['fadeIn'],
  })

  scene.addText({
    text: subtitle,
    x: '50%',
    y: '56%',
    anchor: [0.5, 0.5],
    fontSize: 44,
    color: 'rgba(234,242,255,0.92)',
    textAlign: 'center',
    fontFamily: 'MicrosoftYaHei',
    duration,
    startTime: 0.3,
    animations: ['fadeInUp'],
  })

  if (note) {
    scene.addText({
      text: note,
      x: '50%',
      y: '78%',
      anchor: [0.5, 0.5],
      fontSize: 30,
      color: 'rgba(255,255,255,0.72)',
      textAlign: 'center',
      fontFamily: 'MicrosoftYaHei',
      duration,
      startTime: 0.9,
      animations: ['fadeIn'],
    })
  }
}

function addSection(scene, { title, bullets, duration }) {
  scene.addText({
    text: title,
    x: '8%',
    y: '14%',
    anchor: [0, 0.5],
    fontSize: 64,
    color: '#9ef5ff',
    textAlign: 'left',
    fontFamily: 'MicrosoftYaHei',
    fontWeight: 'bold',
    duration,
    startTime: 0,
    animations: ['fadeIn'],
  })

  const startY = 30
  const lineGap = 8
  const baseFont = 40
  const left = 10

  bullets.forEach((t, i) => {
    const y = `${startY + i * (baseFont + lineGap)}%`
    scene.addText({
      text: `• ${t}`,
      x: `${left}%`,
      y,
      anchor: [0, 0.5],
      fontSize: baseFont,
      color: 'rgba(255,255,255,0.92)',
      textAlign: 'left',
      fontFamily: 'MicrosoftYaHei',
      duration,
      startTime: 0.2 + i * 0.15,
      animations: ['fadeInUp'],
    })
  })
}

async function addLoopedAmbientAudio({ builder, sceneForAudio, assetsDir }) {
  let audioPath = null
  try {
    if (await fs.pathExists(assetsDir)) {
      const files = await fs.readdir(assetsDir)
      const audioFiles = files.filter(f => /\.(mp3|m4a|wav|ogg)$/i.test(f))
      if (audioFiles.length > 0) audioPath = path.join(assetsDir, audioFiles[0])
    }
  } catch (_) {}

  if (!audioPath) return

  const totalDuration = builder.getTotalDuration()
  const audioLen = await getAudioDuration(audioPath)
  if (!audioLen || audioLen <= 0 || !Number.isFinite(totalDuration) || totalDuration <= 0) return

  let t = 0
  while (t < totalDuration) {
    const remaining = totalDuration - t
    const seg = Math.min(audioLen, remaining)
    sceneForAudio.addAudio({
      src: audioPath,
      startTime: t,
      duration: seg,
      cutFrom: 0,
      cutTo: seg,
      volume: 0.26,
      fadeIn: t === 0 ? 0.8 : 0,
      fadeOut: t + seg >= totalDuration ? 1.2 : 0,
    })
    t += seg
  }
}

async function main() {
  const outputDir = path.join(__dirname, '../output')
  const assetsDir = path.join(__dirname, '../assets')
  await fs.ensureDir(outputDir)

  const builder = new VideoBuilder({ width: 1920, height: 1080, fps: 30 })
  const track = builder.createTrack({ zIndex: 1, name: 'DreamAnalysis' })

  const transitionDuration = 0.9
  let currentTime = 0

  const scene1Duration = 6.5
  const scene1 = track.createScene({ duration: scene1Duration, startTime: currentTime }).addBackground({ color: '#0b1022' })
  addTitle(scene1, {
    title: '古籍如何说梦？',
    subtitle: '梦与业力、无明，以及“少梦=澄明？”',
    note: '以古籍与佛教语境做概览，不替代医疗建议',
    duration: scene1Duration,
  })
  currentTime += scene1Duration

  track.addTransition({ name: 'CrossZoom', duration: transitionDuration, startTime: currentTime - transitionDuration })

  const scene2Duration = 11
  const scene2Start = currentTime - transitionDuration
  const scene2 = track.createScene({ duration: scene2Duration, startTime: scene2Start }).addBackground({ color: '#081a1a' })
  addSection(scene2, {
    title: '古籍视角（侧重三条线索）',
    bullets: [
      '庄子：梦与觉相对待，借梦问“真我”与界限',
      '《黄帝内经》：情志与气血失衡可致梦象纷纭',
      '梦占传统：以梦为象，重“象征”与“征兆”的解释',
    ],
    duration: scene2Duration,
  })
  scene2.addText({
    text: '古籍并不只有一种答案：哲思、身心、象征三路并行',
    x: '10%',
    y: '84%',
    anchor: [0, 0.5],
    fontSize: 34,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'left',
    fontFamily: 'MicrosoftYaHei',
    duration: scene2Duration,
    startTime: 1.1,
    animations: ['fadeIn'],
  })
  currentTime = scene2Start + scene2Duration

  track.addTransition({ name: 'Swirl', duration: transitionDuration, startTime: currentTime - transitionDuration })

  const scene3Duration = 13
  const scene3Start = currentTime - transitionDuration
  const scene3 = track.createScene({ duration: scene3Duration, startTime: scene3Start }).addBackground({ color: '#1b1130' })
  addSection(scene3, {
    title: '佛教语境（常见说法）',
    bullets: [
      '“四种梦”：四大不调、日间残影、天神示现、宿业牵引',
      '唯识系：梦多由“习气种子”发动，是识流的现行相',
      '业力与无明：可解释“为何相似梦境反复出现”，但非唯一因',
    ],
    duration: scene3Duration,
  })
  scene3.addText({
    text: '要点：佛教更关心“梦中执取如何起”，以及如何止息它',
    x: '10%',
    y: '84%',
    anchor: [0, 0.5],
    fontSize: 34,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'left',
    fontFamily: 'MicrosoftYaHei',
    duration: scene3Duration,
    startTime: 1.2,
    animations: ['fadeIn'],
  })
  currentTime = scene3Start + scene3Duration

  track.addTransition({ name: 'GridFlip', duration: transitionDuration, startTime: currentTime - transitionDuration })

  const scene4Duration = 12.5
  const scene4Start = currentTime - transitionDuration
  const scene4 = track.createScene({ duration: scene4Duration, startTime: scene4Start }).addBackground({ color: '#111b24' })
  addSection(scene4, {
    title: '少梦 = 心性澄明吗？',
    bullets: [
      '先区分：梦少 vs 记梦少（很多人是“想不起来”）',
      '生理面：睡眠结构、压力、药物/酒精都会影响梦与回忆',
      '修习面：心更安定时，梦的扰动可能减少，但不是唯一指标',
    ],
    duration: scene4Duration,
  })
  scene4.addText({
    text: '更可靠的参照：日间是否更清醒、少烦恼、能觉察起心动念',
    x: '10%',
    y: '84%',
    anchor: [0, 0.5],
    fontSize: 34,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'left',
    fontFamily: 'MicrosoftYaHei',
    duration: scene4Duration,
    startTime: 1.2,
    animations: ['fadeIn'],
  })
  currentTime = scene4Start + scene4Duration

  track.addTransition({ name: 'Dreamy', duration: transitionDuration, startTime: currentTime - transitionDuration })

  const scene5Duration = 9.5
  const scene5Start = currentTime - transitionDuration
  const scene5 = track.createScene({ duration: scene5Duration, startTime: scene5Start }).addBackground({ color: '#0a0e27' })
  addSection(scene5, {
    title: '可操作的小结',
    bullets: [
      '困扰反复梦：记录触发点，白天先处理情绪与压力源',
      '睡前调息与正念：不追梦境内容，回到呼吸与当下觉受',
      '若伴随失眠、惊恐或影响生活：优先求助专业医疗',
    ],
    duration: scene5Duration,
  })
  scene5.addText({
    text: '结论：梦可由身心多因所生；以“觉察与放下”作检验更稳妥',
    x: '10%',
    y: '84%',
    anchor: [0, 0.5],
    fontSize: 34,
    color: 'rgba(255,255,255,0.80)',
    textAlign: 'left',
    fontFamily: 'MicrosoftYaHei',
    duration: scene5Duration,
    startTime: 1.2,
    animations: ['fadeIn'],
  })

  await addLoopedAmbientAudio({ builder, sceneForAudio: scene1, assetsDir })

  const outputPath = path.join(outputDir, 'dream-analysis.mp4')
  await builder.render(outputPath, { parallel: true, usePipe: true, maxWorkers: 4 })
}

main().catch(console.error)

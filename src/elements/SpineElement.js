import 'pixi-spine' 
import { BaseElement } from './BaseElement.js'
import { DEFAULT_SPINE_CONFIG } from '../types/constants.js'
import { deepMerge } from '../utils/helpers.js'
import { ElementType } from '../types/enums.js'
import * as PIXI from '@pixi/node'
import {Spine} from 'pixi-spine';
import { Image, createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'



export class SpineElement extends BaseElement {
  constructor(config = {}) {
    super(config)
    this.type = ElementType.SPINE
    this.config = deepMerge({}, DEFAULT_SPINE_CONFIG, config)
    this._pixi = null
    this._lastTime = null
    this._appliedSchedule = new Set()
  }

   _disableWarnings() {
    if (!this.__fk_warn_suppressed) {      
      const __origWarn = console.warn;
      const __origGroup = console.group;
      const __origGroupCollapsed = console.groupCollapsed;
      const __origGroupEnd = console.groupEnd;
      let __lastDeprecation = 0;
      const __match = (args) => {
        for (const a of args) {
          const s = String(a ?? '');
          if (s.includes('PixiJS Deprecation Warning') || s.includes('Deprecated since')) return true;
        }
        return false;
      };
      console.warn = (...args) => {
        if (__match(args)) { __lastDeprecation = Date.now(); return; }
        if (__lastDeprecation && Date.now() - __lastDeprecation < 500) return;
        __origWarn.apply(console, args);
      };
      console.group = (...args) => {
        if (__match(args)) { __lastDeprecation = Date.now(); return; }
        if (typeof __origGroup === 'function') __origGroup.apply(console, args);
      };
      console.groupCollapsed = (...args) => {
        if (__match(args)) { __lastDeprecation = Date.now(); return; }
        if (typeof __origGroupCollapsed === 'function') __origGroupCollapsed.apply(console, args);
      };
      console.groupEnd = (...args) => {
        if (typeof __origGroupEnd === 'function') __origGroupEnd.apply(console, args);
      };
      this.__fk_warn_suppressed = true;
    }
  }

  async initialize() {
    await super.initialize()
    this._disableWarnings()
    const { dir, skeleton, atlas, prefer, scale, role, anim } = this.config
    let assetsDir = dir || (skeleton ? path.dirname(skeleton) : '')
    if (!assetsDir) return

    const files = fs.readdirSync(assetsDir)
    const jsonFile = files.find(f => f.toLowerCase().endsWith('.json')) || null
    const skelFile = files.find(f => f.toLowerCase().endsWith('.skel')) || null
    const atlasFile = Array.isArray(atlas) ? (atlas.length > 0 ? atlas[0] : null) : (atlas || (files.find(f => f.toLowerCase().endsWith('.atlas')) || null))
    if (!atlasFile && !Array.isArray(atlas)) return

    let atlasPath = null
    let atlasPaths = null
    if (Array.isArray(atlas)) {
      atlasPaths = atlas.map(a => (a && path.isAbsolute(a)) ? a : path.join(assetsDir, a)).filter(p => {
        try { return fs.existsSync(p) } catch (_) { return false }
      })
    } else {
      if (atlas && path.isAbsolute(atlas)) {
        atlasPath = atlas
      } else if (atlas) {
        atlasPath = path.join(assetsDir, atlas)
      } else {
        atlasPath = path.join(assetsDir, atlasFile)
      }
    }
    let skeletonPath = skeleton || null
    let baseName = null
    if (!skeletonPath && jsonFile) {
      const jsonText = fs.readFileSync(path.join(assetsDir, jsonFile), 'utf-8')
      let parsed = null
      try { parsed = JSON.parse(jsonText) } catch (_) {}
      const isAggregator = parsed && typeof parsed === 'object' && !parsed.skeleton
      if (!isAggregator) {
        skeletonPath = path.join(assetsDir, jsonFile)
        baseName = jsonFile.replace(/\.[^.]+$/, '')
      }
    }
    if (skeletonPath && skeletonPath.toLowerCase().endsWith('.json')) {
      try {
        const jsonText = fs.readFileSync(skeletonPath, 'utf-8')
        let parsed = null
        try { parsed = JSON.parse(jsonText) } catch (_) {}
        const isAggregator = parsed && typeof parsed === 'object' && !parsed.skeleton
        if (isAggregator) {
          const names = Object.keys(parsed)
          let chosen = null
          if (role && parsed[role]) {
            chosen = role
          } else {
            const wanted = prefer
            const ordered = [wanted, ...names.filter(n => n !== wanted)].filter(Boolean)
            for (const n of ordered) {
              const entry = parsed[n]
              if (entry && entry.skeleton && entry.animations && Object.keys(entry.animations).length > 0) {
                chosen = n
                break
              }
            }
            if (!chosen) chosen = ordered[0] || names[0] || null
          }
          if (chosen) {
            const data = parsed[chosen]
            const outJson = path.join(path.dirname(skeletonPath), `${chosen}.json`)
            fs.writeFileSync(outJson, JSON.stringify(data))
            skeletonPath = outJson
            baseName = chosen
          }
        }
      } catch (_) {}
    }
    if (!skeletonPath && skelFile) {
      skeletonPath = path.join(assetsDir, skelFile)
      baseName = skelFile.replace(/\.[^.]+$/, '')
    }
    if (!skeletonPath && jsonFile) {
      const jsonText = fs.readFileSync(path.join(assetsDir, jsonFile), 'utf-8')
      let parsed = null
      try { parsed = JSON.parse(jsonText) } catch (_) {}
      const names = parsed && typeof parsed === 'object' ? Object.keys(parsed) : []
      const ordered = [prefer, ...names.filter(n => n !== prefer)].filter(Boolean)
      let chosen = null
      for (const n of ordered) {
        const entry = parsed[n]
        if (entry && entry.skeleton && entry.animations && Object.keys(entry.animations).length > 0) {
          chosen = n
          break
        }
      }
      if (!chosen) {
        chosen = ordered[0] || null
      }
      const data = chosen ? parsed[chosen] : null
      if (data && data.skeleton) {
        const outJson = path.join(assetsDir, `${chosen}.json`)
        fs.writeFileSync(outJson, JSON.stringify(data))
        skeletonPath = outJson
        baseName = chosen
      }
    }
    if (!skeletonPath) return

    if (!baseName && skeletonPath) {
      baseName = path.basename(skeletonPath).replace(/\.[^.]+$/, '')
    }

    const expectedAtlas = path.join(assetsDir, `${baseName}.atlas`)
    try {
      if (atlasPaths && atlasPaths.length > 0) {
        const parts = []
        for (const pth of atlasPaths) {
          try {
            const txt = fs.readFileSync(pth, 'utf-8')
            parts.push(txt.trim())
          } catch (_) {}
        }
        const merged = parts.join('\n\n')
        fs.writeFileSync(expectedAtlas, merged)
      } else if (atlasPath) {
        fs.copyFileSync(atlasPath, expectedAtlas)
      }
    } catch (_) {}

    if (process.env.FK_DEBUG_SPINE === '1') {
      console.log('[SpineElement] skeletonPath=%s baseName=%s expectedAtlas=%s', skeletonPath, baseName, expectedAtlas)
    }
    const width = 1
    const height = 1
    const app = new PIXI.Application({ width, height, backgroundColor: 0x000000, backgroundAlpha: 0, preserveDrawingBuffer: true, transparent: true })
    if (app?.renderer?.background) {
      app.renderer.background.color = 0x000000
      app.renderer.background.alpha = 0
    }
    if (app.ticker && typeof app.ticker.stop === 'function') {
      app.ticker.stop()
      app.ticker.autoStart = false
    }

    await PIXI.Assets.init()
    PIXI.Assets.add({ alias: `${baseName}-skeleton`, src: skeletonPath })
    const spineRes = await PIXI.Assets.load(`${baseName}-skeleton`)
    const spineData = (spineRes && (spineRes.spineData || spineRes.data || spineRes))
    if (!spineData) return

    const spine = new Spine(spineData)
    spine.x = width / 2
    spine.y = height * 0.875
    spine.scale.set(scale || 1)
    app.stage.addChild(spine)

    if (spine?.skeleton?.setToSetupPose) {
      spine.skeleton.setToSetupPose()
    }

    spine.autoUpdate = false
    const state = spine.state
    const sData = (spine.spineData || spine.skeleton?.data || state?.data?.skeletonData || state?.data || {})
    const anims = Array.isArray(sData.animations) ? sData.animations : []
    console.log('[SpineElement] anims=%s', anims.map(a => a.name || a.id || '?').join(', '))
    const available = new Set(anims.map(a => a?.name))
    let schedule = Array.isArray(this.config.animSchedule) ? this.config.animSchedule : null
    const timeline = Array.isArray(this.config.timeline) ? this.config.timeline : null

    if (!schedule && timeline && timeline.length > 0) {
      const sch = []
      for (const item of timeline) {
        const baseTrack = (item && item.track != null) ? item.track : 0
        const loop = !!(item && item.loop)
        const mix = (item && item.mix != null) ? item.mix : null
        const at = Number(item && item.at) >= 0 ? Number(item.at) : 0
        const duration = Number(item && item.duration) > 0 ? Number(item.duration) : null
        const namesArr = Array.isArray(item?.name) ? item.name : (item?.name ? [item.name] : [])
        const validNames = namesArr.filter(n => available.has(n))
        if (validNames.length === 0) continue
        for (let i = 0; i < validNames.length; i++) {
          const n = validNames[i]
          const track = baseTrack + i
          sch.push({ track, name: n, action: 'set', start: at, loop, mix })
          if (duration != null) {
            sch.push({ track, action: 'empty', start: at + duration, end: at + duration, mix })
          }
        }
      }
      this.config.animSchedule = sch
      schedule = sch
    }

    if (!schedule && (!timeline || timeline.length === 0)) {
      const fallback = anims.length > 0 ? (anims[0].name || anims[0].id || null) : null
      if (fallback) state.setAnimation(0, fallback, this.config.loop !== false)
    }

    let naturalW = width
    let naturalH = height
    try {
      const prevScaleX = spine.scale.x
      const prevScaleY = spine.scale.y
      spine.scale.set(1, 1)
      app.renderer.render(app.stage)
      const b = spine.getBounds()
      if (b && b.width > 0 && b.height > 0) {
        naturalW = b.width
        naturalH = b.height
      }
      spine.scale.set(prevScaleX, prevScaleY)
    } catch (_) {}

    this._pixi = { app, spine, naturalW, naturalH }
    this._lastTime = null
    this._callOnLoaded(this.startTime || 0, null, null)
  }

  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null
    if (!this.isActiveAtTime(time)) return null
    if (!this._pixi) {
      await this.initialize()
      if (!this._pixi) return null
    }

    const { paper: p, project } = this.getPaperInstance(paperInstance)
    const viewSize = project?.view?.viewSize || { width: 1920, height: 1080 }
    const context = { width: viewSize.width, height: viewSize.height }
    const state = this.getStateAtTime(time, context)

    const containerSize = this.convertSize(state.width, state.height, context)
    const containerWidth = containerSize.width || viewSize.width
    const containerHeight = containerSize.height || viewSize.height
    const pos = this.calculatePosition(state, context, { width: containerWidth, height: containerHeight })

    const { app, spine, naturalW, naturalH } = this._pixi
    const delta = this._lastTime == null ? 0 : Math.max(0, time - this._lastTime)
    this._lastTime = time
    const timeScale = this.config.timeScale || 1
    spine.update(delta * timeScale)

    const schedule = Array.isArray(this.config.animSchedule) ? this.config.animSchedule : null
    if (schedule && schedule.length > 0) {
      const now = (time - (this.startTime || 0))
      for (let i = 0; i < schedule.length; i++) {
        const evt = schedule[i] || {}
        const track = (evt.track != null ? evt.track : 0)
        const start = (evt.start != null ? evt.start : 0)
        const end = (evt.end != null ? evt.end : null)
        const action = (evt.action || 'set')
        const loop = !!evt.loop
        const name = evt.name || null
        const delay = evt.delay || 0
        const mix = evt.mix || evt.defaultMix || null
        const keyStart = `start:${i}`
        const keyEnd = `end:${i}`
        if (mix != null && spine.stateData) {
          spine.stateData.defaultMix = mix
        }
        if (!this._appliedSchedule.has(keyStart) && now >= start && name) {
          if (action === 'add') {
            spine.state.addAnimation(track, name, loop, delay)
          } else if (action === 'empty') {
            spine.state.setEmptyAnimation(track, mix || 0)
          } else {
            spine.state.setAnimation(track, name, loop)
          }
          this._appliedSchedule.add(keyStart)
        }
        if (end != null && !this._appliedSchedule.has(keyEnd) && now >= end) {
          spine.state.setEmptyAnimation(track, mix || 0)
          this._appliedSchedule.add(keyEnd)
        }
      }
    }

    const fitMode = this.config.fit || 'contain'
    const baseScale = this.config.scale || 1
    spine.scale.set(baseScale)
    app.renderer.render(app.stage)
    let b1 = null
    try { b1 = spine.getBounds() } catch (_) {}
    let bw = (b1 && b1.width > 0) ? b1.width : (naturalW || containerWidth)
    let bh = (b1 && b1.height > 0) ? b1.height : (naturalH || containerHeight)
    let uni = 1
    let sx = containerWidth / (bw || 1)
    let sy = containerHeight / (bh || 1)
    if (fitMode === 'contain') {
      uni = Math.min(sx, sy)
      spine.scale.set(baseScale * uni)
    } else if (fitMode === 'cover') {
      uni = Math.max(sx, sy)
      spine.scale.set(baseScale * uni)
    } else if (fitMode === 'fill') {
      spine.scale.set(baseScale * sx, baseScale * sy)
    } else {
      spine.scale.set(baseScale)
    }
    if (process.env.FK_DEBUG_SPINE === '1') {
      console.log('[SpineElement] fit=%s container=%dx%d bounds=%dx%d scale=%s', fitMode, containerWidth, containerHeight, bw, bh, fitMode === 'fill' ? `${baseScale * sx}x${baseScale * sy}` : `${baseScale * uni}`)
    }
    spine.x = containerWidth / 2
    let targetY
    const valign = (this.config.valign || 'bottom')
    if (valign === 'bottom') {
      targetY = containerHeight
    } else if (valign === 'top') {
      targetY = 0
    } else {
      targetY = containerHeight / 2
    }

    app.renderer.render(app.stage)
    try {
      const b = spine.getBounds()
      if (b && b.width > 0 && b.height > 0) {
        const bcx = b.x + b.width / 2
        const bcy = b.y + b.height / 2
        const targetX = containerWidth / 2
        let alignY = targetY
        if (valign === 'bottom') alignY = containerHeight - b.height / 2
        else if (valign === 'top') alignY = b.height / 2
        const dx = targetX - bcx
        const dy = alignY - bcy
        spine.x += dx
        spine.y += dy
      }
    } catch (_) {}
    app.renderer.resize(containerWidth, containerHeight)
    if (app?.renderer?.gl && typeof app.renderer.gl.clearColor === 'function') {
      app.renderer.gl.clearColor(0, 0, 0, 0)
    }
    app.renderer.render(app.stage)
    const buf = app.renderer.view.toBuffer('image/png')

    const img = new Image()
    img.src = buf
    const canvas = p.createCanvas(containerWidth, containerHeight)
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, containerWidth, containerHeight)
    ctx.drawImage(img, 0, 0, containerWidth, containerHeight)
    const raster = new p.Raster(canvas)
    raster.position = new p.Point(pos.x, pos.y)

    const sourceWidth = img.width || containerWidth
    const sourceHeight = img.height || containerHeight
    if (sourceWidth > 0 && sourceHeight > 0) {
      const scaleX = containerWidth / sourceWidth
      const scaleY = containerHeight / sourceHeight
      raster.scale(scaleX, scaleY, raster.position)
    } else {
      raster.size = new p.Size(containerWidth, containerHeight)
    }

    this.applyTransform(raster, state, { applyPosition: false, paperInstance: p })
    if (layer) layer.addChild(raster)
    this._callOnRender(time, raster, { paper: p, project })
    return raster
  }
}

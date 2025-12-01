import { BaseElement } from './BaseElement.js'
import { DEFAULT_SPINE_CONFIG } from '../types/constants.js'
import { deepMerge } from '../utils/helpers.js'
import { ElementType } from '../types/enums.js'
import { Image, createCanvas, loadImage } from 'canvas'
import fs from 'fs'
import path from 'path'
import CanvasKitInit from 'canvaskit-wasm'
import * as spineck from '@esotericsoftware/spine-canvaskit'
import { RegionAttachment, MeshAttachment, Utils, MixBlend } from '@esotericsoftware/spine-core'



export class SpineElement extends BaseElement {
  constructor(config = {}) {
    super(config)
    this.type = ElementType.SPINE
    this.config = deepMerge({}, DEFAULT_SPINE_CONFIG, config)
    this._ck = null
    this._lastTime = null
    this._appliedSchedule = new Set()
    if (!Array.isArray(this.config.animSchedule) && Array.isArray(this.config.timeline) && this.config.timeline.length > 0) {
      const sch = []
      for (const item of this.config.timeline) {
        const baseTrack = Number(item && item.track) >= 0 ? Number(item.track) : 0
        const loop = !!(item && item.loop)
        const mix = (item && item.mix != null) ? item.mix : null
        const at = Number(item && item.at) >= 0 ? Number(item.at) : 0
        const duration = Number(item && item.duration) > 0 ? Number(item.duration) : null
        const delay = Number(item && item.delay) >= 0 ? Number(item.delay) : 0
        const action = (item && item.action) ? item.action : 'set'
        const namesArr = Array.isArray(item?.name) ? item.name : (item?.name ? [item.name] : [])
        for (let i = 0; i < namesArr.length; i++) {
          const n = namesArr[i]
          const track = Number(baseTrack) + i
          sch.push({ track, name: n, action, start: at, loop, mix, delay })
          if (duration != null) {
            sch.push({ track, action: 'empty', start: at + duration, end: at + duration, mix })
          }
        }
      }
      // 确保所有事件都有明确的 track 字段，避免序列化时丢失
      const finalSchedule = sch.map(evt => ({
        track: evt.track != null ? evt.track : 0,
        name: evt.name,
        action: evt.action,
        start: evt.start,
        end: evt.end,
        loop: evt.loop,
        mix: evt.mix,
        delay: evt.delay
      }));
      
      this.config.animSchedule = finalSchedule
    }
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
    const wasmDir = path.join(process.cwd(), 'node_modules', 'canvaskit-wasm', 'bin')
    const CanvasKit = await CanvasKitInit({ locateFile: (f) => path.join(wasmDir, f) })
    const surface = CanvasKit.MakeSurface(width, height)
    const canvas = surface.getCanvas()

    const atlasFileForModule = expectedAtlas.replace(/\\/g, '/')
    const skeletonFileForModule = skeletonPath.replace(/\\/g, '/')
    const ckAtlas = await spineck.loadTextureAtlas(CanvasKit, atlasFileForModule, (p) => fs.promises.readFile(p))
    let skeletonData = null
    try {
      skeletonData = await spineck.loadSkeletonData(skeletonFileForModule, ckAtlas, (p) => fs.promises.readFile(p), scale || 1)
    } catch (_) {
      const candidateJson = fs.existsSync(path.join(assetsDir, `${baseName}.json`)) ? path.join(assetsDir, `${baseName}.json`) : (jsonFile ? path.join(assetsDir, jsonFile) : null)
      if (!candidateJson) throw _
      const jsonModPath = candidateJson.replace(/\\/g, '/')
      skeletonData = await spineck.loadSkeletonData(jsonModPath, ckAtlas, (p) => fs.promises.readFile(p), scale || 1)
    }
    const drawable = new spineck.SkeletonDrawable(skeletonData)
    const renderer = new spineck.SkeletonRenderer(CanvasKit)

    const setupW = Number(drawable?.skeleton?.data?.width) || 0
    const setupH = Number(drawable?.skeleton?.data?.height) || 0

    let naturalW = width
    let naturalH = height
    let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY
    let naturalCx = 0, naturalCy = 0
    const drawOrderInit = drawable.skeleton.drawOrder
    let positionsInit = Utils.newFloatArray(100)
    for (let i = 0, n = drawOrderInit.length; i < n; i++) {
      const slot = drawOrderInit[i]
      const attachment = slot.getAttachment()
      if (attachment instanceof RegionAttachment) {
        if (positionsInit.length < 8) positionsInit = Utils.newFloatArray(8)
        attachment.computeWorldVertices(slot, positionsInit, 0, 2)
        for (let ii = 0; ii < 8; ii += 2) { const x = positionsInit[ii]; const y = positionsInit[ii+1]; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y) }
      } else if (attachment instanceof MeshAttachment) {
        const len = attachment.worldVerticesLength
        if (positionsInit.length < len) positionsInit = Utils.newFloatArray(len)
        attachment.computeWorldVertices(slot, 0, len, positionsInit, 0, 2)
        for (let ii = 0; ii < len; ii += 2) { const x = positionsInit[ii]; const y = positionsInit[ii+1]; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y) }
      }
    }
    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) { naturalW = Math.max(1, maxX - minX); naturalH = Math.max(1, maxY - minY); naturalCx = (minX + maxX) / 2; naturalCy = (minY + maxY) / 2 }

    this._ck = { CanvasKit, surface, canvas, atlas: ckAtlas, drawable, renderer, naturalW, naturalH, naturalCx, naturalCy, setupW, setupH }
    this._lastTime = null
    this._callOnLoaded(this.startTime || 0, null, null)
    let availableNames = new Set()
    try {
      const animsArr = drawable?.skeleton?.data?.animations || []
      for (const a of animsArr) { const nm = a?.name || a?.id; if (nm) availableNames.add(nm) }
      if (availableNames.size === 0 && skeletonPath.toLowerCase().endsWith('.json')) {
        const jsonText2 = fs.readFileSync(skeletonPath, 'utf-8')
        const parsed2 = JSON.parse(jsonText2)
        const animsObj = parsed2 && parsed2.animations
        if (animsObj && typeof animsObj === 'object') {
          for (const k of Object.keys(animsObj)) availableNames.add(k)
        }
      }
      if (process.env.FK_DEBUG_SPINE === '1') {
        console.log('[SpineElement] available animations:', Array.from(availableNames).join(', '))
      }
    } catch (_) {}
    // 强制重新生成schedule，避免使用缓存数据
    let schedule = null
    const timeline = Array.isArray(this.config.timeline) ? this.config.timeline : null
    if (process.env.FK_DEBUG_SPINE === '1') {
      console.log('[SpineElement] schedule exists:', !!schedule, 'timeline exists:', !!timeline)
      console.log('[SpineElement] config.animSchedule:', this.config.animSchedule)
      if (schedule) {
        console.log('[SpineElement] schedule source:', schedule === this.config.animSchedule ? 'from cache' : 'newly generated')
      }
    }
    if (timeline && timeline.length > 0) {
      if (process.env.FK_DEBUG_SPINE === '1') {
        console.log('[SpineElement] build schedule from timeline, count=%d', timeline.length)
        console.log('[SpineElement] timeline content:', JSON.stringify(timeline, null, 2))
        console.log('[SpineElement] config.animSchedule before generation:', this.config.animSchedule)
      }
      const sch = []
      let trackCounter = 0
      for (const item of timeline) {
        // 自动分配轨道号：如果用户没有指定轨道，就自动递增分配
        const baseTrack = Number(item && item.track) >= 0 ? Number(item.track) : trackCounter++
        const loop = !!(item && item.loop)
        const mix = (item && item.mix != null) ? item.mix : null
        const at = Number(item && item.at) >= 0 ? Number(item.at) : 0
        const duration = Number(item && item.duration) > 0 ? Number(item.duration) : null
        const delay = Number(item && item.delay) >= 0 ? Number(item.delay) : 0
        const action = (item && item.action) ? item.action : 'set'
        const namesArr = Array.isArray(item?.name) ? item.name : (item?.name ? [item.name] : [])
        const validNames = namesArr.filter(n => availableNames.has(n))
        if (validNames.length === 0) continue
        for (let i = 0; i < validNames.length; i++) {
          const n = validNames[i]
          // 使用自动分配的轨道号
          const track = baseTrack
          sch.push({ track, name: n, action, start: at, loop, mix, delay })
          if (duration != null) {
            sch.push({ track, action: 'empty', start: at + duration, end: at + duration, mix })
          }
        }
      }
      // 确保所有事件都有明确的 track 字段，避免序列化时丢失
      const finalSchedule = sch.map(evt => ({
        track: evt.track != null ? evt.track : 0,
        name: evt.name,
        action: evt.action,
        start: evt.start,
        end: evt.end,
        loop: evt.loop,
        mix: evt.mix,
        delay: evt.delay
      }));
      
      this.config.animSchedule = finalSchedule
      schedule = finalSchedule
      if (process.env.FK_DEBUG_SPINE === '1') {
        console.log('[SpineElement] schedule generated with tracks:', finalSchedule.map(e => e.track))
        console.log('[SpineElement] full schedule:', JSON.stringify(finalSchedule, null, 2))
        // 检查 schedule 对象是否被正确设置
        console.log('[SpineElement] config animSchedule tracks:', this.config.animSchedule.map(e => e.track))
        console.log('[SpineElement] config animSchedule keys:', Object.keys(this.config.animSchedule[0] || {}))
      }
      if (process.env.FK_DEBUG_SPINE === '1') {
        console.log('[SpineElement] built animSchedule size=%d', schedule.length)
        console.log('[SpineElement] schedule events:', schedule.map(evt => ({
          name: evt.name,
          track: evt.track,
          action: evt.action,
          start: evt.start
        })))
        console.log('[SpineElement] track assignments:', schedule.map(evt => evt.track))
      }
    }
    if (!schedule && (!timeline || timeline.length === 0)) {
      const animConf = this.config.anim
      let chosen = null
      if (typeof animConf === 'string') {
        chosen = animConf
      } else if (Array.isArray(animConf) && animConf.length > 0) {
        chosen = animConf[0]
      }
      if (!chosen) {
        chosen = Array.from(availableNames)[0] || null
      }
      if (chosen) this._ck.drawable.animationState.setAnimation(0, chosen, this.config.loop !== false)
    }
  }

  async render(layer, time, paperInstance = null) {
    if (!this.visible) return null
    if (!this.isActiveAtTime(time)) return null
    if (!this._ck) {
      await this.initialize()
      if (!this._ck) return null
    }

    const { paper: p, project } = this.getPaperInstance(paperInstance)
    const viewSize = project?.view?.viewSize || { width: 1920, height: 1080 }
    const context = { width: viewSize.width, height: viewSize.height }
    const state = this.getStateAtTime(time, context)
    const containerSize = this.convertSize(state.width, state.height, context)
    const containerWidth = containerSize.width || viewSize.width
    const containerHeight = containerSize.height || viewSize.height
    const pos = this.calculatePosition(state, context)

    const { CanvasKit, surface, canvas, drawable, renderer, naturalW, naturalH, naturalCx, naturalCy } = this._ck
    const wasFirstFrame = (this._lastTime == null)
    const delta = wasFirstFrame ? 0 : (time - this._lastTime)
    const timeScale = (state.timeScale !== undefined ? state.timeScale : this.config.timeScale) || 1

    // 先根据绝对时间应用动画日程
    // 强制重新生成schedule，避免使用缓存数据
    let schedule = null
    if (!schedule) {
      const tl = Array.isArray(state.timeline) ? state.timeline : (Array.isArray(this.config.timeline) ? this.config.timeline : null)
      if (tl && tl.length > 0) {
        const sch = []
        let trackCounter = 0
        for (const item of tl) {
          // 自动分配轨道号：如果用户没有指定轨道，就自动递增分配
          const baseTrack = Number(item && item.track) >= 0 ? Number(item.track) : trackCounter++
          const loop = !!(item && item.loop)
          const mix = (item && item.mix != null) ? item.mix : null
          const at = Number(item && item.at) >= 0 ? Number(item.at) : 0
          const duration = Number(item && item.duration) > 0 ? Number(item.duration) : null
          const delay = Number(item && item.delay) >= 0 ? Number(item.delay) : 0
          const action = (item && item.action) ? item.action : 'set'
          const namesArr = Array.isArray(item?.name) ? item.name : (item?.name ? [item.name] : [])
          for (let i = 0; i < namesArr.length; i++) {
            const n = namesArr[i]
            // 使用自动分配的轨道号
            const track = Number(baseTrack)
            sch.push({ track, name: n, action, start: at, loop, mix, delay })
            if (duration != null) {
              sch.push({ track, action: 'empty', start: at + duration, end: at + duration, mix })
            }
          }
        }
        // 确保所有事件都有明确的 track 字段，避免序列化时丢失
        const finalSchedule = sch.map(evt => ({
          track: evt.track != null ? evt.track : 0,
          name: evt.name,
          action: evt.action,
          start: evt.start,
          end: evt.end,
          loop: evt.loop,
          mix: evt.mix,
          delay: evt.delay
        }));
        
        this.config.animSchedule = finalSchedule
        schedule = finalSchedule
        
        // 调试日志：输出生成的动画日程和轨道分配
        if (process.env.FK_DEBUG_SPINE === '1') {
          console.log('[SpineElement] built animSchedule in render fallback, size=%d', schedule.length)
          console.log('[SpineElement] Final schedule tracks:', finalSchedule.map(evt => ({
            name: evt.name,
            track: evt.track,
            action: evt.action,
            start: evt.start
          })))
        }
      }
    }
    // 过滤不在骨骼中的动画名称，避免异常
    if (schedule && schedule.length > 0) {
      try {
        const available = new Set(
          (drawable?.skeleton?.data?.animations || []).map(a => a?.name || a?.id).filter(Boolean)
        )
        const filtered = []
        for (const evt of schedule) {
          const nm = evt?.name
          const act = evt?.action || 'set'
          if (act === 'set' && nm && !available.has(nm)) {
            continue
          }
          filtered.push(evt)
        }
        if (filtered.length !== schedule.length) {
          schedule = filtered
          this.config.animSchedule = filtered
          if (process.env.FK_DEBUG_SPINE === '1') {
            console.log('[SpineElement] filtered schedule by available animations, size=%d', filtered.length)
          }
        }
      } catch (_) {}
    }
    // 并行段的首帧：若存在基础循环动画，确保其被设置
    if (wasFirstFrame && schedule && schedule.length > 0) {
      try {
        const baseLoop = schedule.find(evt => (evt.action || 'set') === 'set' && evt.track === 0 && !!evt.loop && evt.name)
        if (baseLoop) {
          const as = drawable.animationState
          as.setAnimation(0, baseLoop.name, true)
        }
      } catch (_) {}
    }
    if (schedule && schedule.length > 0) {
      if (true || process.env.FK_DEBUG_SPINE === '1') {
        console.log('[SpineElement] schedule detected, size=%d, now=%s', schedule.length, (time - (this.startTime || 0)).toFixed ? (time - (this.startTime || 0)).toFixed(3) : (time - (this.startTime || 0)))
        console.log('[SpineElement] schedule content:', JSON.stringify(schedule, null, 2))
        console.log('[SpineElement] first event tracks:', schedule.map(e => e.track))
        console.log('[SpineElement] first event keys:', Object.keys(schedule[0] || {}))
      }
      const now = (time - (this.startTime || 0))
      for (let i = 0; i < schedule.length; i++) {
        const evt = schedule[i] || {}
        const track = (evt.track != null ? evt.track : (evt.action === 'empty' ? 0 : 0))
        const start = (evt.start != null ? evt.start : 0)
        const end = (evt.end != null ? evt.end : null)
        const action = (evt.action || 'set')
        const loop = !!evt.loop
        const name = evt.name || null
        const delay = evt.delay || 0
        const mix = evt.mix || evt.defaultMix || null
        const keyStart = `start:${i}`
        const keyEnd = `end:${i}`
        
        if (!this._appliedSchedule.has(keyStart) && now >= start && name) {
          const as = drawable.animationState
          let te = null
          if (action === 'add') {
            te = as.addAnimation(track, name, loop, delay)
          } else if (action === 'empty') {
            // 保护Track 0，避免基础循环被打断
            if (track !== 0) {
              as.setEmptyAnimation(track, mix || 0)
            }
          } else {
            te = as.setAnimation(track, name, loop)
          }
          
          if (true || process.env.FK_DEBUG_SPINE === '1') {
            console.log('[SpineElement] apply start evt: track=%d name=%s start=%s loop=%s', track, name, start, loop)
          }
          this._appliedSchedule.add(keyStart)
        }
        if (end != null && !this._appliedSchedule.has(keyEnd) && now >= end) {
          const as = drawable.animationState
          // 保护Track 0，避免基础循环被打断
          if (evt.track !== 0) {
            as.setEmptyAnimation(evt.track, mix || 0)
          }
          if (true || process.env.FK_DEBUG_SPINE === '1') {
            console.log('[SpineElement] apply end evt: track=%d end=%s mix=%s', evt.track, end, mix)
          }
          this._appliedSchedule.add(keyEnd)
        }
      }
    }

    // 首帧（并行段的第一帧）按绝对时间预滚到正确姿态
    if (wasFirstFrame) {
      const elapsed = Math.max(0, (time - (this.startTime || 0))) * timeScale
      if (elapsed > 0) {
        try { drawable.update(elapsed) } catch (_) {}
      }
    } else if (delta > 0) {
      drawable.update(delta * timeScale)
    } else if (delta < 0) {
      try {
        if (drawable.animationState?.clearTracks) drawable.animationState.clearTracks()
        this._appliedSchedule.clear()
      } catch (_) {}
    }

    this._lastTime = time

    const fitFrom = (state.fitFrom !== undefined ? state.fitFrom : this.config.fitFrom) || 'natural'
    let curW = null
    let curH = null
    let bw = (naturalW && naturalW > 2 ? naturalW : ((this._ck.setupW && this._ck.setupW > 2) ? this._ck.setupW : containerWidth))
    let bh = (naturalH && naturalH > 2 ? naturalH : ((this._ck.setupH && this._ck.setupH > 2) ? this._ck.setupH : containerHeight))
    let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY
    let hasBounds = false
    try {
      const drawOrder = drawable.skeleton.drawOrder
      let positions = Utils.newFloatArray(100)
      for (let i = 0, n = drawOrder.length; i < n; i++) {
        const slot = drawOrder[i]
        const attachment = slot.getAttachment()
        if (attachment instanceof RegionAttachment) {
          if (positions.length < 8) positions = Utils.newFloatArray(8)
          attachment.computeWorldVertices(slot, positions, 0, 2)
          for (let ii = 0; ii < 8; ii += 2) { const x = positions[ii]; const y = positions[ii+1]; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y) }
        } else if (attachment instanceof MeshAttachment) {
          const len = attachment.worldVerticesLength
          if (positions.length < len) positions = Utils.newFloatArray(len)
          attachment.computeWorldVertices(slot, 0, len, positions, 0, 2)
          for (let ii = 0; ii < len; ii += 2) { const x = positions[ii]; const y = positions[ii+1]; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y) }
        }
      }
      if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) { hasBounds = true; curW = Math.max(1, maxX - minX); curH = Math.max(1, maxY - minY) }
    } catch (_) {}
    if (fitFrom === 'dynamic' && hasBounds && curW && curH) {
      bw = curW
      bh = curH
    }
    let sX = 1
    let sY = 1
    let manualScale = (state.scale !== undefined ? state.scale : this.config.scale)
    if (typeof manualScale === 'number') {
      sX = manualScale
      sY = manualScale
    } else if (Array.isArray(manualScale)) {
      sX = Number(manualScale[0]) || 1
      sY = Number(manualScale[1]) || 1
    } else if (manualScale && typeof manualScale === 'object') {
      sX = Number(manualScale.x ?? manualScale.sx) || 1
      sY = Number(manualScale.y ?? manualScale.sy) || 1
    } else {
      sX = 1
      sY = 1
    }
    if (process.env.FK_DEBUG_SPINE === '1') {
      console.log('[SpineElement] scale=%sx%s container=%dx%d bounds=%dx%d', sX, sY, containerWidth, containerHeight, bw, bh)
    }
    const targetX = containerWidth / 2
    const valign = (state.valign !== undefined ? state.valign : this.config.valign) || 'bottom'
    let alignY
    const halfH = (naturalH || bh) / 2
    if (valign === 'bottom') {
      alignY = containerHeight - sY * halfH
    } else if (valign === 'top') {
      alignY = sY * halfH
    } else {
      alignY = containerHeight / 2
    }

    if (!this._ck.surface || containerWidth !== this._ck._w || containerHeight !== this._ck._h) {
      if (this._ck.surface && typeof this._ck.surface.delete === 'function') this._ck.surface.delete()
      this._ck.surface = CanvasKit.MakeSurface(containerWidth, containerHeight)
      this._ck.canvas = this._ck.surface.getCanvas()
      this._ck._w = containerWidth
      this._ck._h = containerHeight
    }
    const skCanvas = this._ck.canvas
    skCanvas.clear(CanvasKit.Color(0, 0, 0, 0))
    let tx = targetX - sX * (naturalCx || 0)
    let ty = alignY - sY * (naturalCy || 0)
    const left = sX * (isFinite(minX) ? minX : 0) + tx
    const right = sX * (isFinite(maxX) ? maxX : 0) + tx
    const top = sY * (isFinite(minY) ? minY : 0) + ty
    const bottom = sY * (isFinite(maxY) ? maxY : 0) + ty
    const clamp = ((state.clampToContainer !== undefined ? state.clampToContainer : this.config.clampToContainer) || false)
    if (clamp) {
      let dx = 0, dy = 0
      if (left < 0 && right <= containerWidth) dx = -left
      else if (right > containerWidth && left >= 0) dx = containerWidth - right
      if (top < 0 && bottom <= containerHeight) dy = -top
      else if (bottom > containerHeight && top >= 0) dy = containerHeight - bottom
      tx += dx
      ty += dy
    }
    skCanvas.save()
    skCanvas.translate(tx, ty)
    skCanvas.scale(sX, sY)
    renderer.render(skCanvas, drawable)
    skCanvas.restore()
    if (typeof this._ck.surface.flush === 'function') this._ck.surface.flush()
    const snapshot = this._ck.surface.makeImageSnapshot()
    const buf = snapshot.encodeToBytes()
    try { snapshot.delete && snapshot.delete() } catch (_) {}

    const img = Buffer.isBuffer(buf) ? await loadImage(buf) : await loadImage(Buffer.from(buf))
    const outCanvas = p.createCanvas(containerWidth, containerHeight)
    const ctx = outCanvas.getContext('2d')
    ctx.clearRect(0, 0, containerWidth, containerHeight)
    ctx.drawImage(img, 0, 0, containerWidth, containerHeight)
    const raster = new p.Raster(outCanvas)
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

    let finalItem = raster
    const bg = (state.bgcolor !== undefined ? state.bgcolor : this.config.bgcolor)
    if (bg) {
      const rect = new p.Path.Rectangle({
        rectangle: new p.Rectangle(
          new p.Point(pos.x - containerWidth / 2, pos.y - containerHeight / 2),
          new p.Size(containerWidth, containerHeight)
        )
      })
      rect.fillColor = bg
      rect.strokeWidth = 0
      const group = new p.Group([rect, raster])
      finalItem = group
    }

    this.applyTransform(finalItem, state, { applyPosition: false, paperInstance: p })
    if (layer) layer.addChild(finalItem)
    this._callOnRender(time, finalItem, { paper: p, project })
    return finalItem
  }
}

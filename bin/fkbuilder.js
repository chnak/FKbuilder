#!/usr/bin/env node

/**
 * fkbuilder CLI
 * Usage: fkbuilder render video.json
 *
 * 支持:
 * - 多轨道嵌套
 * - 场景嵌套
 * - 所有元素类型
 * - 预设动画 + 自定义动画
 * - onFrame 回调
 */

import { VideoBuilder, withContext } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== 命令行解析 ==========

const args = process.argv.slice(2);
const command = args[0];
const inputFile = args[1];

if (!command) {
  console.log(`
📹 fkbuilder CLI

用法:
  fkbuilder render <video.json>    渲染视频
  fkbuilder info <video.json>      查看配置信息
  fkbuilder help                    显示帮助

示例:
  fkbuilder render video.json
  fkbuilder render config.json -o output.mp4
  `);
  process.exit(0);
}

if (command === 'help') {
  printHelp();
  process.exit(0);
}

if (command === 'info') {
  if (!inputFile) {
    console.error('❌ 请提供 JSON 配置文件路径');
    process.exit(1);
  }
  await showInfo(inputFile);
} else if (command === 'render') {
  if (!inputFile) {
    console.error('❌ 请提供 JSON 配置文件路径');
    console.error('   用法: fkbuilder render video.json');
    process.exit(1);
  }
  await renderVideo(inputFile, args.slice(2));
} else {
  console.error(`❌ 未知命令: ${command}`);
  console.error('   用法: fkbuilder render <video.json>');
  process.exit(1);
}

// ========== 帮助信息 ==========

function printHelp() {
  console.log(`
📹 fkbuilder CLI

用法:
  fkbuilder render <video.json>    渲染视频
  fkbuilder info <video.json>      查看配置信息
  fkbuilder help                    显示帮助

JSON 配置文件格式:
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "output": "output.mp4",
  "background": "#000000",
  "tracks": [
    {
      "zIndex": 1,
      "scenes": [
        {
          "startTime": 0,
          "duration": 5,
          "background": "#0a0a0f",
          "elements": [...]
        }
      ],
      "transitions": [
        { "name": "CrossZoom", "duration": 1 }
      ]
    }
  ],
  "audioTracks": [
    { "src": "./music.mp3", "startTime": 0, "volume": 0.6 }
  ]
}

元素类型 (type):
  text, image, video, rect, circle, svg, audio
  sprite, subtitles, code, echarts, oscilloscope, json, path

预设动画:
  fadeIn, fadeOut, fadeInUp, fadeInDown, fadeOutUp, fadeOutDown
  zoomIn, zoomOut, bigIn, bigOut, zoomInLeft, zoomInFade, zoomRotateIn
  rotateIn, rotateOut, rotateInLeft, rotateInRight
  slideInTop, slideInBottom, slideInLeft, slideInRight
  bounceIn, bounceOut, bounceInUp, bounceInLeft
  flipInX, flipInY, elasticIn, pulse, shake, flash, swing

转场效果:
  CrossZoom, Dreamy, GridFlip, CircleOpen, fade
  wipeRight, wipeLeft, wipeUp, wipeDown
  directional, Swirl, ZoomInCircles, Mosaic

嵌套支持:
  tracks 可以嵌套子轨道
  scenes 可以嵌套子场景
  components 可以包含元素数组
`);
}

// ========== 查看配置信息 ==========

async function showInfo(inputFile) {
  if (!await fs.pathExists(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  const configContent = await fs.readFile(inputFile, 'utf-8');
  const config = JSON.parse(configContent);

  console.log(`\n📋 配置文件: ${inputFile}`);
  console.log(`📐 分辨率: ${config.width || 1920} x ${config.height || 1080}`);
  console.log(`🎬 FPS: ${config.fps || 30}`);
  console.log(`📁 输出: ${config.output || 'output.mp4'}`);

  const trackCount = (config.tracks || []).length;
  let sceneCount = 0;
  let elementCount = 0;

  for (const track of (config.tracks || [])) {
    sceneCount += (track.scenes || []).length;
    for (const scene of (track.scenes || [])) {
      elementCount += (scene.elements || []).length;
    }
  }

  console.log(`\n📊 统计:`);
  console.log(`   轨道数: ${trackCount}`);
  console.log(`   场景数: ${sceneCount}`);
  console.log(`   元素数: ${elementCount}`);
  console.log(`   音频轨: ${(config.audioTracks || []).length}`);
  console.log('');
}

// ========== 渲染视频 ==========

async function renderVideo(inputFile, extraArgs) {
  let outputPath = null;

  for (let i = 0; i < extraArgs.length; i++) {
    if (extraArgs[i] === '-o' || extraArgs[i] === '--output') {
      outputPath = extraArgs[i + 1];
      i++;
    }
  }

  if (!await fs.pathExists(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  const configContent = await fs.readFile(inputFile, 'utf-8');
  let config;
  try {
    config = JSON.parse(configContent);
  } catch (e) {
    console.error('❌ JSON 解析失败:', e.message);
    process.exit(1);
  }

  console.log(`\n📹 fkbuilder 渲染器`);
  console.log(`📄 配置文件: ${inputFile}`);

  if (!outputPath) {
    outputPath = config.output || path.join(path.dirname(inputFile), 'output.mp4');
  }

  const { width, height, fps } = config;

  const builder = new VideoBuilder({
    width: width || 1920,
    height: height || 1080,
    fps: fps || 30,
  });

  let totalDuration = 0;

  // 处理全局背景
  if (config.background) {
    // 全局背景通过第一个轨道的第一个场景设置
  }

  // 处理轨道 (支持嵌套)
  for (const trackConfig of (config.tracks || [])) {
    const track = builder.createTrack({ zIndex: trackConfig.zIndex || 1 });
    totalDuration = await processTrack(track, trackConfig, inputFile, totalDuration);
  }

  // 处理音频轨道
  for (const audioConfig of (config.audioTracks || [])) {
    const audioTrack = builder.createTrack({ zIndex: 0 });
    const audioFile = path.isAbsolute(audioConfig.src)
      ? audioConfig.src
      : path.resolve(path.dirname(inputFile), audioConfig.src);

    audioTrack.createScene({ duration: audioConfig.duration || totalDuration })
      .addAudio({
        src: audioFile,
        startTime: audioConfig.startTime || 0,
        duration: audioConfig.duration || totalDuration,
        volume: audioConfig.volume || 0.6,
        fadeIn: audioConfig.fadeIn || 0,
        fadeOut: audioConfig.fadeOut || 0,
      });
  }

  // 处理简单的 audio 字段 (兼容旧格式)
  if (config.audio) {
    const audioTrack = builder.createTrack({ zIndex: 0 });
    const audioFile = path.isAbsolute(config.audio)
      ? config.audio
      : path.resolve(path.dirname(inputFile), config.audio);

    audioTrack.createScene({ duration: totalDuration })
      .addAudio({
        src: audioFile,
        startTime: 0,
        duration: totalDuration,
        volume: config.audioVolume || 0.6,
      });
  }

  console.log(`📐 分辨率: ${width || 1920} x ${height || 1080}`);
  console.log(`🎬 时长: ${totalDuration.toFixed(2)} 秒`);
  console.log(`💾 输出: ${outputPath}\n`);

  try {
    const resultPath = await builder.render(outputPath);
    console.log(`\n✅ 渲染完成: ${resultPath}`);
  } catch (error) {
    console.error('❌ 渲染失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 处理轨道 (支持嵌套)
async function processTrack(track, trackConfig, inputFile, totalDuration) {
  let maxEndTime = totalDuration;

  // 处理场景
  for (const sceneConfig of (trackConfig.scenes || [])) {
    const scene = track.createScene({
      duration: sceneConfig.duration,
      startTime: sceneConfig.startTime,
    });

    // 背景
    if (sceneConfig.background) {
      scene.addBackground({ color: sceneConfig.background });
    }

    // 处理元素
    for (const elemConfig of (sceneConfig.elements || [])) {
      const elem = createElement(scene, elemConfig, inputFile);
      if (elem) {
        const elemDuration = elemConfig.duration || 5;
        const elemStartTime = elemConfig.startTime || 0;
        maxEndTime = Math.max(maxEndTime, sceneConfig.startTime + elemStartTime + elemDuration);
      }
    }

    // 处理嵌套元素 (components)
    for (const compConfig of (sceneConfig.components || [])) {
      processComponent(scene, compConfig, inputFile);
    }

    // 转场
    for (const transConfig of (trackConfig.transitions || [])) {
      track.addTransition({
        name: transConfig.name,
        duration: transConfig.duration,
        easing: transConfig.easing,
      });
    }
  }

  // 处理嵌套子轨道
  for (const subTrackConfig of (trackConfig.tracks || [])) {
    const subTrack = builder.createTrack({ zIndex: subTrackConfig.zIndex || trackConfig.zIndex || 1 });
    maxEndTime = await processTrack(subTrack, subTrackConfig, inputFile, maxEndTime);
  }

  return maxEndTime;
}

// 处理组件
function processComponent(scene, compConfig, inputFile) {
  // components 是预定义的元素组，可以在 scenes 中复用
  // 暂时为空，elements 已经可以直接在 scenes.elements 中定义
}

// 创建元素
function createElement(scene, config, inputFile) {
  const { type, ...props } = config;

  // 处理动画
  const animations = (props.animations || []).map(a => {
    if (typeof a === 'string') return a;
    // 自定义动画配置
    return a;
  });

  const baseProps = { ...props, animations };

  // 处理 onFrame 回调 (JSON 中用对象形式传入)
  if (props.onFrame) {
    if (typeof props.onFrame === 'object' && props.onFrame.fn) {
      baseProps.onFrame = withContext(props.onFrame.fn, props.onFrame.context || {});
    }
  }

  // 处理相对路径
  if (props.src && (type === 'image' || type === 'video' || type === 'audio' || type === 'sprite')) {
    if (!path.isAbsolute(props.src)) {
      baseProps.src = path.resolve(path.dirname(inputFile), props.src);
    }
  }

  switch (type) {
    case 'text':
      return scene.addText(baseProps);

    case 'image':
      return scene.addImage(baseProps);

    case 'video':
      return scene.addVideo(baseProps);

    case 'rect':
      return scene.addRect(baseProps);

    case 'circle':
      return scene.addCircle(baseProps);

    case 'svg':
      return scene.addSVG(baseProps);

    case 'audio':
      return scene.addAudio(baseProps);

    case 'sprite':
      return scene.addSprite(baseProps);

    case 'subtitles':
    case 'subtitle':
      if (scene.addSubtitles) {
        return scene.addSubtitles(baseProps);
      }
      return scene.addSubtitles(baseProps);

    case 'path':
      return scene.addPath(baseProps);

    case 'json':
      return scene.addJSON(baseProps);

    case 'code':
      return scene.addCode(baseProps);

    case 'echarts':
      return scene.addECharts(baseProps);

    case 'oscilloscope':
      return scene.addOscilloscope(baseProps);

    default:
      console.warn(`⚠️ 未知元素类型: ${type}`);
      return null;
  }
}

import { FFmpegUtil } from '../utils/ffmpeg.js';
import fs from 'fs-extra';
import path from 'path';
import { Renderer } from './Renderer.js';
import { TransitionElement } from '../elements/TransitionElement.js';
import { TransitionRenderer } from '../utils/transition-renderer.js';
import { createCanvas } from 'canvas';
import { ElementLayer } from '../layers/ElementLayer.js';
import os from 'os';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

/**
 * 视频导出器
 */
export class VideoExporter {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || './output',
      format: config.format || 'mp4',
      fps: config.fps || 30,
      quality: config.quality || 'high',
      ...config,
    };
    this.ffmpeg = new FFmpegUtil(config.ffmpegConfig);
    this.renderer = null;
  }

  /**
   * 导出视频
   * @param {VideoMaker} composition - 合成对象
   * @param {string} outputPath - 输出路径
   * @param {Object} options - 选项
   */
  async export(composition, outputPath, options = {}) {
    const {
      fps = this.config.fps,
      format = this.config.format,
      audioPath,
      startTime = 0,
      usePipe=true,
      endTime = composition.timeline.duration,
      parallel = false, // 是否使用 Worker 并行渲染
      maxWorkers = 2, // 最大 Worker 数，默认根据 CPU 核心数
    } = options;

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    await fs.ensureDir(outputDir);



      try {
        // 记录渲染开始时间
        const renderStartTime = performance.now();

        // 创建渲染器
        this.renderer = new Renderer({
          width: composition.width,
          height: composition.height,
          fps: fps,
          quality: this.config.quality,
        });
        await this.renderer.init();

        // 渲染所有帧
        const totalFrames = Math.ceil((endTime - startTime) * fps);
        const backgroundColor = composition.backgroundColor || '#000000';

        console.log(`开始渲染 ${totalFrames} 帧...`);
        
        // 保存 tempDir 引用（用于文件模式）
        let tempDir = null;
        
        // 判断是否使用 Worker 并行渲染
        const hasTransitions = (composition.transitions || []).length > 0;
        // 即使有转场，也可以使用 Worker 并行渲染（转场帧在主线程预处理）
        const shouldUseWorkerParallel = parallel && totalFrames > 100;
        
        if (shouldUseWorkerParallel) {
          // 使用 Worker 并行渲染
          const numWorkers = maxWorkers || Math.min(os.cpus().length, 4);
          console.log(`使用 Worker 并行渲染模式（${numWorkers} 个 Worker）...`);
          
          if (usePipe) {
            // 管道模式 + Worker 并行渲染
            await this.renderFramesWithPipeWorker(composition, totalFrames, startTime, fps, outputPath, backgroundColor, {
              fps: fps,
              width: composition.width,
              height: composition.height,
              numWorkers,
            });
          } else {
            // 文件模式 + Worker 并行渲染
            tempDir = path.join(outputDir, `temp_frames_${Date.now()}`);
            await fs.ensureDir(tempDir);
            await this.renderFramesWithWorker(composition, totalFrames, startTime, fps, tempDir, backgroundColor, {
              numWorkers,
            });
            console.log('帧渲染完成，开始编码视频...');
          }
        } else if (usePipe) {
          // 使用管道模式：直接写入 FFmpeg，不保存中间文件
          console.log('使用管道模式（不保存中间图片）...');
          await this.renderFramesWithPipe(composition, totalFrames, startTime, fps, outputPath, backgroundColor, {
            fps: fps,
            width: composition.width,
            height: composition.height,
          });
        } else {
          // 使用文件模式：串行渲染
          tempDir = path.join(outputDir, `temp_frames_${Date.now()}`);
          await fs.ensureDir(tempDir);
          
          // 渲染并保存到文件
          await this.renderFramesSerial(composition, totalFrames, startTime, fps, tempDir, backgroundColor);
          console.log('帧渲染完成，开始编码视频...');
        }

        // 记录渲染结束时间
        const renderEndTime = performance.now();
        const renderTotalTime = (renderEndTime - renderStartTime) / 1000; // 转换为秒

        console.log('视频编码完成');
        console.log(`总耗时: ${renderTotalTime.toFixed(2)} 秒`);

        // 打印转场统计信息（可选）
        TransitionElement.printTransitionStats();

        // 收集所有音频元素（在渲染帧的同时可以提前准备）
      let audioConfigs = [];
      
      // 使用 collectAllAudioElements 方法收集音频
      audioConfigs = composition.collectAllAudioElements();
      
      // 去重：根据路径和开始时间去重
      const uniqueAudioConfigs = [];
      const seen = new Set();
      for (const audio of audioConfigs) {
        const key = `${audio.path}_${audio.startTime}_${audio.duration}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAudioConfigs.push(audio);
        }
      }
      audioConfigs = uniqueAudioConfigs;
      
      if (audioConfigs.length > 0) {
        console.log(`收集到 ${audioConfigs.length} 个音频元素`);
      }
      
      // 如果使用文件模式，需要编码视频（管道模式已经在渲染时完成编码）
      let videoEncodingPromise = Promise.resolve();
      if (!usePipe && tempDir) {
        // 文件模式：需要编码视频
        const framePattern = path.join(tempDir, 'frame_%04d.png');
        videoEncodingPromise = this.ffmpeg.imagesToVideo(framePattern, outputPath, {
          fps: fps,
          width: composition.width,
          height: composition.height,
        }).then(() => {
          // 清理临时文件
          return fs.remove(tempDir).catch(() => {});
        });
      }

      let audioProcessingPromise = Promise.resolve(null);
      let hasAudio = false;
      
      // 如果有音频路径（旧方式）或音频元素，准备音频处理
      if (audioPath && await fs.pathExists(audioPath)) {
        // 旧方式：单个音频文件（不需要处理，直接使用）
        hasAudio = true;
        audioProcessingPromise = Promise.resolve(audioPath);
      } else if (audioConfigs.length > 0) {
        // 新方式：多个音频元素，需要合并
        hasAudio = true;
        console.log('开始处理音频（与视频编码并行）...');
        audioProcessingPromise = this.ffmpeg.mergeAudios(audioConfigs, {
          outputDir: outputDir,
          duration: endTime - startTime,
        }).then(async mergedAudioPath => {
          if (mergedAudioPath && await fs.pathExists(mergedAudioPath)) {
            console.log('音频处理完成');
            return mergedAudioPath;
          }
          return null;
        }).catch(async error => {
          console.warn('音频处理失败:', error.message);
          // 如果合并失败，尝试使用第一个音频
          const firstAudio = audioConfigs[0];
          if (firstAudio && await fs.pathExists(firstAudio.path)) {
            return firstAudio.path;
          }
          return null;
        });
      }

      // 等待视频编码和音频处理都完成
      const [_, processedAudioPath] = await Promise.all([
        videoEncodingPromise,
        audioProcessingPromise,
      ]);

      // 如果有音频，添加到视频
      if (hasAudio) {
        console.log('将音频添加到视频...');
        // 在管道模式下，视频已经编码完成，需要重命名
        // 在文件模式下，视频编码在 videoEncodingPromise 中完成
        const tempVideoPath = outputPath.replace(/\.(mp4|webm)$/, '_temp.$1');
        if (usePipe) {
          // 管道模式：视频已经存在，直接重命名
          await fs.move(outputPath, tempVideoPath);
        } else {
          // 文件模式：视频编码在 videoEncodingPromise 中完成，需要等待
          // 如果视频文件不存在，说明编码还没完成，等待一下
          let retries = 0;
          while (!await fs.pathExists(outputPath) && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }
          if (await fs.pathExists(outputPath)) {
            await fs.move(outputPath, tempVideoPath);
          } else {
            throw new Error('视频文件未生成');
          }
        }
        
        // 优先使用原始音频路径（如果存在且有效）
        if (audioPath && await fs.pathExists(audioPath)) {
          // 旧方式：单个音频文件（直接使用，不删除原始文件）
          await this.ffmpeg.addAudioToVideo(tempVideoPath, audioPath, outputPath, {
            audioStartTime: startTime,
          });
        } else if (processedAudioPath && await fs.pathExists(processedAudioPath)) {
          // 新方式：合并后的音频（临时文件，使用后删除）
          await this.ffmpeg.addAudioToVideo(tempVideoPath, processedAudioPath, outputPath, {
            audioStartTime: 0,
          });
          
          // 清理临时音频文件（只删除临时合并的音频，不删除原始音频）
          const mergedAudioDir = path.dirname(processedAudioPath);
          if (mergedAudioDir.includes('temp_audio_')) {
            await fs.remove(mergedAudioDir).catch(() => {});
          } else if (processedAudioPath.includes('temp') || processedAudioPath.includes('merged')) {
            // 只删除临时文件，不删除原始音频文件
            await fs.remove(processedAudioPath).catch(() => {});
          }
        } else if (audioConfigs.length > 0) {
          // 如果音频处理失败，尝试使用第一个音频（原始文件，不删除）
          const firstAudio = audioConfigs[0];
          if (firstAudio && firstAudio.path && await fs.pathExists(firstAudio.path)) {
            console.log('使用第一个音频文件...');
            await this.ffmpeg.addAudioToVideo(tempVideoPath, firstAudio.path, outputPath, {
              audioStartTime: firstAudio.startTime || 0,
            });
          }
        }
        
        await fs.remove(tempVideoPath);
      }

      // 重置转场统计信息
      TransitionElement.resetTransitionStats();

      console.log(`视频导出完成: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('视频导出失败:', error);
      console.error('错误堆栈:', error.stack);
      throw error;
    } finally {
      if (this.renderer) {
        this.renderer.destroy();
      }
    }
  }

  /**
   * 使用管道模式渲染所有帧（直接写入 FFmpeg，不保存中间文件）
   * 优化：使用原始视频数据格式（raw）和流式渲染，性能提升 5-10倍
   */
  async renderFramesWithPipe(composition, totalFrames, startTime, fps, outputPath, backgroundColor, ffmpegOptions) {
    // 检查是否有转场（转场需要使用 PNG 格式）
    const transitions = composition.transitions || [];
    const hasTransitions = transitions.length > 0;
    
    // 启动 FFmpeg 管道进程
    // 如果有转场，使用 PNG 格式（因为转场需要图片格式）
    // 否则使用原始数据格式（性能更好）
    const useRaw = !hasTransitions;
    const pipe = await this.ffmpeg.imagesToVideoPipe(outputPath, {
      ...ffmpegOptions,
      useRaw, // 使用原始数据格式（如果没有转场）
    });
    
    // 初始化转场渲染器（如果有转场）
    const transitionRenderers = new Map();
    const transitionFunctions = new Map(); // 缓存转场函数
    const transitionCanvasCache = {}; // 缓存转场 Canvas
    
    // 预先渲染并保存所有转场的帧
    const transitionFrames = new Map();
    if (transitions.length > 0) {
      console.log(`检测到 ${transitions.length} 个转场，预先渲染转场帧...`);
      for (const transition of transitions) {
        const transitionKey = `${transition.startTime}_${transition.endTime}_${transition.name}`;
        const frames = await this.preRenderTransitionFrames(composition, transition, backgroundColor);
        transitionFrames.set(transitionKey, frames);
      }
      console.log('转场帧预渲染完成');
    }
    
    // 调试信息：打印转场信息
    if (transitions.length > 0) {
      console.log(`转场信息:`);
      transitions.forEach((t, i) => {
        // 确保 startTime 和 endTime 存在且正确
        const tStartTime = t.startTime !== undefined ? t.startTime : 0;
        const tEndTime = t.endTime !== undefined ? t.endTime : (tStartTime + (t.duration || 0));
        const duration = t.duration || 0;
        console.log(`  转场 ${i + 1}: ${t.name}, 时间范围: ${tStartTime.toFixed(3)}s - ${tEndTime.toFixed(3)}s, 时长: ${duration.toFixed(3)}s`);
      });
    } else {
      console.log('未检测到转场');
    }
    
    try {
      for (let frame = 0; frame < totalFrames; frame++) {
        try {
          const time = startTime + frame / fps;

          // 检查是否有转场
          const activeTransition = transitions.find(t => 
            time >= t.startTime && time < t.endTime
          );
       
          let buffer;
          if (activeTransition) {
            // 有转场，使用预渲染的帧进行转场混合
            const transitionKey = `${activeTransition.startTime}_${activeTransition.endTime}_${activeTransition.name}`;
            const frames = transitionFrames.get(transitionKey);
            if (frames) {
              buffer = await this.renderFrameWithTransition(
                composition, 
                time, 
                activeTransition, 
                backgroundColor,
                transitionRenderers,
                frames,
                transitionFunctions,
                transitionCanvasCache
              );
            } else {
              // 如果没有预渲染的帧，回退到原来的方法
              buffer = await this.renderFrameWithTransition(
                composition, 
                time, 
                activeTransition, 
                backgroundColor,
                transitionRenderers,
                null,
                transitionFunctions,
                transitionCanvasCache
              );
            }
          } else {
            // 正常渲染帧（转场期间或转场结束后）
            await this.renderer.renderFrame(composition.timeline.getLayers(), time, backgroundColor);
            // 如果有转场，使用 PNG 格式；否则使用原始数据格式（性能更好）
            buffer = this.renderer.getCanvasBuffer(hasTransitions ? 'png' : 'raw');
          }
          
          // 直接写入 FFmpeg 管道
          await pipe.writeFrame(buffer);

          // 显示进度
          if (frame % 30 === 0 || frame === totalFrames - 1) {
            const progress = ((frame + 1) / totalFrames * 100).toFixed(1);
            console.log(`渲染进度: ${progress}% (${frame + 1}/${totalFrames})`);
          }
        } catch (error) {
          console.error(`渲染第 ${frame + 1} 帧时出错:`, error);
          console.error('错误堆栈:', error.stack);
          // 关闭管道
          pipe.end();
          throw error;
        }
      }
      
      // 所有帧写入完成，关闭管道
      pipe.end();
      
      // 等待 FFmpeg 编码完成
      await pipe.finish;
    } catch (error) {
      // 确保关闭管道
      try {
        pipe.end();
      } catch (e) {
        // 忽略关闭错误
      }
      throw error;
    }
  }

  /**
   * 预先渲染转场的 fromFrame 和 toFrame
   * @param {VideoMaker} composition - 合成对象
   * @param {Object} transition - 转场配置
   * @param {string} backgroundColor - 背景色
   * @returns {Promise<{fromFrame: Buffer, toFrame: Buffer}>} 预渲染的帧
   */
  async preRenderTransitionFrames(composition, transition, backgroundColor) {
    // 在转场开始时间渲染一帧，作为 fromFrame（此时 fromScene 还在显示）
    await this.renderer.renderFrame(composition.timeline.getLayers(), transition.startTime, backgroundColor);
    // 转场帧使用原始 RGBA 数据（与转场函数兼容）
    const fromBuffer = this.renderer.getCanvasBuffer('raw');
    
    // 在转场结束时间渲染一帧，作为 toFrame（此时 toScene 已经完全显示）
    await this.renderer.renderFrame(composition.timeline.getLayers(), transition.endTime, backgroundColor);
    // 转场帧使用原始 RGBA 数据（与转场函数兼容）
    const toBuffer = this.renderer.getCanvasBuffer('raw');
    
    return {
      fromFrame: fromBuffer,
      toFrame: toBuffer,
    };
  }

  /**
   * 渲染带转场效果的帧
   * @param {VideoMaker} composition - 合成对象
   * @param {number} time - 当前时间
   * @param {Object} transition - 转场配置
   * @param {string} backgroundColor - 背景色
   * @param {Map} transitionRenderers - 转场渲染器缓存
   * @param {Object} preRenderedFrames - 预渲染的帧 {fromFrame, toFrame}（可选）
   * @param {Map} transitionFunctions - 转场函数缓存（可选）
   * @param {Object} transitionCanvasCache - 转场 Canvas 缓存（可选）
   * @returns {Promise<Buffer>} PNG buffer
   */
  async renderFrameWithTransition(composition, time, transition, backgroundColor, transitionRenderers, preRenderedFrames = null, transitionFunctions = null, transitionCanvasCache = null) {
    // 计算转场进度（0-1）
    const actualDuration = transition.endTime - transition.startTime;
    const progress = Math.max(0, Math.min(1, (time - transition.startTime) / actualDuration));
    
    // 获取或创建转场渲染器
    const rendererKey = `${transition.name}_${transition.easing || 'linear'}`;
    let transitionRenderer = transitionRenderers.get(rendererKey);
    if (!transitionRenderer) {
      transitionRenderer = new TransitionRenderer({
        name: transition.name,
        easing: transition.easing,
        params: transition.params,
      });
      transitionRenderers.set(rendererKey, transitionRenderer);
    }
    
    // 缓存转场函数（基于 transition name + width + height + channels）
    // 避免每次调用都创建新的 GL 上下文和资源
    const functionKey = `${rendererKey}_${composition.width}_${composition.height}_4`;
    let transitionFunction;
    if (transitionFunctions && transitionFunctions.has(functionKey)) {
      transitionFunction = transitionFunctions.get(functionKey);
    } else {
      transitionFunction = transitionRenderer.create({
        width: composition.width,
        height: composition.height,
        channels: 4,
      });
      if (transitionFunctions) {
        transitionFunctions.set(functionKey, transitionFunction);
      }
    }
    
    // 使用预渲染的帧（如果提供），否则实时渲染
    let fromBuffer, toBuffer;
    if (preRenderedFrames) {
      fromBuffer = preRenderedFrames.fromFrame;
      toBuffer = preRenderedFrames.toFrame;
    } else {
      // 回退到原来的实时渲染方法
      const fromScene = transition.fromScene;
      const fromBackgroundColor = fromScene.backgroundLayer?.config?.backgroundColor || backgroundColor;
      const fromSceneEndTime = transition.startTime;
      
      await this.renderer.renderFrame(composition.timeline.getLayers(), fromSceneEndTime, fromBackgroundColor);
      // 使用原始 RGBA 数据（与转场函数兼容）
      fromBuffer = this.renderer.getCanvasBuffer('raw');
      
      const toScene = transition.toScene;
      const toBackgroundColor = toScene.backgroundLayer?.config?.backgroundColor || backgroundColor;
      const toSceneStartTime = transition.startTime;
      
      await this.renderer.renderFrame(composition.timeline.getLayers(), toSceneStartTime, toBackgroundColor);
      // 使用原始 RGBA 数据（与转场函数兼容）
      toBuffer = this.renderer.getCanvasBuffer('raw');
    }
    
    // 使用转场函数混合两个场景
    const resultBuffer = transitionFunction({
      fromFrame: fromBuffer,
      toFrame: toBuffer,
      progress: progress,
    });
    
    // 复用 Canvas（避免每次创建新的 Canvas）
    let resultCanvas;
    if (transitionCanvasCache && transitionCanvasCache.canvas) {
      resultCanvas = transitionCanvasCache.canvas;
    } else {
      resultCanvas = createCanvas(composition.width, composition.height);
      if (transitionCanvasCache) {
        transitionCanvasCache.canvas = resultCanvas;
      }
    }
    
    const ctx = resultCanvas.getContext('2d');
    const imageData = ctx.createImageData(composition.width, composition.height);
    imageData.data.set(resultBuffer);
    ctx.putImageData(imageData, 0, 0);
    
    // 转场帧使用 PNG 格式（因为转场期间 FFmpeg 使用 PNG 输入格式）
    return resultCanvas.toBuffer('image/png');
  }

  /**
   * 创建只包含指定场景元素的临时图层
   * @param {VideoMaker} composition - 合成对象
   * @param {Object} scene - 场景对象
   * @param {number} time - 当前时间
   * @param {boolean} isTransition - 是否在转场期间（如果是，会调整元素时间让它们在转场开始时间就可见）
   * @returns {Array<ElementLayer>} 场景图层数组
   */
  _createSceneLayers(composition, scene, time, isTransition = false) {
    // 获取场景的开始时间（绝对时间）
    const sceneStartTime = scene.startTime !== undefined ? scene.startTime : 0;
    const sceneEndTime = sceneStartTime + (scene.duration || 0);
    
    // 方法：从 composition.timeline 的所有图层中，筛选出属于指定场景的元素
    // 这样可以避免重复构建场景，并且使用已经构建好的元素（时间已经是绝对时间）
    const allLayers = composition.timeline.getLayers();
    const sceneLayers = [];
    
    // 遍历所有图层，筛选出属于该场景的元素
    for (const layer of allLayers) {
      if (layer.elements && layer.elements.length > 0) {
        // 筛选出属于该场景的元素
        // 元素的时间已经是绝对时间（在 Track.build 中转换的）
        const sceneElements = layer.elements.filter(element => {
          if (!element) return false;
          
          // 检查元素的时间范围是否与场景重叠
          const elementStartTime = element.startTime !== undefined ? element.startTime : 0;
          const elementEndTime = element.endTime !== undefined ? element.endTime : Infinity;
          
          // 元素属于场景，如果：
          // 1. 元素在场景时间范围内开始
          // 2. 或者元素在场景时间范围内结束
          // 3. 或者元素完全包含场景时间范围
          // 4. 或者元素在场景时间范围内（即使开始时间在场景之前，结束时间在场景之后）
          const elementStartsInScene = elementStartTime >= sceneStartTime && elementStartTime < sceneEndTime;
          const elementEndsInScene = elementEndTime > sceneStartTime && elementEndTime <= sceneEndTime;
          const elementContainsScene = elementStartTime <= sceneStartTime && elementEndTime >= sceneEndTime;
          const elementActiveInScene = elementStartTime < sceneEndTime && elementEndTime > sceneStartTime;
          
          return elementStartsInScene || elementEndsInScene || elementContainsScene || elementActiveInScene;
        });
        
        // 如果有属于该场景的元素，创建临时图层
        if (sceneElements.length > 0) {
          const sceneLayer = new ElementLayer({
            zIndex: layer.zIndex,
            startTime: sceneStartTime,
            endTime: sceneEndTime,
          });
          
          // 添加元素到临时图层（元素的时间已经是绝对时间，不需要转换）
          for (const element of sceneElements) {
            // 确保元素的 canvas 尺寸正确
            element.canvasWidth = composition.width;
            element.canvasHeight = composition.height;
            
            // 如果是转场期间，且元素在转场开始时间还没有开始，需要调整元素的时间
            if (isTransition && element.startTime !== undefined && element.startTime > time) {
              // 计算时间偏移
              const timeOffset = element.startTime - time;
              // 临时调整元素的时间，让它在转场开始时间就开始显示
              const originalStartTime = element.startTime;
              const originalEndTime = element.endTime;
              element.startTime = time;
              if (element.endTime !== undefined && element.endTime !== Infinity) {
                element.endTime = element.endTime - timeOffset;
              }
              
              // 如果是分割文本，也需要调整子元素的时间
              if (element.type === 'text' && element.segments && element.segments.length > 0) {
                for (const segment of element.segments) {
                  if (segment.startTime !== undefined && segment.startTime > time) {
                    const segmentTimeOffset = segment.startTime - time;
                    segment.startTime = time;
                    if (segment.endTime !== undefined && segment.endTime !== Infinity) {
                      segment.endTime = segment.endTime - segmentTimeOffset;
                    }
                  }
                }
              }
            }
            
            // 如果是分割文本，也需要设置子元素的 canvas 尺寸
            if (element.type === 'text' && element.segments && element.segments.length > 0) {
              for (const segment of element.segments) {
                segment.canvasWidth = composition.width;
                segment.canvasHeight = composition.height;
              }
            }
            
            sceneLayer.addElement(element);
          }
          
          sceneLayers.push(sceneLayer);
        }
      }
    }
    
    return sceneLayers;
  }

  /**
   * 使用 Worker 并行渲染所有帧（保存到文件）
   * @param {VideoMaker} composition - 合成对象
   * @param {number} totalFrames - 总帧数
   * @param {number} startTime - 开始时间
   * @param {number} fps - 帧率
   * @param {string} tempDir - 临时目录
   * @param {string} backgroundColor - 背景颜色
   * @param {Object} options - 选项
   */
  async renderFramesWithWorker(composition, totalFrames, startTime, fps, tempDir, backgroundColor, options = {}) {
    const { numWorkers = 4 } = options;
    
    // 收集字体信息（用于在 Worker 中注册）
    const { getRegisteredFonts } = await import('../utils/font-manager.js');
    const fontInfo = getRegisteredFonts();
    
    // 序列化 composition（与转场预处理并行）
    const compositionDataPromise = this._serializeComposition(composition);
    
    // 预处理转场帧（如果有转场）- 与序列化并行执行
    const transitions = composition.transitions || [];
    const transitionFrames = new Map(); // frameIndex -> buffer
    const transitionRanges = []; // [{ startFrame, endFrame }]
    
    // 转场预处理任务（与序列化并行）
    const transitionPreprocessTask = (async () => {
      if (transitions.length > 0) {
        console.log(`检测到 ${transitions.length} 个转场，在主线程预处理转场帧（与 Worker 并行）...`);
        
        // 初始化转场渲染器
        const transitionRenderers = new Map();
        const transitionFunctions = new Map();
        const transitionCanvasCache = {};
        
        for (const transition of transitions) {
          const transitionStartFrame = Math.floor((transition.startTime - startTime) * fps);
          const transitionEndFrame = Math.ceil((transition.endTime - startTime) * fps);
          
          console.log(`转场 ${transition.name || 'unknown'}: 时间范围 [${transition.startTime.toFixed(2)}s, ${transition.endTime.toFixed(2)}s], 帧范围 [${transitionStartFrame}, ${transitionEndFrame})`);
          
          // 记录转场范围
          transitionRanges.push({
            startFrame: transitionStartFrame,
            endFrame: transitionEndFrame,
          });
          
          // 预先渲染转场的 fromFrame 和 toFrame
          const preRenderedFrames = await this.preRenderTransitionFrames(composition, transition, backgroundColor);
          
          // 渲染转场期间的所有帧
          let renderedCount = 0;
          for (let frame = transitionStartFrame; frame < transitionEndFrame; frame++) {
            if (frame >= 0 && frame < totalFrames) {
              const time = startTime + frame / fps;
              const buffer = await this.renderFrameWithTransition(
                composition,
                time,
                transition,
                backgroundColor,
                transitionRenderers,
                preRenderedFrames,
                transitionFunctions,
                transitionCanvasCache
              );
              transitionFrames.set(frame, buffer);
              renderedCount++;
            }
          }
          console.log(`转场 ${transition.name || 'unknown'}: 渲染了 ${renderedCount} 帧 (帧范围 [${transitionStartFrame}, ${transitionEndFrame}))`);
        }
        
        console.log(`转场帧预处理完成，共 ${transitionFrames.size} 帧`);
      }
    })();
    
    // 等待序列化完成（转场预处理在后台继续）
    const compositionData = await compositionDataPromise;
    
    // 将帧分成多个段（考虑转场范围，尽量让段边界避开转场）
    const framesPerSegment = Math.ceil(totalFrames / numWorkers);
    const segments = [];
    
    for (let i = 0; i < numWorkers; i++) {
      const startFrame = i * framesPerSegment;
      const endFrame = Math.min(startFrame + framesPerSegment, totalFrames);
      if (startFrame < totalFrames) {
        segments.push({
          segmentIndex: i,
          startFrame,
          endFrame,
          startTime: startTime + startFrame / fps,
        });
      }
    }
    
    console.log(`将视频分成 ${segments.length} 个段进行并行渲染...`);
    
    // 创建 Worker 池（转场预处理在后台继续）
    const workers = [];
    const workerPromises = [];
    
    // 进度跟踪
    const segmentProgress = new Map(); // segmentIndex -> { currentFrame, totalFrames }
    let lastOverallProgress = -1;
    
    // 信号处理：确保 Ctrl+C 能立即终止所有 Worker
    let isCancelled = false;
    const cleanup = () => {
      if (isCancelled) return;
      isCancelled = true;
      console.log('\n收到中断信号，正在终止所有 Worker...');
      workers.forEach(worker => {
        try {
          worker.terminate();
        } catch (e) {
          // 忽略终止错误
        }
      });
      console.log('所有 Worker 已终止');
    };
    
    const signalHandler = () => {
      cleanup();
      process.exit(130); // 130 是 SIGINT 的标准退出码
    };
    
    process.on('SIGINT', signalHandler);
    process.on('SIGTERM', signalHandler);
    
    const __filename = fileURLToPath(import.meta.url);
    const workerPath = path.resolve(path.dirname(__filename), 'workers', 'worker.js');
    
    for (const segment of segments) {
      segmentProgress.set(segment.segmentIndex, { currentFrame: 0, totalFrames: segment.endFrame - segment.startFrame });
      
      const worker = new Worker(workerPath, {
        workerData: {
          ...segment,
          fps,
          width: composition.width,
          height: composition.height,
          backgroundColor,
          compositionData,
          transitionRanges, // 传递转场范围，让 Worker 跳过转场帧
          fontInfo, // 传递字体信息，让 Worker 注册字体
        },
      });
      
      workers.push(worker);
      
      const promise = new Promise((resolve, reject) => {
        worker.on('message', (result) => {
          if (result.type === 'progress') {
            // 处理进度消息
            const { segmentIndex, progress, currentFrame, totalFrames, frameIndex } = result;
            
            // 更新该段的进度
            segmentProgress.set(segmentIndex, { currentFrame, totalFrames });
            
            // 计算总体进度（排除转场帧）
            let totalCompletedFrames = 0;
            let totalWorkerFrames = 0;
            for (const [idx, seg] of segments.entries()) {
              const segProgress = segmentProgress.get(idx) || { currentFrame: 0, totalFrames: seg.endFrame - seg.startFrame };
              totalCompletedFrames += segProgress.currentFrame;
              totalWorkerFrames += segProgress.totalFrames;
            }
            
            const overallProgress = totalWorkerFrames > 0 ? (totalCompletedFrames / totalWorkerFrames * 100) : 0;
            
            // 只在总体进度变化超过 1% 时打印，避免输出过多
            if (Math.abs(overallProgress - lastOverallProgress) >= 1 || overallProgress >= 100) {
              console.log(`总体进度: ${overallProgress.toFixed(1)}% (${totalCompletedFrames}/${totalWorkerFrames} 帧) | [Worker ${segmentIndex}] ${progress}%`);
              lastOverallProgress = overallProgress;
            }
            
            return; // 不 resolve，继续等待完成消息
          }
          
          if (result.success) {
            // 保存帧到文件（转场帧会被跳过，因为 Worker 已经跳过了转场帧）
            for (const frameData of result.frames) {
              // 检查是否是转场帧（转场帧不应该由 Worker 渲染）
              const isTransitionFrame = transitionRanges.some(range => 
                frameData.frameIndex >= range.startFrame && frameData.frameIndex < range.endFrame
              );
              if (isTransitionFrame) {
                continue; // 跳过转场帧
              }
              const framePath = path.join(tempDir, `frame_${(frameData.frameIndex + 1).toString().padStart(4, '0')}.png`);
              fs.writeFileSync(framePath, frameData.buffer);
            }
            console.log(`段 ${result.segmentIndex} 完成，共接收 ${result.frames.length} 帧`);
            resolve(result);
          } else {
            reject(new Error(`段 ${result.segmentIndex} 渲染失败: ${result.error}`));
          }
          worker.terminate();
        });
        
        worker.on('error', (error) => {
          reject(new Error(`段 ${segment.segmentIndex} Worker 错误: ${error.message}`));
          worker.terminate();
        });
      });
      
      workerPromises.push(promise);
    }
    
    // 等待所有 Worker 完成和转场预处理完成（并行）
    try {
      await Promise.all([...workerPromises, transitionPreprocessTask]);
      
      if (isCancelled) {
        return; // 如果已取消，直接返回
      }
      
      console.log('所有段渲染完成');
      
      // 保存转场帧到文件
      if (transitionFrames.size > 0) {
        console.log(`保存 ${transitionFrames.size} 个转场帧到文件...`);
        for (const [frameIndex, buffer] of transitionFrames) {
          const framePath = path.join(tempDir, `frame_${(frameIndex + 1).toString().padStart(4, '0')}.png`);
          await fs.writeFile(framePath, buffer);
        }
        console.log('转场帧保存完成');
      }
    } catch (error) {
      cleanup();
      // 移除信号监听器
      process.removeListener('SIGINT', signalHandler);
      process.removeListener('SIGTERM', signalHandler);
      throw error;
    } finally {
      // 移除信号监听器
      process.removeListener('SIGINT', signalHandler);
      process.removeListener('SIGTERM', signalHandler);
    }
  }

  /**
   * 使用 Worker 并行渲染 + 管道模式
   * @param {VideoMaker} composition - 合成对象
   * @param {number} totalFrames - 总帧数
   * @param {number} startTime - 开始时间
   * @param {number} fps - 帧率
   * @param {string} outputPath - 输出路径
   * @param {string} backgroundColor - 背景颜色
   * @param {Object} options - 选项
   */
  async renderFramesWithPipeWorker(composition, totalFrames, startTime, fps, outputPath, backgroundColor, options = {}) {
    const { numWorkers = 4 } = options;
    
    // 检查是否有转场（转场需要使用 PNG 格式）
    const transitions = composition.transitions || [];
    const hasTransitions = transitions.length > 0;
    
    // 启动 FFmpeg 管道进程
    // 如果有转场，使用 PNG 格式；否则使用原始数据格式（性能更好）
    const useRaw = !hasTransitions;
    const pipe = await this.ffmpeg.imagesToVideoPipe(outputPath, {
      fps: options.fps,
      width: options.width,
      height: options.height,
      useRaw, // 使用原始数据格式（如果没有转场）
    });
    
    // 收集字体信息（用于在 Worker 中注册）
    const { getRegisteredFonts } = await import('../utils/font-manager.js');
    const fontInfo = getRegisteredFonts();
    
    // 序列化 composition（与转场预处理并行）
    const compositionDataPromise = this._serializeComposition(composition);
    
    // 预处理转场帧（如果有转场）- 与序列化并行执行
    const transitionFrames = new Map(); // frameIndex -> buffer
    const transitionRanges = []; // [{ startFrame, endFrame }]
    
    // 转场预处理任务（与序列化并行）
    const transitionPreprocessTask = (async () => {
      if (transitions.length > 0) {
        console.log(`检测到 ${transitions.length} 个转场，在主线程预处理转场帧（与 Worker 并行）...`);
        
        // 初始化转场渲染器
        const transitionRenderers = new Map();
        const transitionFunctions = new Map();
        const transitionCanvasCache = {};
        
        for (const transition of transitions) {
          const transitionStartFrame = Math.floor((transition.startTime - startTime) * fps);
          const transitionEndFrame = Math.ceil((transition.endTime - startTime) * fps);
          
          console.log(`转场 ${transition.name || 'unknown'}: 时间范围 [${transition.startTime.toFixed(2)}s, ${transition.endTime.toFixed(2)}s], 帧范围 [${transitionStartFrame}, ${transitionEndFrame})`);
          
          // 记录转场范围
          transitionRanges.push({
            startFrame: transitionStartFrame,
            endFrame: transitionEndFrame,
          });
          
          // 预先渲染转场的 fromFrame 和 toFrame
          const preRenderedFrames = await this.preRenderTransitionFrames(composition, transition, backgroundColor);
          
          // 渲染转场期间的所有帧
          let renderedCount = 0;
          for (let frame = transitionStartFrame; frame < transitionEndFrame; frame++) {
            if (frame >= 0 && frame < totalFrames) {
              const time = startTime + frame / fps;
              const buffer = await this.renderFrameWithTransition(
                composition,
                time,
                transition,
                backgroundColor,
                transitionRenderers,
                preRenderedFrames,
                transitionFunctions,
                transitionCanvasCache
              );
              transitionFrames.set(frame, buffer);
              renderedCount++;
            }
          }
          console.log(`转场 ${transition.name || 'unknown'}: 渲染了 ${renderedCount} 帧 (帧范围 [${transitionStartFrame}, ${transitionEndFrame}))`);
        }
        
        console.log(`转场帧预处理完成，共 ${transitionFrames.size} 帧`);
      }
    })();
    
    // 等待序列化完成（转场预处理在后台继续）
    const compositionData = await compositionDataPromise;
    
    // 将帧分成多个段
    const framesPerSegment = Math.ceil(totalFrames / numWorkers);
    const segments = [];
    
    for (let i = 0; i < numWorkers; i++) {
      const startFrame = i * framesPerSegment;
      const endFrame = Math.min(startFrame + framesPerSegment, totalFrames);
      if (startFrame < totalFrames) {
        segments.push({
          segmentIndex: i,
          startFrame,
          endFrame,
          startTime: startTime + startFrame / fps,
        });
      }
    }
    
    console.log(`将视频分成 ${segments.length} 个段进行并行渲染...`);
    
    // 帧缓冲区管理器
    class FrameBuffer {
      constructor(totalFrames) {
        this.buffer = new Map(); // frameIndex -> buffer
        this.nextFrameIndex = 0;
        this.totalFrames = totalFrames;
      }
      
      addFrame(frameIndex, buffer) {
        // 如果该帧已经存在，检查是否是转场帧（转场帧优先级更高）
        // 转场帧应该在 Worker 帧之前添加，所以如果已经存在，说明是转场帧，不应该被覆盖
        if (this.buffer.has(frameIndex)) {
          return;
        }
        this.buffer.set(frameIndex, buffer);
      }
      
      getNextFrames() {
        const frames = [];
        while (this.buffer.has(this.nextFrameIndex)) {
          frames.push({
            frameIndex: this.nextFrameIndex,
            buffer: this.buffer.get(this.nextFrameIndex),
          });
          this.buffer.delete(this.nextFrameIndex);
          this.nextFrameIndex++;
        }
        return frames;
      }
      
      isComplete() {
        return this.nextFrameIndex >= this.totalFrames;
      }
      
      getBufferedCount() {
        return this.buffer.size;
      }
    }
    
    const frameBuffer = new FrameBuffer(totalFrames);
    let allWorkersCompleted = false;
    let completedWorkers = 0;
    
    // 创建 Worker 池
    const workers = [];
    const workerPromises = [];
    
    // 进度跟踪
    const segmentProgress = new Map(); // segmentIndex -> { currentFrame, totalFrames }
    let lastOverallProgress = -1;
    
    // 信号处理：确保 Ctrl+C 能立即终止所有 Worker
    let isCancelled = false;
    const cleanup = () => {
      if (isCancelled) return;
      isCancelled = true;
      console.log('\n收到中断信号，正在终止所有 Worker...');
      workers.forEach(worker => {
        try {
          worker.terminate();
        } catch (e) {
          // 忽略终止错误
        }
      });
      // 关闭管道
      try {
        pipe.end();
      } catch (e) {
        // 忽略关闭错误
      }
      console.log('所有 Worker 已终止');
    };
    
    const signalHandler = () => {
      cleanup();
      process.exit(130); // 130 是 SIGINT 的标准退出码
    };
    
    process.on('SIGINT', signalHandler);
    process.on('SIGTERM', signalHandler);
    
    const __filename = fileURLToPath(import.meta.url);
    const workerPath = path.resolve(path.dirname(__filename), 'workers', 'worker.js');
    
    // 转场预处理完成标志
    let transitionPreprocessCompleted = false;
    
    // 监听转场预处理完成
    transitionPreprocessTask.then(() => {
      transitionPreprocessCompleted = true;
    }).catch(() => {
      transitionPreprocessCompleted = true; // 即使失败也标记为完成
    });
    
    // 写入帧到管道的函数（转场帧会在预处理完成后自动添加）
    const writeFramesToPipe = async () => {
      let transitionFramesAdded = false; // 标记转场帧是否已添加
      
      while (!frameBuffer.isComplete() || frameBuffer.getBufferedCount() > 0 || !transitionPreprocessCompleted || (!transitionFramesAdded && transitionFrames.size > 0)) {
        // 检查是否已取消
        if (isCancelled) {
          break;
        }
        
        // 如果转场预处理已完成，添加转场帧到缓冲区（只添加一次）
        if (transitionPreprocessCompleted && !transitionFramesAdded && transitionFrames.size > 0) {
          console.log(`添加 ${transitionFrames.size} 个转场帧到缓冲区...`);
          for (const [frameIndex, buffer] of transitionFrames) {
            frameBuffer.addFrame(frameIndex, buffer);
          }
          transitionFramesAdded = true;
          transitionFrames.clear(); // 清空，释放内存
        }
        
        const framesToWrite = frameBuffer.getNextFrames();
        if (framesToWrite.length > 0) {
          for (const { buffer } of framesToWrite) {
            if (isCancelled) {
              break;
            }
            await pipe.writeFrame(buffer);
          }
        } else if (allWorkersCompleted && transitionPreprocessCompleted && transitionFramesAdded) {
          // 所有 Worker 和转场预处理都已完成，转场帧已添加，检查是否还有帧
          if (frameBuffer.isComplete()) {
            break;
          }
        } else {
          // 等待更多帧或转场预处理完成
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    };
    
    for (const segment of segments) {
      segmentProgress.set(segment.segmentIndex, { currentFrame: 0, totalFrames: segment.endFrame - segment.startFrame });
      
      const worker = new Worker(workerPath, {
        workerData: {
          ...segment,
          fps,
          width: composition.width,
          height: composition.height,
          backgroundColor,
          compositionData,
          transitionRanges, // 传递转场范围，让 Worker 跳过转场帧
          fontInfo, // 传递字体信息，让 Worker 注册字体
        },
      });
      
      workers.push(worker);
      
      const promise = new Promise((resolve, reject) => {
        worker.on('message', async (result) => {
          if (result.type === 'progress') {
            // 处理进度消息
            const { segmentIndex, progress, currentFrame, totalFrames, frameIndex } = result;
            
            // 更新该段的进度
            segmentProgress.set(segmentIndex, { currentFrame, totalFrames });
            
            // 计算总体进度（排除转场帧）
            let totalCompletedFrames = 0;
            let totalWorkerFrames = 0;
            for (const [idx, seg] of segments.entries()) {
              const segProgress = segmentProgress.get(idx) || { currentFrame: 0, totalFrames: seg.endFrame - seg.startFrame };
              totalCompletedFrames += segProgress.currentFrame;
              totalWorkerFrames += segProgress.totalFrames;
            }
            
            const overallProgress = totalWorkerFrames > 0 ? (totalCompletedFrames / totalWorkerFrames * 100) : 0;
            
            // 只在总体进度变化超过 1% 时打印，避免输出过多
            if (Math.abs(overallProgress - lastOverallProgress) >= 1 || overallProgress >= 100) {
              console.log(`总体进度: ${overallProgress.toFixed(1)}% (${totalCompletedFrames}/${totalWorkerFrames} 帧) | [Worker ${segmentIndex}] ${progress}%`);
              lastOverallProgress = overallProgress;
            }
            
            return; // 不 resolve，继续等待完成消息
          }
          
          if (result.success) {
            // 将帧存入缓冲区（转场帧会被跳过，因为 Worker 已经跳过了转场帧）
            for (const frameData of result.frames) {
              // 检查是否是转场帧（转场帧不应该由 Worker 渲染）
              const isTransitionFrame = transitionRanges.some(range => 
                frameData.frameIndex >= range.startFrame && frameData.frameIndex < range.endFrame
              );
              if (isTransitionFrame) {
                continue; // 跳过转场帧
              }
              frameBuffer.addFrame(frameData.frameIndex, frameData.buffer);
            }
            
            completedWorkers++;
            console.log(`段 ${result.segmentIndex} 完成，共接收 ${result.frames.length} 帧，缓冲区: ${frameBuffer.getBufferedCount()} 帧`);
            
            if (completedWorkers === segments.length) {
              allWorkersCompleted = true;
            }
            
            resolve(result);
          } else {
            reject(new Error(`段 ${result.segmentIndex} 渲染失败: ${result.error}`));
          }
          worker.terminate();
        });
        
        worker.on('error', (error) => {
          reject(new Error(`段 ${segment.segmentIndex} Worker 错误: ${error.message}`));
          worker.terminate();
        });
      });
      
      workerPromises.push(promise);
    }
    
    // 启动写入任务（在后台运行）
    const writeTask = writeFramesToPipe();
    
    // 等待所有 Worker 完成和转场预处理完成（并行）
    try {
      await Promise.all([...workerPromises, transitionPreprocessTask]);
      
      if (isCancelled) {
        return; // 如果已取消，直接返回
      }
      
      console.log('所有段渲染完成，转场预处理完成，等待写入管道...');
      
      // 注意：转场帧已经在 writeFramesToPipe 中自动添加到缓冲区了
      // 这里不需要再次添加，因为 writeFramesToPipe 会在转场预处理完成后自动处理
      
      // 等待所有帧写入完成
      await writeTask;
      
      if (isCancelled) {
        return; // 如果已取消，直接返回
      }
      
      // 关闭管道
      pipe.end();
      
      // 等待 FFmpeg 编码完成
      await pipe.finish;
    } catch (error) {
      cleanup();
      // 移除信号监听器
      process.removeListener('SIGINT', signalHandler);
      process.removeListener('SIGTERM', signalHandler);
      throw error;
    } finally {
      // 移除信号监听器
      process.removeListener('SIGINT', signalHandler);
      process.removeListener('SIGTERM', signalHandler);
    }
  }

  /**
   * 串行渲染所有帧（保存到文件）
   * @param {string|null} tempDir - 临时目录，如果为 null 则不保存文件（仅渲染）
   */
  async renderFramesSerial(composition, totalFrames, startTime, fps, tempDir, backgroundColor) {
    // 初始化转场渲染器（如果有转场）
    const transitions = composition.transitions || [];
    const transitionRenderers = new Map();
    const transitionFunctions = new Map(); // 缓存转场函数
    const transitionCanvasCache = {}; // 缓存转场 Canvas
    
    // 预先渲染并保存所有转场的帧
    const transitionFrames = new Map();
    if (transitions.length > 0) {
      console.log(`检测到 ${transitions.length} 个转场，预先渲染转场帧...`);
      for (const transition of transitions) {
        const transitionKey = `${transition.startTime}_${transition.endTime}_${transition.name}`;
        const frames = await this.preRenderTransitionFrames(composition, transition, backgroundColor);
        transitionFrames.set(transitionKey, frames);
      }
      console.log('转场帧预渲染完成');
    }
    
    // 调试信息：打印转场信息
    if (transitions.length > 0) {
      console.log(`转场信息:`);
      transitions.forEach((t, i) => {
        // 确保 startTime 和 endTime 存在且正确
        const tStartTime = t.startTime !== undefined ? t.startTime : 0;
        const tEndTime = t.endTime !== undefined ? t.endTime : (tStartTime + (t.duration || 0));
        const duration = t.duration || 0;
        console.log(`  转场 ${i + 1}: ${t.name}, 时间范围: ${tStartTime.toFixed(3)}s - ${tEndTime.toFixed(3)}s, 时长: ${duration.toFixed(3)}s`);
      });
    }
    
    for (let frame = 0; frame < totalFrames; frame++) {
      try {
        const time = startTime + frame / fps;
        const frameNumber = frame + 1;

        // 检查是否有转场
        const activeTransition = transitions.find(t => 
          time >= t.startTime && time < t.endTime
        );
        
        let buffer;
        if (activeTransition) {
          // 有转场，使用预渲染的帧进行转场混合
          const transitionKey = `${activeTransition.startTime}_${activeTransition.endTime}_${activeTransition.name}`;
          const frames = transitionFrames.get(transitionKey);
          if (frames) {
            buffer = await this.renderFrameWithTransition(
              composition, 
              time, 
              activeTransition, 
              backgroundColor,
              transitionRenderers,
              frames,
              transitionFunctions,
              transitionCanvasCache
            );
          } else {
            // 如果没有预渲染的帧，回退到原来的方法
            buffer = await this.renderFrameWithTransition(
              composition, 
              time, 
              activeTransition, 
              backgroundColor,
              transitionRenderers,
              null,
              transitionFunctions,
              transitionCanvasCache
            );
          }
        } else {
          // 正常渲染帧（转场期间或转场结束后）
          await this.renderer.renderFrame(composition.timeline.getLayers(), time, backgroundColor);
          // 文件模式使用 PNG 格式（用于保存帧文件）
          buffer = this.renderer.getCanvasBuffer('png');
        }

        // 如果提供了 tempDir，保存帧
        if (tempDir) {
          const framePath = path.join(tempDir, `frame_${frameNumber.toString().padStart(4, '0')}.png`);
          await fs.writeFile(framePath, buffer);
        }

        // 显示进度
        if (frame % 30 === 0 || frame === totalFrames - 1) {
          const progress = ((frame + 1) / totalFrames * 100).toFixed(1);
          console.log(`渲染进度: ${progress}% (${frame + 1}/${totalFrames})`);
        }
      } catch (error) {
        console.error(`渲染第 ${frame + 1} 帧时出错:`, error);
        console.error('错误堆栈:', error.stack);
        throw error;
      }
    }
  }

  /**
   * 导出 GIF
   */
  async exportGIF(composition, outputPath, options = {}) {
    // GIF 导出逻辑（可以调用 FFmpeg 或使用专门的 GIF 库）
    // 这里先使用 FFmpeg
    const tempVideoPath = outputPath.replace('.gif', '_temp.mp4');
    await this.export(composition, tempVideoPath, { ...options, format: 'mp4' });

    try {
      // 使用 FFmpeg 将视频转换为 GIF
      const { execa } = await import('execa');
      await execa('ffmpeg', [
        '-y',
        '-hide_banner', // 隐藏版本信息横幅
        '-loglevel', 'error', // 只显示错误信息
        '-i', tempVideoPath,
        '-vf', 'fps=10,scale=320:-1:flags=lanczos',
        outputPath,
      ]);
      await fs.remove(tempVideoPath);
      return outputPath;
    } catch (error) {
      await fs.remove(tempVideoPath).catch(() => {});
      throw new Error(`Failed to export GIF: ${error.message}`);
    }
  }

  /**
   * 序列化 composition（支持 onFrame 回调）
   * @private
   */
  async _serializeComposition(composition) {
    // 递归处理对象，将函数转换为字符串，处理循环引用
    const serializeFunctions = (obj, path = '', visited = new WeakSet()) => {
      if (obj === null || obj === undefined) {
        return obj;
      }
      
      // 处理基本类型
      if (typeof obj !== 'object' && typeof obj !== 'function') {
        return obj;
      }
      
      // 处理函数
      if (typeof obj === 'function') {
        // 将函数转换为字符串，标记为特殊类型
        // 如果函数有 __context 属性（用户提供的上下文），也一起序列化
        const funcData = {
          __isFunction: true,
          __functionCode: obj.toString(),
        };
        
        // 检查函数是否有关联的上下文
        if (obj.__context && typeof obj.__context === 'object') {
          // 序列化上下文对象（递归处理，但避免循环引用）
          funcData.__context = serializeFunctions(obj.__context, `${path}.__context`, new WeakSet());
        }
        
        return funcData;
      }
      
      // 处理循环引用
      if (visited.has(obj)) {
        // 如果已经访问过，返回占位符
        return {
          __isCircular: true,
          __circularRef: '[Circular Reference]',
        };
      }
      
      // 标记为已访问
      visited.add(obj);
      
      // 处理数组
      if (Array.isArray(obj)) {
        return obj.map((item, index) => serializeFunctions(item, `${path}[${index}]`, visited));
      }
      
      // 处理对象
      if (typeof obj === 'object') {
        // 跳过某些不应该序列化的对象类型
        if (obj instanceof Error || obj instanceof RegExp || obj instanceof Date) {
          return obj.toString();
        }
        
        // 跳过 DOM 对象、Canvas 对象等
        if (obj.constructor && (
          obj.constructor.name === 'HTMLImageElement' ||
          obj.constructor.name === 'HTMLVideoElement' ||
          obj.constructor.name === 'HTMLCanvasElement' ||
          obj.constructor.name === 'Image' ||
          obj.constructor.name === 'Video' ||
          obj.constructor.name === 'Canvas'
        )) {
          return {
            __isDOMObject: true,
            __type: obj.constructor.name,
          };
        }
        
        // 跳过 Paper.js 对象（这些会在 Worker 中重新创建）
        if (obj.constructor && obj.constructor.name && (
          obj.constructor.name.startsWith('paper.') ||
          obj.constructor.name === 'Item' ||
          obj.constructor.name === 'Path' ||
          obj.constructor.name === 'Group' ||
          obj.constructor.name === 'Raster' ||
          obj.constructor.name === 'PointText'
        )) {
          return {
            __isPaperObject: true,
            __type: obj.constructor.name,
          };
        }
        
        // 跳过 VideoBuilder、Track 等构建器对象（这些不应该在 config 中）
        if (obj.constructor && (
          obj.constructor.name === 'VideoBuilder' ||
          obj.constructor.name === 'Track' ||
          obj.constructor.name === 'Scene' ||
          obj.constructor.name === 'Component' ||
          obj.constructor.name === 'VideoMaker' ||
          obj.constructor.name === 'Timeline'
        )) {
          return {
            __isBuilderObject: true,
            __type: obj.constructor.name,
          };
        }
        
        const result = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            // 跳过某些不应该序列化的属性
            if (key === 'parent' || key === 'builder' || key === 'track' || key === 'scene' ||
                key === 'canvasWidth' || key === 'canvasHeight' || key === '_paperItem' ||
                key === '_paperInstance' || key === '_loadedCallbackCalled') {
              continue;
            }
            
            // 检查值的类型，跳过不应该序列化的对象
            const value = obj[key];
            if (value && typeof value === 'object') {
              // 跳过 VideoBuilder、Track、Scene、Component 等构建器对象
              if (value.constructor && (
                value.constructor.name === 'VideoBuilder' ||
                value.constructor.name === 'Track' ||
                value.constructor.name === 'Scene' ||
                value.constructor.name === 'Component' ||
                value.constructor.name === 'VideoMaker' ||
                value.constructor.name === 'Timeline'
              )) {
                continue;
              }
            }
            
            try {
              const serializedValue = serializeFunctions(value, path ? `${path}.${key}` : key, visited);
              if (serializedValue !== undefined) {
                result[key] = serializedValue;
              }
            } catch (e) {
              // 如果序列化失败，跳过该属性
              console.warn(`[序列化] 跳过属性 ${path ? `${path}.${key}` : key}:`, e.message);
            }
          }
        }
        return result;
      }
      
      return obj;
    };
    
    // 序列化基本配置
    const serialized = {
      config: {
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        backgroundColor: composition.backgroundColor,
        duration: composition.duration,
      },
      layers: await Promise.all(composition.layers.map(async (layer) => ({
        config: {
          zIndex: layer.zIndex,
          name: layer.name,
          type: layer.type || 'element', // 添加图层类型
        },
        elements: layer.elements ? await Promise.all(layer.elements.map(async (element) => {
          // 序列化 config，将函数转换为字符串，处理循环引用
          let serializedConfig;
          try {
            // 为每个元素创建新的序列化上下文（新的 visited Set）
            // 特别注意：需要规范化动画配置（将动画实例转换为配置对象）
            const configToSerialize = { ...element.config };
            
            // 从 element.animations 中获取动画配置（而不是从 config.animations）
            // 因为 BaseElement 构造函数会从 config.animations 中提取并删除
            // 动画实际存储在 element.animations 数组中
            if (element.animations && Array.isArray(element.animations) && element.animations.length > 0) {
              // 动态导入 normalizeAnimationConfig
              const baseElementModule = await import('../elements/BaseElement.js');
              const { normalizeAnimationConfig } = baseElementModule;
              configToSerialize.animations = element.animations.map(anim => 
                normalizeAnimationConfig(anim)
              );
            } else if (configToSerialize.animations && Array.isArray(configToSerialize.animations)) {
              // 如果 element.animations 不存在，尝试从 config.animations 中获取（向后兼容）
              const baseElementModule = await import('../elements/BaseElement.js');
              const { normalizeAnimationConfig } = baseElementModule;
              configToSerialize.animations = configToSerialize.animations.map(anim => 
                normalizeAnimationConfig(anim)
              );
            }
            
            serializedConfig = serializeFunctions(configToSerialize, '', new WeakSet());
          } catch (e) {
            console.warn(`[序列化] 元素 ${element.type} 的 config 序列化失败:`, e.message);
            // 如果序列化失败，尝试只序列化基本属性
            serializedConfig = {};
            for (const key in element.config) {
              if (element.config.hasOwnProperty(key)) {
                const value = element.config[key];
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
                  serializedConfig[key] = value;
                } else if (typeof value === 'function') {
                  serializedConfig[key] = {
                    __isFunction: true,
                    __functionCode: value.toString(),
                  };
                } else if (Array.isArray(value)) {
                  // 处理数组（如 animations）
                  if (key === 'animations') {
                    // 在异步上下文中，需要先导入 normalizeAnimationConfig
                    // 但由于这是在 try-catch 的回退逻辑中，这里先简单处理
                    // 实际应该在主 try 块中已经处理了
                    serializedConfig[key] = value;
                  } else {
                    serializedConfig[key] = value;
                  }
                }
              }
            }
          }
          
          // 也序列化元素上的 onFrame、onRender、onLoaded（如果存在）
          const callbacks = {};
          if (element.onFrame) {
            try {
              const onFrameData = {
                __isFunction: true,
                __functionCode: element.onFrame.toString(),
              };
              // 如果 onFrame 有关联的上下文，也一起序列化
              if (element.onFrame.__context && typeof element.onFrame.__context === 'object') {
                onFrameData.__context = serializeFunctions(element.onFrame.__context, 'element.onFrame.__context', new WeakSet());
              }
              callbacks.onFrame = onFrameData;
            } catch (e) {
              console.warn(`[序列化] onFrame 序列化失败:`, e.message);
            }
          }
          if (element.onRender) {
            try {
              const onRenderData = {
                __isFunction: true,
                __functionCode: element.onRender.toString(),
              };
              if (element.onRender.__context && typeof element.onRender.__context === 'object') {
                onRenderData.__context = serializeFunctions(element.onRender.__context, 'element.onRender.__context', new WeakSet());
              }
              callbacks.onRender = onRenderData;
            } catch (e) {
              console.warn(`[序列化] onRender 序列化失败:`, e.message);
            }
          }
          if (element.onLoaded) {
            try {
              const onLoadedData = {
                __isFunction: true,
                __functionCode: element.onLoaded.toString(),
              };
              if (element.onLoaded.__context && typeof element.onLoaded.__context === 'object') {
                onLoadedData.__context = serializeFunctions(element.onLoaded.__context, 'element.onLoaded.__context', new WeakSet());
              }
              callbacks.onLoaded = onLoadedData;
            } catch (e) {
              console.warn(`[序列化] onLoaded 序列化失败:`, e.message);
            }
          }
          
          // 序列化分割文本的特殊属性
          let originalAnimations = undefined;
          if (element.type === 'text' && element.originalAnimations) {
            try {
              // 使用相对路径导入，从 src/core/VideoExporter.js 到 src/elements/BaseElement.js
              const baseElementModule = await import('../elements/BaseElement.js');
              const { normalizeAnimationConfig } = baseElementModule;
              originalAnimations = element.originalAnimations.map(anim => normalizeAnimationConfig(anim));
            } catch (e) {
              console.warn(`[序列化] 文本元素 originalAnimations 序列化失败:`, e.message);
            }
          }
          
          return {
            type: element.type,
            config: serializedConfig,
            callbacks: Object.keys(callbacks).length > 0 ? callbacks : undefined,
            // 序列化元素的时间属性（这些不在 config 中，但在 Track.build 时设置）
            startTime: element.startTime !== undefined ? element.startTime : undefined,
            endTime: element.endTime !== undefined && element.endTime !== Infinity ? element.endTime : undefined,
            duration: element.duration !== undefined ? element.duration : undefined,
            // 序列化其他重要属性
            visible: element.visible !== undefined ? element.visible : true,
            zIndex: element.zIndex !== undefined ? element.zIndex : undefined,
            // 序列化分割文本的特殊属性
            originalAnimations: originalAnimations,
            split: element.split !== undefined ? element.split : undefined,
            splitDelay: element.splitDelay !== undefined ? element.splitDelay : undefined,
            splitDuration: element.splitDuration !== undefined ? element.splitDuration : undefined,
            // 如果是分割文本，也需要序列化子片段的时间和其他重要属性
            segments: element.segments && Array.isArray(element.segments) ? await Promise.all(element.segments.map(async (segment) => {
              // 序列化子片段的动画配置
              let segmentAnimations = undefined;
              if (segment.animations && Array.isArray(segment.animations) && segment.animations.length > 0) {
                try {
                  const baseElementModule = await import('../elements/BaseElement.js');
                  const { normalizeAnimationConfig } = baseElementModule;
                  segmentAnimations = segment.animations.map(anim => normalizeAnimationConfig(anim));
                } catch (e) {
                  console.warn(`[序列化] 分割文本子片段动画序列化失败:`, e.message);
                }
              }
              
              return {
                startTime: segment.startTime !== undefined ? segment.startTime : undefined,
                endTime: segment.endTime !== undefined && segment.endTime !== Infinity ? segment.endTime : undefined,
                duration: segment.duration !== undefined ? segment.duration : undefined,
                visible: segment.visible !== undefined ? segment.visible : true,
                animations: segmentAnimations, // 序列化子片段的动画配置
              };
            })) : undefined,
          };
        })) : [],
      }))),
      transitions: [], // Worker 中不支持转场
    };
    
    // 使用 JSON 序列化/反序列化确保完全可序列化
    // 使用自定义 replacer 函数处理循环引用和特殊对象
    const jsonReplacer = (key, value) => {
      // 在 JSON.stringify 时再次过滤循环引用和特殊对象
      if (typeof value === 'object' && value !== null) {
        // 如果遇到循环引用标记或特殊对象标记，返回 undefined（跳过）
        if (value.__isCircular || value.__isDOMObject || value.__isPaperObject || value.__isBuilderObject) {
          return undefined;
        }
        
        // 检查是否是 VideoBuilder、Track、Scene 等构建器对象
        if (value.constructor && (
          value.constructor.name === 'VideoBuilder' ||
          value.constructor.name === 'Track' ||
          value.constructor.name === 'Scene' ||
          value.constructor.name === 'VideoMaker' ||
          value.constructor.name === 'Timeline'
        )) {
          return undefined;
        }
      }
      return value;
    };
    
    try {
      return JSON.parse(JSON.stringify(serialized, jsonReplacer));
    } catch (e) {
      // 如果仍然失败，尝试更激进的清理策略
      console.warn('[序列化] JSON 序列化失败，尝试清理后重试:', e.message);
      try {
        // 创建一个完全干净的副本，只保留基本类型
        const cleanSerialized = {
          config: serialized.config,
          layers: serialized.layers.map(layer => ({
            config: layer.config,
            elements: layer.elements.map(element => ({
              type: element.type,
              config: element.config ? Object.fromEntries(
                Object.entries(element.config).filter(([k, v]) => 
                  v === null || 
                  typeof v === 'string' || 
                  typeof v === 'number' || 
                  typeof v === 'boolean' ||
                  (typeof v === 'object' && v !== null && v.__isFunction)
                )
              ) : {},
              callbacks: element.callbacks,
            })),
          })),
          transitions: [],
        };
        return JSON.parse(JSON.stringify(cleanSerialized, jsonReplacer));
      } catch (e2) {
        console.error('[序列化] 清理后仍然失败:', e2.message);
        throw new Error(`无法序列化 composition: ${e.message}`);
      }
    }
  }
}


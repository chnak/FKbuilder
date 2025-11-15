import { FFmpegUtil } from '../utils/ffmpeg.js';
import fs from 'fs-extra';
import path from 'path';
import { Renderer } from './Renderer.js';
import { TransitionElement } from '../elements/TransitionElement.js';
import { TransitionRenderer } from '../utils/transition-renderer.js';
import { createCanvas } from 'canvas';
import { ElementLayer } from '../layers/ElementLayer.js';

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
        
        if (usePipe) {
          // 使用管道模式：直接写入 FFmpeg，不保存中间文件
          console.log('使用管道模式（不保存中间图片）...');
          await this.renderFramesWithPipe(composition, totalFrames, startTime, fps, outputPath, backgroundColor, {
            fps: fps,
            width: composition.width,
            height: composition.height,
          });
        } else {
          // 使用文件模式：保存图片到临时目录（编码在后面的代码中处理）
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
      // 注意：需要在渲染前收集，因为 CompositionElement 可能在渲染时才初始化
      let audioConfigs = [];
      
      // 递归函数：从 CompositionElement 中收集音频
      const collectFromComposition = (compElement, parentStartTime = 0) => {
        if (!compElement) return;
        
        const currentStartTime = parentStartTime + (compElement.startTime || 0);
        
        // 从 elementsConfig 中收集（配置对象）
        // 注意：Track.build() 返回的配置中使用的是 'elements' 字段，而不是 'elementsConfig'
        const configArray = compElement.elementsConfig || compElement.elements;
        if (configArray && Array.isArray(configArray)) {
          for (const childConfig of configArray) {
            if (!childConfig) continue;
            
            if (childConfig.type === 'audio') {
              audioConfigs.push({
                path: childConfig.audioPath || childConfig.src,
                startTime: currentStartTime + (childConfig.startTime || 0),
                duration: childConfig.duration,
                audioStartTime: childConfig.cutFrom !== undefined ? childConfig.cutFrom : (childConfig.audioStartTime || 0),
                audioEndTime: childConfig.cutTo !== undefined ? childConfig.cutTo : childConfig.audioEndTime,
                volume: childConfig.volume !== undefined ? childConfig.volume : 1.0,
                fadeIn: childConfig.fadeIn || 0,
                fadeOut: childConfig.fadeOut || 0,
                loop: childConfig.loop || false,
              });
            } else if (childConfig.type === 'composition') {
              // 递归处理嵌套的 CompositionElement（配置对象）
              collectFromComposition(childConfig, currentStartTime);
            }
          }
        }
        
        // 从 elements 中收集（如果存在，这是已初始化的元素实例）
        // 注意：只有当 elements 和 elementsConfig 不是同一个数组时才处理，避免重复收集
        if (compElement.elements && Array.isArray(compElement.elements)) {
          const isSameAsConfig = compElement.elements === compElement.elementsConfig;
          if (!isSameAsConfig) {
            for (const childElement of compElement.elements) {
              if (!childElement) continue;
              
              if (childElement.type === 'audio' && childElement.audioPath) {
                audioConfigs.push(childElement.getAudioConfig ? childElement.getAudioConfig() : {
                  path: childElement.audioPath,
                  startTime: currentStartTime + (childElement.startTime || 0),
                  duration: childElement.duration,
                  audioStartTime: childElement.audioStartTime || 0,
                  audioEndTime: childElement.audioEndTime,
                  volume: childElement.volume || 1.0,
                  fadeIn: childElement.fadeIn || 0,
                  fadeOut: childElement.fadeOut || 0,
                  loop: childElement.loop || false,
                });
              }
            }
          }
        }
      };
      
      // 先尝试使用 collectAllAudioElements 方法
      audioConfigs = composition.collectAllAudioElements();
      
      // 如果收集到的音频元素为空，从 CompositionElement 的配置中直接收集
      if (audioConfigs.length === 0) {
        // 遍历所有图层，查找 CompositionElement
        for (const layer of composition.timeline.getLayers()) {
          if (layer.elements) {
            for (const element of layer.elements) {
              if (element && element.type === 'composition') {
                collectFromComposition(element, 0);
              }
            }
          }
        }
      }
      
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
   */
  async renderFramesWithPipe(composition, totalFrames, startTime, fps, outputPath, backgroundColor, ffmpegOptions) {
    // 启动 FFmpeg 管道进程
    const pipe = await this.ffmpeg.imagesToVideoPipe(outputPath, ffmpegOptions);
    
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
            buffer = this.renderer.getCanvasBuffer();
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
    const fromCanvas = this.renderer.canvas;
    const fromCtx = fromCanvas.getContext('2d');
    const fromImageData = fromCtx.getImageData(0, 0, fromCanvas.width, fromCanvas.height);
    const fromBuffer = Buffer.from(fromImageData.data);
    
    // 在转场结束时间渲染一帧，作为 toFrame（此时 toScene 已经完全显示）
    await this.renderer.renderFrame(composition.timeline.getLayers(), transition.endTime, backgroundColor);
    const toCanvas = this.renderer.canvas;
    const toCtx = toCanvas.getContext('2d');
    const toImageData = toCtx.getImageData(0, 0, toCanvas.width, toCanvas.height);
    const toBuffer = Buffer.from(toImageData.data);
    
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
      const fromCanvas = this.renderer.canvas;
      const fromCtx = fromCanvas.getContext('2d');
      const fromImageData = fromCtx.getImageData(0, 0, fromCanvas.width, fromCanvas.height);
      fromBuffer = Buffer.from(fromImageData.data);
      
      const toScene = transition.toScene;
      const toBackgroundColor = toScene.backgroundLayer?.config?.backgroundColor || backgroundColor;
      const toSceneStartTime = transition.startTime;
      
      await this.renderer.renderFrame(composition.timeline.getLayers(), toSceneStartTime, toBackgroundColor);
      const toCanvas = this.renderer.canvas;
      const toCtx = toCanvas.getContext('2d');
      const toImageData = toCtx.getImageData(0, 0, toCanvas.width, toCanvas.height);
      toBuffer = Buffer.from(toImageData.data);
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
    
    // 转换为 PNG buffer
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
          buffer = this.renderer.getCanvasBuffer();
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
}


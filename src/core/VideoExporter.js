import { FFmpegUtil } from '../utils/ffmpeg.js';
import fs from 'fs-extra';
import path from 'path';
import { Renderer } from './Renderer.js';
import { TransitionElement } from '../elements/TransitionElement.js';

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
      endTime = composition.timeline.duration,
    } = options;

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    await fs.ensureDir(outputDir);

      // 创建临时目录存储帧
      const tempDir = path.join(outputDir, `temp_frames_${Date.now()}`);
      await fs.ensureDir(tempDir);

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
        const framePattern = path.join(tempDir, 'frame_%04d.png');

        console.log(`开始渲染 ${totalFrames} 帧...`);
        
        // 使用串行渲染
        const backgroundColor = composition.backgroundColor || '#000000';
        await this.renderFramesSerial(composition, totalFrames, startTime, fps, tempDir, backgroundColor);

        // 记录渲染结束时间
        const renderEndTime = performance.now();
        const renderTotalTime = (renderEndTime - renderStartTime) / 1000; // 转换为秒

        console.log('帧渲染完成，开始编码视频...');
        console.log(`渲染总耗时: ${renderTotalTime.toFixed(2)} 秒`);

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
      
      // 并行处理：同时进行视频编码和音频处理
      // 这样可以充分利用 CPU 和 I/O 资源，提升整体速度
      const videoEncodingPromise = this.ffmpeg.imagesToVideo(framePattern, outputPath, {
        fps: fps,
        width: composition.width,
        height: composition.height,
      });

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
      if (hasAudio && processedAudioPath && await fs.pathExists(processedAudioPath)) {
        console.log('将音频添加到视频...');
        const tempVideoPath = outputPath.replace(/\.(mp4|webm)$/, '_temp.$1');
        await fs.move(outputPath, tempVideoPath);
        
        if (audioPath && await fs.pathExists(audioPath)) {
          // 旧方式：单个音频文件
          await this.ffmpeg.addAudioToVideo(tempVideoPath, audioPath, outputPath, {
            audioStartTime: startTime,
          });
        } else {
          // 新方式：合并后的音频
          await this.ffmpeg.addAudioToVideo(tempVideoPath, processedAudioPath, outputPath, {
            audioStartTime: 0,
          });
          
          // 清理临时音频文件
          const mergedAudioDir = path.dirname(processedAudioPath);
          if (mergedAudioDir.includes('temp_audio_')) {
            await fs.remove(mergedAudioDir).catch(() => {});
          } else {
            await fs.remove(processedAudioPath).catch(() => {});
          }
        }
        
        await fs.remove(tempVideoPath);
      } else if (hasAudio && audioConfigs.length > 0) {
        // 如果音频处理失败，尝试使用第一个音频
        const firstAudio = audioConfigs[0];
        if (firstAudio && await fs.pathExists(firstAudio.path)) {
          console.log('使用第一个音频文件...');
          const tempVideoPath = outputPath.replace(/\.(mp4|webm)$/, '_temp.$1');
          await fs.move(outputPath, tempVideoPath);
          await this.ffmpeg.addAudioToVideo(tempVideoPath, firstAudio.path, outputPath, {
            audioStartTime: firstAudio.startTime || 0,
          });
          await fs.remove(tempVideoPath);
        }
      }

      // 清理临时文件
      await fs.remove(tempDir);

      // 重置转场统计信息
      TransitionElement.resetTransitionStats();

      console.log(`视频导出完成: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('视频导出失败:', error);
      console.error('错误堆栈:', error.stack);
      // 清理临时文件
      await fs.remove(tempDir).catch(() => {});
      throw error;
    } finally {
      if (this.renderer) {
        this.renderer.destroy();
      }
    }
  }

  /**
   * 串行渲染所有帧
   */
  async renderFramesSerial(composition, totalFrames, startTime, fps, tempDir, backgroundColor) {
    for (let frame = 0; frame < totalFrames; frame++) {
      try {
        const time = startTime + frame / fps;
        const frameNumber = frame + 1;

        // 渲染帧（传入背景色）
        await this.renderer.renderFrame(composition.timeline.getLayers(), time, backgroundColor);

        // 保存帧
        const framePath = path.join(tempDir, `frame_${frameNumber.toString().padStart(4, '0')}.png`);
        const buffer = this.renderer.getCanvasBuffer();
        await fs.writeFile(framePath, buffer);

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


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

      for (let frame = 0; frame < totalFrames; frame++) {
        try {
          const time = startTime + frame / fps;
          const frameNumber = frame + 1;

          // 渲染帧（传入背景色）
          await this.renderer.renderFrame(composition.timeline.getLayers(), time, composition.backgroundColor);

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
          throw error; // 重新抛出错误，让外层捕获
        }
      }

      // 记录渲染结束时间
      const renderEndTime = performance.now();
      const renderTotalTime = (renderEndTime - renderStartTime) / 1000; // 转换为秒

      console.log('帧渲染完成，开始编码视频...');
      console.log(`渲染总耗时: ${renderTotalTime.toFixed(2)} 秒`);

      // 打印转场统计信息（可选）
      TransitionElement.printTransitionStats();

      // 使用 FFmpeg 将帧序列转换为视频
      await this.ffmpeg.imagesToVideo(framePattern, outputPath, {
        fps: fps,
        width: composition.width,
        height: composition.height,
      });

      // 如果有音频，添加到视频
      if (audioPath && await fs.pathExists(audioPath)) {
        const tempVideoPath = outputPath.replace(/\.(mp4|webm)$/, '_temp.$1');
        await fs.move(outputPath, tempVideoPath);
        await this.ffmpeg.addAudioToVideo(tempVideoPath, audioPath, outputPath, {
          audioStartTime: startTime,
        });
        await fs.remove(tempVideoPath);
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


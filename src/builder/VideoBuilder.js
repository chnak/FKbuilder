/**
 * 视频构建器 - 多轨道多场景支持（直接使用 Layer，不使用 CompositionElement 嵌套）
 */
import { VideoMaker } from '../core/VideoMaker.js';
import { Track } from './Track.js';
import path from 'path';
import fs from 'fs-extra';

/**
 * 视频构建器主类
 */
export class VideoBuilder {
  constructor(config = {}) {
    this.config = {
      width: config.width || 1920,
      height: config.height || 1080,
      fps: config.fps || 30,
      // backgroundColor 不再在构造函数中设置，应该通过 Scene 的 addBackground() 添加
      ...config,
    };
    
    this.tracks = [];
    this.currentTime = 0; // 当前时间位置
  }

  /**
   * 创建轨道
   * @param {Object} config - 轨道配置 { zIndex, name }
   * @returns {Track} 轨道实例
   */
  createTrack(config = {}) {
    const track = new Track({
      ...config,
      builder: this,
      zIndex: config.zIndex || this.tracks.length,
    });
    
    this.tracks.push(track);
    return track;
  }

  /**
   * 获取所有轨道
   * @returns {Array<Track>}
   */
  getTracks() {
    return this.tracks;
  }

  /**
   * 计算总时长（所有轨道中最长的）
   * @returns {number} 总时长（秒）
   */
  getTotalDuration() {
    if (this.tracks.length === 0) return 0;
    
    return Math.max(...this.tracks.map(track => track.getTotalDuration()));
  }

  /**
   * 构建最终的 VideoMaker（直接使用 Layer，不使用 CompositionElement 嵌套）
   * @returns {VideoMaker}
   */
  build() {
    const totalDuration = this.getTotalDuration();
    
    // 创建主合成（背景透明，背景应该通过 Scene 的 addBackground() 添加）
    const mainComposition = new VideoMaker({
      width: this.config.width,
      height: this.config.height,
      fps: this.config.fps,
      duration: totalDuration,
      backgroundColor: 'transparent', // 主合成背景透明
    });

    // 移除默认的背景图层（因为背景应该通过 Scene 的 addBackground() 添加）
    if (mainComposition.backgroundLayer) {
      mainComposition.removeLayer(mainComposition.backgroundLayer);
      mainComposition.backgroundLayer = null;
    }

    // 按 zIndex 排序轨道
    const sortedTracks = [...this.tracks].sort((a, b) => a.zIndex - b.zIndex);

    // 收集所有转场信息
    const allTransitions = [];
    for (const track of sortedTracks) {
      // Track.build() 现在直接创建 Layer 并添加元素到 VideoMaker
      track.build(mainComposition);
      
      // 收集转场信息
      for (let i = 0; i < track.transitions.length; i++) {
        const transition = track.transitions[i];
        if (transition.startTime !== undefined) {
          // 查找转场对应的场景
          const sortedScenes = [...track.scenes].sort((a, b) => {
            const aStartTime = a.startTime !== undefined ? a.startTime : 0;
            const bStartTime = b.startTime !== undefined ? b.startTime : 0;
            return aStartTime - bStartTime;
          });
          
          // 找到转场对应的from和to场景
          let fromScene = null;
          let toScene = null;
          let transitionStartTime = transition.startTime;
          
          // 如果transition.startTime未定义，尝试从场景推断
          if (transitionStartTime === undefined) {
            // 遍历场景，找到转场应该插入的位置
            for (let j = 0; j < sortedScenes.length - 1; j++) {
              const scene = sortedScenes[j];
              const nextScene = sortedScenes[j + 1];
              const sceneEndTime = (scene.startTime || 0) + scene.duration;
              const nextSceneStartTime = nextScene.startTime !== undefined ? nextScene.startTime : sceneEndTime;
              
              // 如果转场没有指定startTime，使用下一个场景的开始时间
              fromScene = scene;
              toScene = nextScene;
              transitionStartTime = nextSceneStartTime;
              break;
            }
          } else {
            // 转场有指定的startTime，查找对应的场景
            // transition.startTime 是转场结束的时间点（目标场景开始的时间）
            for (let j = 0; j < sortedScenes.length; j++) {
              const scene = sortedScenes[j];
              const sceneStartTime = scene.startTime !== undefined ? scene.startTime : 0;
              
              // 转场结束时间应该等于目标场景的开始时间
              if (Math.abs(transitionStartTime - sceneStartTime) < 0.01) {
                // 找到目标场景，查找源场景（前一个场景）
                if (j > 0) {
                  fromScene = sortedScenes[j - 1];
                  toScene = scene;
                  break;
                }
              }
            }
          }
          
          if (fromScene && toScene && transitionStartTime !== undefined) {
            // 转场时间计算：
            // transition.startTime 是转场结束的时间点（目标场景开始的时间）
            // 转场开始时间 = transitionStartTime - duration
            // 转场结束时间 = transitionStartTime
            const transitionDuration = transition.duration || 0.5;
            const transitionActualStartTime = transitionStartTime - transitionDuration;
            const transitionActualEndTime = transitionStartTime;
            
            // 确保计算正确
            if (transitionActualStartTime >= transitionActualEndTime) {
              console.warn(`转场 ${transition.name} 时间计算错误: startTime=${transitionActualStartTime}, endTime=${transitionActualEndTime}, transitionStartTime=${transitionStartTime}, duration=${transitionDuration}`);
            }
            
            const transitionObj = {
              name: transition.name,
              duration: transitionDuration,
              startTime: transitionActualStartTime, // 转场开始时间
              endTime: transitionActualEndTime, // 转场结束时间（目标场景开始时间）
              easing: transition.easing,
              params: transition.params,
              fromScene: fromScene,
              toScene: toScene,
            };
            
            allTransitions.push(transitionObj);
          } else {
            console.warn(`转场 ${transition.name} 无法找到对应的场景，startTime: ${transitionStartTime}, fromScene: ${fromScene}, toScene: ${toScene}`);
          }
        }
      }
    }
    
    // 将转场信息保存到composition
    mainComposition.transitions = allTransitions;

    return mainComposition;
  }

  /**
   * 导出视频
   * @param {string} outputPath - 输出路径
   * @param {Object} options - 导出选项
   * @returns {Promise<void>}
   */
  async export(outputPath, options = {}) {
    const composition = this.build();
    try {
      await composition.export(outputPath, options);
    } finally {
      composition.destroy();
      // 导出完成后自动销毁 builder
      this.destroy();
    }
  }

  /**
   * 渲染视频（自动 build 和 export）
   * @param {string} outputPath - 输出路径（可选，默认：'output/fkbuilder-video.mp4'）
   * @param {Object} options - 导出选项
   * @returns {Promise<string>} 输出路径
   */
  async render(outputPath, options = {}) {
    // 如果没有提供 outputPath，使用默认路径
    if (!outputPath) {
      const defaultOutputDir = path.join(process.cwd(), 'output');
      await fs.ensureDir(defaultOutputDir);
      outputPath = path.join(defaultOutputDir, 'fkbuilder-video.mp4');
    }

    const composition = this.build();
    try {
      const result = await composition.export(outputPath, options);
      return result || outputPath;
    } finally {
      composition.destroy();
      // 渲染完成后自动销毁 builder
      this.destroy();
    }
  }

  /**
   * 渲染一帧
   * @param {number} time - 时间（秒）
   * @returns {Promise<Canvas>}
   */
  async renderFrame(time) {
    const composition = this.build();
    const canvas = await composition.renderFrame(time);
    composition.destroy();
    return canvas;
  }

  /**
   * 销毁构建器
   */
  destroy() {
    for (const track of this.tracks) {
      track.destroy();
    }
    this.tracks = [];
  }
}


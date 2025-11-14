/**
 * 视频构建器 - 多轨道多场景支持（直接使用 Layer，不使用 CompositionElement 嵌套）
 */
import { VideoMaker } from '../core/VideoMaker.js';
import { Track } from './Track.js';

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
            for (let j = 0; j < sortedScenes.length - 1; j++) {
              const scene = sortedScenes[j];
              const nextScene = sortedScenes[j + 1];
              const sceneEndTime = (scene.startTime || 0) + scene.duration;
              const nextSceneStartTime = nextScene.startTime !== undefined ? nextScene.startTime : sceneEndTime;
              
              // 转场开始时间应该等于下一个场景的开始时间
              if (Math.abs(transitionStartTime - nextSceneStartTime) < 0.01) {
                fromScene = scene;
                toScene = nextScene;
                break;
              }
            }
          }
          
          if (fromScene && toScene && transitionStartTime !== undefined) {
            // 转场应该在两个场景之间各占一半
            // 例如：场景1结束时间是3秒，场景2开始时间是3秒，转场时长1秒
            // 转场应该从2.5秒开始（场景1结束前0.5秒），到3.5秒结束（场景2开始后0.5秒）
            const fromSceneEndTime = (fromScene.startTime || 0) + fromScene.duration;
            const toSceneStartTime = transitionStartTime;
            const halfDuration = transition.duration / 2;
            
            allTransitions.push({
              name: transition.name,
              duration: transition.duration,
              startTime: fromSceneEndTime - halfDuration, // 转场开始时间（场景1结束前一半）
              endTime: toSceneStartTime + halfDuration, // 转场结束时间（场景2开始后一半）
              easing: transition.easing,
              params: transition.params,
              fromScene: fromScene,
              toScene: toScene,
            });
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
    await composition.export(outputPath, options);
    composition.destroy();
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


import { Lrc } from 'lrc-kit';
import fs from 'fs-extra';

/**
 * LRC 字幕构建器
 * 使用 lrc-kit 库从 LRC 文件创建字幕元素
 */
export class LRCSubtitleBuilder {
  /**
   * 从 LRC 文件加载字幕
   * @param {string} lrcPath - LRC 文件路径
   * @param {Object} options - 字幕样式选项
   * @returns {Promise<Array>} 字幕元素配置数组
   */
  static async loadFromFile(lrcPath, options = {}) {
    if (!await fs.pathExists(lrcPath)) {
      throw new Error(`LRC 文件不存在: ${lrcPath}`);
    }

    const content = await fs.readFile(lrcPath, 'utf-8');
    return this.loadFromContent(content, options);
  }

  /**
   * 从 LRC 内容字符串加载字幕
   * @param {string} lrcContent - LRC 文件内容
   * @param {Object} options - 字幕样式选项
   * @returns {Array} 字幕元素配置数组
   */
  static loadFromContent(lrcContent, options = {}) {
    // 先手动解析多时间标签格式（支持 [03:06.90][02:33.64][01:06.36]文本 这种格式）
    const lyricsWithMultipleTimes = this.parseMultipleTimeTags(lrcContent);
    
    // 如果有多个时间标签的歌词，使用手动解析的结果
    if (lyricsWithMultipleTimes.length > 0) {
      return this.toSubtitleElements(lyricsWithMultipleTimes, options);
    }
    
    // 否则使用 lrc-kit 解析标准 LRC 内容
    const parsedLrc = Lrc.parse(lrcContent);
    
    // 转换为字幕元素配置
    return this.toSubtitleElements(parsedLrc.lyrics, options);
  }

  /**
   * 解析多时间标签格式的 LRC 内容
   * 支持格式：[03:06.90][02:33.64][01:06.36]文本内容
   * @param {string} lrcContent - LRC 文件内容
   * @returns {Array} 歌词数组，格式: [{timestamp: 秒数, content: '歌词内容'}, ...]
   */
  static parseMultipleTimeTags(lrcContent) {
    const lines = lrcContent.split(/\r?\n/);
    const lyrics = [];
    
    // 匹配时间标签的正则表达式：[mm:ss.xx] 或 [m:ss.xx]
    const timeTagRegex = /\[(\d{1,2}):(\d{2})\.(\d{2})\]/g;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过空行
      if (!trimmedLine) {
        continue;
      }
      
      // 重置正则表达式
      timeTagRegex.lastIndex = 0;
      
      // 检查是否是元数据行（如 [ar:艺术家]），元数据行不包含时间标签格式
      // 先检查是否有时间标签格式
      const hasTimeTag = timeTagRegex.test(trimmedLine);
      timeTagRegex.lastIndex = 0; // 重置正则表达式
      
      // 如果是元数据行（以 [ 开头但不是时间标签），跳过
      if (trimmedLine.startsWith('[') && !hasTimeTag) {
        continue;
      }
      
      // 提取所有时间标签
      const timeTags = [];
      let match;
      while ((match = timeTagRegex.exec(trimmedLine)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centiseconds = parseInt(match[3], 10);
        const timestamp = minutes * 60 + seconds + centiseconds / 100;
        timeTags.push(timestamp);
      }
      
      // 如果没有找到时间标签，跳过这一行
      if (timeTags.length === 0) {
        continue;
      }
      
      // 提取文本内容（移除所有时间标签后剩余的部分）
      const text = trimmedLine.replace(timeTagRegex, '').trim();
      
      // 如果文本为空，跳过
      if (!text) {
        continue;
      }
      
      // 为每个时间标签创建一个歌词条目
      for (const timestamp of timeTags) {
        lyrics.push({
          timestamp: timestamp,
          content: text
        });
      }
    }
    
    // 按时间戳排序
    lyrics.sort((a, b) => a.timestamp - b.timestamp);
    
    return lyrics;
  }

  /**
   * 将 lrc-kit 解析的歌词数组转换为字幕元素配置数组
   * @param {Array} lyrics - lrc-kit 解析的歌词数组，格式: [{timestamp: 秒数, content: '歌词内容'}, ...]
   * @param {Object} options - 配置选项
   * @returns {Array} 字幕元素配置数组
   */
  static toSubtitleElements(lyrics, options = {}) {
    const {
      textColor = '#ffffff',
      fontSize = 32,
      x = '50%',
      y = '80%',
      textAlign = 'center',
      minDuration = 1, // 最小显示时长
      maxDuration = 5.0,  // 最大显示时长
      sceneDuration = null, // 场景或轨道时长，用于计算最后一句歌词的显示时长
      lastLineDuration = null, // 最后一句歌词的显示时长（如果指定，优先使用）
      ...otherOptions // 其他选项（如 animations, split, fontPath 等）
    } = options;

    const elements = [];

    for (let i = 0; i < lyrics.length; i++) {
      const lyric = lyrics[i];
      const nextLyric = lyrics[i + 1];

      // 计算显示时长
      let duration;
      if (nextLyric) {
        // 下一句歌词开始前结束，留一点间隔
        duration = Math.max(
          minDuration,
          Math.min(
            maxDuration,
            nextLyric.timestamp - lyric.timestamp - 0.1 // 留 0.1 秒间隔
          )
        );
      } else {
        // 最后一句歌词的时长计算
        if (lastLineDuration !== null && lastLineDuration !== undefined) {
          // 如果明确指定了最后一句的时长，使用指定值
          duration = Math.max(minDuration, lastLineDuration);
        } else if (sceneDuration !== null && sceneDuration !== undefined && sceneDuration > 0) {
          // 如果提供了场景/轨道时长，最后一句显示到场景/轨道结束
          // 计算从最后一句开始到场景结束的时长
          const timeToEnd = sceneDuration - lyric.timestamp;
          duration = Math.max(minDuration, timeToEnd);
        } else {
          // 否则使用默认时长（3秒或最小时长）
          duration = Math.max(minDuration, 3);
        }
      }
      
      elements.push({
        ...otherOptions, // 传递其他选项（animations, split, fontPath 等）
        type: 'subtitle',  // 使用 subtitle 类型
        text: lyric.content,  // lrc-kit 使用 content 字段
        color: textColor,
        textColor: textColor,
        fontSize: fontSize,
        x: x,
        y: y,
        textAlign: textAlign,
        startTime: lyric.timestamp,  // lrc-kit 使用 timestamp 字段（单位：秒）
        duration: duration
      });
    }

    return elements;
  }

  /**
   * 将字幕元素添加到场景或轨道
   * @param {Object} sceneOrTrack - 场景或轨道对象
   * @param {string} lrcPath - LRC 文件路径
   * @param {Object} options - 字幕样式选项
   * @returns {Promise<Object>} 返回场景或轨道对象（支持链式调用）
   */
  static async addSubtitlesFromLRC(sceneOrTrack, lrcPath, options = {}) {
    if (!await fs.pathExists(lrcPath)) {
      throw new Error(`LRC 文件不存在: ${lrcPath}`);
    }

    // 获取场景或轨道的时长，用于计算最后一句歌词的显示时长
    const sceneOrTrackDuration = sceneOrTrack.duration;
    
    // 将场景/轨道时长传递给 options，用于计算最后一句歌词的时长
    const subtitleElements = await this.loadFromFile(lrcPath, {
      ...options,
      sceneDuration: sceneOrTrackDuration // 传递场景/轨道时长
    });
    
    // 将字幕元素添加到场景或轨道
    for (const subtitleConfig of subtitleElements) {
      // 使用 addSubtitle 方法添加字幕
      // startTime 是 LRC 中解析的时间戳，相对于场景开始时间（场景的 startTime 通常是 0）
      sceneOrTrack.addSubtitle(subtitleConfig);
    }

    return sceneOrTrack;
  }
}




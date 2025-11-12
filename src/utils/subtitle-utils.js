/**
 * 字幕工具函数
 */

/**
 * 计算混合中英文的语音时间
 * @param {string} text - 文本内容
 * @param {number} chineseSpeed - 中文速度（字符/分钟），默认 200
 * @param {number} englishSpeed - 英文速度（单词/分钟），默认 150
 * @returns {number} 总时间（秒）
 */
export function calculateSpeechTimeMixed(text, chineseSpeed = 200, englishSpeed = 150) {
  if (!text || typeof text !== 'string') return 0;

  // 统计中文字符数（Unicode中文范围）
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const chineseCount = chineseChars.length;

  // 统计英文单词数（按空格分割，过滤空值）
  const englishWords = text
    .replace(/[\u4e00-\u9fa5]/g, ' ') // 移除中文以准确统计英文单词
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
  const englishCount = englishWords.length;

  // 计算两部分时间（秒）
  const chineseTime = (chineseCount / chineseSpeed) * 60;
  const englishTime = (englishCount / englishSpeed) * 60;

  // 返回总时间（四舍五入）
  return Math.round(chineseTime + englishTime);
}

const SIGN = '_$_';

/**
 * 检查是否正在分割英文单词
 */
function isSplittingEnglishWord(text, position) {
  if (position === 0 || position >= text.length) return false;
  
  const prevChar = text[position - 1];
  const currChar = text[position];
  
  // 如果前后字符都是英文字母，说明正在分割单词
  return /[a-zA-Z]/.test(prevChar) && /[a-zA-Z]/.test(currChar);
}

/**
 * 查找安全的分割点
 */
function findSafeSplitPoint(text, start, proposedEnd, maxLength) {
  let end = proposedEnd;
  
  // 方案1：向前查找空格或标点
  for (let i = end - 1; i > start; i--) {
    if (text[i] === ' ' || /[，。！？、,.;!?]/.test(text[i])) {
      return i + 1; // 在空格或标点后分割
    }
  }
  
  // 方案2：向后查找空格或标点
  for (let i = end; i < Math.min(text.length, end + 10); i++) {
    if (text[i] === ' ' || /[，。！？、,.;!?]/.test(text[i])) {
      return i + 1; // 在空格或标点后分割
    }
  }
  
  // 方案3：如果找不到合适位置，尽量完整包含单词
  if (end < text.length) {
    let wordEnd = end;
    while (wordEnd < text.length && /[a-zA-Z]/.test(text[wordEnd])) {
      wordEnd++;
    }
    
    // 如果单词长度可控，尽量完整包含
    if (wordEnd - start <= maxLength + 5) {
      return wordEnd;
    }
  }
  
  // 最后手段：按原位置分割
  return proposedEnd;
}

/**
 * 按标点符号和最大长度分割文本
 * @param {string} text - 文本内容
 * @param {number} maxLength - 每段最大字符数
 * @returns {Array<string>} 分割后的文本段落数组
 */
function splitText(text, maxLength = 20) {
  if (!text || typeof text !== 'string') return [];
  
  // 1. 去除多余的引号和换行符
  text = text.replace(/["""''\n\r]/g, '');
  
  // 2. 替换标点为 SIGN + 标点（标点后插入 SIGN）
  const regexp = /([。？！,!;；，,])/g;
  text = text.replace(regexp, `$1${SIGN}`); // 标点后加 SIGN
  
  // 3. 按 SIGN 分割，并过滤空字符串
  let segments = text.split(SIGN).filter(seg => seg.trim());
  
  // 4. 处理长句子（超过 maxLength 的按字数分割），保护英文单词
  segments = segments.flatMap(seg => {
    if (seg.length <= maxLength) return seg;
    
    const chunks = [];
    let start = 0;
    
    while (start < seg.length) {
      let end = Math.min(start + maxLength, seg.length);
      
      // 避免在标点中间切断
      if (end < seg.length && /[，。！？、,.;!?]/.test(seg[end])) {
        end++;
      }
      // 避免分割英文单词
      else if (end < seg.length && isSplittingEnglishWord(seg, end)) {
        end = findSafeSplitPoint(seg, start, end, maxLength);
      }
      
      chunks.push(seg.slice(start, end));
      start = end;
    }
    
    return chunks;
  });
  
  return segments.filter(seg => seg.trim().length > 0);
}

/**
 * 同步文本段落时长与最小时长
 * @param {Array<string>} textSegments - 文本段落数组
 * @param {number} totalDuration - 总时长（秒）
 * @param {number} minDuration - 最小时长（秒），默认 0.2
 * @returns {Array<{text: string, duration: number}>} 带时长的段落数组
 */
function syncDurationWithMinDuration(textSegments, totalDuration, minDuration = 0.2) {
  if (!textSegments || textSegments.length === 0) return [];
  
  const totalChars = textSegments.join('').length;
  if (totalChars === 0) return [];
  
  let remainingDuration = totalDuration;

  // 先分配保底时长
  const segments = textSegments.map(text => {
    const duration = Math.max(
      minDuration,
      (text.length / totalChars) * totalDuration
    );
    remainingDuration -= duration;
    return { text, duration };
  });

  // 如果剩余时间 > 0，按字数比例再分配
  if (remainingDuration > 0) {
    const extraPerChar = remainingDuration / totalChars;
    segments.forEach(seg => {
      seg.duration += seg.text.length * extraPerChar;
    });
  }

  return segments;
}

/**
 * 计算文本容量
 * @param {number} screenWidth - 屏幕宽度（像素）
 * @param {number} fontSize - 字体大小（像素）
 * @param {string} text - 文本内容
 * @param {string} fontFamily - 字体族，默认 'PatuaOne'
 * @returns {Object} 包含最大字符数、平均字符宽度等信息
 */
export function calculateMixedTextCapacity(screenWidth, fontSize, text, fontFamily = 'PatuaOne') {
  // 统计中英文比例
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishChars = text.match(/[a-zA-Z]/g) || [];
  const otherChars = text.match(/[^\u4e00-\u9fa5a-zA-Z\s]/g) || [];
  
  const totalChars = chineseChars.length + englishChars.length + otherChars.length;
  if (totalChars === 0) {
    return {
      maxChars: 0,
      avgCharWidth: fontSize,
      chineseCount: 0,
      englishCount: 0,
      otherCount: 0,
      chineseRatio: 0,
      englishRatio: 0
    };
  }
  
  const chineseRatio = chineseChars.length / totalChars;
  const englishRatio = englishChars.length / totalChars;
  
  // 不同字符的宽度系数
  const chineseWidth = fontSize * 1.0;    // 中文字符宽度
  const englishWidth = fontSize * 0.6;    // 英文字符宽度
  const otherWidth = fontSize * 0.7;      // 其他字符宽度
  
  // 计算平均字符宽度
  const avgCharWidth = (chineseWidth * chineseRatio) + 
                      (englishWidth * englishRatio) + 
                      (otherWidth * (1 - chineseRatio - englishRatio));
  
  const maxChars = Math.floor(screenWidth / avgCharWidth);
  
  return {
    maxChars,
    avgCharWidth,
    chineseCount: chineseChars.length,
    englishCount: englishChars.length,
    otherCount: otherChars.length,
    chineseRatio,
    englishRatio
  };
}

/**
 * 解析字幕文本，按标点符号和时长分割
 * @param {string} text - 文本内容
 * @param {number} duration - 总时长（秒），如果未指定则自动计算
 * @param {number} maxLength - 每段最大字符数，默认 20
 * @returns {Array<{text: string, duration: number}>} 带时长的段落数组
 */
export function parseSubtitles(text, duration, maxLength = 20) {
  if (!text || typeof text !== 'string') return [];
  
  // 计算语音时间
  const textListWithDuration = calculateSpeechTimeMixed(text);
  
  // 分割文本
  const textList = splitText(text, maxLength);
  
  // 使用指定时长或计算出的时长
  const finalDuration = duration || textListWithDuration;
  
  // 同步时长
  return syncDurationWithMinDuration(textList, finalDuration);
}


/**
 * 文本分割工具类
 * 用于将文本按字符、单词或行进行分割，并计算每个片段的位置和尺寸
 * 使用 Canvas API 准确计算文本尺寸
 */
import { createCanvas } from 'node-canvas-webgl';

export class TextSplitter {
  constructor(text, options = {}) {
    this.text = text || '';
    this.options = {
      fontSize: options.fontSize || 24,
      fontFamily: options.fontFamily || 'Arial',
      fontWeight: options.fontWeight || 'normal',
      fontStyle: options.fontStyle || 'normal',
      // 字符间距
      charSpacing: options.charSpacing || (options.fontSize * 0.1),
      // 单词间距
      wordSpacing: options.wordSpacing || (options.fontSize * 0.3),
      // 行高
      lineHeight: options.lineHeight || 1.2,
      // 是否启用动态间距
      dynamicSpacing: options.dynamicSpacing !== false,
      ...options
    };

    // 创建 Canvas 上下文用于测量文本
    this.canvas = createCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d');
    this._setupCanvasContext();

    // 存储分割后的数据
    this.characters = [];
    this.words = [];
    this.lines = [];
    
    // 总尺寸
    this.totalWidth = 0;
    this.totalHeight = 0;

    // 初始化分割数据
    this._createCharacters();
    this._createWords();
    this._createLines();
    this._calculateDimensions();
  }

  /**
   * 设置 Canvas 上下文字体
   */
  _setupCanvasContext() {
    const { fontSize, fontFamily, fontWeight, fontStyle } = this.options;
    // 构建字体字符串：fontStyle fontWeight fontSize fontFamily
    const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.font = fontString;
    // 设置文本基线
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.textAlign = 'left';
  }

  /**
   * 使用 Canvas API 准确测量文本宽度
   */
  _measureText(text) {
    if (!text) return 0;
    
    // 使用 Canvas API 的 measureText 方法，这是最准确的方式
    const metrics = this.ctx.measureText(text);
    return metrics.width;
  }

  /**
   * 判断是否为空格字符
   */
  _isSpace(char) {
    return /\s/.test(char);
  }

  /**
   * 判断是否为符号字符
   */
  _isSymbol(char) {
    return /[^\w\s\u4e00-\u9fa5]/.test(char);
  }

  /**
   * 创建字符分割
   */
  _createCharacters() {
    this.characters = [];
    const chars = Array.from(this.text);
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const isSpace = this._isSpace(char);
      const isSymbol = this._isSymbol(char);
      
      // 使用 Canvas API 准确测量字符宽度
      const charWidth = this._measureText(char);

      this.characters.push({
        text: char,
        index: i,
        isSpace,
        isSymbol,
        width: charWidth,
        height: this.options.fontSize,
        x: 0, // 将在 _calculateDimensions 中设置
        y: 0
      });
    }
  }

  /**
   * 创建单词分割
   */
  _createWords() {
    this.words = [];
    // 使用正则分割，保留空格
    const parts = this.text.split(/(\s+)/).filter(part => part.length > 0);
    
    for (let i = 0; i < parts.length; i++) {
      const word = parts[i];
      const isSpace = word.trim() === '';
      
      // 使用 Canvas API 准确测量单词宽度
      const wordWidth = this._measureText(word);

      this.words.push({
        text: word,
        index: i,
        isSpace,
        width: wordWidth,
        height: this.options.fontSize,
        x: 0, // 将在 _calculateDimensions 中设置
        y: 0
      });
    }
  }

  /**
   * 创建行分割
   * 保留所有行，包括空行（只包含空格的行）
   */
  _createLines() {
    this.lines = [];
    // 保留所有行，不过滤空行或只包含空格的行
    const lines = this.text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 使用 Canvas API 准确测量行宽度（包括空行）
      const lineWidth = this._measureText(line);

      this.lines.push({
        text: line,
        index: i,
        width: lineWidth,
        height: this.options.fontSize,
        x: 0, // 将在 _calculateDimensions 中设置
        y: 0
      });
    }
  }

  /**
   * 计算动态字符间距
   */
  _calculateDynamicCharSpacing() {
    const spacing = [];
    
    if (!this.options.dynamicSpacing) {
      return spacing;
    }
    
    const chars = this.characters.filter(c => !c.isSpace);
    
    if (chars.length <= 1) {
      return spacing;
    }
    
    const widths = chars.map(c => c.width);
    const avgWidth = widths.reduce((sum, w) => sum + w, 0) / widths.length;
    const minWidth = Math.min(...widths);
    const maxWidth = Math.max(...widths);
    const widthRange = maxWidth - minWidth;
    
    if (widthRange < avgWidth * 0.2) {
      for (let i = 0; i < chars.length - 1; i++) {
        spacing.push(this.options.charSpacing);
      }
      return spacing;
    }
    
    for (let i = 0; i < chars.length - 1; i++) {
      const currentChar = chars[i];
      const nextChar = chars[i + 1];
      
      const currentWidthRatio = currentChar.width / avgWidth;
      const nextWidthRatio = nextChar.width / avgWidth;
      
      let baseSpacing = this.options.charSpacing;
      
      if (currentChar.isSymbol || nextChar.isSymbol) {
        baseSpacing *= 0.6;
      } else if (currentWidthRatio < 0.7 && nextWidthRatio < 0.7) {
        baseSpacing *= 1.2;
      } else if (currentWidthRatio > 1.3 && nextWidthRatio > 1.3) {
        baseSpacing *= 0.7;
      } else if (Math.abs(currentWidthRatio - nextWidthRatio) > 0.6) {
        baseSpacing *= 1.05;
      }
      
      const minSpacing = this.options.charSpacing * 0.2;
      const maxSpacing = this.options.charSpacing * 1.5;
      baseSpacing = Math.max(minSpacing, Math.min(maxSpacing, baseSpacing));
      
      spacing.push(baseSpacing);
    }
    
    return spacing;
  }

  /**
   * 计算动态单词间距
   */
  _calculateDynamicWordSpacing() {
    const spacing = [];
    
    if (!this.options.dynamicSpacing) {
      return spacing;
    }
    
    const words = this.words.filter(w => !w.isSpace);
    
    if (words.length <= 1) {
      return spacing;
    }
    
    const widths = words.map(w => w.width);
    const avgWidth = widths.reduce((sum, w) => sum + w, 0) / widths.length;
    const minWidth = Math.min(...widths);
    const maxWidth = Math.max(...widths);
    const widthRange = maxWidth - minWidth;
    
    if (widthRange < avgWidth * 0.3) {
      for (let i = 0; i < words.length - 1; i++) {
        spacing.push(this.options.wordSpacing);
      }
      return spacing;
    }
    
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      
      const currentWidthRatio = currentWord.width / avgWidth;
      const nextWidthRatio = nextWord.width / avgWidth;
      
      let baseSpacing = this.options.wordSpacing;
      
      if (currentWidthRatio < 0.8 && nextWidthRatio < 0.8) {
        baseSpacing *= 1.3;
      } else if (currentWidthRatio > 1.2 && nextWidthRatio > 1.2) {
        baseSpacing *= 0.8;
      } else if (Math.abs(currentWidthRatio - nextWidthRatio) > 0.5) {
        baseSpacing *= 1.1;
      }
      
      const minSpacing = this.options.wordSpacing * 0.5;
      const maxSpacing = this.options.wordSpacing * 1.8;
      baseSpacing = Math.max(minSpacing, Math.min(maxSpacing, baseSpacing));
      
      spacing.push(baseSpacing);
    }
    
    return spacing;
  }

  /**
   * 计算字符位置
   */
  _calculateCharacterPositions() {
    let currentX = 0;
    const lineHeight = this.options.fontSize * this.options.lineHeight;
    const dynamicSpacing = this._calculateDynamicCharSpacing();
    
    for (let i = 0; i < this.characters.length; i++) {
      const char = this.characters[i];
      
      char.x = currentX;
      char.y = 0;
      
      currentX += char.width;
      
      // 添加字符间距（除了最后一个字符）
      if (i < this.characters.length - 1) {
        if (char.isSpace) {
          currentX += this.options.charSpacing * 0.3;
        } else {
          const spacing = dynamicSpacing[i] || this.options.charSpacing;
          currentX += spacing;
        }
      }
    }
    
    this.totalWidth = currentX;
    this.totalHeight = lineHeight;
  }

  /**
   * 计算单词位置
   */
  _calculateWordPositions() {
    let currentX = 0;
    const lineHeight = this.options.fontSize * this.options.lineHeight;
    const dynamicSpacing = this._calculateDynamicWordSpacing();
    
    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];
      
      word.x = currentX;
      word.y = 0;
      
      currentX += word.width;
      
      // 添加单词间距（除了最后一个单词）
      if (i < this.words.length - 1) {
        if (word.isSpace) {
          currentX += this.options.wordSpacing * 0.3;
        } else {
          const spacing = dynamicSpacing[i] || this.options.wordSpacing;
          currentX += spacing;
        }
      }
    }
    
    this.totalWidth = currentX;
    this.totalHeight = lineHeight;
  }

  /**
   * 计算行位置
   */
  _calculateLinePositions() {
    let currentY = 0;
    const lineHeight = this.options.fontSize * this.options.lineHeight;
    let maxWidth = 0;
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      line.x = 0;
      line.y = currentY;
      
      maxWidth = Math.max(maxWidth, line.width);
      currentY += lineHeight;
    }
    
    this.totalWidth = maxWidth;
    this.totalHeight = currentY;
  }

  /**
   * 计算所有尺寸和位置
   */
  _calculateDimensions() {
    this._calculateCharacterPositions();
    this._calculateWordPositions();
    this._calculateLinePositions();
  }

  /**
   * 获取字符数组
   */
  getCharacters() {
    return this.characters;
  }

  /**
   * 获取单词数组
   */
  getWords() {
    return this.words;
  }

  /**
   * 获取行数组
   */
  getLines() {
    return this.lines;
  }

  /**
   * 获取总宽度
   */
  getTotalWidth() {
    return this.totalWidth;
  }

  /**
   * 获取总高度
   */
  getTotalHeight() {
    return this.totalHeight;
  }

  /**
   * 获取指定分割类型的数据
   * @param {string} type - 'letter', 'word', 'line'
   * @returns {Array} 分割后的片段数组
   */
  getTextSegments(type) {
    switch (type) {
      case 'letter':
        return this.characters.map(char => ({
          text: char.text,
          index: char.index,
          width: char.width,
          height: char.height,
          x: char.x,
          y: char.y,
          isSpace: char.isSpace,
          isSymbol: char.isSymbol
        }));
      case 'word':
        return this.words.map(word => ({
          text: word.text,
          index: word.index,
          width: word.width,
          height: word.height,
          x: word.x,
          y: word.y,
          isSpace: word.isSpace
        }));
      case 'line':
        return this.lines.map(line => ({
          text: line.text,
          index: line.index,
          width: line.width,
          height: line.height,
          x: line.x,
          y: line.y
        }));
      default:
        return [];
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    // 清理 Canvas 上下文
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.ctx = null;
      this.canvas = null;
    }
  }
}


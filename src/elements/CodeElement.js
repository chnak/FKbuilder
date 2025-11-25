import { BaseElement } from './BaseElement.js';
import { DEFAULT_TEXT_CONFIG } from '../types/constants.js';
import { deepMerge } from '../utils/helpers.js';
import { toPixels } from '../utils/unit-converter.js';
import {createCanvas} from 'canvas'
import paper from 'paper';
import { getCodeTheme } from '../builder/CodeBlock.js';


/**
 * 简化版语法高亮器（与 CodeBlock 保持一致的高亮规则）
 */
class SyntaxHighlighter {
  constructor(language = 'javascript') {
    this.language = language.toLowerCase();
  }

  getKeywords() {
    const keywordMap = {
      javascript: ['const','let','var','function','async','await','return','if','else','for','while','switch','case','try','catch','finally','throw','new','class','extends','import','export','from','as'],
      python: ['def','class','if','elif','else','for','while','try','except','finally','with','as','import','from','return','yield'],
      java: ['public','private','protected','static','final','class','interface','new','return','if','else','for','while','try','catch','finally']
    };
    return keywordMap[this.language] || keywordMap.javascript;
  }

  isNumber(str) { return /^[\d.]+$/.test(str); }
  isOperator(str) { return /^[+\-*/%=<>!&|^~?:;,.]$/.test(str) || /^(==|!=|===|!==|<=|>=|&&|\|\||>>|<<|\*\*|=>)$/.test(str); }

  tokenize(line) {
    const tokens = [];
    let current = '';
    let inString = false;
    let stringChar = null;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i+1];

      if ((char === '"' || char === "'" || char === '`') && !inString) {
        if (current) { tokens.push({ text: current, type: 'other' }); current = ''; }
        inString = true; stringChar = char; current = char; continue;
      }
      if (inString && char === stringChar) { current += char; tokens.push({ text: current, type: 'string' }); current = ''; inString = false; stringChar = null; continue; }
      if (inString) { current += char; continue; }

      if ((char === '/' && nextChar === '/') || char === '#' || (char === '/' && nextChar === '*')) {
        if (current) { tokens.push({ text: current, type: 'other' }); current = ''; }
        tokens.push({ text: line.slice(i), type: 'comment' }); break;
      }

      if (char === ' ' || this.isOperator(char)) {
        if (current) {
          const trimmed = current.trim();
          if (trimmed) {
            let type = 'identifier';
            const keywords = this.getKeywords();
            if (keywords.includes(trimmed)) type = 'keyword';
            else if (this.isNumber(trimmed)) type = 'number';
            else if (/^[A-Z]/.test(trimmed)) type = 'function';
            tokens.push({ text: trimmed, type });
          }
          current = '';
        }
        if (char === ' ') tokens.push({ text: ' ', type: 'space' }); else tokens.push({ text: char, type: 'operator' });
      } else {
        current += char;
      }
    }
    if (current) {
      const trimmed = current.trim();
      if (trimmed) {
        let type = 'identifier';
        const keywords = this.getKeywords();
        if (keywords.includes(trimmed)) type = 'keyword';
        else if (this.isNumber(trimmed)) type = 'number';
        else if (/^[A-Z]/.test(trimmed)) type = 'function';
        tokens.push({ text: trimmed, type });
      }
    }
    return tokens;
  }

  highlight(code) {
    const lines = (code || '').split('\n');
    return lines.map(line => ({ line, tokens: this.tokenize(line) }));
  }
}

export class CodeElement extends BaseElement {
  constructor(config = {}) {
    const merged = deepMerge({}, DEFAULT_TEXT_CONFIG, config);
    super(merged);
    this.type = 'code';
    this.config = merged;

    this.code = this.config.code || '';
    this.language = this.config.language || 'javascript';
    this.theme = this.config.theme || 'dark';
    this.showLineNumbers = this.config.showLineNumbers !== false;
    this.padding = this.config.padding !== undefined ? this.config.padding : 20;
    this.lineHeight = this.config.lineHeight || 1.6;
    this.fontSize = this.config.fontSize || 20;
    this.showBorder = this.config.showBorder !== false;
    this.borderRadius = this.config.borderRadius || 8;
    this.borderWidth = this.config.borderWidth !== undefined ? this.config.borderWidth : (this.showBorder ? 2 : 0);
    this.bgcolor = this.config.bgcolor || null;
    this.borderColor = this.config.borderColor || null;

    this.split = this.config.split || null;
    this.splitDelay = this.config.splitDelay || 0.1;
    this.splitDuration = this.config.splitDuration || 0.3;
    this.cursor = this.config.cursor !== false;
    this.cursorWidth = this.config.cursorWidth || 2;
    this.cursorColor = this.config.cursorColor || (this.theme === 'dark' ? '#ffffff' : '#000000');
    this.cursorBlinkPeriod = this.config.cursorBlinkPeriod || 0.7;
    this.cursorPaddingLeft = 8;
    // this.cursorOffsetY = this.config.cursorOffsetY;
    this.autoScroll = this.config.autoScroll !== undefined ? this.config.autoScroll : true;

    this.highlighter = new SyntaxHighlighter(this.language);
    this.highlightedLines = this.highlighter.highlight(this.code);
    this.config.scrollPaddingBottom =  this.padding
    
    // 缓存用于宽度测量
    this._widthCache = new Map();
    this._cursorItem = null;
  }

  /**
   * 使用 canvas 测量文本宽度
   */
  measureTextWidth(text, fontSize, fontFamily = 'PatuaOne') {
    const cacheKey = `${text}|${fontSize}|${fontFamily}`;
    if (this._widthCache.has(cacheKey)) {
      return this._widthCache.get(cacheKey);
    }

    const canvas = createCanvas();

    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}`;
    const width = ctx.measureText(text).width;
    
    this._widthCache.set(cacheKey, width);
    return width;
  }

  initialize() {
    return Promise.resolve();
  }

  render(layer, time, paperInstance = null) {
    if (!this.visible) return null;
    const p = paperInstance ? paperInstance.paper : paper;

    if (!this.isActiveAtTime(time)) return null;

    const project = paperInstance ? paperInstance.project : (paper.project || null);
    const viewSize = project && project.view && project.view.viewSize ? project.view.viewSize : { width: 1920, height: 1080 };
    const context = { width: this.canvasWidth || viewSize.width, height: this.canvasHeight || viewSize.height, baseFontSize: 16 };

    const state = this.getStateAtTime(time, context);
    const fontSize = this.convertFontSize(state.fontSize || this.fontSize, context, 20);
    const lineHeightPx = fontSize * this.lineHeight;

    // 几何尺寸
    const size = this.convertSize(
      state.width !== undefined ? state.width : (this.config.width !== undefined ? this.config.width : context.width),
      state.height !== undefined ? state.height : (this.config.height !== undefined ? this.config.height : context.height),
      context
    );
    const elementWidth = size.width;
    const elementHeight = size.height;

    // 背景和边框（优先使用 CodeBlock 主题颜色，允许 state/config 覆盖）
    const themeColors = getCodeTheme(this.theme || 'dark');
    const fillColorFromTheme = themeColors && themeColors.background ? themeColors.background : (this.theme === 'light' ? '#ffffff' : '#071226');
    const strokeColorFromTheme = themeColors && themeColors.border ? themeColors.border : (this.theme === 'light' ? '#e6e6e6' : '#2b2b2b');
    const fillColor = state.bgcolor || this.bgcolor || fillColorFromTheme;
    const strokeColor = state.borderColor || this.borderColor || strokeColorFromTheme;
    const strokeWidth = state.borderWidth || this.borderWidth || 0;

    // 计算元素左上角位置（考虑 anchor）
    const pos = this.calculatePosition(state, context, { elementWidth, elementHeight });

    // 在内容绘制前先绘制背景矩形（支持圆角）
    let bgRect = null;
    if (elementWidth > 0 && elementHeight > 0) {
      const r = Math.min(this.borderRadius || 0, elementWidth / 2, elementHeight / 2);
      if (r > 0) {
        const path = new p.Path();
        path.moveTo(new p.Point(pos.x + r, pos.y));
        path.lineTo(new p.Point(pos.x + elementWidth - r, pos.y));
        path.arcTo(new p.Point(pos.x + elementWidth, pos.y + r));
        path.lineTo(new p.Point(pos.x + elementWidth, pos.y + elementHeight - r));
        path.arcTo(new p.Point(pos.x + elementWidth - r, pos.y + elementHeight));
        path.lineTo(new p.Point(pos.x + r, pos.y + elementHeight));
        path.arcTo(new p.Point(pos.x, pos.y + elementHeight - r));
        path.lineTo(new p.Point(pos.x, pos.y + r));
        path.arcTo(new p.Point(pos.x + r, pos.y));
        path.closePath();
        bgRect = path;
      } else {
        bgRect = new p.Path.Rectangle({ rectangle: new p.Rectangle(pos.x, pos.y, elementWidth, elementHeight) });
      }

      if (bgRect) {
        bgRect.fillColor = fillColor;
        if (strokeWidth > 0 && strokeColor) {
          bgRect.strokeColor = strokeColor;
          bgRect.strokeWidth = strokeWidth;
        }

        // 应用动画/变换
        this.applyTransform(bgRect, state, { pivot: new p.Point(pos.x + elementWidth/2, pos.y + elementHeight/2), paperInstance });
        layer.addChild(bgRect);
        this._callOnRender(time, bgRect, paperInstance);
      }
    }

    // 上对齐：使用固定 padding（顶部缩进）
    const paddingPx = this.padding;
    const paddingBottomPx = paddingPx

    const lineNumberWidth = this.showLineNumbers ? 50 : 0;
    const contentStartX = pos.x + paddingPx + lineNumberWidth + 8;
    const contentStartY = pos.y + paddingPx;

    // token color map from CodeBlock theme
    const tokenColorMap = {
      keyword: themeColors.keyword || '#ff6b9d',
      string: themeColors.string || '#00ff88',
      comment: themeColors.comment || '#888888',
      number: themeColors.number || '#ffd700',
      operator: themeColors.operator || '#ffffff',
      function: themeColors.function || '#00d9ff',
      identifier: themeColors.identifier || '#ffffff',
      other: themeColors.text || '#ffffff',
      space: themeColors.background || fillColorFromTheme,
    };
    const lineNumberColor = themeColors.lineNumber || '#888888';
    const lineNumberBg = themeColors.lineNumberBackground || null;

    let globalCharIndex = 0;
    let globalTokenIndex = 0;

    if (this._cursorItem) {
      try { this._cursorItem.remove(); } catch (e) {}
      this._cursorItem = null;
    }

    let pendingCursorX = null;
    let pendingCursorYTop = null;
    const cursorHeight = fontSize;
    const cursorYOffset =  -(fontSize * 0.3);

    const contentWidth = Math.max(0, elementWidth - paddingPx * 2);
    const contentHeight = Math.max(0, elementHeight - paddingPx - paddingBottomPx);
    const maxVisibleLines = Math.max(1, Math.floor(contentHeight / lineHeightPx));

    let lastPrintedLine = 0;
    if (this.split === 'line') {
      const printed = Math.floor(Math.max(0, time - this.startTime) / this.splitDelay);
      lastPrintedLine = Math.min(this.highlightedLines.length - 1, printed);
    } else if (this.split === 'word') {
      const printed = Math.floor(Math.max(0, time - this.startTime) / this.splitDelay);
      let remaining = printed;
      for (let i = 0; i < this.highlightedLines.length; i++) {
        if (remaining <= 0) break;
        const tokens = this.highlightedLines[i].tokens;
        const count = tokens.reduce((acc, t) => acc + (t.type === 'space' ? 0 : 1), 0);
        remaining -= count;
        if (remaining >= 0) lastPrintedLine = i;
      }
    } else if (this.split === 'letter') {
      const printed = Math.floor(Math.max(0, time - this.startTime) / this.splitDelay);
      let remaining = printed;
      for (let i = 0; i < this.highlightedLines.length; i++) {
        if (remaining <= 0) break;
        const tokens = this.highlightedLines[i].tokens;
        const count = tokens.reduce((acc, t) => acc + t.text.length, 0);
        remaining -= count;
        if (remaining >= 0) lastPrintedLine = i;
      }
    }
    const printedLines = lastPrintedLine + 1;
    const scrollPadBottomPx = this.config.scrollPaddingBottom !== undefined ? this.config.scrollPaddingBottom : paddingBottomPx;
    const scrollViewportHeight = Math.max(0, contentHeight - scrollPadBottomPx);
    const scrollOffsetY = (this.split && this.autoScroll) ? Math.max(0, printedLines * lineHeightPx - scrollViewportHeight) : 0;

    const clipExtraTop = Math.max(2, Math.round(fontSize * 0.3));
    const clipExtraBottom = Math.max(2, Math.round(fontSize * 0.6));
    const clipRect = new p.Path.Rectangle({ rectangle: new p.Rectangle(
      pos.x + paddingPx,
      pos.y + paddingPx - clipExtraTop,
      contentWidth,
      contentHeight + clipExtraTop + clipExtraBottom
    ) });
    const clipGroup = new p.Group();
    clipGroup.addChild(clipRect);
    clipRect.clipMask = true;
    clipGroup.clipped = true;
    layer.addChild(clipGroup);
    const target = clipGroup;

    this.highlightedLines.forEach((lineData, idx) => {
      const centerY = contentStartY + idx * lineHeightPx + (lineHeightPx / 2) - scrollOffsetY;
      const fontFamily = state.fontFamily || 'PatuaOne';
      let currentX = contentStartX;

      if (this.split === 'line') {
        const segStart = this.startTime + idx * this.splitDelay;
        if (time < segStart) return;
        const progress = Math.max(0, Math.min(1, (time - segStart) / this.splitDuration));
        if (this.showLineNumbers) {
          const ln = new p.PointText(new p.Point(pos.x + (lineNumberWidth - 8), centerY));
          ln.content = String(idx + 1);
          ln.fontSize = fontSize;
          ln.fontFamily = fontFamily;
          ln.justification = 'right';
            ln.fillColor = lineNumberColor;
          //ln.opacity = progress;
          target.addChild(ln);
        }
        for (const token of lineData.tokens) {
          if (token.type === 'space') {
            const w = this.measureTextWidth(token.text, fontSize, fontFamily);
            currentX += w;
            continue;
          }
          const pt = new p.PointText(new p.Point(currentX, centerY));
          pt.content = token.text;
          pt.fontSize = fontSize;
          pt.fontFamily = fontFamily;
          pt.justification = 'left';
          pt.fillColor = colorMap[token.type] || '#ffffff';
          //pt.opacity = progress;
          const w = this.measureTextWidth(token.text, fontSize, fontFamily);
          target.addChild(pt);
          currentX += w;
        }
        return;
      }

      if (this.split === 'word') {
        if (this.showLineNumbers) {
          const firstTokenIndex = globalTokenIndex;
          const segStart = this.startTime + firstTokenIndex * this.splitDelay;
          const progress = Math.max(0, Math.min(1, (time - segStart) / this.splitDuration));
          if (time >= segStart) {
            const ln = new p.PointText(new p.Point(pos.x + (lineNumberWidth - 8), centerY));
            ln.content = String(idx + 1);
            ln.fontSize = fontSize;
            ln.fontFamily = fontFamily;
            ln.justification = 'right';
            ln.fillColor = lineNumberColor;
            //ln.opacity = progress;
            target.addChild(ln);
          }
        }
        let lastDrawnX = currentX;
        let anyDrawn = false;
        for (const token of lineData.tokens) {
          if (token.type === 'space') {
            const w = this.measureTextWidth(token.text, fontSize, fontFamily);
            currentX += w;
            continue;
          }
          const segStart = this.startTime + globalTokenIndex * this.splitDelay;
          if (time < segStart) {
            break;
          }
          const progress = Math.max(0, Math.min(1, (time - segStart) / this.splitDuration));
          const pt = new p.PointText(new p.Point(currentX, centerY));
          pt.content = token.text;
          pt.fontSize = fontSize;
          pt.fontFamily = fontFamily;
          pt.justification = 'left';
          pt.fillColor = colorMap[token.type] || '#ffffff';
          //pt.opacity = progress;
          const w = this.measureTextWidth(token.text, fontSize, fontFamily);
          target.addChild(pt);
          currentX += w;
          lastDrawnX = currentX;
          globalTokenIndex += 1;
          anyDrawn = true;
        }
        if (this.cursor && anyDrawn) {
          pendingCursorX = lastDrawnX + this.cursorPaddingLeft;
          pendingCursorYTop = centerY - fontSize / 2 + cursorYOffset;
        }
        return;
      }

      if (this.split === 'letter') {
        if (this.showLineNumbers) {
          const segStart = this.startTime + globalCharIndex * this.splitDelay;
          const progress = Math.max(0, Math.min(1, (time - segStart) / this.splitDuration));
          if (time >= segStart) {
            const ln = new p.PointText(new p.Point(pos.x + (lineNumberWidth - 8), centerY));
            ln.content = String(idx + 1);
            ln.fontSize = fontSize;
            ln.fontFamily = fontFamily;
            ln.justification = 'right';
              ln.fillColor = lineNumberColor;
            //ln.opacity = progress;
            target.addChild(ln);
          }
        }
        let lastDrawnX = currentX;
        let anyDrawn = false;
        let stopProcessing = false;
        for (const token of lineData.tokens) {
          if (token.type === 'space') {
            const segStartSpace = this.startTime + globalCharIndex * this.splitDelay;
            if (time < segStartSpace) { stopProcessing = true; break; }
            const w = this.measureTextWidth(token.text, fontSize, fontFamily);
            currentX += w;
            globalCharIndex += token.text.length;
            continue;
          }
          for (let i = 0; i < token.text.length; i++) {
            const ch = token.text[i];
            const segStart = this.startTime + globalCharIndex * this.splitDelay;
            const wch = this.measureTextWidth(ch, fontSize, fontFamily);
            if (time < segStart) { stopProcessing = true; break; }
            const progress = Math.max(0, Math.min(1, (time - segStart) / this.splitDuration));
            const pt = new p.PointText(new p.Point(currentX, centerY));
            pt.content = ch;
            pt.fontSize = fontSize;
            pt.fontFamily = fontFamily;
            pt.justification = 'left';
            pt.fillColor = colorMap[token.type] || '#ffffff';
            //pt.opacity = progress;
            target.addChild(pt);
            lastDrawnX = currentX + wch;
            anyDrawn = true;
            currentX += wch;
            globalCharIndex += 1;
          }
          if (stopProcessing) break;
        }
        if (this.cursor && anyDrawn) {
          pendingCursorX = lastDrawnX + this.cursorPaddingLeft;
          pendingCursorYTop = centerY - fontSize / 2 + cursorYOffset;
        }
        return;
      }

      if (this.showLineNumbers) {
        const ln = new p.PointText(new p.Point(pos.x + (lineNumberWidth - 8), centerY));
        ln.content = String(idx + 1);
        ln.fontSize = fontSize;
        ln.fontFamily = fontFamily;
        ln.justification = 'right';
        ln.fillColor = lineNumberColor;
        target.addChild(ln);
      }
      for (const token of lineData.tokens) {
        if (token.type === 'space') {
          const w = this.measureTextWidth(token.text, fontSize, fontFamily);
          currentX += w;
          continue;
        }
        const pt = new p.PointText(new p.Point(currentX, centerY));
        pt.content = token.text;
        pt.fontSize = fontSize;
        pt.fontFamily = fontFamily;
        pt.justification = 'left';
        pt.fillColor = colorMap[token.type] || '#ffffff';
        const w = this.measureTextWidth(token.text, fontSize, fontFamily);
        target.addChild(pt);
        currentX += w;
      }
    });

    if (this.cursor && pendingCursorX !== null && pendingCursorYTop !== null) {
      const blink = Math.floor(time / this.cursorBlinkPeriod) % 2 === 0;
      const rect = new p.Path.Rectangle({ rectangle: new p.Rectangle(pendingCursorX, pendingCursorYTop, this.cursorWidth, cursorHeight) });
      rect.fillColor = this.cursorColor;
      rect.opacity = blink ? 1 : 0;
      target.addChild(rect);
      this._cursorItem = rect;
    }

    return null;
  }

  setCode(code, language = null) {
    this.code = code;
    if (language) this.language = language;
    this.highlighter = new SyntaxHighlighter(this.language);
    this.highlightedLines = this.highlighter.highlight(this.code);
  }
}

export default CodeElement;

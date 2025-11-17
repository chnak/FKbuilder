/**
 * SVG 动画解析器
 * 解析 SVG 中的原生动画标签（<animate>, <animateTransform>, <animateMotion>）
 * 并将其转换为可以在 Paper.js 中执行的动画配置
 * 使用 Cheerio 进行 DOM 解析
 */

import * as cheerio from 'cheerio';

/**
 * 解析 SVG 字符串中的动画标签
 * @param {string} svgContent - SVG 内容
 * @returns {Array} 动画配置数组
 */
export function parseSVGAnimations(svgContent) {
  const animations = [];
  
  // 使用 Cheerio 加载 SVG
  const $ = cheerio.load(svgContent, {
    xml: {
      xmlMode: true,
      decodeEntities: false,
    },
  });
  
  // 解析 <animate> 标签
  $('animate').each((index, element) => {
    const $el = $(element);
    const attrs = {};
    
    // 提取所有属性
    Object.keys(element.attribs || {}).forEach(key => {
      attrs[key] = element.attribs[key];
    });
    
    const animation = parseAnimateTag(attrs, $, $el);
    if (animation) {
      animations.push(animation);
    }
  });
  
  // 解析 <animateTransform> 标签
  $('animateTransform').each((index, element) => {
    const $el = $(element);
    const attrs = {};
    
    Object.keys(element.attribs || {}).forEach(key => {
      attrs[key] = element.attribs[key];
    });
    
    const animation = parseAnimateTransformTag(attrs, $, $el);
    if (animation) {
      animations.push(animation);
    }
  });
  
  // 解析 <animateMotion> 标签
  $('animateMotion').each((index, element) => {
    const $el = $(element);
    const attrs = {};
    
    Object.keys(element.attribs || {}).forEach(key => {
      attrs[key] = element.attribs[key];
    });
    
    const animation = parseAnimateMotionTag(attrs, $, $el);
    if (animation) {
      animations.push(animation);
    }
  });
  
  return animations;
}

/**
 * 解析 <animate> 标签
 * @param {Object} attrs - 属性对象
 * @param {cheerio.CheerioAPI} $ - Cheerio 实例
 * @param {cheerio.Cheerio} $el - 动画元素
 * @returns {Object|null} 动画配置
 */
function parseAnimateTag(attrs, $, $el) {
  const attributeName = attrs.attributeName;
  if (!attributeName) return null;
  
  // 查找父元素
  const parentElement = findParentElement($, $el);
  if (!parentElement) return null;
  
  const begin = parseTime(attrs.begin || '0s');
  const dur = parseTime(attrs.dur || '1s');
  const repeatCount = attrs.repeatCount === 'indefinite' ? Infinity : parseInt(attrs.repeatCount || '1');
  const values = attrs.values ? attrs.values.split(';') : null;
  const from = attrs.from;
  const to = attrs.to;
  const keyTimes = attrs.keyTimes ? attrs.keyTimes.split(';').map(parseFloat) : null;
  
  const animation = {
    selector: parentElement.selector,
    id: parentElement.id,
    tagName: parentElement.tagName,
    attributeName,
    begin,
    duration: dur,
    repeatCount,
    values,
    from,
    to,
    keyTimes,
    type: 'animate',
  };
  
  return animation;
}

/**
 * 解析 <animateTransform> 标签
 * @param {Object} attrs - 属性对象
 * @param {cheerio.CheerioAPI} $ - Cheerio 实例
 * @param {cheerio.Cheerio} $el - 动画元素
 * @returns {Object|null} 动画配置
 */
function parseAnimateTransformTag(attrs, $, $el) {
  const type = attrs.type || 'translate';
  const parentElement = findParentElement($, $el);
  if (!parentElement) return null;
  
  const begin = parseTime(attrs.begin || '0s');
  const dur = parseTime(attrs.dur || '1s');
  const repeatCount = attrs.repeatCount === 'indefinite' ? Infinity : parseInt(attrs.repeatCount || '1');
  const values = attrs.values ? attrs.values.split(';') : null;
  const from = attrs.from;
  const to = attrs.to;
  const keyTimes = attrs.keyTimes ? attrs.keyTimes.split(';').map(parseFloat) : null;
  
  const animation = {
    selector: parentElement.selector,
    id: parentElement.id,
    tagName: parentElement.tagName,
    type: 'animateTransform',
    transformType: type,
    begin,
    duration: dur,
    repeatCount,
    values,
    from,
    to,
    keyTimes,
  };
  
  return animation;
}

/**
 * 解析 <animateMotion> 标签
 * @param {Object} attrs - 属性对象
 * @param {cheerio.CheerioAPI} $ - Cheerio 实例
 * @param {cheerio.Cheerio} $el - 动画元素
 * @returns {Object|null} 动画配置
 */
function parseAnimateMotionTag(attrs, $, $el) {
  const parentElement = findParentElement($, $el);
  if (!parentElement) return null;
  
  const begin = parseTime(attrs.begin || '0s');
  const dur = parseTime(attrs.dur || '1s');
  const repeatCount = attrs.repeatCount === 'indefinite' ? Infinity : parseInt(attrs.repeatCount || '1');
  const path = attrs.path;
  const keyPoints = attrs.keyPoints ? attrs.keyPoints.split(';').map(parseFloat) : null;
  const keyTimes = attrs.keyTimes ? attrs.keyTimes.split(';').map(parseFloat) : null;
  
  const animation = {
    selector: parentElement.selector,
    id: parentElement.id,
    tagName: parentElement.tagName,
    type: 'animateMotion',
    begin,
    duration: dur,
    repeatCount,
    path,
    keyPoints,
    keyTimes,
  };
  
  return animation;
}

/**
 * 查找动画标签的父元素
 * @param {cheerio.CheerioAPI} $ - Cheerio 实例
 * @param {cheerio.Cheerio} $el - 动画元素
 * @returns {Object|null} 父元素信息 { selector, id, tagName }
 */
function findParentElement($, $el) {
  // 获取父元素
  const parent = $el.parent();
  
  if (parent.length === 0 || parent[0].type === 'root') {
    return null;
  }
  
  const parentNode = parent[0];
  const tagName = parentNode.tagName || parentNode.name;
  
  if (!tagName) {
    return null;
  }
  
  // 提取 id 属性
  const id = parentNode.attribs?.id || null;
  
  // 生成选择器（优先使用 id，如果没有 id 则使用标签名）
  let selector = tagName;
  if (id) {
    selector = `#${id}`;
  }
  
  return { selector, id, tagName };
}

/**
 * 解析时间字符串（如 "0s", "1.5s", "500ms"）
 * @param {string} timeStr - 时间字符串
 * @returns {number} 时间（秒）
 */
function parseTime(timeStr) {
  if (!timeStr) return 0;
  
  const match = timeStr.match(/^([\d.]+)(s|ms)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 's';
  
  return unit === 'ms' ? value / 1000 : value;
}

/**
 * 将 SVG 动画配置转换为 Paper.js 可执行的动画函数
 * @param {Object} animation - SVG 动画配置
 * @returns {Function} 动画函数 (relativeTime, element, svgElement, context) => ({ ... })
 */
export function convertSVGAnimationToFunction(animation) {
  return (relativeTime, element, svgElement, context) => {
    const { absoluteTime, startTime, duration } = context;
    
    // 计算动画的绝对开始时间
    const animationStartTime = startTime + animation.begin;
    const animationDuration = animation.duration;
    
    // 计算相对于动画开始的时间
    let animRelativeTime = absoluteTime - animationStartTime;
    
    // 调试：输出时间计算（已禁用）
    // if (animation.selector === '#BirdFlapClosed_2_18' && absoluteTime <= 2) {
    //   const beforeMod = animRelativeTime;
    //   let afterMod = animRelativeTime;
    //   if (animation.repeatCount === Infinity) {
    //     afterMod = animRelativeTime % animationDuration;
    //   }
    //   const progress = afterMod / animationDuration;
    //   if (Math.abs(absoluteTime % 0.1) < 0.01 || progress >= 0.9) {
    //     console.log(`[动画函数] absoluteTime=${absoluteTime.toFixed(3)}, animRelativeTime=${beforeMod.toFixed(3)}, afterMod=${afterMod.toFixed(3)}, progress=${progress.toFixed(6)}`);
    //   }
    // }
    
    // 如果动画还没开始，返回空属性
    if (animRelativeTime < 0) {
      return {};
    }
    
    // 处理重复
    if (animation.repeatCount === Infinity) {
      // 无限重复：取模
      animRelativeTime = animRelativeTime % animationDuration;
      // 确保在 [0, duration) 范围内
      if (animRelativeTime < 0) {
        animRelativeTime = 0;
      }
    } else {
      const totalDuration = animationDuration * animation.repeatCount;
      if (animRelativeTime > totalDuration) {
        // 动画已结束，使用最后一个值
        animRelativeTime = animationDuration;
      } else {
        // 在重复周期内，取模
        animRelativeTime = animRelativeTime % animationDuration;
      }
    }
    
    // 计算进度（0-1）
    let progress = animRelativeTime / animationDuration;
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    // 注意：progress 可以等于 1，这样能正确处理最后一个 keyTime
    
    // 根据动画类型生成属性
    const props = {};
    
    if (animation.type === 'animate') {
      // 处理不同的 attributeName
      if (animation.attributeName === 'display') {
        // display 动画：根据 values 或 from/to 设置 visibility
        // 使用 keyTimes 来精确控制显示/隐藏时机
        if (animation.values && animation.keyTimes) {
          // 根据 keyTimes 和 values 计算当前值
          // keyTimes 和 values 的数量应该相同
          let currentValue = animation.values[0];
          
          // 找到 progress 所在的 keyTimes 区间
          // SVG 规范：keyTimes[i] 对应 values[i]
          // 当 progress 在 [keyTimes[i], keyTimes[i+1]) 时，使用 values[i]
          // 当 progress 等于 keyTimes[i+1] 时，使用 values[i+1]
          let found = false;
          for (let i = 0; i < animation.keyTimes.length - 1; i++) {
            const currentKeyTime = animation.keyTimes[i];
            const nextKeyTime = animation.keyTimes[i + 1];
            
            // 如果 progress 正好等于下一个 keyTime，使用下一个 value
            if (Math.abs(progress - nextKeyTime) < 0.000001) {
              currentValue = animation.values[i + 1];
              found = true;
              break;
            }
            // 如果 progress 在当前区间内 [currentKeyTime, nextKeyTime)
            // 注意：当 progress 等于 currentKeyTime 时，也应该使用 values[i]
            if (progress >= currentKeyTime && progress < nextKeyTime) {
              currentValue = animation.values[i];
              found = true;
              break;
            }
          }
          // 如果没找到，说明 progress 在最后一个区间或等于最后一个 keyTime
          if (!found) {
            const lastIndex = animation.keyTimes.length - 1;
            if (progress >= animation.keyTimes[lastIndex]) {
              currentValue = animation.values[lastIndex];
            } else {
              // 这种情况不应该发生，但为了安全，使用第一个值
              currentValue = animation.values[0];
            }
          }
          
          props.opacity = currentValue === 'none' ? 0 : 1;
          
          // 调试：输出 keyTimes 匹配结果（已禁用）
          // if (animation.selector === '#BirdFlapClosed_2_18' && absoluteTime <= 2) {
          //   if (Math.abs(absoluteTime % 0.1) < 0.01 || progress >= 0.9) {
          //     console.log(`[keyTimes匹配] progress=${progress.toFixed(6)}, currentValue=${currentValue}, opacity=${currentValue === 'none' ? 0 : 1}`);
          //   }
          // }
        } else if (animation.values) {
          // 没有 keyTimes，均匀分布
          const valueIndex = Math.min(
            Math.floor(progress * animation.values.length),
            animation.values.length - 1
          );
          const value = animation.values[valueIndex];
          props.opacity = value === 'none' ? 0 : 1;
        } else if (animation.from && animation.to) {
          const fromValue = animation.from === 'none' ? 0 : 1;
          const toValue = animation.to === 'none' ? 0 : 1;
          props.opacity = fromValue + (toValue - fromValue) * progress;
        }
      } else if (animation.attributeName === 'opacity') {
        if (animation.values) {
          const valueIndex = Math.floor(progress * (animation.values.length - 1));
          props.opacity = parseFloat(animation.values[valueIndex] || animation.values[animation.values.length - 1]);
        } else if (animation.from !== undefined && animation.to !== undefined) {
          props.opacity = parseFloat(animation.from) + (parseFloat(animation.to) - parseFloat(animation.from)) * progress;
        }
      } else if (animation.attributeName === 'fill' || animation.attributeName === 'stroke') {
        // 颜色动画：简化处理，只支持 from 到 to
        if (animation.from && animation.to) {
          // 颜色插值比较复杂，这里简化处理
          props[animation.attributeName] = progress < 0.5 ? animation.from : animation.to;
        }
      }
    } else if (animation.type === 'animateTransform') {
      // 处理变换动画
      if (animation.transformType === 'rotate') {
        if (animation.values) {
          const valueIndex = Math.floor(progress * (animation.values.length - 1));
          const value = animation.values[valueIndex] || animation.values[animation.values.length - 1];
          // 解析 rotate(angle [x y])
          const rotateMatch = value.match(/rotate\(([^)]+)\)/);
          if (rotateMatch) {
            const parts = rotateMatch[1].split(/\s+/);
            props.rotation = parseFloat(parts[0]);
          }
        } else if (animation.from && animation.to) {
          const fromMatch = animation.from.match(/rotate\(([^)]+)\)/);
          const toMatch = animation.to.match(/rotate\(([^)]+)\)/);
          if (fromMatch && toMatch) {
            const fromAngle = parseFloat(fromMatch[1].split(/\s+/)[0]);
            const toAngle = parseFloat(toMatch[1].split(/\s+/)[0]);
            props.rotation = fromAngle + (toAngle - fromAngle) * progress;
          }
        }
      } else if (animation.transformType === 'scale') {
        if (animation.values) {
          const valueIndex = Math.floor(progress * (animation.values.length - 1));
          const value = animation.values[valueIndex] || animation.values[animation.values.length - 1];
          const scaleMatch = value.match(/scale\(([^)]+)\)/);
          if (scaleMatch) {
            const parts = scaleMatch[1].split(/\s+/);
            props.scaleX = parseFloat(parts[0]);
            props.scaleY = parts[1] ? parseFloat(parts[1]) : props.scaleX;
          }
        } else if (animation.from && animation.to) {
          const fromMatch = animation.from.match(/scale\(([^)]+)\)/);
          const toMatch = animation.to.match(/scale\(([^)]+)\)/);
          if (fromMatch && toMatch) {
            const fromParts = fromMatch[1].split(/\s+/);
            const toParts = toMatch[1].split(/\s+/);
            const fromX = parseFloat(fromParts[0]);
            const fromY = fromParts[1] ? parseFloat(fromParts[1]) : fromX;
            const toX = parseFloat(toParts[0]);
            const toY = toParts[1] ? parseFloat(toParts[1]) : toX;
            props.scaleX = fromX + (toX - fromX) * progress;
            props.scaleY = fromY + (toY - fromY) * progress;
          }
        }
      } else if (animation.transformType === 'translate') {
        if (animation.values) {
          const valueIndex = Math.floor(progress * (animation.values.length - 1));
          const value = animation.values[valueIndex] || animation.values[animation.values.length - 1];
          const translateMatch = value.match(/translate\(([^)]+)\)/);
          if (translateMatch) {
            const parts = translateMatch[1].split(/\s+/);
            props.x = parseFloat(parts[0]);
            props.y = parts[1] ? parseFloat(parts[1]) : 0;
          }
        } else if (animation.from && animation.to) {
          const fromMatch = animation.from.match(/translate\(([^)]+)\)/);
          const toMatch = animation.to.match(/translate\(([^)]+)\)/);
          if (fromMatch && toMatch) {
            const fromParts = fromMatch[1].split(/\s+/);
            const toParts = toMatch[1].split(/\s+/);
            const fromX = parseFloat(fromParts[0]);
            const fromY = fromParts[1] ? parseFloat(fromParts[1]) : 0;
            const toX = parseFloat(toParts[0]);
            const toY = toParts[1] ? parseFloat(toParts[1]) : 0;
            props.x = fromX + (toX - fromX) * progress;
            props.y = fromY + (toY - fromY) * progress;
          }
        }
      }
    } else if (animation.type === 'animateMotion') {
      // 路径动画：简化处理，只支持简单的路径
      if (animation.path) {
        // 解析路径并计算当前位置
        // 这里简化处理，实际应该解析 SVG path 并计算位置
        // TODO: 实现路径动画
      }
    }
    
    return props;
  };
}

/**
 * Worker 线程：渲染视频段
 * 每个 Worker 负责渲染视频的一个时间段
 */
import { parentPort, workerData } from 'worker_threads';
import { Renderer } from '../Renderer.js';
import { VideoMaker } from '../VideoMaker.js';
import { ElementLayer } from '../../layers/ElementLayer.js';
import { BackgroundLayer } from '../../layers/BackgroundLayer.js';
import { registerFontFile } from '../../utils/font-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renderSegment() {
  const {
    segmentIndex,
    startFrame,
    endFrame,
    startTime,
    fps,
    width,
    height,
    backgroundColor,
    compositionData,
    transitionRanges = [], // 转场范围，Worker 需要跳过这些帧
    fontInfo = [], // 字体信息，用于在 Worker 中注册字体
  } = workerData;

  try {
    // 在 Worker 中注册字体（必须在创建 Renderer 之前）
    if (fontInfo && fontInfo.length > 0) {
      for (const font of fontInfo) {
        try {
          registerFontFile(font.path, font.fontFamily, font.options || {});
        } catch (e) {
          console.warn(`[Worker ${segmentIndex}] 字体注册失败 ${font.fontFamily}:`, e.message);
        }
      }
    }
    
    // 创建独立的 Renderer 实例（每个 Worker 有自己的 Paper.js Project）
    const renderer = new Renderer({
      width,
      height,
      fps,
    });
    await renderer.init();

    // 重建 composition 对象（从序列化的数据）
    const composition = new VideoMaker(compositionData.config);
    
    // 重建函数（从字符串）
    const deserializeFunctions = (obj) => {
      if (obj === null || obj === undefined) {
        return obj;
      }
      
      if (typeof obj === 'object' && obj.__isFunction && obj.__functionCode) {
        // 重建函数
        try {
          const funcCode = obj.__functionCode;
          let func;
          
          // 如果有上下文，需要将上下文注入到函数作用域中
          if (obj.__context) {
            // 重建上下文对象
            const context = deserializeFunctions(obj.__context);
            
            // 创建一个包装函数，将上下文注入到作用域中
            // 使用 Function 构造函数创建函数，将 context 的键作为参数
            const contextKeys = Object.keys(context);
            const contextValues = contextKeys.map(key => context[key]);
            
            // 将上下文变量作为参数传递给函数
            // 例如：function(element, progress, time) { ... } 
            // 变成：function(element, progress, time, ...contextKeys) { ... }
            // 但这样会改变函数签名，不推荐
            
            // 更好的方法：创建一个包装函数，在函数内部注入上下文变量
            // 使用 with 语句（不推荐，已废弃）或直接修改函数体
            
            // 解析函数代码，提取函数参数和函数体
            // funcCode 可能是：function(element, progress, time) { ... } 或 (element, progress, time) => { ... }
            let funcParams = '';
            let funcBody = '';
            
            // 尝试匹配函数声明或函数表达式
            const funcDeclMatch = funcCode.match(/^\s*function\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/);
            const arrowMatch = funcCode.match(/^\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*)\}\s*$/);
            const arrowSingleMatch = funcCode.match(/^\s*\(([^)]*)\)\s*=>\s*([^{][\s\S]*)$/);
            
            if (funcDeclMatch) {
              funcParams = funcDeclMatch[1].trim();
              funcBody = funcDeclMatch[2];
            } else if (arrowMatch) {
              funcParams = arrowMatch[1].trim();
              funcBody = arrowMatch[2];
            } else if (arrowSingleMatch) {
              funcParams = arrowSingleMatch[1].trim();
              funcBody = `return ${arrowSingleMatch[2].trim()};`;
            } else {
              // 如果无法解析，尝试直接执行（可能已经是完整的函数表达式）
              funcParams = 'element, progress, time';
              funcBody = funcCode;
            }
            
            // 创建上下文变量的声明语句
            const contextVars = contextKeys.map(key => {
              const value = context[key];
              // 处理不同类型的值
              if (typeof value === 'string') {
                return `const ${key} = ${JSON.stringify(value)};`;
              } else if (typeof value === 'number' || typeof value === 'boolean') {
                return `const ${key} = ${value};`;
              } else if (value === null) {
                return `const ${key} = null;`;
              } else if (Array.isArray(value)) {
                return `const ${key} = ${JSON.stringify(value)};`;
              } else if (typeof value === 'object') {
                return `const ${key} = ${JSON.stringify(value)};`;
              } else {
                return `const ${key} = undefined;`;
              }
            }).join('\n    ');
            
            // 创建包装函数，将上下文变量注入到函数作用域
            const wrappedCode = `
              (function() {
                ${contextVars}
                return function(${funcParams}) {
                  ${funcBody}
                };
              })()
            `;
            
            func = eval(wrappedCode);
            func.__context = context;
          } else {
            // 没有上下文，直接重建函数
            func = eval(`(${funcCode})`);
          }
          
          return func;
        } catch (e) {
          console.warn(`[Worker ${segmentIndex}] 无法重建函数:`, e.message);
          return undefined;
        }
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => deserializeFunctions(item));
      }
      
      if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            result[key] = deserializeFunctions(obj[key]);
          }
        }
        return result;
      }
      
      return obj;
    };
    
    // 重建图层和元素
    if (compositionData.layers) {
      for (let layerIdx = 0; layerIdx < compositionData.layers.length; layerIdx++) {
        const layerData = compositionData.layers[layerIdx];
        
        // 根据图层类型重建图层
        let layer;
        if (layerData.config.type === 'background') {
          layer = new BackgroundLayer(layerData.config);
        } else {
          layer = new ElementLayer(layerData.config);
        }
        
        // 重建元素
        if (layerData.elements) {
          for (let elemIdx = 0; elemIdx < layerData.elements.length; elemIdx++) {
            const elementData = layerData.elements[elemIdx];
            try {
              // 动态导入元素类
              const elementTypeMap = {
                'text': 'Text',
                'image': 'Image',
                'video': 'Video',
                'rect': 'Rect',
                'circle': 'Circle',
                'path': 'Path',
                'svg': 'SVG',
                'json': 'JSON',
                'sprite': 'Sprite',
                'audio': 'Audio',
                'oscilloscope': 'Oscilloscope',
                'subtitle': 'Subtitle',
              };
              
              const className = elementTypeMap[elementData.type] || 
                elementData.type.charAt(0).toUpperCase() + elementData.type.slice(1);
              const elementModule = await import(`../../elements/${className}Element.js`);
              const ElementClass = elementModule[`${className}Element`];
              
              if (ElementClass) {
                // 反序列化 config（重建函数）
                const deserializedConfig = deserializeFunctions(elementData.config || {});
                
                const element = new ElementClass(deserializedConfig);
                
                // 恢复回调函数（onFrame、onRender、onLoaded）
                if (elementData.callbacks) {
                  if (elementData.callbacks.onFrame) {
                    element.onFrame = deserializeFunctions(elementData.callbacks.onFrame);
                  }
                  if (elementData.callbacks.onRender) {
                    element.onRender = deserializeFunctions(elementData.callbacks.onRender);
                  }
                  if (elementData.callbacks.onLoaded) {
                    element.onLoaded = deserializeFunctions(elementData.callbacks.onLoaded);
                  }
                }
                
                // 恢复元素的时间属性（这些不在 config 中，但在 Track.build 时设置）
                if (elementData.startTime !== undefined) {
                  element.startTime = elementData.startTime;
                }
                if (elementData.endTime !== undefined) {
                  element.endTime = elementData.endTime;
                } else if (elementData.endTime === undefined && elementData.startTime !== undefined && elementData.duration !== undefined) {
                  // 如果没有 endTime 但有 startTime 和 duration，计算 endTime
                  element.endTime = elementData.startTime + elementData.duration;
                }
                if (elementData.duration !== undefined) {
                  element.duration = elementData.duration;
                }
                
                // 恢复其他重要属性
                if (elementData.visible !== undefined) {
                  element.visible = elementData.visible;
                }
                if (elementData.zIndex !== undefined) {
                  element.zIndex = elementData.zIndex;
                }
                
                // 如果是分割文本，恢复特殊属性并重新初始化分割器
                if (element.type === 'text') {
                  if (elementData.originalAnimations !== undefined) {
                    element.originalAnimations = elementData.originalAnimations;
                  }
                  if (elementData.split !== undefined) {
                    element.split = elementData.split;
                  }
                  if (elementData.splitDelay !== undefined) {
                    element.splitDelay = elementData.splitDelay;
                  }
                  if (elementData.splitDuration !== undefined) {
                    element.splitDuration = elementData.splitDuration;
                  }
                  
                  // 如果启用了分割，重新初始化分割器（这会重新创建 segments 并应用动画）
                  if (element.split && element._initializeSplitter && typeof element._initializeSplitter === 'function') {
                    try {
                      // 确保在重新初始化之前，startTime 和 endTime 已经恢复
                      // 因为 _initializeSplitter 会使用这些值来计算子片段的时间
                      element._initializeSplitter();
                    } catch (e) {
                      console.warn(`[Worker ${segmentIndex}] 文本元素分割器初始化失败:`, e.message);
                    }
                  }
                  
                  // 恢复子片段的时间和其他属性（在重新初始化后）
                  if (elementData.segments && Array.isArray(elementData.segments) && element.segments && Array.isArray(element.segments)) {
                    for (let segIdx = 0; segIdx < Math.min(elementData.segments.length, element.segments.length); segIdx++) {
                      const segmentData = elementData.segments[segIdx];
                      const segment = element.segments[segIdx];
                      
                      // 恢复时间属性
                      if (segmentData.startTime !== undefined) {
                        segment.startTime = segmentData.startTime;
                      }
                      if (segmentData.endTime !== undefined) {
                        segment.endTime = segmentData.endTime;
                      } else if (segmentData.endTime === undefined && segmentData.startTime !== undefined && segmentData.duration !== undefined) {
                        // 如果没有 endTime 但有 startTime 和 duration，计算 endTime
                        segment.endTime = segmentData.startTime + segmentData.duration;
                      }
                      if (segmentData.duration !== undefined) {
                        segment.duration = segmentData.duration;
                      }
                      if (segmentData.visible !== undefined) {
                        segment.visible = segmentData.visible;
                      }
                      
                      // 如果子片段有自定义动画配置，恢复它们
                      // 注意：如果重新初始化分割器时已经创建了动画，这里会保留重新创建的动画
                      // 但如果序列化时有特定的动画配置，我们可以选择恢复它们
                      // 由于 _initializeSplitter 会根据 originalAnimations 重新创建动画，
                      // 所以通常不需要单独恢复子片段的动画，除非有特殊情况
                      // 但为了完整性，我们仍然保留这个逻辑
                      if (segmentData.animations && Array.isArray(segmentData.animations) && segmentData.animations.length > 0) {
                        // 如果子片段没有动画，或者需要覆盖，可以在这里恢复
                        // 但通常 _initializeSplitter 已经处理了动画创建
                        // 所以这里主要是为了确保动画配置的一致性
                        // 暂时不覆盖，因为 _initializeSplitter 已经根据 originalAnimations 创建了动画
                      }
                    }
                  }
                } else {
                  // 非文本元素，只恢复子片段的时间（如果有）
                  if (elementData.segments && Array.isArray(elementData.segments) && element.segments && Array.isArray(element.segments)) {
                    for (let segIdx = 0; segIdx < Math.min(elementData.segments.length, element.segments.length); segIdx++) {
                      const segmentData = elementData.segments[segIdx];
                      const segment = element.segments[segIdx];
                      if (segmentData.startTime !== undefined) {
                        segment.startTime = segmentData.startTime;
                      }
                      if (segmentData.endTime !== undefined) {
                        segment.endTime = segmentData.endTime;
                      } else if (segmentData.endTime === undefined && segmentData.startTime !== undefined && segmentData.duration !== undefined) {
                        // 如果没有 endTime 但有 startTime 和 duration，计算 endTime
                        segment.endTime = segmentData.startTime + segmentData.duration;
                      }
                      if (segmentData.duration !== undefined) {
                        segment.duration = segmentData.duration;
                      }
                      if (segmentData.visible !== undefined) {
                        segment.visible = segmentData.visible;
                      }
                    }
                  }
                }
                
                // 设置元素的 canvas 尺寸
                element.canvasWidth = width;
                element.canvasHeight = height;
                
                // 如果是分割文本，也需要设置子元素的 canvas 尺寸
                if (element.type === 'text' && element.segments && element.segments.length > 0) {
                  for (const segment of element.segments) {
                    segment.canvasWidth = width;
                    segment.canvasHeight = height;
                  }
                }
                
                // 初始化元素（如果需要异步加载资源）
                if (element.initialize && typeof element.initialize === 'function') {
                  try {
                    // 添加超时机制，避免资源加载卡住
                    const initPromise = element.initialize();
                    const timeoutPromise = new Promise((_, reject) => {
                      setTimeout(() => reject(new Error('初始化超时（30秒）')), 30000);
                    });
                    await Promise.race([initPromise, timeoutPromise]);
                  } catch (initError) {
                    console.warn(`[Worker ${segmentIndex}] 元素 ${elementData.type} 初始化失败或超时:`, initError.message);
                  }
                }
                
                layer.addElement(element);
              }
            } catch (importError) {
              console.warn(`[Worker ${segmentIndex}] 无法导入元素类型 ${elementData.type}:`, importError.message);
            }
          }
        }
        
        composition.addLayer(layer);
      }
    }

    // 注意：转场在 Worker 中不支持（GL 模块无法在 Worker 中加载）
    // 转场帧应该在主线程预处理，然后传递给 Worker

    const frames = [];
    const totalFrames = endFrame - startFrame;
    const progressInterval = Math.max(1, Math.floor(totalFrames / 10));

    // 检查帧是否在转场范围内
    const isFrameInTransition = (frame) => {
      return transitionRanges.some(range => 
        frame >= range.startFrame && frame < range.endFrame
      );
    };

    // 渲染该段的所有帧
    for (let frame = startFrame; frame < endFrame; frame++) {
      try {
        // 跳过转场帧（转场帧在主线程预处理）
        if (isFrameInTransition(frame)) {
          continue;
        }
        
        const time = startTime + (frame - startFrame) / fps;
        const localFrameIndex = frame - startFrame;

        // 正常渲染帧（支持 onFrame、onRender 回调）
        await renderer.renderFrame(composition.timeline.getLayers(), time, backgroundColor);
        const buffer = renderer.getCanvasBuffer();

        if (!buffer) {
          console.warn(`[Worker ${segmentIndex}] 帧 ${frame} 渲染失败：buffer 为空`);
          continue;
        }

        frames.push({
          frameIndex: frame,
          buffer: buffer,
        });

        // 发送进度到主进程
        if (localFrameIndex % progressInterval === 0 || localFrameIndex === totalFrames - 1) {
          const progress = ((localFrameIndex + 1) / totalFrames * 100).toFixed(1);
          parentPort.postMessage({
            type: 'progress',
            segmentIndex,
            progress: parseFloat(progress),
            currentFrame: localFrameIndex + 1,
            totalFrames: totalFrames,
            frameIndex: frame,
          });
        }
      } catch (renderError) {
        console.error(`[Worker ${segmentIndex}] 帧 ${frame} 渲染失败:`, renderError.message);
        throw renderError;
      }
    }

    // 清理
    renderer.destroy();

    // 发送结果
    parentPort.postMessage({
      success: true,
      segmentIndex,
      frames,
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      segmentIndex,
      error: error.message,
      stack: error.stack,
    });
  }
}

renderSegment();


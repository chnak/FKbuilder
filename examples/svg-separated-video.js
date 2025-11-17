import { VideoBuilder, RectElement, TextElement } from '../src/index.js';
import { SVGElement } from '../src/elements/SVGElement.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 解析 SVG 文件，提取所有独立的图形元素
 */
function parseSVGElements(svgContent) {
  const elements = [];
  
  // 使用正则表达式提取所有 <g> 组元素
  const groupRegex = /<g[^>]*id="g(\d+)"[^>]*>([\s\S]*?)<\/g>/g;
  let groupMatch;
  const groups = [];
  
  while ((groupMatch = groupRegex.exec(svgContent)) !== null) {
    const groupId = groupMatch[1];
    const groupContent = groupMatch[0];
    const fullId = `g${groupId}`;
    
    // 检查这个组是否包含路径或其他图形元素
    const hasPath = /<path[^>]*>/i.test(groupContent);
    const hasCircle = /<circle[^>]*>/i.test(groupContent);
    const hasRect = /<rect[^>]*>/i.test(groupContent);
    const hasEllipse = /<ellipse[^>]*>/i.test(groupContent);
    const hasPolygon = /<polygon[^>]*>/i.test(groupContent);
    const hasPolyline = /<polyline[^>]*>/i.test(groupContent);
    
    if (hasPath || hasCircle || hasRect || hasEllipse || hasPolygon || hasPolyline) {
      // 提取 transform 属性
      const transformMatch = groupContent.match(/transform="([^"]+)"/);
      const transform = transformMatch ? transformMatch[1] : '';
      
      groups.push({
        id: fullId,
        groupId: parseInt(groupId),
        content: groupContent,
        transform: transform,
        hasGraphics: true,
      });
    }
  }
  
  // 也提取独立的 <path> 元素（不在组内的）
  const pathRegex = /<path[^>]*id="path(\d+)"[^>]*\/>/g;
  let pathMatch;
  const paths = [];
  
  while ((pathMatch = pathRegex.exec(svgContent)) !== null) {
    const pathId = pathMatch[1];
    const pathContent = pathMatch[0];
    const fullId = `path${pathId}`;
    
    // 检查这个路径是否已经在某个组中
    const isInGroup = groups.some(g => g.content.includes(pathContent));
    
    if (!isInGroup) {
      paths.push({
        id: fullId,
        pathId: parseInt(pathId),
        content: pathContent,
        hasGraphics: true,
      });
    }
  }
  
  // 合并并排序所有元素
  const allElements = [...groups, ...paths].sort((a, b) => {
    const aId = a.groupId !== undefined ? a.groupId : a.pathId;
    const bId = b.groupId !== undefined ? b.groupId : b.pathId;
    return aId - bId;
  });
  
  return allElements;
}

/**
 * 创建包含单个 SVG 元素的完整 SVG 字符串
 * 简化版本：只保留必要的元素，移除可能导致 Paper.js 解析失败的部分
 */
function createSingleElementSVG(element, originalSVG) {
  // 提取原始 SVG 的 viewBox
  const viewBoxMatch = originalSVG.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 666.66669 666.66669';
  
  // 提取根 transform（查找 id="g10" 的组）
  let rootTransform = 'matrix(1.3333333,0,0,-1.3333333,0,666.66667)'; // 默认值
  const rootGroupMatch = originalSVG.match(/<g[^>]*id="g10"[^>]*>/);
  if (rootGroupMatch) {
    const transformMatch = rootGroupMatch[0].match(/transform="([^"]+)"/);
    if (transformMatch) {
      rootTransform = transformMatch[1];
    }
  }
  
  // 提取元素的实际内容（不包含外层的 <g> 标签）
  let elementContent = element.content;
  
  // 如果元素内容是一个完整的 <g> 标签，提取其内部内容
  if (elementContent.trim().startsWith('<g')) {
    // 找到第一个 <g> 标签的结束位置
    const openTagEnd = elementContent.indexOf('>');
    if (openTagEnd !== -1) {
      // 找到对应的 </g> 标签
      let depth = 1;
      let pos = openTagEnd + 1;
      let closePos = -1;
      
      while (pos < elementContent.length && depth > 0) {
        const nextOpen = elementContent.indexOf('<g', pos);
        const nextClose = elementContent.indexOf('</g>', pos);
        
        if (nextClose === -1) break;
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos = nextOpen + 2;
        } else {
          depth--;
          if (depth === 0) {
            closePos = nextClose;
            break;
          }
          pos = nextClose + 4;
        }
      }
      
      if (closePos !== -1) {
        // 提取 <g> 标签内部的内容
        elementContent = elementContent.substring(openTagEnd + 1, closePos).trim();
      }
    }
  }
  
  // 清理元素内容：移除 clip-path 引用（可能导致 Paper.js 解析失败）
  let cleanedContent = elementContent;
  // 移除 clip-path 属性
  cleanedContent = cleanedContent.replace(/clip-path="[^"]*"/gi, '');
  
  // 创建简化的 SVG（不包含 defs，因为 clipPath 可能导致问题）
  // 如果元素需要 clipPath，可以在后续版本中添加
  // 注意：移除 width 和 height 属性，让 SVG 根据 viewBox 自适应
  // 调整 viewBox 以匹配视频的宽高比（1920x1080 = 16:9）
  // 原始 viewBox 是正方形，我们需要调整它以居中显示内容
  const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
  const videoAspect = 1920 / 1080; // 16:9
  const svgAspect = vw / vh; // 1:1 (正方形)
  
  // 如果 SVG 是正方形但视频是 16:9，调整 viewBox 以居中显示
  let adjustedViewBox = viewBox;
  if (Math.abs(svgAspect - 1) < 0.01 && Math.abs(videoAspect - 16/9) < 0.01) {
    // SVG 是正方形，视频是 16:9
    // 保持高度不变，扩展宽度以匹配 16:9
    const newWidth = vh * videoAspect;
    const offsetX = (newWidth - vw) / 2;
    adjustedViewBox = `${vx - offsetX} ${vy} ${newWidth} ${vh}`;
  }
  
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${adjustedViewBox}">
  <g transform="${rootTransform}">
    ${cleanedContent}
  </g>
</svg>`;
  
  return svgContent;
}

async function main() {
  console.log('开始解析 SVG 文件...');
  
  // 读取 SVG 文件
  const svgPath = path.join(__dirname, '../assets/10342971.svg');
  const svgContent = await fs.readFile(svgPath, 'utf-8');
  
  // 解析 SVG 元素
  const elements = parseSVGElements(svgContent);
  console.log(`找到 ${elements.length} 个独立的图形元素`);
  
  if (elements.length === 0) {
    console.log('未找到图形元素，退出');
    return;
  }
  
  // 限制元素数量（如果太多的话）
  const maxElements = 50; // 最多处理 50 个元素
  const elementsToUse = elements.slice(0, maxElements);
  console.log(`将使用前 ${elementsToUse.length} 个元素制作视频`);
  
  // 创建视频构建器
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });
  
  // 创建主轨道
  const mainTrack = builder.createTrack({ zIndex: 1 });
  
  // 每个元素的显示时间（秒）
  const elementDuration = 2;
  const transitionDuration = 0.5;
  
  // 为每个元素创建一个场景
  for (let i = 0; i < elementsToUse.length; i++) {
    const element = elementsToUse[i];
    const startTime = i * (elementDuration + transitionDuration);
    
    // 创建包含单个元素的 SVG 字符串
    const singleElementSVG = createSingleElementSVG(element, svgContent);
    
    // 创建场景
    const scene = mainTrack.createScene({
      startTime: startTime,
      duration: elementDuration + transitionDuration,
    });
    
    // 添加背景
    scene.addBackground({ color: '#1a1a2e' });
    
    // 添加 SVG 元素（使用 addSVG 方法）
    // 注意：SVG 的 viewBox 已调整为匹配视频的 16:9 宽高比
    scene.addSVG({
      svgString: singleElementSVG,
      x: '50%',
      y: '50%',
      width: '100%', // 使用 100% 宽度，让 SVG 填满视频宽度
      height: '100%', // 使用 100% 高度，让 SVG 填满视频高度
      anchor: [0.5, 0.5], // 居中对齐
      fit: 'contain', // 保持宽高比，完整显示
      preserveAspectRatio: true,
      startTime: 0, // 相对于场景的开始时间
      duration: elementDuration,
      animations: [
        {
          type: 'fade',
          fromOpacity: 0,
          toOpacity: 1,
          duration: 0.5,
          delay: 0,
        },
        {
          type: 'fade',
          fromOpacity: 1,
          toOpacity: 0,
          duration: 0.5,
          delay: elementDuration - 0.5,
        },
        {
          type: 'scale',
          fromScaleX: 0.8,
          fromScaleY: 0.8,
          toScaleX: 1,
          toScaleY: 1,
          duration: 0.8,
          delay: 0,
          easing: 'easeOut',
        },
      ],
    });
    
    // 添加元素编号文本（可选）
    scene.addElement(new TextElement({
      text: `${i + 1}/${elementsToUse.length}`,
      x: '90%',
      y: '10%',
      fontSize: 32,
      color: '#ffffff',
      opacity: 0.7,
      startTime: startTime,
      duration: elementDuration,
    }));
  }
  
  // 构建并导出视频
  console.log('开始构建视频...');
  const outputPath = path.join(__dirname, '../output/svg-separated-video.mp4');
  
  await builder.render(outputPath, {
    parallel: true,
    usePipe: true,
    maxWorkers: 4,
    onProgress: (progress) => {
      console.log(`渲染进度: ${(progress * 100).toFixed(1)}%`);
    },
  });
  
  console.log(`视频已导出到: ${outputPath}`);
}

main().catch(console.error);


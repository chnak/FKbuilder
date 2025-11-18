/**
 * 图片适配工具函数
 * 根据 fit 参数计算图片的实际显示尺寸和位置
 */

/**
 * 计算图片适配后的尺寸和位置
 * @param {Object} options - 选项
 * @param {number} options.imageWidth - 图片原始宽度
 * @param {number} options.imageHeight - 图片原始高度
 * @param {number} options.containerWidth - 容器宽度
 * @param {number} options.containerHeight - 容器高度
 * @param {string} options.fit - 适配模式：'cover', 'contain', 'fill', 'none'
 * @returns {Object} { width, height, x, y } 适配后的尺寸和位置（相对于容器中心）
 */
export function calculateImageFit({ imageWidth, imageHeight, containerWidth, containerHeight, fit = 'cover' }) {
  const imageAspectRatio = imageWidth / imageHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  
  let width = containerWidth;
  let height = containerHeight;
  let x = 0;
  let y = 0;
  
  switch (fit) {
    case 'cover':
      // 覆盖：保持宽高比，填满容器，可能会裁剪
      if (containerAspectRatio > imageAspectRatio) {
        // 容器更宽，以高度为准
        height = containerHeight;
        width = containerHeight * imageAspectRatio;
      } else {
        // 容器更高，以宽度为准
        width = containerWidth;
        height = containerWidth / imageAspectRatio;
      }
      break;
      
    case 'contain':
      // 包含：保持宽高比，完整显示，可能会有空白
      if (containerAspectRatio > imageAspectRatio) {
        // 容器更宽，以高度为准
        height = containerHeight;
        width = containerHeight * imageAspectRatio;
      } else {
        // 容器更高，以宽度为准
        width = containerWidth;
        height = containerWidth / imageAspectRatio;
      }
      break;
      
    case 'fill':
    case 'stretch':
      // 填充：拉伸填满容器，不保持宽高比
      width = containerWidth;
      height = containerHeight;
      break;
      
    case 'none':
    case 'scale-down':
      // 不缩放或缩小：使用原始尺寸或缩小到适合容器
      if (fit === 'scale-down') {
        // 只在图片大于容器时缩小
        if (imageWidth > containerWidth || imageHeight > containerHeight) {
          if (containerAspectRatio > imageAspectRatio) {
            height = containerHeight;
            width = containerHeight * imageAspectRatio;
          } else {
            width = containerWidth;
            height = containerWidth / imageAspectRatio;
          }
        } else {
          width = imageWidth;
          height = imageHeight;
        }
      } else {
        // none: 使用原始尺寸
        width = imageWidth;
        height = imageHeight;
      }
      break;
      
    default:
      // 默认使用 cover
      if (containerAspectRatio > imageAspectRatio) {
        height = containerHeight;
        width = containerHeight * imageAspectRatio;
      } else {
        width = containerWidth;
        height = containerWidth / imageAspectRatio;
      }
  }
  
  return {
    width,
    height,
    x: 0, // 相对于容器中心，x 偏移为 0（由 anchor 控制）
    y: 0, // 相对于容器中心，y 偏移为 0（由 anchor 控制）
  };
}


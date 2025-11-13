// 导入依赖
import pkg from 'spritejs';
import { initFonts } from './src/core/Renderer.js';
import { polyfill } from 'spritejs/lib/platform/node-canvas.js';
const { Scene, Sprite,Layer,Label, ENV } = pkg;
import path from 'path';
//import { createCanvas,loadImage } from 'node-canvas-webgl';
import { createCanvas,loadImage } from 'canvas';

import fse from 'fs-extra';
//polyfill({ ENV });
ENV.createCanvas = createCanvas;
// 启用 node-canvas-webgl 作为渲染器
// 这一步是关键，它将 SpriteJS 指向一个无头画布实现
initFonts();
console.log( pkg);
// 定义一个异步函数来执行渲染
async function generateImage() {
  try {
    // 创建一个场景，指定尺寸
    const scene = new Scene({
      width: 1200,
      height: 600,
    });

    // 获取场景的默认图层
    const layer = scene.layer();
    const imagePath = './assets/img2.jpg';
    const image = await loadImage(imagePath); // 加载图片

    const imageSprite = new Sprite();
    imageSprite.attr({
      texture: image, // 将图片设置为纹理
      size: [image.width, image.height],
      pos: [50, 50],
    });
    layer.append(imageSprite);
    

    const text1 = new Label('SpriteJS.org');
    text1.attr({
      pos: [100, 40],
      fillColor: '#707',
      font: 'PatuaOne oblique small-caps bold 56px Arial',
      border: [2.5, '#ccc'],
    });
    layer.append(text1);

    const text2 = new Label('从前有座灵剑山');
    text2.attr({
      pos: [500, 20],
      fillColor: '#077',
      font: '64px "PatuaOne"',
      lineHeight: 112,
      textAlign: 'center',
    });
    layer.append(text2);

    const text3 = new Label('Hello');
    text3.attr({
      pos: [100, 240],
      strokeColor: 'red',
      font: 'PatuaOne bold oblique 70px Microsoft Yahei',
      strokeWidth: 1,
      textAlign: 'center',
      padding: [0, 30],
      border: [2.5, '#ccc'],
    });
    layer.append(text3);

    const myLabel = new Label('你好，SpriteJS！');

    // 设置 Label 的属性
    myLabel.attr({
      // 设置字体大小和字体系列
      fontSize:'120px',
      fontFamily:'PatuaOne',
      // 设置颜色
      color: 'white',
      // 设置位置
      pos: [100, 100],
    });

    // 将 Label 添加到图层
    layer.append(myLabel);
    // 等待渲染完成
    await scene.render();
    const canvas = await scene.snapshot();

    // 将画布内容导出为 buffer
    // scene.canvas 是 node-canvas-webgl 创建的画布实例
    const buffer = canvas.toBuffer('image/png');

    // 将 buffer 写入文件
    await fse.writeFile('output/output.png', buffer);

    console.log('图片生成成功：output.png');
  } catch (error) {
    console.error('图片生成失败:', error);
  }
}

// 执行函数
generateImage();

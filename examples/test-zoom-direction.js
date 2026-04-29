/**
 * zoomDirection 功能演示
 * 展示图片的缩放动画效果
 */
import { VideoBuilder } from '../src/index.js';

async function demo() {
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  // 创建4个场景，分别展示不同方向
  const directions = [
    { zoomDirection: 'in', zoomAmount: 0.3 },
    { zoomDirection: 'out', zoomAmount: 0.3 },
    { zoomDirection: 'left', zoomAmount: 0.2 },
    { zoomDirection: 'right', zoomAmount: 0.2 },
  ];

  const imageUrl = 'https://www.w3schools.com/css/trolltunga.jpg';
  let time = 0;
  const duration = 2;

  for (let i = 0; i < 4; i++) {
    const scene = track.createScene({ duration, startTime: time });
    scene.addBackground({ color: '#1a1a2e' });
    scene.addImage({
      width: '100%',
      height: '100%',
      x: '50%',
      y: '50%',
      src: imageUrl,
      ...directions[i],
    });
    time += duration;
  }

  await builder.render();
  console.log('zoom demo rendered: output/zoom-demo.mp4');
}

// auto 模式演示 - 随机缩放方向
async function autoDemo() {
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  const scene = track.createScene({ duration: 3, startTime: 0 });
  scene.addBackground({ color: '#0f0f23' });

  const imageUrl = 'https://www.w3schools.com/css/trolltunga.jpg';

  // auto 模式 - 每次随机选择 in/out/left/right
  scene.addImage({
    width: '100%',
    height: '100%',
    x: '50%',
    y: '50%',
    src: imageUrl,
    zoomDirection: 'auto',
    zoomAmount: 0.25,
    duration: 3,
  });

  await builder.render();
  console.log('zoom auto demo rendered: output/zoom-auto-demo.mp4');
}

// 多图轮播随机缩放
async function slideshowDemo() {
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const track = builder.createTrack({ zIndex: 1 });

  const images = [
    'https://www.w3schools.com/css/trolltunga.jpg',
    'https://www.w3schools.com/css/trolltunga.jpg',
    'https://www.w3schools.com/css/trolltunga.jpg',
    'https://www.w3schools.com/css/trolltunga.jpg',
    'https://www.w3schools.com/css/trolltunga.jpg',
  ];

  let time = 0;
  const duration = 2;
  let i = 0;
  for (const url of images) {
    const scene = track.createScene({ duration, startTime: time });
    scene.addBackground({ color: '#000000' });
    scene.addImage({
      width: '100%',
      height: '100%',
      x: '50%',
      y: '50%',
      src: url,
      zoomDirection: 'auto', // 每张图片随机不同方向
      zoomAmount: 0.1,
    });
    time += duration;
  }

  await builder.render(`output/zoom-slideshow.mp4`);
  console.log('zoom slideshow demo rendered: output/zoom-slideshow.mp4');
}

// 运行所有演示
//await demo();
//await autoDemo();
await slideshowDemo();

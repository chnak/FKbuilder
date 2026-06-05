/**
     * Ken Burns 效果示例
     * 演示如何使用 zoomDirection 和 zoomAmount 创建动态缩放动画
     */
    
    import { FKBuilder } from '../src/index.js';
    import { ImageElement } from '../src/elements/ImageElement.js';
    import path from 'path';
    import { fileURLToPath } from 'url';
    
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    
    async function createKenBurnsDemo() {
      const fk = new FKBuilder({
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 10,  // 10秒视频
        outputPath: path.join(__dirname, 'output/ken-burns-demo.mp4'),
      });
    
      // 示例图片路径（替换为实际图片）
      const imagePath = path.join(__dirname, 'assets/sample.jpg');
    
      // 定义所有 Ken Burns 方向
      const directions = [
        { name: 'left', desc: '向左移动' },
        { name: 'right', desc: '向右移动' },
        { name: 'up', desc: '向上移动' },
        { name: 'down', desc: '向下移动' },
        { name: 'diagonal1', desc: '左上→右下' },
        { name: 'diagonal2', desc: '右上→左下' },
        { name: 'diagonal3', desc: '左下→右上' },
        { name: 'diagonal4', desc: '右下→左上' },
        { name: 'diagonal5', desc: '左上→右下(陡)' },
        { name: 'diagonal6', desc: '右上→左下(陡)' },
      ];
    
      // 每张图片 5 秒，每个方向一张
      const slideDuration = 5;
      let currentTime = 0;
    
      for (const dir of directions) {
        // 创建图片元素
        const img = new ImageElement({
          src: imagePath,
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          zoomDirection: dir.name,  // 设置 Ken Burns 方向
          zoomAmount: 0.2,           // 缩放幅度 (0.2 = 30% 放大)
          // 元素时间范围
          startTime: currentTime,
          endTime: currentTime + slideDuration,
        });
    
        // 添加到场景
        fk.addElement(img);
        
        console.log(`添加图片: ${dir.desc}, 时间: ${currentTime}s - ${currentTime + slideDuration}s`);
        
        currentTime += slideDuration;
      }
    
      // 更新总时长
      fk.setDuration(currentTime);
    
      // 渲染
      console.log('\n开始渲染...');
      await fk.render();
    
      console.log('\n渲染完成!');
      console.log('输出路径:', fk.config.outputPath);
    }
    
    // 使用预设配置快速创建
    async function quickExample() {
      const fk = new FKBuilder({
        width: 1280,
        height: 720,
        fps: 30,
        duration: 5,
        outputPath: path.join(__dirname, 'output/ken-burns-quick.mp4'),
      });
    
      // 快速方式：直接创建带 Ken Burns 效果的单张图片
      const img = new ImageElement({
        src: path.join(__dirname, 'assets/sample.jpg'),
        width: 1280,
        height: 720,
        x: 0,
        y: 0,
        // Ken Burns 配置
        zoomDirection: 'diagonal1',  // 可选: left, right, up, down, diagonal1-6
        zoomAmount: 0.25,            // 缩放幅度 0.1-0.5 推荐
        // 时间配置
        startTime: 0,
        endTime: 5,
      });
    
      fk.addElement(img);
      
      console.log('快速示例配置:');
      console.log('- 方向: diagonal1 (左上→右下)');
      console.log('- 缩放: 0.25 (37.5% 放大)');
      console.log('- 时长: 5秒');
      
      await fk.render();
    }
    
    // 运行
    (async () => {
      console.log('=== Ken Burns 效果演示 ===\n');
      
      // 运行完整示例
      await createKenBurnsDemo();
      
      // 或运行快速示例
      // await quickExample();
      
    })();
    
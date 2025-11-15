import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import paper from 'paper-jsdom-canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案
const colors = {
  midnightBlue: '#153c64',
  mistyBlue: '#bed5eb',
  royalBlue: '#0070e0',
  blueGrotto: '#4a90a4',
};

/**
 * 测试 JSON 元素功能
 * 注意：Paper.js 目前不直接支持从 Adobe Illustrator 通过 JSON 导入
 * 但可以导入 Paper.js 的 JSON 格式
 */
async function testJSON() {
  console.log('🎨 测试 JSON 元素功能...\n');
  console.log('注意：Paper.js 目前不直接支持从 Adobe Illustrator 通过 JSON 导入');
  console.log('但可以导入 Paper.js 的 JSON 格式（通过 project.exportJSON() 导出的格式）\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });

  let currentTime = 0;
  const sceneDuration = 5;
  const transitionDuration = 0.5;

  // ========== 场景1：从 Paper.js JSON 格式导入 ==========
  console.log('创建场景1: Paper.js JSON 格式...');
  const scene1 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: currentTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: 'Paper.js JSON 格式',
      color: colors.mistyBlue,
      fontSize: 70,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 创建一个简单的 Paper.js JSON 格式示例
  // 注意：这是 Paper.js 的 JSON 格式，不是 Illustrator 的格式
  // 可以通过 paper.project.exportJSON() 导出得到这种格式
  const paperJSON = {
    children: [
      {
        className: 'Path',
        data: {
          segments: [
            [400, 400],
            [600, 300],
            [800, 400],
            [1000, 300],
            [1200, 400],
          ],
          closed: false,
          fillColor: {
            hue: 200,
            saturation: 0.7,
            brightness: 0.9,
          },
          strokeColor: {
            hue: 220,
            saturation: 0.8,
            brightness: 0.8,
          },
          strokeWidth: 5,
        },
      },
      {
        className: 'Path',
        data: {
          segments: [
            [960, 500],
            [960, 600],
          ],
          closed: false,
          fillColor: null,
          strokeColor: {
            hue: 200,
            saturation: 0.7,
            brightness: 0.9,
          },
          strokeWidth: 3,
        },
      },
    ],
  };

  // 注意：由于 Paper.js 的 importJSON 可能不可用，这里先尝试
  // 如果不可用，会回退到其他方法
  scene1.addJSON({
    jsonData: paperJSON,
    x: '50%',
    y: '50%',
    width: 800,
    height: 400,
    anchor: [0.5, 0.5],
    fit: 'contain',
    duration: sceneDuration,
    startTime: 0.5,
    zIndex: 2,
    animations: [
      { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
    ],
  });

  currentTime += sceneDuration;
  mainTrack.addTransition({
    name: 'fade',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景2：从 JSON 文件导入（如果存在） ==========
  console.log('创建场景2: JSON 文件导入...');
  const scene2StartTime = currentTime - transitionDuration;
  const scene2 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene2StartTime,
  })
    .addBackground({ color: colors.royalBlue })
    .addText({
      text: 'JSON 文件导入',
      color: colors.mistyBlue,
      fontSize: 70,
      x: '50%',
      y: '10%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    });

  // 尝试从 assets 目录加载 JSON 文件
  const assetsDir = path.join(__dirname, '../assets');
  const jsonFiles = await fs.readdir(assetsDir).catch(() => []);
  const jsonFile = jsonFiles.find(file => file.toLowerCase().endsWith('.json'));

  if (jsonFile) {
    const jsonPath = path.join(assetsDir, jsonFile);
    scene2.addJSON({
      src: jsonPath,
      x: '50%',
      y: '50%',
      width: 800,
      height: 600,
      anchor: [0.5, 0.5],
      fit: 'contain',
      duration: sceneDuration,
      startTime: 0.5,
      zIndex: 2,
      animations: [
        { type: 'fade', fromOpacity: 0, toOpacity: 1, duration: 0.8 },
      ],
    });
  } else {
    // 如果没有 JSON 文件，显示提示信息
    scene2.addText({
      text: '未找到 JSON 文件\n可以将 Paper.js 导出的 JSON 文件\n放在 assets 目录中',
      color: colors.mistyBlue,
      fontSize: 40,
      x: '50%',
      y: '50%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });
  }

  currentTime = scene2StartTime + sceneDuration;
  mainTrack.addTransition({
    name: 'CrossZoom',
    duration: transitionDuration,
    startTime: currentTime - transitionDuration,
  });

  // ========== 场景3：说明信息 ==========
  console.log('创建场景3: 说明信息...');
  const scene3StartTime = currentTime - transitionDuration;
  const scene3 = mainTrack.createScene({
    duration: sceneDuration,
    startTime: scene3StartTime,
  })
    .addBackground({ color: colors.midnightBlue })
    .addText({
      text: '关于 JSON 导入',
      color: colors.mistyBlue,
      fontSize: 80,
      x: '50%',
      y: '20%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0,
      fontFamily: 'MicrosoftYaHei',
      fontWeight: 'bold',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• Paper.js 支持导入自己的 JSON 格式',
      color: colors.mistyBlue,
      fontSize: 45,
      x: '50%',
      y: '40%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 0.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• 从 Illustrator 导入：导出为 SVG',
      color: colors.mistyBlue,
      fontSize: 45,
      x: '50%',
      y: '55%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 1,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• 使用 project.exportJSON() 导出',
      color: colors.mistyBlue,
      fontSize: 45,
      x: '50%',
      y: '70%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 1.5,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    })
    .addText({
      text: '• 使用 addJSON() 导入',
      color: colors.mistyBlue,
      fontSize: 45,
      x: '50%',
      y: '85%',
      textAlign: 'center',
      anchor: [0.5, 0.5],
      duration: sceneDuration,
      startTime: 2,
      fontFamily: 'MicrosoftYaHei',
      animations: ['fadeIn'],
    });

  currentTime = scene3StartTime + sceneDuration;

  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-json.mp4');

  try {
    console.log('\n🚀 开始导出视频...');
    console.log(`输出路径: ${outputPath}\n`);
    console.log(`总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
    console.log(`场景数: ${mainTrack.scenes.length}`);
    console.log(`转场数: ${mainTrack.transitions.length}\n`);

    await builder.export(outputPath, {
      quality: 'high',
      bitrate: '10M',
      usePipe: true,
    });

    console.log('✅ 视频导出成功！');
    console.log(`📁 文件位置: ${outputPath}`);
    console.log(`⏱️  总时长: ${builder.getTotalDuration().toFixed(2)} 秒`);
    console.log('\n✨ JSON 功能测试完成！');
    console.log('\n📝 关于 Adobe Illustrator 导入：');
    console.log('  - Paper.js 目前不直接支持从 Illustrator 通过 JSON 导入');
    console.log('  - 建议方法：从 Illustrator 导出 SVG，然后使用 addSVG()');
    console.log('  - 或者：使用 Paper.js 的 exportJSON() 导出，然后使用 addJSON()');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

testJSON().catch(console.error);


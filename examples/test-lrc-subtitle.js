import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLRCSubtitle() {
  console.log('=== 测试 LRC 歌词导入功能 ===\n');
  
  // 创建示例 LRC 文件（如果不存在）
  const lrcFile = path.join(__dirname, '../assets/test.lrc');
  const lrcDir = path.dirname(lrcFile);
  await fs.ensureDir(lrcDir);
  
  if (!await fs.pathExists(lrcFile)) {
    console.log('创建示例 LRC 文件...');
    const sampleLRC = `[ti:测试歌曲]
[ar:测试歌手]
[al:测试专辑]
[00:00.00]开始渲染，字幕视频开始播放
[00:03.50]第二句歌词
[00:07.20]第三句歌词
[00:11.00]第四句歌词
[00:14.80]第五句歌词
[00:18.50]第六句歌词
`;
    await fs.writeFile(lrcFile, sampleLRC, 'utf-8');
    console.log(`✅ 已创建示例 LRC 文件: ${lrcFile}\n`);
  }
  
  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1 });
  
  // 创建场景并添加 LRC 歌词
  const scene = mainTrack.createScene({ duration: 20 })
    .addBackground({ color: '#4a90e2', duration: 20 })
    .addText({
      text: "LRC 歌词测试",
      color: "#ffffff",
      fontSize: 80,
      x: "50%",
      y: "25%",
      textAlign: "center",
      duration: 20,
      startTime: 0,
      zIndex: 1,
    });
  
  // 添加 LRC 歌词
  await scene.addLRC(lrcFile, {
    textColor: '#ffffff',
    fontSize: 48,
    x: '50%',
    y: '80%',
    textAlign: 'center',
    minDuration: 1,
    maxDuration: 5,
  });
  
  const videoMaker = builder.build();
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  
  const outputPath = path.join(outputDir, 'test-lrc-subtitle.mp4');
  
  console.log('开始渲染视频...');
  await videoMaker.export(outputPath);
  
  console.log(`\n✅ 视频导出完成: ${outputPath}`);
  
  videoMaker.destroy();
}

testLRCSubtitle().catch(console.error);




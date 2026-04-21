/**
 * 测试文本拆分动画
 * 使用预设动画（preset animations）
 */
import { VideoBuilder } from '../src/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配色方案
const colors = {
  peach: '#fcdec3',
  pewter: '#e6e9e6',
  blueGrotto: '#208ab7',
  babyBlue: '#5acbed',
  babyBlueLight: '#cbe7e8',
  babyBlueLighter: '#dbf3f4',
  blueGrottoDark: '#0d659d',
  ebony: '#2e3b3c',
};

async function testTextSplitAnimation() {
  console.log('🧪 开始测试文本拆分动画...\n');

  const builder = new VideoBuilder({
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const mainTrack = builder.createTrack({ zIndex: 1, name: '测试轨道' });

  // ========== 测试场景1：zoomIn 预设动画 ==========
  console.log('📝 测试场景1：zoomIn 预设动画...');
  const scene1 = mainTrack.createScene({
    duration: 5,
    startTime: 0,
  });

  scene1.addBackground({ color: colors.ebony });

  scene1.addText({
    text: '测试1：zoomIn 缩放动画',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene1.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: colors.babyBlue,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.5,
    animations: ['zoomIn'], // 使用预设动画名称
  });

  // ========== 测试场景2：fadeInUp 预设动画 ==========
  console.log('📝 测试场景2：fadeInUp 预设动画...');
  const scene2 = mainTrack.createScene({
    duration: 5,
    startTime: 5,
  });

  scene2.addBackground({ color: colors.blueGrottoDark });

  scene2.addText({
    text: '测试2：fadeInUp 动画',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene2.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: colors.babyBlue,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.5,
    animations: ['fadeInUp'], // 使用预设动画名称
  });

  // ========== 测试场景3：bigIn 预设动画（放大进入） ==========
  console.log('📝 测试场景3：bigIn 放大进入...');
  const scene3 = mainTrack.createScene({
    duration: 5,
    startTime: 10,
  });

  scene3.addBackground({ color: colors.ebony });

  scene3.addText({
    text: '测试3：bigIn 放大进入',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene3.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: colors.babyBlue,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.6,
    animations: ['bigIn'], // 使用预设动画名称
  });

  // ========== 测试场景4：rotateIn 旋转进入 ==========
  console.log('📝 测试场景4：rotateIn 旋转进入...');
  const scene4 = mainTrack.createScene({
    duration: 5,
    startTime: 15,
  });

  scene4.addBackground({ color: colors.blueGrottoDark });

  scene4.addText({
    text: '测试4：rotateIn 旋转进入',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene4.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: colors.babyBlue,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.5,
    textShadow: true,
    textShadowColor: colors.babyBlue,
    textShadowBlur: 15,
    textShadowOpacity: 0.8,
    animations: ['rotateIn'], // 使用预设动画名称
  });

  // ========== 测试场景5：zoomInLeft 左侧缩放 ==========
  console.log('📝 测试场景5：zoomInLeft 左侧缩放...');
  const scene5 = mainTrack.createScene({
    duration: 5,
    startTime: 20,
  });

  scene5.addBackground({ color: colors.ebony });

  scene5.addText({
    text: '测试5：zoomInLeft 左侧缩放',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene5.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: colors.babyBlue,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.5,
    animations: ['zoomInLeft'], // 使用预设动画名称
  });

  // ========== 测试场景6：word 拆分 + zoomIn ==========
  console.log('📝 测试场景6：word 拆分 + zoomIn...');
  const scene6 = mainTrack.createScene({
    duration: 5,
    startTime: 25,
  });

  scene6.addBackground({ color: colors.blueGrottoDark });

  scene6.addText({
    text: '测试6：word 拆分动画',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene6.addText({
    text: 'Hello World',
    x: '50%',
    y: '40%',
    fontSize: 100,
    color: colors.babyBlue,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'word',
    splitDelay: 0.2,
    splitDuration: 0.5,
    animations: ['zoomIn'], // 使用预设动画名称
  });

  // ========== 测试场景7：多个动画组合 ==========
  console.log('📝 测试场景7：bigIn + bigOut 组合...');
  const scene7 = mainTrack.createScene({
    duration: 5,
    startTime: 30,
  });

  scene7.addBackground({ color: colors.ebony });

  scene7.addText({
    text: '测试7：进入 + 退出动画',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene7.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: colors.babyBlue,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'letter',
    splitDelay: 0.08,
    splitDuration: 0.5,
    animations: ['bigIn', 'bigOut'], // 进入 + 退出动画
  });

  // ========== 测试场景8：描边 + zoomIn ==========
  console.log('📝 测试场景8：描边 + zoomIn...');
  const scene8 = mainTrack.createScene({
    duration: 5,
    startTime: 35,
  });

  scene8.addBackground({ color: '#000000' });

  scene8.addText({
    text: '测试8：描边 + 缩放',
    x: '50%',
    y: '20%',
    fontSize: 60,
    color: colors.pewter,
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 10,
  });

  scene8.addText({
    text: 'FKbuilder',
    x: '50%',
    y: '40%',
    fontSize: 120,
    color: '#ffffff',
    fontFamily: '微软雅黑',
    fontWeight: 'bold',
    textAlign: 'center',
    anchor: [0.5, 0.5],
    duration: 5,
    startTime: 0,
    zIndex: 9,
    split: 'letter',
    splitDelay: 0.1,
    splitDuration: 0.4,
    stroke: true,
    strokeWidth: 3,
    strokeColor: colors.babyBlue,
    animations: ['zoomIn'], // 使用预设动画名称
  });

  // ========== 导出视频 ==========
  const outputDir = path.join(__dirname, '../output');
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, 'test-text-split-animation.mp4');

  try {
    console.log('\n🎬 开始渲染测试视频...');
    console.log(`总时长: 40 秒`);
    console.log(`总帧数: ${Math.ceil(40 * 30)} 帧\n`);

    const resultPath = await builder.render(outputPath);

    console.log('\n✅ 测试视频渲染完成！');
    console.log(`📁 输出文件: ${resultPath}`);
    console.log(`⏱️  视频时长: 40 秒`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    throw error;
  }
}

// 执行
testTextSplitAnimation().catch(console.error);

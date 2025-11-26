import { VideoBuilder } from '../src/index.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)



async function main() {
    const outputDir = path.join(__dirname, 'output');
    const audioFile = path.join('assets', '有何不可.mp3');
    const colors = {
        navyBlue: '#00297f',      // 深蓝色 - 用于背景
        blue: '#0058ab',          // 蓝色 - 用于主色调
        champagne: '#dfcbb2',     // 香槟色 - 用于强调和文字
        carafe: '#693e2d',        // 咖啡色 - 用于深色背景
        white: '#ffffff',         // 白色 - 用于文字
        black: '#000000',         // 黑色 - 用于阴影
        };
    // 创建视频构建器
    const builder = new VideoBuilder({
        width: 1920,
        height: 1080,
        fps: 30
    })

    const mainTrack = builder.createTrack({ zIndex: 1, name: '主轨道' });
    let currentTime = 0;
    const scene1Duration = 6;
    const sceneDuration = 10;
    const transitionDuration = 1;

    // ========== 场景1：项目介绍 ==========
    console.log('创建场景1: 项目介绍...');
    const scene1 = mainTrack.createScene({
        duration: scene1Duration,
        startTime: currentTime,
    })
        .addBackground({ color: colors.navyBlue })
        .addText({
        text: 'FKbuilder',
        color: colors.white,
        fontSize: 120,
        x: '50%',
        y: '35%',
        textAlign: 'center',
        duration: scene1Duration,
        startTime: 0,
        fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
        fontWeight: 'bold',
        textShadow: true,
        textShadowBlur: 30,
        textGlow: true,
        textGlowColor: colors.blue,
        textGlowBlur: 40,
        split: 'letter',
        animations: ['slideInRight'],
        })
        .addText({
        text: '程序化视频生成库',
        color: '#ffffff',
        fontSize: 56,
        x: '50%',
        y: '50%',
        textAlign: 'center',
        duration: scene1Duration-1,
        startTime: 1,
        fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
        split: 'letter',
        animations: ['slideInLeft'],
        })
        .addText({
        text: '基于 Node.js + Paper.js',
        color: colors.champagne,
        fontSize: 42,
        x: '50%',
        y: '60%',
        textAlign: 'center',
        duration: scene1Duration-1.5,
        startTime: 1.5,
        fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
        split: 'letter',
        animations: ['fadeIn'],
        })
        .addText({
        text: '强大 · 灵活 · 易用',
        color: colors.champagne,
        fontSize: 36,
        x: '50%',
        y: '70%',
        textAlign: 'center',
        duration: scene1Duration-2,
        startTime: 2,
        fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
        split: 'letter',
        animations: ['bigIn'],
        })
        .addCode({
        code: `npm install fkbuilder`,
        language: 'javascript',
        theme: 'dark',
        fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
        x: '50%',
        y: '80%',
        width: '50%',
        height: 90,
        duration: scene1Duration,
        fontSize: 24,
        showLineNumbers: true,
        showBorder: true,
        split: 'letter',  // 打字模式：'line', 'word', 'letter'
        splitDelay: 0.1,
        borderRadius: 12,
        duration: scene1Duration
        })
    
    currentTime += scene1Duration;

    let transitionTime = scene1Duration - transitionDuration / 2;
    mainTrack.addTransition({ name: 'CircleCrop', duration:  transitionDuration })


    // ========== 场景2：Echarts展示 ==========
    const scene2 = mainTrack.createScene({
        duration: sceneDuration,
        startTime: currentTime,
    }).addBackground({color: colors.navyBlue})

    scene2.addText({
		text:"Echarts图表演示",
		x:"25%",
		y:"25%",
		fontSize:"30rpx",
		color:"#ffffff",
		fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
		split: 'letter',
		duration: sceneDuration,
		animations: ['zoomIn'],
	})
	scene2.addText({
		text:"Code代码块演示",
		x:"75%",
		y:"25%",
		fontSize:"30rpx",
		color:"#ffffff",
		fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
		split: 'letter',
		duration: sceneDuration,
		animations: ['zoomIn'],
	})
	scene2.addECharts({
	  option: {
		title: [
			{
			text: '饼状图示例'
			}
		],
		polar: {
			radius: [30, '80%']
		},
		angleAxis: {
			max: 4,
			startAngle: 75
		},
		radiusAxis: {
			type: 'category',
			data: ['a', 'b', 'c', 'd']
		},
		tooltip: {},
		series: {
			type: 'bar',
			data: [2, 1.2, 2.4, 3.6],
			coordinateSystem: 'polar',
			label: {
			show: true,
			position: 'middle',
			formatter: '{b}: {c}'
			}
		}
		},
	  x: '25%',
	  y: '60%',
	  width: '48%',
	  height: '50%',
	  bgcolor:'#ffffff',
	  anchor: [0.5, 0.5],
	  fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
	  startTime:0,
	  duration: sceneDuration
	})
	

	scene2.addCode({
	  code: `
		const {VideoBuilder} = require('fkbuilder')
		const builder = new VideoBuilder({
			width: 1920,
			height: 1080,
			fps: 30,
		});
		const mainTrack = builder.createTrack({ zIndex: 1, name: '主轨道' });
		const scene1 = mainTrack.createScene({
			duration: 10
		})
		scene1.addText({
			text: 'Echarts 示例',
			x: '50%',
			y: '10%',
			fontSize: 30,
			color: '#ffffff',
			textAlign: 'center',
			duration: 10
		})
		scene1.addECharts({
		  x: '50%',
		  y: '50%',
		  width: '50%',
		  height: '50%',
		  bgcolor: '#00000020',
		  duration: 10,
		})
		
		await builder.render('output/demo.mp4');
	  `,
	  language: 'javascript',
	  theme: 'dark',
	  x: '75%',
	  y: '60%',
	  width: '48%',
	  height: '50%',
	  duration: sceneDuration,
	  fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
	  fontSize: 24,
	  showLineNumbers: true,
	  showBorder: true,
	  split: 'word',  // 打字模式：'line', 'word', 'letter'
	  splitDelay: 0.05,
	  borderRadius: 12,
	  duration: sceneDuration,
	  padding: 20
	})

    currentTime += sceneDuration;
    transitionTime = currentTime - transitionDuration / 2;
    mainTrack.addTransition({ name: 'pixelize', duration:  transitionDuration})

    // ========== 场景3：Echarts展示 ==========
    const scene3 = mainTrack.createScene({
		duration: sceneDuration,
		startTime: currentTime,
	}).addBackground({color: colors.navyBlue})

    scene3.addECharts({
		option: {
			title: [
				{
					text: '折线图示例'
				}
			],
			xAxis: {
				type: 'category',
				data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
			},
			yAxis: {
				type: 'value'
			},
			series: [
				{
				data: [820, 932, 901, 934, 1290, 1330, 1320],
				type: 'line',
				smooth: true
				}
			]
		},
		x: '25%',
		y: '25%',
		width: '48%',
		height: '48%',
		bgcolor:'#ffffff',
		anchor: [0.5, 0.5],
		fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
		duration: sceneDuration
	})
    scene3.addECharts({
		option: {
			title: [
				{
					text: '富文本示例'
				}
			],
			tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                data: [
                'Direct',
                'Marketing',
                'Search Engine',
                'Email',
                'Union Ads',
                'Video Ads',
                'Baidu',
                'Google',
                'Bing',
                'Others'
                ]
            },
            series: [
                {
                name: 'Access From',
                type: 'pie',
                selectedMode: 'single',
                radius: [0, '30%'],
                label: {
                    position: 'inner',
                    fontSize: 14
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: 1548, name: 'Search Engine' },
                    { value: 775, name: 'Direct' },
                    { value: 679, name: 'Marketing', selected: true }
                ]
                },
                {
                name: 'Access From',
                type: 'pie',
                radius: ['45%', '60%'],
                labelLine: {
                    length: 30
                },
                label: {
                    formatter: '{a|{a}}{abg|}\n{hr|}\n  {b|{b}：}{c}  {per|{d}%}  ',
                    backgroundColor: '#F6F8FC',
                    borderColor: '#8C8D8E',
                    borderWidth: 1,
                    borderRadius: 4,
                    rich: {
                    a: {
                        color: '#6E7079',
                        lineHeight: 22,
                        align: 'center'
                    },
                    hr: {
                        borderColor: '#8C8D8E',
                        width: '100%',
                        borderWidth: 1,
                        height: 0
                    },
                    b: {
                        color: '#4C5058',
                        fontSize: 14,
                        fontWeight: 'bold',
                        lineHeight: 33
                    },
                    per: {
                        color: '#fff',
                        backgroundColor: '#4C5058',
                        padding: [3, 4],
                        borderRadius: 4
                    }
                    }
                },
                data: [
                    { value: 1048, name: 'Baidu' },
                    { value: 335, name: 'Direct' },
                    { value: 310, name: 'Email' },
                    { value: 251, name: 'Google' },
                    { value: 234, name: 'Union Ads' },
                    { value: 147, name: 'Bing' },
                    { value: 135, name: 'Video Ads' },
                    { value: 102, name: 'Others' }
                ]
                }
            ]
		},
		x: '75%',
		y: '25%',
		width: '48%',
		height: '48%',
		bgcolor:'#ffffff',
		anchor: [0.5, 0.5],
		fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
		duration: sceneDuration
	})
	scene3.addECharts({
		option: {
			title: [
				{
					text: '柱状图示例'
				}
			],
			xAxis: {
				type: 'category',
				data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
			},
			yAxis: {
				type: 'value'
			},
			series: [
				{
				data: [120, 200, 150, 80, 70, 110, 130],
				type: 'bar'
				}
			]
		},
		x: '25%',
		y: '75%',
		width: '48%',
		height: '48%',
		bgcolor:'#ffffff',
		anchor: [0.5, 0.5],
		fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
		duration: sceneDuration
	})
	scene3.addECharts({
		option: {
			title: [
				{
					text: '仪表图示例'
				}
			],
			tooltip: {
				formatter: '{a} <br/>{b} : {c}%'
			},
			series: [
				{
				name: 'Pressure',
				type: 'gauge',
				progress: {
					show: true
				},
				detail: {
					valueAnimation: true,
					formatter: '{value}'
				},
				data: [
					{
					value: 50,
					name: 'SCORE'
					}
				]
				}
			]
		},
		x: '75%',
		y: '75%',
		width: '48%',
		height: '48%',
		bgcolor:'#ffffff',
		anchor: [0.5, 0.5],
		fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
		duration: sceneDuration
	})

    currentTime += sceneDuration;
    transitionTime = currentTime - transitionDuration / 2;
    mainTrack.addTransition({ name: 'wind', duration:  transitionDuration })


    // 示波器场景
    const scene4 = mainTrack.createScene({
		duration: sceneDuration,
		startTime: currentTime,
	}).addBackground({color: colors.navyBlue})


    scene4.addText({
		text:"示波器演示",
		x:"50%",
		y:"25%",
		fontSize:"30rpx",
		color:"#ffffff",
		fontPath: "D:/code/foliko-trade/public/fonts/MicrosoftYaHei-01.ttf",
		split: 'letter',
		duration: sceneDuration,
		animations: ['zoomIn'],
	})
	
	scene4.addOscilloscope({
		audioPath: audioFile,
		x: '17%',
		y: '60%',
		width: '30%',
		height: '50%',
		backgroundColor: '#ffffff30',
		style: 'particles',
		mirror: true,
		sensitivity: 1.5,
		particleCount: 60,
		particleMinSize: 4,
		particleMaxSize: 20,
		particleColors: [
		  '#ff0080', '#ff4080', '#ff8000', '#ffc000',
		  '#ffff00', '#80ff00', '#00ff80', '#00ffff',
		  '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
		],
		particleTrail: true,
		windowSize: 0.1,
		cutFrom:50,
		cutTo:sceneDuration,
		duration: sceneDuration,
		zIndex: 1,
	});
    scene4.addOscilloscope({
		audioPath: audioFile,
		x: '50%',
		y: '60%',
		width: '30%',
		height: '50%',
		backgroundColor: '#ffffff30',
		style: 'blob',
        blobBallCount: 15,
        minRadiusRatio: 0.3,
        maxRadiusRatio: 3.0,
        sensitivity: 1.5,
        particleColors: [
            '#ff0080', '#ff4080', '#ff8000', '#ffc000',
            '#ffff00', '#80ff00', '#00ff80', '#00ffff',
            '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
            '#ff4080', '#ff8000', '#ffc000',
        ],
        windowSize: 0.1,
		cutFrom:50,
		cutTo:sceneDuration,
		duration: sceneDuration,
		zIndex: 1,
	});
	scene4.addOscilloscope({
		audioPath: audioFile,
		x: "83%",
		y: "60%",
		width: '30%',
		height: '50%',
		backgroundColor: '#ffffff30',
		style: 'explosion',
		explosionParticles: 100,
		sensitivity: 1.5,
		particleColors: [
		  '#ff0080', '#ff4080', '#ff8000', '#ffc000',
		  '#ffff00', '#80ff00', '#00ff80', '#00ffff',
		  '#0080ff', '#8000ff', '#ff00ff', '#ff0080',
		],
		windowSize: 0.1,
		cutFrom:50,
		cutTo:sceneDuration,
		duration: sceneDuration,
		zIndex: 1,
	});

    const totalDuration = currentTime + sceneDuration;

    // ========== 背景音乐轨道 ==========
    const audioTrack = builder.createTrack({ zIndex: 10, name: '背景音乐轨道' });
    const audioScene = audioTrack.createScene({ duration: totalDuration });
    audioScene.addAudio({
        src: audioFile,
        startTime: 0,
        cutFrom: 0,
        cutTo: totalDuration,
        duration: totalDuration
    });

    const outputPath = path.join(outputDir, 'demo.mp4');

    try {
        console.log('\n🎬 开始渲染...');
        const startTime = Date.now();
        await builder.render(outputPath,{
            parallel: true,
            maxWorkers: 4
        });
        const endTime = Date.now();
        
        console.log('');
        console.log('✅ 视觉效果测试完成！');
        console.log(`📁 输出文件: ${outputPath}`);
        console.log(`⏱️  耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.stack) {
        console.error('详细错误:', error.stack);
        }
    }

}


main()
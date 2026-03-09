import { VideoBuilder, Scene, SVGElement, RectElement, CircleElement } from '../src/index.js';
import path from 'path';

// --- Assets (SVG Strings) ---

const XWING_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M45 20 L55 20 L55 80 L45 80 Z" fill="#e0e0e0" />
  <path d="M50 0 L60 20 L40 20 Z" fill="#c0c0c0" />
  <path d="M55 40 L95 30 L95 50 L55 60 Z" fill="#e0e0e0" />
  <path d="M45 40 L5 30 L5 50 L45 60 Z" fill="#e0e0e0" />
  <rect x="25" y="70" width="10" height="15" fill="#a0a0a0" />
  <rect x="65" y="70" width="10" height="15" fill="#a0a0a0" />
  <rect x="5" y="20" width="2" height="30" fill="#ff0000" />
  <rect x="93" y="20" width="2" height="30" fill="#ff0000" />
</svg>
`;

const TIE_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 10 L20 20 L20 80 L10 90 Z" fill="#333" />
  <path d="M90 10 L80 20 L80 80 L90 90 Z" fill="#333" />
  <rect x="20" y="45" width="60" height="10" fill="#555" />
  <circle cx="50" cy="50" r="15" fill="#777" />
  <circle cx="50" cy="50" r="10" fill="#222" />
  <path d="M50 50 L60 40 L40 40 Z" fill="#aaa" opacity="0.5"/>
</svg>
`;

// --- Star Field Generator ---
function generateStarFieldSVG(width, height, count) {
    let stars = '';
    for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.5 + 0.5;
        stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${opacity}" />`;
    }
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${stars}</svg>`;
}

async function createStarWarsVideo() {
    const builder = new VideoBuilder({
        width: 1920,
        height: 1080,
        fps: 30,
    });

    // Create Main Track and Scene
    const track = builder.createTrack();
    const gameDuration = 15;
    const scene = track.createScene({
        duration: gameDuration,
        name: 'StarWarsBattle',
    });
    
    // 1. Background (Black + Stars)
    scene.addBackground({ color: '#000000' });
    
    // Add two layers of stars for parallax effect (simulated by moving one faster)
    const starField1 = generateStarFieldSVG(1920, 1080, 200);
    const starField2 = generateStarFieldSVG(1920, 1080, 100);

    // Static distant stars
    scene.addElement(new SVGElement({
        svgString: starField1,
        width: 1920,
        height: 1080,
        x: '50%',
        y: '50%',
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: gameDuration,
    }));

    // Moving closer stars (simulating forward movement or vertical scroll)
    // To simulate moving down (ship flying up), stars move down.
    // We can use 'slideInDown' or custom animation. 
    // Let's just put two copies and move them.
    // Actually, simple static stars are fine for now, let's focus on the action.
    
    // 2. Player Ship (X-Wing)
    // Starts at bottom center, moves slightly left/right
    const playerShip = new SVGElement({
        svgString: XWING_SVG,
        width: 120,
        height: 120,
        x: '50%',
        y: '85%',
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: gameDuration,
        animations: [
            {
                type: 'custom', // We will simulate movement by changing x/y
                update: (progress, element) => {
                    // Simple sine wave movement
                    const xOffset = Math.sin(progress * Math.PI * 4) * 300;
                    element.x = 960 + xOffset; // 960 is center of 1920
                    // Banking effect (rotation)
                    element.rotation = Math.sin(progress * Math.PI * 4) * 15;
                }
            }
        ]
    });
    scene.addElement(playerShip);

    // 3. Enemies and Combat Logic
    const enemySpawnInterval = 2; // Spawn every 2 seconds
    const enemyCount = Math.floor(gameDuration / enemySpawnInterval);
    
    for (let i = 0; i < enemyCount; i++) {
        const spawnTime = i * enemySpawnInterval;
        const startX = 300 + Math.random() * 1320; // Random X within safe area
        const duration = 4; // Takes 4 seconds to cross screen
        
        // Enemy Ship
        const enemy = new SVGElement({
            svgString: TIE_SVG,
            width: 100,
            height: 100,
            x: startX,
            y: -100, // Start above screen
            anchor: [0.5, 0.5],
            startTime: spawnTime,
            duration: duration,
            animations: [
                {
                    type: 'custom',
                    update: (p, el) => {
                        // Move down
                        el.y = -100 + (p * 1300); // Move to 1200 (below screen)
                        // Slight weave
                        el.x = startX + Math.sin(p * Math.PI * 2) * 50;
                    }
                }
            ]
        });
        scene.addElement(enemy);

        // Player shoots at enemy?
        // Let's spawn a laser from player towards this enemy at some point
        const shootTime = spawnTime + 1.5;
        if (shootTime < gameDuration) {
            // Calculate where player is at shootTime
            // Player X logic from above: 960 + Math.sin(progress * PI * 4) * 300
            // progress = shootTime / gameDuration
            const playerProgress = shootTime / gameDuration;
            const playerX = 960 + Math.sin(playerProgress * Math.PI * 4) * 300;
            const playerY = 1080 * 0.85; // 85%

            // Laser
            const laser = new RectElement({
                width: 6,
                height: 40,
                bgcolor: '#ff0000', // Red laser
                x: playerX,
                y: playerY - 60,
                anchor: [0.5, 1],
                startTime: shootTime,
                duration: 0.5,
                animations: [
                    {
                        type: 'custom',
                        update: (p, el) => {
                            el.y = (playerY - 60) - (p * 1000); // Shoot up fast
                        }
                    }
                ]
            });
            scene.addElement(laser);

            // Explosion when laser hits (simulated)
            const hitTime = shootTime + 0.3;
            // Enemy position at hitTime
            // Enemy progress = (hitTime - spawnTime) / duration
            const enemyProgress = (hitTime - spawnTime) / duration;
            const enemyY = -100 + (enemyProgress * 1300);
            const enemyX = startX + Math.sin(enemyProgress * Math.PI * 2) * 50;

            if (hitTime < gameDuration) {
                const explosion = new CircleElement({
                    width: 10,
                    height: 10, // Start small
                    x: enemyX,
                    y: enemyY,
                    bgcolor: '#ffaa00', // Orange
                    anchor: [0.5, 0.5],
                    startTime: hitTime,
                    duration: 0.5,
                    animations: [
                        {
                            type: 'custom',
                            update: (p, el) => {
                                // Expand and fade
                                const scale = 1 + p * 10;
                                el.width = 10 * scale;
                                el.height = 10 * scale;
                                el.alpha = 1 - p;
                            }
                        }
                    ]
                });
                scene.addElement(explosion);
            }
        }
    }

    // Add Title
    scene.addText({
        text: 'STAR WARS',
        fontSize: 120,
        color: '#FFE81F', // Star Wars Yellow
        x: '50%',
        y: '20%',
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: 3,
        animations: ['fadeOut'],
        fontFamily: 'Arial Black', // Or similar bold font
        fontWeight: 'bold',
        stroke: '#000',
        strokeWidth: 4
    });

    // builder.addScene(scene);

    // Render
    const outputDir = path.resolve('output');
    const outputPath = path.join(outputDir, 'star-wars-game.mp4');
    await builder.render(outputPath);
}

createStarWarsVideo().catch(console.error);
